// Notification service for handling various types of notifications
import { prisma } from './prisma'
import { sendTemplatedEmail, sendBulkTemplatedEmails } from './email'
import { WebSocketManager } from './websocket'

interface NotificationData {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  targetUserId?: string
  targetRoleId?: string
  actionUrl?: string
  actionText?: string
  metadata?: any
  expiresAt?: Date
  sendEmail?: boolean
  emailTemplate?: string
  emailVariables?: Record<string, string>
}

interface BulkNotificationData {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  targetUserIds?: string[]
  targetRoleIds?: string[]
  actionUrl?: string
  actionText?: string
  metadata?: any
  expiresAt?: Date
  sendEmail?: boolean
  emailTemplate?: string
  globalEmailVariables?: Record<string, string>
  userSpecificVariables?: Record<string, Record<string, string>>
}

export class NotificationService {
  /**
   * Create a single notification
   */
  static async createNotification(
    data: NotificationData,
    createdBy?: string
  ): Promise<{ success: boolean; notification?: any; error?: string }> {
    try {
      // Create notification in database
      const notification = await prisma.idbi_notifications.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          target_user_id: data.targetUserId,
          target_role_id: data.targetRoleId,
          action_url: data.actionUrl,
          action_text: data.actionText,
          metadata: data.metadata,
          expires_at: data.expiresAt,
          created_by: createdBy,
          status: 'active'
        },
        include: {
          target_user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true
            }
          },
          target_role: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Send real-time notification
      await this.sendRealTimeNotification(notification)

      // Send email notification if requested
      if (data.sendEmail) {
        await this.sendEmailNotification(notification, data.emailTemplate, data.emailVariables)
      }

      return {
        success: true,
        notification
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Create bulk notifications
   */
  static async createBulkNotifications(
    data: BulkNotificationData,
    createdBy?: string
  ): Promise<{ success: boolean; notifications?: any[]; stats?: { created: number; emailsSent: number; errors: string[] }; error?: string }> {
    try {
      const stats = {
        created: 0,
        emailsSent: 0,
        errors: [] as string[]
      }

      const notifications = []
      const emailRecipients = []

      // Get target users
      let targetUsers = []
      
      if (data.targetUserIds && data.targetUserIds.length > 0) {
        const users = await prisma.idbi_users.findMany({
          where: {
            id: { in: data.targetUserIds },
            is_active: true
          },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        })
        targetUsers.push(...users)
      }

      if (data.targetRoleIds && data.targetRoleIds.length > 0) {
        const roleUsers = await prisma.idbi_users.findMany({
          where: {
            role_id: { in: data.targetRoleIds },
            is_active: true
          },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        })
        targetUsers.push(...roleUsers)
      }

      // Remove duplicates
      const uniqueUsers = targetUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      )

      // Create notifications for each user
      for (const user of uniqueUsers) {
        try {
          const notification = await prisma.idbi_notifications.create({
            data: {
              title: data.title,
              message: data.message,
              type: data.type,
              priority: data.priority,
              target_user_id: user.id,
              action_url: data.actionUrl,
              action_text: data.actionText,
              metadata: data.metadata,
              expires_at: data.expiresAt,
              created_by: createdBy,
              status: 'active'
            }
          })

          notifications.push(notification)
          stats.created++

          // Send real-time notification
          await this.sendRealTimeNotification({
            ...notification,
            target_user: user
          })

          // Prepare email data if needed
          if (data.sendEmail && data.emailTemplate) {
            const userVariables = {
              ...data.globalEmailVariables,
              ...data.userSpecificVariables?.[user.id],
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              notification_title: data.title,
              notification_message: data.message,
              action_url: data.actionUrl || '',
              action_text: data.actionText || ''
            }

            emailRecipients.push({
              email: user.email,
              variables: userVariables
            })
          }
        } catch (error) {
          stats.errors.push(`Failed to create notification for user ${user.id}: ${error}`)
        }
      }

      // Send bulk emails if requested
      if (data.sendEmail && data.emailTemplate && emailRecipients.length > 0) {
        try {
          const emailResults = await sendBulkTemplatedEmails({
            templateName: data.emailTemplate,
            recipients: emailRecipients,
            globalVariables: data.globalEmailVariables
          })

          stats.emailsSent = emailResults.success
          stats.errors.push(...emailResults.errors)
        } catch (error) {
          stats.errors.push(`Bulk email error: ${error}`)
        }
      }

      return {
        success: true,
        notifications,
        stats
      }
    } catch (error) {
      console.error('Error creating bulk notifications:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Send real-time notification via WebSocket
   */
  private static async sendRealTimeNotification(notification: any): Promise<void> {
    try {
      const wsManager = WebSocketManager.getInstance()
      
      if (notification.target_user_id) {
        // Send to specific user
        wsManager.sendToUser(notification.target_user_id, {
          type: 'notification',
          data: {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            actionUrl: notification.action_url,
            actionText: notification.action_text,
            createdAt: notification.created_at,
            expiresAt: notification.expires_at
          }
        })
      } else if (notification.target_role_id) {
        // Send to all users with specific role
        wsManager.sendToRole(notification.target_role_id, {
          type: 'notification',
          data: {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            actionUrl: notification.action_url,
            actionText: notification.action_text,
            createdAt: notification.created_at,
            expiresAt: notification.expires_at
          }
        })
      } else {
        // Send to all connected users
        wsManager.broadcast({
          type: 'notification',
          data: {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            actionUrl: notification.action_url,
            actionText: notification.action_text,
            createdAt: notification.created_at,
            expiresAt: notification.expires_at
          }
        })
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error)
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    notification: any,
    templateName?: string,
    variables?: Record<string, string>
  ): Promise<void> {
    try {
      if (!notification.target_user?.email) {
        console.warn('No email address found for notification recipient')
        return
      }

      const emailVariables = {
        ...variables,
        first_name: notification.target_user.first_name,
        last_name: notification.target_user.last_name,
        notification_title: notification.title,
        notification_message: notification.message,
        action_url: notification.action_url || '',
        action_text: notification.action_text || '',
        priority: notification.priority,
        created_at: new Date(notification.created_at).toLocaleString()
      }

      if (templateName) {
        // Use custom template
        await sendTemplatedEmail(
          templateName,
          notification.target_user.email,
          emailVariables
        )
      } else {
        // Use default notification template
        await sendTemplatedEmail(
          'notification',
          notification.target_user.email,
          emailVariables
        )
      }
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.idbi_notifications.update({
        where: {
          id: notificationId,
          target_user_id: userId
        },
        data: {
          is_read: true,
          read_at: new Date()
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(
    userId: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const result = await prisma.idbi_notifications.updateMany({
        where: {
          target_user_id: userId,
          is_read: false,
          status: 'active'
        },
        data: {
          is_read: true,
          read_at: new Date()
        }
      })

      return {
        success: true,
        count: result.count
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      unreadOnly?: boolean
      type?: string
      priority?: string
    }
  ): Promise<{ success: boolean; notifications?: any[]; total?: number; unreadCount?: number; error?: string }> {
    try {
      const where = {
        target_user_id: userId,
        status: 'active',
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ],
        ...(options?.unreadOnly && { is_read: false }),
        ...(options?.type && { type: options.type }),
        ...(options?.priority && { priority: options.priority })
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.idbi_notifications.findMany({
          where,
          orderBy: [
            { priority: 'desc' },
            { created_at: 'desc' }
          ],
          take: options?.limit || 50,
          skip: options?.offset || 0
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

      return {
        success: true,
        notifications,
        total,
        unreadCount
      }
    } catch (error) {
      console.error('Error getting user notifications:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(
    notificationId: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const where: any = { id: notificationId }
      if (userId) {
        where.target_user_id = userId
      }

      await prisma.idbi_notifications.update({
        where,
        data: {
          status: 'deleted',
          deleted_at: new Date()
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const result = await prisma.idbi_notifications.updateMany({
        where: {
          expires_at: {
            lt: new Date()
          },
          status: 'active'
        },
        data: {
          status: 'expired'
        }
      })

      return {
        success: true,
        deletedCount: result.count
      }
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

// Convenience functions for common notification types
export const sendWelcomeNotification = async (userId: string, userEmail: string, userName: string) => {
  return NotificationService.createNotification({
    title: 'Welcome to Analytics Hub!',
    message: `Welcome ${userName}! Your account has been successfully created. Please complete your profile setup.`,
    type: 'success',
    priority: 'normal',
    targetUserId: userId,
    actionUrl: '/dashboard/profile',
    actionText: 'Complete Profile',
    sendEmail: true,
    emailTemplate: 'welcome',
    emailVariables: {
      user_name: userName,
      user_email: userEmail
    }
  })
}

export const sendPasswordResetNotification = async (userId: string, userEmail: string, userName: string) => {
  return NotificationService.createNotification({
    title: 'Password Reset Requested',
    message: 'A password reset has been requested for your account. If this wasn\'t you, please contact support.',
    type: 'warning',
    priority: 'high',
    targetUserId: userId,
    actionUrl: '/dashboard/security',
    actionText: 'Security Settings',
    sendEmail: false // Email is sent separately with reset link
  })
}

export const sendSecurityAlertNotification = async (userId: string, alertType: string, details: string) => {
  return NotificationService.createNotification({
    title: 'Security Alert',
    message: `Security alert: ${alertType}. ${details}`,
    type: 'error',
    priority: 'urgent',
    targetUserId: userId,
    actionUrl: '/dashboard/security',
    actionText: 'Review Security',
    sendEmail: true,
    emailTemplate: 'security_alert',
    emailVariables: {
      alert_type: alertType,
      alert_details: details
    }
  })
}

export const sendSystemMaintenanceNotification = async (title: string, message: string, scheduledTime: string) => {
  return NotificationService.createBulkNotifications({
    title,
    message,
    type: 'warning',
    priority: 'high',
    sendEmail: true,
    emailTemplate: 'system_maintenance',
    globalEmailVariables: {
      maintenance_title: title,
      maintenance_message: message,
      scheduled_time: scheduledTime
    }
  })
}