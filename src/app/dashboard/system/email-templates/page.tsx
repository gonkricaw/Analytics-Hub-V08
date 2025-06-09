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
import { Separator } from '@/components/ui/separator'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  created_by_user: {
    first_name: string
    last_name: string
  }
}

const TEMPLATE_VARIABLES = [
  '{{user_name}}',
  '{{user_email}}',
  '{{first_name}}',
  '{{last_name}}',
  '{{company_name}}',
  '{{reset_link}}',
  '{{verification_link}}',
  '{{invitation_link}}',
  '{{temporary_password}}',
  '{{login_url}}',
  '{{support_email}}',
  '{{current_date}}',
  '{{current_year}}'
]

const PREDEFINED_TEMPLATES = [
  {
    name: 'user_invitation',
    subject: 'Welcome to {{company_name}} - Account Invitation',
    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Account Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #FF7A00;">Welcome to {{company_name}}!</h2>
        <p>Hello {{first_name}},</p>
        <p>You have been invited to join {{company_name}}. Please click the link below to set up your account:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{invitation_link}}" style="background-color: #FF7A00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
        </div>
        <p>Your temporary password is: <strong>{{temporary_password}}</strong></p>
        <p>You will be required to change this password on your first login.</p>
        <p>If you have any questions, please contact us at {{support_email}}.</p>
        <p>Best regards,<br>{{company_name}} Team</p>
    </div>
</body>
</html>`,
    variables: ['{{company_name}}', '{{first_name}}', '{{invitation_link}}', '{{temporary_password}}', '{{support_email}}']
  },
  {
    name: 'password_reset',
    subject: 'Password Reset Request - {{company_name}}',
    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #FF7A00;">Password Reset Request</h2>
        <p>Hello {{first_name}},</p>
        <p>We received a request to reset your password for your {{company_name}} account.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{reset_link}}" style="background-color: #FF7A00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 24 hours for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>{{company_name}} Team</p>
    </div>
</body>
</html>`,
    variables: ['{{company_name}}', '{{first_name}}', '{{reset_link}}']
  },
  {
    name: 'account_verification',
    subject: 'Verify Your Account - {{company_name}}',
    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Account Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #FF7A00;">Verify Your Account</h2>
        <p>Hello {{first_name}},</p>
        <p>Thank you for creating an account with {{company_name}}. Please verify your email address by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{verification_link}}" style="background-color: #FF7A00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Account</a>
        </div>
        <p>If you didn't create this account, please ignore this email.</p>
        <p>Best regards,<br>{{company_name}} Team</p>
    </div>
</body>
</html>`,
    variables: ['{{company_name}}', '{{first_name}}', '{{verification_link}}']
  }
]

export default function EmailTemplatesPage() {
  const { data: session } = useSession()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    variables: [] as string[],
    is_active: true
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/dashboard/email-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const url = editingTemplate 
        ? `/api/dashboard/email-templates/${editingTemplate.id}`
        : '/api/dashboard/email-templates'
      
      const method = editingTemplate ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(`Template ${editingTemplate ? 'updated' : 'created'} successfully`)
        setIsDialogOpen(false)
        setEditingTemplate(null)
        resetForm()
        fetchTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${editingTemplate ? 'update' : 'create'} template`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error(`Failed to ${editingTemplate ? 'update' : 'create'} template`)
    } finally {
      setCreating(false)
    }
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      variables: template.variables,
      is_active: template.is_active
    })
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/email-templates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (response.ok) {
        toast.success(`Template ${!isActive ? 'activated' : 'deactivated'}`)
        fetchTemplates()
      } else {
        toast.error('Failed to update template')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Failed to update template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/dashboard/email-templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Template deleted successfully')
        fetchTemplates()
      } else {
        toast.error('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const handleUsePredefinedTemplate = (template: any) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: '',
      variables: template.variables,
      is_active: true
    })
  }

  const extractVariables = (content: string) => {
    const regex = /\{\{([^}]+)\}\}/g
    const matches = content.match(regex) || []
    return [...new Set(matches)]
  }

  const handleContentChange = (field: 'html_content' | 'text_content' | 'subject', value: string) => {
    const newFormData = { ...formData, [field]: value }
    
    // Auto-extract variables from all content fields
    const allContent = `${newFormData.subject} ${newFormData.html_content} ${newFormData.text_content}`
    const extractedVars = extractVariables(allContent)
    newFormData.variables = extractedVars
    
    setFormData(newFormData)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      html_content: '',
      text_content: '',
      variables: [],
      is_active: true
    })
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && template.is_active) ||
                      (activeTab === 'inactive' && !template.is_active)
    
    return matchesSearch && matchesTab
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
          <h1 className="text-2xl font-bold text-white">Email Template Management</h1>
          <p className="text-white/70">Manage system email templates and notifications</p>
        </div>
        
        <Button 
          onClick={() => {
            setEditingTemplate(null)
            resetForm()
            setIsDialogOpen(true)
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/10 border-white/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            All ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Active ({templates.filter(t => t.is_active).length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Inactive ({templates.filter(t => !t.is_active).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTemplates.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 text-center">
                <Icon icon="mdi:email-outline" className="h-12 w-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">No email templates found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white">{template.name}</h3>
                          <Badge className={template.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <p className="text-white/70 font-medium">{template.subject}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-white/50">
                          <span>Variables: {template.variables.length}</span>
                          <span>•</span>
                          <span>By: {template.created_by_user.first_name} {template.created_by_user.last_name}</span>
                          <span>•</span>
                          <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
                        </div>
                        
                        {template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.variables.slice(0, 5).map((variable, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-white/20 text-white/60">
                                {variable}
                              </Badge>
                            ))}
                            {template.variables.length > 5 && (
                              <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                                +{template.variables.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Icon icon="mdi:pencil" className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(template.id, template.is_active)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Icon 
                            icon={template.is_active ? 'mdi:pause' : 'mdi:play'} 
                            className="h-4 w-4" 
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTemplate(template.id)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0E0E44] border-white/20 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Email Template' : 'Create New Email Template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="e.g., user_invitation"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleContentChange('subject', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Email subject with {{variables}}"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="html_content">HTML Content</Label>
                  <Textarea
                    id="html_content"
                    value={formData.html_content}
                    onChange={(e) => handleContentChange('html_content', e.target.value)}
                    className="bg-white/10 border-white/20 text-white font-mono text-sm"
                    rows={12}
                    placeholder="HTML email template with {{variables}}"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text_content">Text Content (Optional)</Label>
                  <Textarea
                    id="text_content"
                    value={formData.text_content}
                    onChange={(e) => handleContentChange('text_content', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    rows={6}
                    placeholder="Plain text version of the email"
                  />
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
                      <Icon icon={editingTemplate ? 'mdi:content-save' : 'mdi:plus'} className="h-4 w-4 mr-2" />
                    )}
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Variables */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Detected Variables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.variables.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {formData.variables.map((variable, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-orange-400/20 text-orange-400">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/50 text-xs">No variables detected</p>
                  )}
                </CardContent>
              </Card>

              {/* Available Variables */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Available Variables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                    {TEMPLATE_VARIABLES.map((variable, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById('html_content') as HTMLTextAreaElement
                          if (textarea) {
                            const start = textarea.selectionStart
                            const end = textarea.selectionEnd
                            const newValue = formData.html_content.substring(0, start) + variable + formData.html_content.substring(end)
                            handleContentChange('html_content', newValue)
                            setTimeout(() => {
                              textarea.focus()
                              textarea.setSelectionRange(start + variable.length, start + variable.length)
                            }, 0)
                          }
                        }}
                        className="text-xs text-left px-2 py-1 rounded border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Predefined Templates */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Predefined Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {PREDEFINED_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleUsePredefinedTemplate(template)}
                      className="w-full text-xs text-left px-2 py-2 rounded border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-white/50 truncate">{template.subject}</div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}