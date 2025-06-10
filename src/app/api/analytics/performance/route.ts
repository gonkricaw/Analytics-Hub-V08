import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface PerformanceMetric {
  metric: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow anonymous performance metrics collection
    const body: PerformanceMetric = await request.json()
    
    // Validate required fields
    if (!body.metric || typeof body.value !== 'number' || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: metric, value, timestamp' },
        { status: 400 }
      )
    }

    // Store performance metric in database
    await prisma.idbi_performance_metrics.create({
      data: {
        metric_name: body.metric,
        metric_value: body.value,
        rating: body.rating,
        url: body.url,
        user_agent: body.userAgent,
        user_id: session?.user?.id || null,
        timestamp: new Date(body.timestamp),
        created_at: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing performance metric:', error)
    return NextResponse.json(
      { error: 'Failed to store performance metric' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const metric = searchParams.get('metric')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const whereClause: any = {
      timestamp: {
        gte: startDate,
      },
    }

    if (metric) {
      whereClause.metric_name = metric
    }

    // Get performance metrics
    const metrics = await prisma.idbi_performance_metrics.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      take: 1000, // Limit to prevent large responses
    })

    // Calculate aggregated statistics
    const aggregatedData = metrics.reduce((acc: any, metric) => {
      const metricName = metric.metric_name
      if (!acc[metricName]) {
        acc[metricName] = {
          name: metricName,
          values: [],
          average: 0,
          min: Infinity,
          max: -Infinity,
          good: 0,
          needsImprovement: 0,
          poor: 0,
        }
      }

      acc[metricName].values.push({
        value: metric.metric_value,
        timestamp: metric.timestamp,
        url: metric.url,
        rating: metric.rating,
      })

      acc[metricName].min = Math.min(acc[metricName].min, metric.metric_value)
      acc[metricName].max = Math.max(acc[metricName].max, metric.metric_value)

      // Count ratings
      switch (metric.rating) {
        case 'good':
          acc[metricName].good++
          break
        case 'needs-improvement':
          acc[metricName].needsImprovement++
          break
        case 'poor':
          acc[metricName].poor++
          break
      }

      return acc
    }, {})

    // Calculate averages
    Object.keys(aggregatedData).forEach(metricName => {
      const metric = aggregatedData[metricName]
      metric.average = metric.values.reduce((sum: number, v: any) => sum + v.value, 0) / metric.values.length
    })

    return NextResponse.json({
      metrics: Object.values(aggregatedData),
      totalCount: metrics.length,
      dateRange: {
        start: startDate,
        end: new Date(),
      },
    })
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}