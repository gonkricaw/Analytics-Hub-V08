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

    // Check if user has permission to view dashboard stats
    const canViewStats = await hasPermission(
      session.user.id,
      PERMISSIONS.DASHBOARD_READ
    )

    if (!canViewStats) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get total users count
    const totalUsers = await prisma.idbi_users.count({
      where: {
        deleted_at: null
      }
    })

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activeUsers = await prisma.idbi_users.count({
      where: {
        deleted_at: null,
        last_login_at: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Get total content count
    const totalContent = await prisma.idbi_content.count({
      where: {
        deleted_at: null
      }
    })

    // Get published content count
    const publishedContent = await prisma.idbi_content.count({
      where: {
        deleted_at: null,
        status: 'published'
      }
    })

    // Get total dashboards count
    const totalDashboards = await prisma.idbi_dashboards.count({
      where: {
        deleted_at: null
      }
    })

    // Get active dashboards count
    const activeDashboards = await prisma.idbi_dashboards.count({
      where: {
        deleted_at: null,
        is_active: true
      }
    })

    const stats = {
      totalUsers,
      activeUsers,
      totalContent,
      publishedContent,
      totalDashboards,
      activeDashboards
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}