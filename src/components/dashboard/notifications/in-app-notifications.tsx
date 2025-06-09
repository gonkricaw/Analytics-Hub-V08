import React, { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BellIcon, Trash2Icon, CheckIcon, CheckCheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface InAppNotificationsProps {
  className?: string
}

const InAppNotifications: React.FC<InAppNotificationsProps> = ({ className }) => {
  const { data: session } = useSession()
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteAllNotifications,
    getNotifications,
    connected
  } = useWebSocket()

  useEffect(() => {
    if (connected && session?.user) {
      // Load initial notifications
      getNotifications({ limit: 50 })
    }
  }, [connected, session?.user, getNotifications])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id)
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const handleClearAllNotifications = async () => {
    try {
      await deleteAllNotifications()
      toast.success('All notifications cleared')
    } catch (error) {
      toast.error('Failed to clear notifications')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BellIcon className="h-4 w-4" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        {!connected && (
          <Badge variant="outline" className="text-xs">
            Offline
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{unreadCount} Unread</div>
        <p className="text-xs text-muted-foreground">
          {notifications.length} total notifications
        </p>
        
        {notifications.length > 0 && (
          <div className="mt-4 flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                className="flex-1"
              >
                <CheckCheckIcon className="mr-2 h-4 w-4" /> 
                Mark All Read
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAllNotifications}
              className="flex-1"
            >
              <Trash2Icon className="mr-2 h-4 w-4" /> 
              Clear All
            </Button>
          </div>
        )}
        
        <ScrollArea className="h-[400px] mt-4">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <BellIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll see new notifications here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative p-3 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-muted/50 border-muted' 
                      : 'bg-background border-primary/20 shadow-sm'
                  }`}
                >
                  {!notification.read && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-tight">
                          {notification.title}
                        </h4>
                        <Badge 
                          variant={getPriorityColor(notification.priority)} 
                          className="text-xs shrink-0"
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true 
                          })}
                        </p>
                        
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <CheckIcon className="h-3 w-3 mr-1" />
                              Read
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default InAppNotifications