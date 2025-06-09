import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = session.user.id

  try {
    switch (req.method) {
      case 'GET':
        return await getNotificationSettings(req, res, userId)
      case 'PUT':
        return await updateNotificationSettings(req, res, userId)
      default:
        res.setHeader('Allow', ['GET', 'PUT'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Notification settings API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getNotificationSettings(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    let userSettings = await prisma.idbi_user_settings.findUnique({
      where: {
        userId: userId
      }
    })

    // Default settings
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      digestFrequency: 'immediate',
      notificationTypes: {
        system: true,
        security: true,
        updates: true,
        marketing: false,
        reports: true
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    }

    let settings = defaultSettings

    if (userSettings?.notificationSettings) {
      try {
        const parsed = JSON.parse(userSettings.notificationSettings as string)
        settings = { ...defaultSettings, ...parsed }
      } catch (error) {
        console.error('Error parsing notification settings:', error)
      }
    }

    return res.status(200).json({ settings })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return res.status(500).json({ error: 'Failed to fetch notification settings' })
  }
}

async function updateNotificationSettings(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const {
      emailNotifications,
      pushNotifications,
      inAppNotifications,
      digestFrequency,
      notificationTypes,
      quietHours
    } = req.body

    // Validate required fields
    if (
      typeof emailNotifications !== 'boolean' ||
      typeof pushNotifications !== 'boolean' ||
      typeof inAppNotifications !== 'boolean' ||
      !['immediate', 'hourly', 'daily', 'weekly', 'never'].includes(digestFrequency)
    ) {
      return res.status(400).json({ error: 'Invalid settings data' })
    }

    // Validate notification types
    if (
      !notificationTypes ||
      typeof notificationTypes.system !== 'boolean' ||
      typeof notificationTypes.security !== 'boolean' ||
      typeof notificationTypes.updates !== 'boolean' ||
      typeof notificationTypes.marketing !== 'boolean' ||
      typeof notificationTypes.reports !== 'boolean'
    ) {
      return res.status(400).json({ error: 'Invalid notification types' })
    }

    // Validate quiet hours
    if (
      !quietHours ||
      typeof quietHours.enabled !== 'boolean' ||
      (quietHours.enabled && (!quietHours.startTime || !quietHours.endTime))
    ) {
      return res.status(400).json({ error: 'Invalid quiet hours settings' })
    }

    const settings = {
      emailNotifications,
      pushNotifications,
      inAppNotifications,
      digestFrequency,
      notificationTypes,
      quietHours
    }

    // Update or create user settings
    await prisma.idbi_user_settings.upsert({
      where: {
        userId: userId
      },
      update: {
        notificationSettings: JSON.stringify(settings),
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        notificationSettings: JSON.stringify(settings),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return res.status(200).json({ 
      message: 'Notification settings updated successfully',
      settings 
    })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return res.status(500).json({ error: 'Failed to update notification settings' })
  }
}