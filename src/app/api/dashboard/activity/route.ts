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

    // Check if user has permission to view dashboard activity
    const canViewActivity = await hasPermission(
      session.user.id,
      PERMISSIONS.DASHBOARD_READ
    )

    if (!canViewActivity) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get recent audit logs for activity feed
    const recentLogs = await prisma.idbi_audit_logs.findMany({
      take: 20,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      where: {
        action: {
          in: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN']
        }
      }
    })

    // Transform audit logs into activity items
    const activities = recentLogs.map(log => {
      let type: string
      let description: string

      switch (log.action) {
        case 'LOGIN':
          type = 'user_login'
          description = `User logged in`
          break
        case 'CREATE':
          if (log.table_name === 'idbi_content') {
            type = 'content_created'
            description = `New content item created`
          } else if (log.table_name === 'idbi_dashboards') {
            type = 'dashboard_created'
            description = `New dashboard created`
          } else if (log.table_name === 'idbi_menus') {
            type = 'menu_updated'
            description = `New menu item created`
          } else {
            type = 'other'
            description = `New ${log.table_name.replace('idbi_', '')} created`
          }
          break
        case 'UPDATE':
          if (log.table_name === 'idbi_menus') {
            type = 'menu_updated'
            description = `Menu item updated`
          } else {
            type = 'other'
            description = `${log.table_name.replace('idbi_', '')} updated`
          }
          break
        case 'DELETE':
          type = 'other'
          description = `${log.table_name.replace('idbi_', '')} deleted`
          break
        default:
          type = 'other'
          description = `${log.action} performed on ${log.table_name.replace('idbi_', '')}`
      }

      return {
        id: log.id,
        type,
        description,
        timestamp: log.created_at.toISOString(),
        user: log.user ? {
          first_name: log.user.first_name,
          last_name: log.user.last_name
        } : null
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}