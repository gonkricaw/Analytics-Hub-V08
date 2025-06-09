import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { z } from 'zod'

const updateNotificationSchema = z.object({
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  type: z.enum(['info', 'success', 'warning', 'error']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  is_active: z.boolean().optional(),
  action_url: z.string().url().optional().or(z.literal('')),
  action_text: z.string().optional(),
  expires_at: z.string().datetime().optional().or(z.literal('')),
  is_read: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to view notifications
    const canViewNotifications = await hasPermission(
      session.user.id,
      PERMISSIONS.SYSTEM_READ
    )

    if (!canViewNotifications) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const notification = await prisma.idbi_notifications.findFirst({
      where: {
        id: params.id,
        deleted_at: null
      },
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

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error fetching notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if notification exists
    const existingNotification = await prisma.idbi_notifications.findFirst({
      where: {
        id: params.id,
        deleted_at: null
      }
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateNotificationSchema.parse(body)

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    }

    // Only update provided fields
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.message !== undefined) updateData.message = validatedData.message
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.is_active !== undefined) updateData.is_active = validatedData.is_active
    if (validatedData.is_read !== undefined) {
      updateData.is_read = validatedData.is_read
      if (validatedData.is_read) {
        updateData.read_at = new Date()
      }
    }

    if (validatedData.action_url !== undefined) {
      updateData.action_url = validatedData.action_url.trim() || null
    }

    if (validatedData.action_text !== undefined) {
      updateData.action_text = validatedData.action_text?.trim() || null
    }

    if (validatedData.expires_at !== undefined) {
      updateData.expires_at = validatedData.expires_at.trim() ? new Date(validatedData.expires_at) : null
    }

    // Update notification
    const updatedNotification = await prisma.idbi_notifications.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'UPDATE',
        resource: 'notification',
        resource_id: params.id,
        old_values: existingNotification,
        new_values: updateData,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if notification exists
    const existingNotification = await prisma.idbi_notifications.findFirst({
      where: {
        id: params.id,
        deleted_at: null
      }
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Soft delete the notification
    await prisma.idbi_notifications.update({
      where: { id: params.id },
      data: {
        deleted_at: new Date(),
        is_active: false
      }
    })

    // Log audit trail
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: session.user.id,
        action: 'DELETE',
        resource: 'notification',
        resource_id: params.id,
        old_values: existingNotification,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}