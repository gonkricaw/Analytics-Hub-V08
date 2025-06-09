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

    const userId = session.user.id

    switch (req.method) {
      case 'GET':
        return await handleGetNotifications(req, res, userId)
      case 'POST':
        return await handleCreateNotification(req, res, session)
      case 'DELETE':
        return await handleDeleteAllNotifications(req, res, userId)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Notifications API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleGetNotifications(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  const {
    limit = '20',
    offset = '0',
    unreadOnly = 'false',
    type,
    priority
  } = req.query

  const where = {
    target_user_id: userId,
    status: 'active',
    OR: [
      { expires_at: null },
      { expires_at: { gt: new Date() } }
    ],
    ...(unreadOnly === 'true' && { is_read: false }),
    ...(type && { type: type as string }),
    ...(priority && { priority: priority as string })
  }

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.idbi_notifications.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' }
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        priority: true,
        is_read: true,
        read_at: true,
        created_at: true,
        expires_at: true,
        metadata: true
      }
    }),
    prisma.idbi_notifications.count({ where }),
    prisma.idbi_notifications.count({
      where: {
        target_user_id: userId,
        status: 'active',
        is_read: false,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    })
  ])

  // Transform to match frontend interface
  const transformedNotifications = notifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    read: notification.is_read,
    readAt: notification.read_at?.toISOString(),
    createdAt: notification.created_at.toISOString(),
    expiresAt: notification.expires_at?.toISOString(),
    metadata: notification.metadata
  }))

  return res.status(200).json({
    notifications: transformedNotifications,
    pagination: {
      total: totalCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: parseInt(offset as string) + parseInt(limit as string) < totalCount
    },
    unreadCount
  })
}

async function handleCreateNotification(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  // Check if user has permission to send notifications
  if (!hasPermission(session.user, 'notifications:send')) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }

  const {
    title,
    message,
    type = 'info',
    priority = 'medium',
    targetUserId,
    targetRole,
    expiresAt,
    metadata,
    sendEmail = false
  } = req.body

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' })
  }

  if (!targetUserId && !targetRole) {
    return res.status(400).json({ error: 'Either targetUserId or targetRole is required' })
  }

  try {
    let notificationIds: string[] = []

    if (targetUserId) {
      // Send to specific user
      const notification = await NotificationService.createNotification({
        title,
        message,
        type,
        priority,
        targetUserId,
        senderId: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        metadata,
        sendEmail
      })
      notificationIds.push(notification.id)
    } else if (targetRole) {
      // Send to all users with specific role
      const users = await prisma.idbi_users.findMany({
        where: { role: targetRole },
        select: { id: true }
      })

      const notifications = await Promise.all(
        users.map(user => 
          NotificationService.createNotification({
            title,
            message,
            type,
            priority,
            targetUserId: user.id,
            senderId: session.user.id,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            metadata,
            sendEmail
          })
        )
      )
      notificationIds = notifications.map(n => n.id)
    }

    return res.status(201).json({
      success: true,
      notificationIds,
      count: notificationIds.length
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return res.status(500).json({ error: 'Failed to create notification' })
  }
}

async function handleDeleteAllNotifications(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const result = await prisma.idbi_notifications.updateMany({
      where: {
        target_user_id: userId,
        status: 'active'
      },
      data: {
        status: 'deleted',
        updated_at: new Date()
      }
    })

    return res.status(200).json({
      success: true,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error deleting all notifications:', error)
    return res.status(500).json({ error: 'Failed to delete notifications' })
  }
}