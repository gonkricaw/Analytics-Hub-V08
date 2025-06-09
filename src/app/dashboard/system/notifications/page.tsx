'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  target_user_id?: string
  is_read: boolean
  is_active: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  action_url?: string
  action_text?: string
  expires_at?: string
  created_at: string
  created_by_user: {
    first_name: string
    last_name: string
  }
  target_user?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    target_user_id: '',
    priority: 'normal' as const,
    action_url: '',
    action_text: '',
    expires_at: '',
    is_active: true
  })

  useEffect(() => {
    fetchNotifications()
    fetchUsers()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/dashboard/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/dashboard/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          target_user_id: formData.target_user_id || null,
          expires_at: formData.expires_at || null
        }),
      })

      if (response.ok) {
        toast.success('Notification created successfully')
        setIsDialogOpen(false)
        setFormData({
          title: '',
          message: '',
          type: 'info',
          target_user_id: '',
          priority: 'normal',
          action_url: '',
          action_text: '',
          expires_at: '',
          is_active: true
        })
        fetchNotifications()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create notification')
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      toast.error('Failed to create notification')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (response.ok) {
        toast.success(`Notification ${!isActive ? 'activated' : 'deactivated'}`)
        fetchNotifications()
      } else {
        toast.error('Failed to update notification')
      }
    } catch (error) {
      console.error('Error updating notification:', error)
      toast.error('Failed to update notification')
    }
  }

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return

    try {
      const response = await fetch(`/api/dashboard/notifications/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Notification deleted successfully')
        fetchNotifications()
      } else {
        toast.error('Failed to delete notification')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return 'mdi:check-circle'
      case 'warning': return 'mdi:alert'
      case 'error': return 'mdi:alert-circle'
      default: return 'mdi:information'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'low': return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || notification.type === filterType
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'system' && !notification.target_user_id) ||
                      (activeTab === 'user' && notification.target_user_id)
    
    return matchesSearch && matchesType && matchesPriority && matchesTab
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Management</h1>
          <p className="text-white/70">Manage system and user notifications</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0E0E44] border-white/20 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Notification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0E0E44] border-white/20">
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0E0E44] border-white/20">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_user">Target User (Optional)</Label>
                  <Select value={formData.target_user_id} onValueChange={(value) => setFormData({ ...formData, target_user_id: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="System-wide notification" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0E0E44] border-white/20">
                      <SelectItem value="">System-wide notification</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="action_url">Action URL (Optional)</Label>
                  <Input
                    id="action_url"
                    value={formData.action_url}
                    onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action_text">Action Text (Optional)</Label>
                  <Input
                    id="action_text"
                    value={formData.action_text}
                    onChange={(e) => setFormData({ ...formData, action_text: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="View Details"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At (Optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {creating ? (
                    <Icon icon="mdi:loading" className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                  )}
                  Create Notification
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px] bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0E0E44] border-white/20">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[130px] bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0E0E44] border-white/20">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/10 border-white/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            All Notifications ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            System-wide ({notifications.filter(n => !n.target_user_id).length})
          </TabsTrigger>
          <TabsTrigger value="user" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            User-specific ({notifications.filter(n => n.target_user_id).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 text-center">
                <Icon icon="mdi:bell-off" className="h-12 w-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">No notifications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card key={notification.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${getTypeColor(notification.type)}`}>
                          <Icon icon={getTypeIcon(notification.type)} className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white">{notification.title}</h3>
                            <Badge className={getTypeColor(notification.type)}>
                              {notification.type}
                            </Badge>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            {!notification.is_active && (
                              <Badge className="text-gray-400 bg-gray-400/10 border-gray-400/20">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-white/70">{notification.message}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-white/50">
                            <span>By: {notification.created_by_user.first_name} {notification.created_by_user.last_name}</span>
                            <span>•</span>
                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                            {notification.target_user && (
                              <>
                                <span>•</span>
                                <span>To: {notification.target_user.first_name} {notification.target_user.last_name}</span>
                              </>
                            )}
                            {notification.expires_at && (
                              <>
                                <span>•</span>
                                <span>Expires: {new Date(notification.expires_at).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                          
                          {notification.action_url && notification.action_text && (
                            <div className="pt-2">
                              <a
                                href={notification.action_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm"
                              >
                                {notification.action_text}
                                <Icon icon="mdi:external-link" className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(notification.id, notification.is_active)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Icon 
                            icon={notification.is_active ? 'mdi:pause' : 'mdi:play'} 
                            className="h-4 w-4" 
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="border-red-400/20 text-red-400 hover:bg-red-400/10"
                        >
                          <Icon icon="mdi:delete" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}