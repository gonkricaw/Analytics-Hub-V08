import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to view dashboard analytics
    const canViewAnalytics = await hasPermission(
      session.user.id,
      PERMISSIONS.DASHBOARD_READ
    )

    if (!canViewAnalytics) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get login activity for the last 15 days
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
    fifteenDaysAgo.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // Get login audit logs for the last 15 days
    const loginLogs = await prisma.idbi_audit_logs.findMany({
      where: {
        action: 'LOGIN',
        created_at: {
          gte: fifteenDaysAgo,
          lte: today
        }
      },
      select: {
        created_at: true,
        user_id: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    // Group login logs by date
    const loginsByDate = new Map<string, Set<string>>()
    
    // Initialize all dates in the range with empty sets
    for (let i = 0; i < 15; i++) {
      const date = new Date(fifteenDaysAgo)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      loginsByDate.set(dateKey, new Set())
    }

    // Count unique users per day
    loginLogs.forEach(log => {
      const dateKey = log.created_at.toISOString().split('T')[0]
      if (loginsByDate.has(dateKey)) {
        loginsByDate.get(dateKey)!.add(log.user_id)
      }
    })

    // Convert to array format for chart
    const loginActivity = Array.from(loginsByDate.entries()).map(([date, userSet]) => ({
      date,
      count: userSet.size
    }))

    return NextResponse.json(loginActivity)
  } catch (error) {
    console.error('Error fetching login activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}