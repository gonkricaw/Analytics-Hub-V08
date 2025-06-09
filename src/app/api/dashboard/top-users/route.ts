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
    const limit = parseInt(searchParams.get('limit') || '5')

    // Get the last 30 days for login activity calculation
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get users with their login counts from audit logs
    const usersWithLoginCounts = await prisma.idbi_users.findMany({
      where: {
        deleted_at: null,
        is_active: true
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        last_login_at: true,
        avatar_url: true
      }
    })

    // Get login counts for each user from audit logs
    const usersWithCounts = await Promise.all(
      usersWithLoginCounts.map(async (user) => {
        const loginCount = await prisma.idbi_audit_logs.count({
          where: {
            user_id: user.id,
            action: 'LOGIN',
            created_at: {
              gte: thirtyDaysAgo
            }
          }
        })

        return {
          ...user,
          login_count: loginCount
        }
      })
    )

    // Sort by login count (descending) and take the top users
    const topUsers = usersWithCounts
      .sort((a, b) => b.login_count - a.login_count)
      .slice(0, limit)

    return NextResponse.json(topUsers)
  } catch (error) {
    console.error('Error fetching top users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}