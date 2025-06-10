import { LRUCache } from 'lru-cache'

// In-memory cache configuration
const cache = new LRUCache<string, any>({
  max: 1000, // Maximum number of items
  ttl: 1000 * 60 * 15, // 15 minutes default TTL
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
})

// Cache key prefixes for different data types
export const CACHE_KEYS = {
  USER_PROFILE: 'user:profile:',
  USER_PERMISSIONS: 'user:permissions:',
  DASHBOARD_DATA: 'dashboard:data:',
  ANALYTICS_DATA: 'analytics:data:',
  CONTENT_LIST: 'content:list:',
  SYSTEM_HEALTH: 'system:health:',
  MENU_DATA: 'menu:data:',
  ROLE_PERMISSIONS: 'role:permissions:',
} as const

// Cache TTL configurations (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 15, // 15 minutes
  LONG: 1000 * 60 * 60, // 1 hour
  VERY_LONG: 1000 * 60 * 60 * 24, // 24 hours
} as const

export interface CacheOptions {
  ttl?: number
  tags?: string[]
}

export class CacheManager {
  private static instance: CacheManager
  private cache: LRUCache<string, any>
  private tagMap: Map<string, Set<string>> = new Map()

  private constructor() {
    this.cache = cache
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get(key)
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const { ttl = CACHE_TTL.MEDIUM, tags = [] } = options
    
    this.cache.set(key, value, { ttl })
    
    // Handle tags for cache invalidation
    tags.forEach(tag => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set())
      }
      this.tagMap.get(tag)!.add(key)
    })
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    // Remove from tag mappings
    this.tagMap.forEach((keys, tag) => {
      keys.delete(key)
      if (keys.size === 0) {
        this.tagMap.delete(tag)
      }
    })
    
    return this.cache.delete(key)
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.tagMap.clear()
  }

  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag(tag: string): void {
    const keys = this.tagMap.get(tag)
    if (keys) {
      keys.forEach(key => {
        this.cache.delete(key)
      })
      this.tagMap.delete(tag)
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.delete(key))
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
      tags: this.tagMap.size,
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const value = await fetchFn()
    this.set(key, value, options)
    return value
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance()

// Utility functions for common caching patterns
export const cacheUtils = {
  /**
   * Generate cache key for user data
   */
  userKey: (userId: string, suffix: string = '') => 
    `${CACHE_KEYS.USER_PROFILE}${userId}${suffix ? ':' + suffix : ''}`,

  /**
   * Generate cache key for dashboard data
   */
  dashboardKey: (userId: string, timeframe: string = 'default') => 
    `${CACHE_KEYS.DASHBOARD_DATA}${userId}:${timeframe}`,

  /**
   * Generate cache key for analytics data
   */
  analyticsKey: (type: string, params: Record<string, any> = {}) => {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(':')
    return `${CACHE_KEYS.ANALYTICS_DATA}${type}${paramString ? ':' + paramString : ''}`
  },

  /**
   * Generate cache key for content lists
   */
  contentKey: (filters: Record<string, any> = {}) => {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(':')
    return `${CACHE_KEYS.CONTENT_LIST}${filterString}`
  },

  /**
   * Generate cache key for system health
   */
  systemHealthKey: () => CACHE_KEYS.SYSTEM_HEALTH + 'current',

  /**
   * Generate cache key for menu data
   */
  menuKey: (userId: string, roleId: string) => 
    `${CACHE_KEYS.MENU_DATA}${userId}:${roleId}`,

  /**
   * Generate cache key for role permissions
   */
  rolePermissionsKey: (roleId: string) => 
    `${CACHE_KEYS.ROLE_PERMISSIONS}${roleId}`,
}

// Cache warming functions
export const cacheWarming = {
  /**
   * Warm up user-related caches
   */
  async warmUserCache(userId: string) {
    // Implementation would fetch and cache user data
    console.log(`Warming cache for user: ${userId}`)
  },

  /**
   * Warm up dashboard caches
   */
  async warmDashboardCache() {
    // Implementation would fetch and cache common dashboard data
    console.log('Warming dashboard cache')
  },

  /**
   * Warm up system caches
   */
  async warmSystemCache() {
    // Implementation would fetch and cache system-wide data
    console.log('Warming system cache')
  },
}