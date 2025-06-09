import React, { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../api/auth/[...nextauth]'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  SendIcon,
  UsersIcon,
  UserIcon,
  BellIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon
} from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { hasPermission } from '@/lib/auth'
import { useWebSocket } from '@/hooks/useWebSocket'

interface AdminNotificationsPageProps {
  user: any
  users: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
}

interface NotificationForm {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  targetType: 'user' | 'role' | 'all'
  targetUserId: string
  targetRole: string
  expiresAt: string
  sendEmail: boolean
  metadata: Record<string, any>
}

const AdminNotificationsPage: React.FC<AdminNotificationsPageProps> = ({ user, users }) => {
  const { connected } = useWebSocket()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('single')
  
  const [singleForm, setSingleForm] = useState<NotificationForm>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    targetType: 'user',
    targetUserId: '',
    targetRole: '',
    expiresAt: '',
    sendEmail: false,
    metadata: {}
  })

  const [bulkForm, setBulkForm] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const,
    targetRole: '',
    expiresAt: '',
    sendEmail: false
  })

  const [previewMode, setPreviewMode] = useState(false)

  const roles = ['admin', 'manager', 'analyst', 'viewer']

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!singleForm.title.trim() || !singleForm.message.trim()) {
      toast.error('Title and message are required')
      return
    }

    if (singleForm.targetType === 'user' && !singleForm.targetUserId) {
      toast.error('Please select a user')
      return
    }

    if (singleForm.targetType === 'role' && !singleForm.targetRole) {
      toast.error('Please select a role')
      return
    }

    setIsLoading(true)
    
    try {
      const payload: any = {
        title: singleForm.title,
        message: singleForm.message,
        type: singleForm.type,
        priority: singleForm.priority,
        sendEmail: singleForm.sendEmail,
        metadata: singleForm.metadata
      }

      if (singleForm.expiresAt) {
        payload.expiresAt = new Date(singleForm.expiresAt).toISOString()
      }

      if (singleForm.targetType === 'user') {
        payload.targetUserId = singleForm.targetUserId
      } else if (singleForm.targetType === 'role') {
        payload.targetRole = singleForm.targetRole
      }
      // For 'all', we don't set any target (will be handled by backend)

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send notification')
      }

      const result = await response.json()
      toast.success(`Notification sent successfully to ${result.count} recipient(s)`)
      
      // Reset form
      setSingleForm({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        targetType: 'user',
        targetUserId: '',
        targetRole: '',
        expiresAt: '',
        sendEmail: false,
        metadata: {}
      })
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send notification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bulkForm.title.trim() || !bulkForm.message.trim()) {
      toast.error('Title and message are required')
      return
    }

    if (!bulkForm.targetRole) {
      toast.error('Please select a role')
      return
    }

    setIsLoading(true)
    
    try {
      const payload = {
        title: bulkForm.title,
        message: bulkForm.message,
        type: bulkForm.type,
        priority: bulkForm.priority,
        targetRole: bulkForm.targetRole,
        sendEmail: bulkForm.sendEmail,
        ...(bulkForm.expiresAt && { expiresAt: new Date(bulkForm.expiresAt).toISOString() })
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send notifications')
      }

      const result = await response.json()
      toast.success(`Bulk notification sent to ${result.count} users`)
      
      // Reset form
      setBulkForm({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        targetRole: '',
        expiresAt: '',
        sendEmail: false
      })
    } catch (error) {
      console.error('Error sending bulk notification:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'info':
      default:
        return <InfoIcon className="h-4 w-4 text-blue-500" />
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

  const NotificationPreview = ({ form }: { form: NotificationForm | typeof bulkForm }) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BellIcon className="h-4 w-4" />
          Notification Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-3 rounded-lg border bg-background">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {getTypeIcon(form.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium">{form.title || 'Notification Title'}</h4>
                <Badge variant={getPriorityColor(form.priority)}>
                  {form.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {form.message || 'Notification message will appear here...'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Just now
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Send Notifications</h1>
            <p className="text-muted-foreground">
              Send notifications to users or groups
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? 'default' : 'secondary'}>
              {connected ? 'Connected' : 'Offline'}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Single Notification
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Bulk Notification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Single Notification</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={singleForm.title}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Notification title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={singleForm.type}
                        onValueChange={(value: any) => setSingleForm(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={singleForm.message}
                      onChange={(e) => setSingleForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Notification message"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={singleForm.priority}
                        onValueChange={(value: any) => setSingleForm(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetType">Send To</Label>
                      <Select
                        value={singleForm.targetType}
                        onValueChange={(value: any) => setSingleForm(prev => ({ ...prev, targetType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Specific User</SelectItem>
                          <SelectItem value="role">All Users in Role</SelectItem>
                          <SelectItem value="all">All Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {singleForm.targetType === 'user' && (
                    <div className="space-y-2">
                      <Label htmlFor="targetUser">Select User</Label>
                      <Select
                        value={singleForm.targetUserId}
                        onValueChange={(value) => setSingleForm(prev => ({ ...prev, targetUserId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email}) - {user.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {singleForm.targetType === 'role' && (
                    <div className="space-y-2">
                      <Label htmlFor="targetRole">Select Role</Label>
                      <Select
                        value={singleForm.targetRole}
                        onValueChange={(value) => setSingleForm(prev => ({ ...prev, targetRole: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={singleForm.expiresAt}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        id="sendEmail"
                        checked={singleForm.sendEmail}
                        onCheckedChange={(checked) => setSingleForm(prev => ({ ...prev, sendEmail: checked }))}
                      />
                      <Label htmlFor="sendEmail">Also send email notification</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="preview"
                        checked={previewMode}
                        onCheckedChange={setPreviewMode}
                      />
                      <Label htmlFor="preview">Show preview</Label>
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      <SendIcon className="h-4 w-4 mr-2" />
                      {isLoading ? 'Sending...' : 'Send Notification'}
                    </Button>
                  </div>
                </form>

                {previewMode && <NotificationPreview form={singleForm} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Bulk Notification</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBulkSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulkTitle">Title *</Label>
                      <Input
                        id="bulkTitle"
                        value={bulkForm.title}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Notification title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bulkType">Type</Label>
                      <Select
                        value={bulkForm.type}
                        onValueChange={(value: any) => setBulkForm(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulkMessage">Message *</Label>
                    <Textarea
                      id="bulkMessage"
                      value={bulkForm.message}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Notification message"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulkPriority">Priority</Label>
                      <Select
                        value={bulkForm.priority}
                        onValueChange={(value: any) => setBulkForm(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bulkTargetRole">Target Role *</Label>
                      <Select
                        value={bulkForm.targetRole}
                        onValueChange={(value) => setBulkForm(prev => ({ ...prev, targetRole: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulkExpiresAt">Expires At (Optional)</Label>
                      <Input
                        id="bulkExpiresAt"
                        type="datetime-local"
                        value={bulkForm.expiresAt}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        id="bulkSendEmail"
                        checked={bulkForm.sendEmail}
                        onCheckedChange={(checked) => setBulkForm(prev => ({ ...prev, sendEmail: checked }))}
                      />
                      <Label htmlFor="bulkSendEmail">Also send email notification</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="bulkPreview"
                        checked={previewMode}
                        onCheckedChange={setPreviewMode}
                      />
                      <Label htmlFor="bulkPreview">Show preview</Label>
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      <SendIcon className="h-4 w-4 mr-2" />
                      {isLoading ? 'Sending...' : 'Send to All Users in Role'}
                    </Button>
                  </div>
                </form>

                {previewMode && <NotificationPreview form={bulkForm} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

  // Check if user has permission to send notifications
  if (!hasPermission(session.user, 'notifications:send')) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  // Fetch users for the dropdown
  const { prisma } = await import('@/lib/prisma')
  const users = await prisma.idbi_users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return {
    props: {
      user: session.user,
      users: users.map(user => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        role: user.role
      }))
    },
  }
}

export default AdminNotificationsPage