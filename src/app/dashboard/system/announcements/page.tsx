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
import { Checkbox } from '@/components/ui/checkbox'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_active: boolean
  is_pinned: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  target_roles: string[]
  action_url?: string
  action_text?: string
  starts_at?: string
  expires_at?: string
  created_at: string
  created_by_user: {
    first_name: string
    last_name: string
  }
}

interface Role {
  id: string
  name: string
  description?: string
}

export default function AnnouncementsPage() {
  const { data: session } = useSession()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [roles, setRoles] = useState<Role[]>([])
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
    content: '',
    type: 'info' as const,
    priority: 'normal' as const,
    target_roles: [] as string[],
    action_url: '',
    action_text: '',
    starts_at: '',
    expires_at: '',
    is_active: true,
    is_pinned: false
  })

  useEffect(() => {
    fetchAnnouncements()
    fetchRoles()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/dashboard/announcements-management')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/dashboard/announcements-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          starts_at: formData.starts_at || null,
          expires_at: formData.expires_at || null
        }),
      })

      if (response.ok) {
        toast.success('Announcement created successfully')
        setIsDialogOpen(false)
        setFormData({
          title: '',
          content: '',
          type: 'info',
          priority: 'normal',
          target_roles: [],
          action_url: '',
          action_text: '',
          starts_at: '',
          expires_at: '',
          is_active: true,
          is_pinned: false
        })
        fetchAnnouncements()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create announcement')
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast.error('Failed to create announcement')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/announcements-management/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (response.ok) {
        toast.success(`Announcement ${!isActive ? 'activated' : 'deactivated'}`)
        fetchAnnouncements()
      } else {
        toast.error('Failed to update announcement')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      toast.error('Failed to update announcement')
    }
  }

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/announcements-management/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_pinned: !isPinned }),
      })

      if (response.ok) {
        toast.success(`Announcement ${!isPinned ? 'pinned' : 'unpinned'}`)
        fetchAnnouncements()
      } else {
        toast.error('Failed to update announcement')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      toast.error('Failed to update announcement')
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const response = await fetch(`/api/dashboard/announcements-management/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Announcement deleted successfully')
        fetchAnnouncements()
      } else {
        toast.error('Failed to delete announcement')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    }
  }

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        target_roles: [...formData.target_roles, roleId]
      })
    } else {
      setFormData({
        ...formData,
        target_roles: formData.target_roles.filter(id => id !== roleId)
      })
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

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || announcement.type === filterType
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && announcement.is_active && !isExpired(announcement.expires_at)) ||
                      (activeTab === 'pinned' && announcement.is_pinned) ||
                      (activeTab === 'expired' && isExpired(announcement.expires_at))
    
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
          <h1 className="text-2xl font-bold text-white">Announcement Management</h1>
          <p className="text-white/70">Manage system announcements and notices</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0E0E44] border-white/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
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
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  rows={4}
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
                  <Label>Target Roles</Label>
                  <div className="bg-white/10 border border-white/20 rounded-md p-3 max-h-32 overflow-y-auto">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="all-roles"
                          checked={formData.target_roles.length === 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, target_roles: [] })
                            }
                          }}
                        />
                        <Label htmlFor="all-roles" className="text-sm font-medium">All Roles</Label>
                      </div>
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={role.id}
                            checked={formData.target_roles.includes(role.id)}
                            onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                          />
                          <Label htmlFor={role.id} className="text-sm">{role.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
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
                    placeholder="Learn More"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Starts At (Optional)</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
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
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_pinned"
                    checked={formData.is_pinned}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                  />
                  <Label htmlFor="is_pinned">Pinned</Label>
                </div>
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
                  Create Announcement
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
                placeholder="Search announcements..."
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
            All ({announcements.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Active ({announcements.filter(a => a.is_active && !isExpired(a.expires_at)).length})
          </TabsTrigger>
          <TabsTrigger value="pinned" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Pinned ({announcements.filter(a => a.is_pinned).length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Expired ({announcements.filter(a => isExpired(a.expires_at)).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredAnnouncements.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 text-center">
                <Icon icon="mdi:bullhorn-outline" className="h-12 w-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">No announcements found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${getTypeColor(announcement.type)}`}>
                          <Icon icon={getTypeIcon(announcement.type)} className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white">{announcement.title}</h3>
                            {announcement.is_pinned && (
                              <Icon icon="mdi:pin" className="h-4 w-4 text-orange-400" />
                            )}
                            <Badge className={getTypeColor(announcement.type)}>
                              {announcement.type}
                            </Badge>
                            <Badge className={getPriorityColor(announcement.priority)}>
                              {announcement.priority}
                            </Badge>
                            {!announcement.is_active && (
                              <Badge className="text-gray-400 bg-gray-400/10 border-gray-400/20">
                                Inactive
                              </Badge>
                            )}
                            {isExpired(announcement.expires_at) && (
                              <Badge className="text-red-400 bg-red-400/10 border-red-400/20">
                                Expired
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-white/70">{announcement.content}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-white/50">
                            <span>By: {announcement.created_by_user.first_name} {announcement.created_by_user.last_name}</span>
                            <span>•</span>
                            <span>{new Date(announcement.created_at).toLocaleString()}</span>
                            {announcement.target_roles.length > 0 && (
                              <>
                                <span>•</span>
                                <span>Roles: {announcement.target_roles.length} selected</span>
                              </>
                            )}
                            {announcement.expires_at && (
                              <>
                                <span>•</span>
                                <span>Expires: {new Date(announcement.expires_at).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                          
                          {announcement.action_url && announcement.action_text && (
                            <div className="pt-2">
                              <a
                                href={announcement.action_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm"
                              >
                                {announcement.action_text}
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
                          onClick={() => handleTogglePin(announcement.id, announcement.is_pinned)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Icon 
                            icon={announcement.is_pinned ? 'mdi:pin-off' : 'mdi:pin'} 
                            className="h-4 w-4" 
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Icon 
                            icon={announcement.is_active ? 'mdi:pause' : 'mdi:play'} 
                            className="h-4 w-4" 
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
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