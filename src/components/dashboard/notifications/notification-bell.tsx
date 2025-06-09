import React, { useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { BellIcon, CheckIcon, Trash2Icon, SettingsIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'

interface NotificationBellProps {
  className?: string
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    connected
  } = useWebSocket()
  
  const [isOpen, setIsOpen] = useState(false)
  
  // Show only recent notifications in dropdown (last 5)
  const recentNotifications = notifications.slice(0, 5)

  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await markAsRead(id)
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleDeleteNotification = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await deleteNotification(id)
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
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
        return 'text-red-500'
      case 'high':
        return 'text-orange-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative ${className}`}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {!connected && (
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-gray-400 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        sideOffset={5}
      >
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMarkAllAsRead}
                  className="h-6 px-2 text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Link href="/dashboard/notifications">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => setIsOpen(false)}
                >
                  <SettingsIcon className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <Separator />
        
        <ScrollArea className="max-h-96">
          {recentNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="p-2">
              {recentNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`relative p-3 rounded-md transition-colors hover:bg-muted/50 cursor-pointer ${
                      notification.read ? 'opacity-75' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    {!notification.read && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="text-sm mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium leading-tight line-clamp-1">
                            {notification.title}
                          </h4>
                          <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            ●
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { 
                              addSuffix: true 
                            })}
                          </p>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="h-5 w-5 p-0"
                              >
                                <CheckIcon className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2Icon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < recentNotifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 5 && (
          <>
            <Separator />
            <div className="p-2">
              <Link href="/dashboard/notifications">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications ({notifications.length})
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationBell