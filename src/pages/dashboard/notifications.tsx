import React, { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import { useWebSocket } from '@/hooks/useWebSocket'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  BellIcon,
  SearchIcon,
  FilterIcon,
  CheckIcon,
  CheckCheckIcon,
  Trash2Icon,
  RefreshCwIcon,
  SettingsIcon
} from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { hasPermission } from '@/lib/auth'

interface NotificationsPageProps {
  user: any
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ user }) => {
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

  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (connected) {
      refreshNotifications()
    }
  }, [connected])

  const refreshNotifications = async () => {
    setIsLoading(true)
    try {
      await getNotifications({ limit: 100 })
    } catch (error) {
      toast.error('Failed to refresh notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'unread' && !notification.read) ||
      (statusFilter === 'read' && notification.read)

    return matchesSearch && matchesType && matchesPriority && matchesStatus
  })

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id))
    }
  }

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    )
  }

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return
    
    try {
      await Promise.all(selectedNotifications.map(id => markAsRead(id)))
      setSelectedNotifications([])
      toast.success(`Marked ${selectedNotifications.length} notifications as read`)
    } catch (error) {
      toast.error('Failed to mark notifications as read')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return
    
    try {
      await Promise.all(selectedNotifications.map(id => deleteNotification(id)))
      setSelectedNotifications([])
      toast.success(`Deleted ${selectedNotifications.length} notifications`)
    } catch (error) {
      toast.error('Failed to delete notifications')
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

  const handleClearAll = async () => {
    try {
      await deleteAllNotifications()
      toast.success('All notifications cleared')
    } catch (error) {
      toast.error('Failed to clear notifications')
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
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Manage your notifications and stay updated
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? 'default' : 'secondary'}>
              {connected ? 'Connected' : 'Offline'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <BellIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <BellIcon className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
              <CheckIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {notifications.length - unreadCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected</CardTitle>
              <CheckCheckIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {selectedNotifications.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                <CheckCheckIcon className="h-4 w-4 mr-2" />
                {selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
              </Button>
              
              {selectedNotifications.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkAsRead}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Mark as Read ({selectedNotifications.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Delete ({selectedNotifications.length})
                  </Button>
                </>
              )}
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheckIcon className="h-4 w-4 mr-2" />
                  Mark All as Read
                </Button>
              )}
              
              {notifications.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                >
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Notifications ({filteredNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                  <p className="text-muted-foreground">
                    {notifications.length === 0 
                      ? "You don't have any notifications yet"
                      : "Try adjusting your filters to see more notifications"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`relative p-4 rounded-lg border transition-colors ${
                          notification.read 
                            ? 'bg-muted/30 border-muted' 
                            : 'bg-background border-primary/20 shadow-sm'
                        } ${
                          selectedNotifications.includes(notification.id)
                            ? 'ring-2 ring-primary'
                            : ''
                        }`}
                      >
                        {!notification.read && (
                          <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full" />
                        )}
                        
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedNotifications.includes(notification.id)}
                            onCheckedChange={() => handleSelectNotification(notification.id)}
                            className="mt-1"
                          />
                          
                          <div className="text-lg mt-0.5">
                            {getTypeIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
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
                            
                            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), { 
                                  addSuffix: true 
                                })}
                              </p>
                              
                              <div className="flex gap-2">
                                {!notification.read && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-7 px-3 text-xs"
                                  >
                                    <CheckIcon className="h-3 w-3 mr-1" />
                                    Mark as Read
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => deleteNotification(notification.id)}
                                  className="h-7 px-3 text-xs text-destructive hover:text-destructive"
                                >
                                  <Trash2Icon className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < filteredNotifications.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session?.user) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user: session.user,
    },
  }
}

export default NotificationsPage