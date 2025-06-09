import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { z } from 'zod'

const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  target_user_id: z.string().nullable().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  action_url: z.string().url().optional().or(z.literal('')),
  action_text: z.string().optional(),
  expires_at: z.string().datetime().optional().or(z.literal('')),
  is_active: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to manage notifications
    const canManageNotifications = await hasPermission(
      session.user.id,
      PERMISSIONS.SYSTEM_MANAGE
    )

    if (!canManageNotifications) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const target_type = searchParams.get('target_type') // 'system', 'user', or 'all'

    // Build where clause
    const where: any = {
      deleted_at: null
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (priority && priority !== 'all') {
      where.priority = priority
    }

    if (target_type === 'system') {
      where.target_user_id = null
    } else if (target_type === 'user') {
      where.target_user_id = { not: null }
    }

    // Fetch notifications
    const notifications = await prisma.idbi_notifications.findMany({
      where,
      include: {
        created_by_user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        },
        target_user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      skip: offset
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to manage notifications
    const canManageNotifications = await hasPermission(
      session.user.id,
      PERMISSIONS.SYSTEM_MANAGE
    )

    if (!canManageNotifications) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createNotificationSchema.parse(body)

    // Process optional fields
    const notificationData: any = {
      title: validatedData.title,
      message: validatedData.message,
      type: validatedData.type,
      priority: validatedData.priority,
      is_active: validatedData.is_active,
      created_by: session.user.id
    }

    if (validatedData.target_user_id) {
      // Verify target user exists
      const targetUser = await prisma.idbi_users.findUnique({
        where: { id: validatedData.target_user_id }
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: 'Target user not found' },
          { status: 400 }
        )
      }

      notificationData.target_user_id = validatedData.target_user_id
    }

    if (validatedData.action_url && validatedData.action_url.trim()) {
      notificationData.action_url = validatedData.action_url
    }

    if (validatedData.action_text && validatedData.action_text.trim()) {
      notificationData.action_text = validatedData.action_text
    }

    if (validatedData.expires_at && validatedData.expires_at.trim()) {
      notificationData.expires_at = new Date(validatedData.expires_at)
    }

    // Create notification
    const notification = await prisma.idbi_notifications.create({
      data: notificationData,
      include: {
        created_by_user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        },
        target_user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    })

    // Log audit trail
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: session.user.id,
        action: 'CREATE',
        resource: 'notification',
        resource_id: notification.id,
        new_values: notificationData,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}