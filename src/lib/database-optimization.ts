import { PrismaClient } from '@prisma/client'
import { cacheManager, cacheUtils, CACHE_TTL } from './cache'

// Database connection pool configuration
const DATABASE_CONFIG = {
  // Connection pool settings
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  
  // Query optimization settings
  queryTimeout: 30000,
  statementTimeout: 30000,
  
  // Logging configuration
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
} as const

// Query performance monitoring
class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor
  private queryStats: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map()
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = []
  private readonly SLOW_QUERY_THRESHOLD = 1000 // 1 second

  private constructor() {}

  public static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor()
    }
    return QueryPerformanceMonitor.instance
  }

  logQuery(query: string, duration: number) {
    // Update query statistics
    const stats = this.queryStats.get(query) || { count: 0, totalTime: 0, avgTime: 0 }
    stats.count++
    stats.totalTime += duration
    stats.avgTime = stats.totalTime / stats.count
    this.queryStats.set(query, stats)

    // Log slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.slowQueries.push({
        query,
        duration,
        timestamp: new Date(),
      })

      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-100)
      }

      console.warn(`Slow query detected (${duration}ms):`, query)
    }
  }

  getStats() {
    return {
      totalQueries: Array.from(this.queryStats.values()).reduce((sum, stat) => sum + stat.count, 0),
      slowQueries: this.slowQueries.length,
      averageQueryTime: Array.from(this.queryStats.values()).reduce((sum, stat) => sum + stat.avgTime, 0) / this.queryStats.size || 0,
      queryBreakdown: Object.fromEntries(this.queryStats),
      recentSlowQueries: this.slowQueries.slice(-10),
    }
  }

  reset() {
    this.queryStats.clear()
    this.slowQueries = []
  }
}

export const queryMonitor = QueryPerformanceMonitor.getInstance()

// Database optimization utilities
export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer
  private prisma: PrismaClient

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  public static getInstance(prisma: PrismaClient): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer(prisma)
    }
    return DatabaseOptimizer.instance
  }

  /**
   * Execute query with caching and performance monitoring
   */
  async executeWithCache<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    options: {
      ttl?: number
      tags?: string[]
      skipCache?: boolean
    } = {}
  ): Promise<T> {
    const { ttl = CACHE_TTL.MEDIUM, tags = [], skipCache = false } = options

    // Check cache first (unless skipping)
    if (!skipCache) {
      const cached = cacheManager.get<T>(cacheKey)
      if (cached !== undefined) {
        return cached
      }
    }

    // Execute query with performance monitoring
    const startTime = Date.now()
    try {
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      // Log query performance
      queryMonitor.logQuery(cacheKey, duration)
      
      // Cache the result
      if (!skipCache) {
        cacheManager.set(cacheKey, result, { ttl, tags })
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      queryMonitor.logQuery(`ERROR: ${cacheKey}`, duration)
      throw error
    }
  }

  /**
   * Optimized user queries with caching
   */
  async getUserWithPermissions(userId: string) {
    const cacheKey = cacheUtils.userKey(userId, 'permissions')
    
    return this.executeWithCache(
      cacheKey,
      () => this.prisma.idbi_users.findUnique({
        where: { user_id: userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }),
      { ttl: CACHE_TTL.LONG, tags: ['user', 'permissions'] }
    )
  }

  /**
   * Optimized dashboard data queries
   */
  async getDashboardData(userId: string, timeframe: string = '7d') {
    const cacheKey = cacheUtils.dashboardKey(userId, timeframe)
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        const [userActivity, contentStats, systemHealth] = await Promise.all([
          this.getUserActivityStats(timeframe),
          this.getContentStats(timeframe),
          this.getSystemHealthStats()
        ])
        
        return {
          userActivity,
          contentStats,
          systemHealth,
          lastUpdated: new Date()
        }
      },
      { ttl: CACHE_TTL.SHORT, tags: ['dashboard', 'analytics'] }
    )
  }

  /**
   * Optimized content queries with pagination
   */
  async getContentList(filters: any = {}, page: number = 1, limit: number = 20) {
    const cacheKey = cacheUtils.contentKey({ ...filters, page, limit })
    
    return this.executeWithCache(
      cacheKey,
      () => this.prisma.idbi_content.findMany({
        where: filters,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          category: true,
          created_by_user: {
            select: {
              user_id: true,
              username: true,
              email: true
            }
          }
        }
      }),
      { ttl: CACHE_TTL.MEDIUM, tags: ['content'] }
    )
  }

  /**
   * Batch operations for better performance
   */
  async batchUpdateUsers(updates: Array<{ userId: string; data: any }>) {
    const transaction = await this.prisma.$transaction(
      updates.map(({ userId, data }) =>
        this.prisma.idbi_users.update({
          where: { user_id: userId },
          data
        })
      )
    )

    // Invalidate user caches
    updates.forEach(({ userId }) => {
      cacheManager.invalidateByPattern(`user:.*:${userId}.*`)
    })

    return transaction
  }

  /**
   * Optimized analytics queries
   */
  async getAnalyticsData(type: string, params: any = {}) {
    const cacheKey = cacheUtils.analyticsKey(type, params)
    
    return this.executeWithCache(
      cacheKey,
      async () => {
        switch (type) {
          case 'user-activity':
            return this.getUserActivityStats(params.timeframe || '7d')
          case 'content-performance':
            return this.getContentPerformanceStats(params.timeframe || '7d')
          case 'system-metrics':
            return this.getSystemMetricsStats(params.timeframe || '7d')
          default:
            throw new Error(`Unknown analytics type: ${type}`)
        }
      },
      { ttl: CACHE_TTL.SHORT, tags: ['analytics', type] }
    )
  }

  // Private helper methods
  private async getUserActivityStats(timeframe: string) {
    const days = parseInt(timeframe.replace('d', '')) || 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.prisma.idbi_user_activity.groupBy({
      by: ['activity_date'],
      where: {
        activity_date: {
          gte: startDate
        }
      },
      _count: {
        activity_id: true
      },
      orderBy: {
        activity_date: 'asc'
      }
    })
  }

  private async getContentStats(timeframe: string) {
    const days = parseInt(timeframe.replace('d', '')) || 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.prisma.idbi_content.groupBy({
      by: ['content_type'],
      where: {
        created_at: {
          gte: startDate
        }
      },
      _count: {
        content_id: true
      }
    })
  }

  private async getSystemHealthStats() {
    // This would typically query system metrics
    // For now, return mock data
    return {
      database: {
        status: 'healthy',
        connections: await this.prisma.$queryRaw`SELECT count(*) as connection_count FROM pg_stat_activity`,
        responseTime: Math.random() * 100 + 50
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    }
  }

  private async getContentPerformanceStats(timeframe: string) {
    const days = parseInt(timeframe.replace('d', '')) || 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.prisma.idbi_content.findMany({
      where: {
        created_at: {
          gte: startDate
        }
      },
      select: {
        content_id: true,
        title: true,
        content_type: true,
        view_count: true,
        created_at: true
      },
      orderBy: {
        view_count: 'desc'
      },
      take: 10
    })
  }

  private async getSystemMetricsStats(timeframe: string) {
    // Implementation for system metrics
    return {
      performance: queryMonitor.getStats(),
      cache: cacheManager.getStats(),
      database: await this.getSystemHealthStats()
    }
  }

  /**
   * Database maintenance operations
   */
  async runMaintenance() {
    console.log('Running database maintenance...')
    
    try {
      // Analyze tables for query optimization
      await this.prisma.$executeRaw`ANALYZE`
      
      // Update table statistics
      await this.prisma.$executeRaw`VACUUM ANALYZE`
      
      console.log('Database maintenance completed successfully')
    } catch (error) {
      console.error('Database maintenance failed:', error)
      throw error
    }
  }

  /**
   * Get database performance statistics
   */
  async getPerformanceStats() {
    return {
      queryStats: queryMonitor.getStats(),
      cacheStats: cacheManager.getStats(),
      connectionStats: await this.prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
      `,
      tableStats: await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `
    }
  }
}