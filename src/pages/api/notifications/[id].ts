import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid notification ID' })
    }

    switch (req.method) {
      case 'GET':
        return await handleGetNotification(req, res, id, session.user.id)
      case 'PATCH':
        return await handleUpdateNotification(req, res, id, session.user.id)
      case 'DELETE':
        return await handleDeleteNotification(req, res, id, session.user.id)
      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Notification API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleGetNotification(
  req: NextApiRequest,
  res: NextApiResponse,
  notificationId: string,
  userId: string
) {
  try {
    const notification = await prisma.idbi_notifications.findFirst({
      where: {
        id: notificationId,
        target_user_id: userId,
        status: 'active'
      },
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
        metadata: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    // Transform to match frontend interface
    const transformedNotification = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      read: notification.is_read,
      readAt: notification.read_at?.toISOString(),
      createdAt: notification.created_at.toISOString(),
      expiresAt: notification.expires_at?.toISOString(),
      metadata: notification.metadata,
      sender: notification.sender
    }

    return res.status(200).json(transformedNotification)
  } catch (error) {
    console.error('Error fetching notification:', error)
    return res.status(500).json({ error: 'Failed to fetch notification' })
  }
}

async function handleUpdateNotification(
  req: NextApiRequest,
  res: NextApiResponse,
  notificationId: string,
  userId: string
) {
  const { isRead, metadata } = req.body

  try {
    // Verify notification belongs to user
    const existingNotification = await prisma.idbi_notifications.findFirst({
      where: {
        id: notificationId,
        target_user_id: userId,
        status: 'active'
      }
    })

    if (!existingNotification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    const updateData: any = {
      updated_at: new Date()
    }

    if (typeof isRead === 'boolean') {
      updateData.is_read = isRead
      if (isRead && !existingNotification.is_read) {
        updateData.read_at = new Date()
      } else if (!isRead) {
        updateData.read_at = null
      }
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata
    }

    const updatedNotification = await prisma.idbi_notifications.update({
      where: { id: notificationId },
      data: updateData,
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
    })

    // Transform to match frontend interface
    const transformedNotification = {
      id: updatedNotification.id,
      title: updatedNotification.title,
      message: updatedNotification.message,
      type: updatedNotification.type,
      priority: updatedNotification.priority,
      read: updatedNotification.is_read,
      readAt: updatedNotification.read_at?.toISOString(),
      createdAt: updatedNotification.created_at.toISOString(),
      expiresAt: updatedNotification.expires_at?.toISOString(),
      metadata: updatedNotification.metadata
    }

    return res.status(200).json(transformedNotification)
  } catch (error) {
    console.error('Error updating notification:', error)
    return res.status(500).json({ error: 'Failed to update notification' })
  }
}

async function handleDeleteNotification(
  req: NextApiRequest,
  res: NextApiResponse,
  notificationId: string,
  userId: string
) {
  try {
    // Verify notification belongs to user
    const existingNotification = await prisma.idbi_notifications.findFirst({
      where: {
        id: notificationId,
        target_user_id: userId,
        status: 'active'
      }
    })

    if (!existingNotification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    // Soft delete by updating status
    await prisma.idbi_notifications.update({
      where: { id: notificationId },
      data: {
        status: 'deleted',
        updated_at: new Date()
      }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return res.status(500).json({ error: 'Failed to delete notification' })
  }
}