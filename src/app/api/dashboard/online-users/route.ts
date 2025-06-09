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

    // Get limit from query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '8')

    // Define time thresholds for user status
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // Online threshold
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000) // Away threshold

    // Get users with their last activity
    const users = await prisma.idbi_users.findMany({
      where: {
        deleted_at: null,
        is_active: true,
        last_login_at: {
          not: null
        }
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        last_login_at: true,
        avatar_url: true
      },
      orderBy: {
        last_login_at: 'desc'
      }
    })

    // Get the most recent activity for each user from audit logs
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        // Get the most recent audit log entry for this user
        const lastActivity = await prisma.idbi_audit_logs.findFirst({
          where: {
            user_id: user.id
          },
          orderBy: {
            created_at: 'desc'
          },
          select: {
            created_at: true
          }
        })

        // Use last_login_at if no audit log activity found
        const lastActivityTime = lastActivity?.created_at || user.last_login_at
        
        // Determine user status based on last activity
        let status: 'online' | 'away' | 'offline' = 'offline'
        
        if (lastActivityTime) {
          if (lastActivityTime >= fiveMinutesAgo) {
            status = 'online'
          } else if (lastActivityTime >= thirtyMinutesAgo) {
            status = 'away'
          }
        }

        return {
          ...user,
          last_activity_at: lastActivityTime?.toISOString() || user.last_login_at?.toISOString() || now.toISOString(),
          status
        }
      })
    )

    // Sort by status priority (online first, then away, then offline) and last activity
    const sortedUsers = usersWithActivity
      .sort((a, b) => {
        // Priority: online > away > offline
        const statusPriority = { online: 3, away: 2, offline: 1 }
        const aPriority = statusPriority[a.status]
        const bPriority = statusPriority[b.status]
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        
        // If same status, sort by last activity (most recent first)
        return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
      })
      .slice(0, limit)

    return NextResponse.json(sortedUsers)
  } catch (error) {
    console.error('Error fetching online users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}