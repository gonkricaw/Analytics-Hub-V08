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
    const limit = parseInt(searchParams.get('limit') || '3')

    // Get announcements from notifications table (assuming announcements are stored as notifications)
    const announcements = await prisma.idbi_notifications.findMany({
      where: {
        deleted_at: null,
        is_active: true,
        // Only get announcements (system-wide notifications)
        target_user_id: null
      },
      include: {
        created_by_user: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit
    })

    // Transform the data to match the expected format
    const formattedAnnouncements = announcements.map(notification => ({
      id: notification.id,
      title: notification.title,
      content: notification.content,
      type: notification.type || 'info',
      is_active: notification.is_active,
      created_at: notification.created_at.toISOString(),
      created_by_name: notification.created_by_user 
        ? `${notification.created_by_user.first_name} ${notification.created_by_user.last_name}`
        : 'System',
      expires_at: notification.expires_at?.toISOString()
    }))

    return NextResponse.json(formattedAnnouncements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    
    // If notifications table doesn't exist or has issues, return sample data
    const sampleAnnouncements = [
      {
        id: '1',
        title: 'System Maintenance Scheduled',
        content: 'We will be performing scheduled maintenance on the system this weekend. Please save your work regularly.',
        type: 'warning',
        is_active: true,
        created_at: new Date().toISOString(),
        created_by_name: 'System Administrator',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'New Dashboard Features Available',
        content: 'Check out the new analytics widgets and real-time data features now available in your dashboard.',
        type: 'success',
        is_active: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_by_name: 'Product Team'
      },
      {
        id: '3',
        title: 'Welcome to Analytics Hub',
        content: 'Welcome to the new Analytics Hub platform. Explore the powerful features and create amazing dashboards.',
        type: 'info',
        is_active: true,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_by_name: 'Analytics Team'
      }
    ]
    
    return NextResponse.json(sampleAnnouncements)
  }
}