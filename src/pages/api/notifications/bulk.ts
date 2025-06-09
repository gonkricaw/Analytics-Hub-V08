import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    switch (req.method) {
      case 'PATCH':
        return await handleBulkUpdate(req, res, session.user.id)
      case 'DELETE':
        return await handleBulkDelete(req, res, session.user.id)
      case 'POST':
        return await handleBulkCreate(req, res, session)
      default:
        res.setHeader('Allow', ['PATCH', 'DELETE', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Bulk notifications API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleBulkUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const { action, notificationIds, filters } = req.body

  if (!action) {
    return res.status(400).json({ error: 'Action is required' })
  }

  try {
    let whereClause: any = {
      target_user_id: userId,
      status: 'active'
    }

    // If specific notification IDs are provided
    if (notificationIds && Array.isArray(notificationIds)) {
      whereClause.id = { in: notificationIds }
    }

    // Apply filters if provided
    if (filters) {
      if (filters.unreadOnly) {
        whereClause.is_read = false
      }
      if (filters.type) {
        whereClause.type = filters.type
      }
      if (filters.priority) {
        whereClause.priority = filters.priority
      }
      if (filters.olderThan) {
        whereClause.created_at = { lt: new Date(filters.olderThan) }
      }
    }

    let updateData: any = {
      updated_at: new Date()
    }

    switch (action) {
      case 'mark_read':
        updateData.is_read = true
        updateData.read_at = new Date()
        break
      case 'mark_unread':
        updateData.is_read = false
        updateData.read_at = null
        break
      case 'archive':
        updateData.status = 'archived'
        break
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

    const result = await prisma.idbi_notifications.updateMany({
      where: whereClause,
      data: updateData
    })

    return res.status(200).json({
      success: true,
      updatedCount: result.count,
      action
    })
  } catch (error) {
    console.error('Error in bulk update:', error)
    return res.status(500).json({ error: 'Failed to update notifications' })
  }
}

async function handleBulkDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const { notificationIds, filters, permanent = false } = req.body

  try {
    let whereClause: any = {
      target_user_id: userId,
      status: 'active'
    }

    // If specific notification IDs are provided
    if (notificationIds && Array.isArray(notificationIds)) {
      whereClause.id = { in: notificationIds }
    }

    // Apply filters if provided
    if (filters) {
      if (filters.readOnly) {
        whereClause.is_read = true
      }
      if (filters.type) {
        whereClause.type = filters.type
      }
      if (filters.priority) {
        whereClause.priority = filters.priority
      }
      if (filters.olderThan) {
        whereClause.created_at = { lt: new Date(filters.olderThan) }
      }
    }

    let result
    if (permanent) {
      // Permanent deletion (hard delete)
      result = await prisma.idbi_notifications.deleteMany({
        where: whereClause
      })
    } else {
      // Soft delete
      result = await prisma.idbi_notifications.updateMany({
        where: whereClause,
        data: {
          status: 'deleted',
          updated_at: new Date()
        }
      })
    }

    return res.status(200).json({
      success: true,
      deletedCount: result.count,
      permanent
    })
  } catch (error) {
    console.error('Error in bulk delete:', error)
    return res.status(500).json({ error: 'Failed to delete notifications' })
  }
}

async function handleBulkCreate(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  // Check if user has permission to send notifications
  if (!hasPermission(session.user, 'notifications:send')) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  const { notifications } = req.body

  if (!notifications || !Array.isArray(notifications)) {
    return res.status(400).json({ error: 'Notifications array is required' })
  }

  if (notifications.length === 0) {
    return res.status(400).json({ error: 'At least one notification is required' })
  }

  if (notifications.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 notifications allowed per batch' })
  }

  try {
    const results = []
    const errors = []

    for (let i = 0; i < notifications.length; i++) {
      const notificationData = notifications[i]
      
      try {
        // Validate required fields
        if (!notificationData.title || !notificationData.message) {
          errors.push({
            index: i,
            error: 'Title and message are required'
          })
          continue
        }

        if (!notificationData.targetUserId && !notificationData.targetRole) {
          errors.push({
            index: i,
            error: 'Either targetUserId or targetRole is required'
          })
          continue
        }

        let notificationIds: string[] = []

        if (notificationData.targetUserId) {
          // Send to specific user
          const notification = await NotificationService.createNotification({
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'info',
            priority: notificationData.priority || 'medium',
            targetUserId: notificationData.targetUserId,
            senderId: session.user.id,
            expiresAt: notificationData.expiresAt ? new Date(notificationData.expiresAt) : undefined,
            metadata: notificationData.metadata,
            sendEmail: notificationData.sendEmail || false
          })
          notificationIds.push(notification.id)
        } else if (notificationData.targetRole) {
          // Send to all users with specific role
          const users = await prisma.idbi_users.findMany({
            where: { role: notificationData.targetRole },
            select: { id: true }
          })

          const roleNotifications = await Promise.all(
            users.map(user => 
              NotificationService.createNotification({
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type || 'info',
                priority: notificationData.priority || 'medium',
                targetUserId: user.id,
                senderId: session.user.id,
                expiresAt: notificationData.expiresAt ? new Date(notificationData.expiresAt) : undefined,
                metadata: notificationData.metadata,
                sendEmail: notificationData.sendEmail || false
              })
            )
          )
          notificationIds = roleNotifications.map(n => n.id)
        }

        results.push({
          index: i,
          success: true,
          notificationIds,
          count: notificationIds.length
        })
      } catch (error) {
        console.error(`Error creating notification at index ${i}:`, error)
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const totalCreated = results.reduce((sum, result) => sum + result.count, 0)

    return res.status(201).json({
      success: true,
      totalCreated,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors
    })
  } catch (error) {
    console.error('Error in bulk create:', error)
    return res.status(500).json({ error: 'Failed to create notifications' })
  }
}