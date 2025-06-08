'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Send, 
  Copy, 
  Save, 
  X,
  Mail,
  Code,
  FileText,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_body: string
  text_body: string
  variables: Record<string, string>
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
  updated_by?: string
}

interface EmailPreview {
  subject: string
  html_body: string
  text_body: string
}

const EmailTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<EmailPreview | null>(null)
  const [previewVariables, setPreviewVariables] = useState<Record<string, any>>({})
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')
  const [activeTab, setActiveTab] = useState('list')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_body: '',
    text_body: '',
    variables: {} as Record<string, string>,
    is_active: true
  })

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/email-templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data)
      } else {
        toast.error('Failed to fetch email templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Error fetching email templates')
    } finally {
      setIsLoading(false)
    }
  }

  // Create or update template
  const saveTemplate = async () => {
    try {
      const url = '/api/email-templates'
      const method = editMode === 'create' ? 'POST' : 'PUT'
      const payload = editMode === 'edit' ? { id: selectedTemplate?.id, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setIsDialogOpen(false)
        resetForm()
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Error saving template')
    }
  }

  // Delete template
  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/email-templates?id=${templateId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error deleting template')
    }
  }

  // Preview template
  const previewTemplate = async (template: EmailTemplate, variables: Record<string, any>) => {
    try {
      const response = await fetch('/api/email-templates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: template.id,
          variables
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setPreviewData(data.data)
        setIsPreviewOpen(true)
      } else {
        toast.error(data.error || 'Failed to preview template')
      }
    } catch (error) {
      console.error('Error previewing template:', error)
      toast.error('Error previewing template')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      html_body: '',
      text_body: '',
      variables: {},
      is_active: true
    })
    setSelectedTemplate(null)
  }

  // Open edit dialog
  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      html_body: template.html_body,
      text_body: template.text_body,
      variables: template.variables,
      is_active: template.is_active
    })
    setEditMode('edit')
    setIsDialogOpen(true)
  }

  // Open create dialog
  const openCreateDialog = () => {
    resetForm()
    setEditMode('create')
    setIsDialogOpen(true)
  }

  // Generate sample variables for preview
  const generateSampleVariables = (template: EmailTemplate) => {
    const sampleData: Record<string, any> = {}
    
    Object.keys(template.variables).forEach(key => {
      switch (key) {
        case 'appName':
          sampleData[key] = 'Analytics Hub'
          break
        case 'firstName':
          sampleData[key] = 'John'
          break
        case 'lastName':
          sampleData[key] = 'Doe'
          break
        case 'email':
          sampleData[key] = 'john.doe@example.com'
          break
        case 'temporaryPassword':
          sampleData[key] = 'TempPass123!'
          break
        case 'loginUrl':
          sampleData[key] = 'https://analytics-hub.com/login'
          break
        case 'resetUrl':
          sampleData[key] = 'https://analytics-hub.com/reset-password?token=abc123'
          break
        case 'supportEmail':
          sampleData[key] = 'support@analytics-hub.com'
          break
        case 'inviterName':
          sampleData[key] = 'Jane Smith'
          break
        case 'role':
          sampleData[key] = 'Analyst'
          break
        case 'expirationTime':
          sampleData[key] = '24 hours'
          break
        case 'expirationDate':
          sampleData[key] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          break
        case 'requestIP':
          sampleData[key] = '192.168.1.100'
          break
        case 'reason':
          sampleData[key] = 'Multiple failed login attempts'
          break
        case 'suspensionDate':
          sampleData[key] = new Date().toLocaleDateString()
          break
        case 'title':
          sampleData[key] = 'System Maintenance Scheduled'
          break
        case 'content':
          sampleData[key] = 'We will be performing scheduled maintenance on our servers this weekend. Please expect brief service interruptions.'
          break
        case 'actionUrl':
          sampleData[key] = 'https://analytics-hub.com/maintenance'
          break
        case 'actionText':
          sampleData[key] = 'Learn More'
          break
        case 'senderName':
          sampleData[key] = 'System Administrator'
          break
        default:
          sampleData[key] = `Sample ${key}`
      }
    })
    
    return sampleData
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Manage email templates for automated communications
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-[#FF7A00] hover:bg-[#FF7A00]/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#FF7A00]/10 rounded-lg">
                          <Mail className="h-5 w-5 text-[#FF7A00]" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {template.subject}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const sampleVars = generateSampleVariables(template)
                              previewTemplate(template, sampleVars)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Variables: {Object.keys(template.variables).length}</span>
                      <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Email Template Settings</CardTitle>
              <CardDescription>
                Configure global settings for email templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Email template settings will be implemented in a future update.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode === 'create' ? 'Create Email Template' : 'Edit Email Template'}
            </DialogTitle>
            <DialogDescription>
              {editMode === 'create' 
                ? 'Create a new email template for automated communications'
                : 'Update the email template configuration'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., welcome, password_reset"
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
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject with {{variables}}"
              />
            </div>

            <Tabs defaultValue="html" className="w-full">
              <TabsList>
                <TabsTrigger value="html">HTML Body</TabsTrigger>
                <TabsTrigger value="text">Text Body</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="space-y-2">
                <Label htmlFor="html_body">HTML Body</Label>
                <Textarea
                  id="html_body"
                  value={formData.html_body}
                  onChange={(e) => setFormData({ ...formData, html_body: e.target.value })}
                  placeholder="HTML email template with {{variables}}"
                  className="min-h-[300px] font-mono text-sm"
                />
              </TabsContent>

              <TabsContent value="text" className="space-y-2">
                <Label htmlFor="text_body">Text Body</Label>
                <Textarea
                  id="text_body"
                  value={formData.text_body}
                  onChange={(e) => setFormData({ ...formData, text_body: e.target.value })}
                  placeholder="Plain text email template with {{variables}}"
                  className="min-h-[300px] font-mono text-sm"
                />
              </TabsContent>

              <TabsContent value="variables" className="space-y-2">
                <Label>Template Variables</Label>
                <div className="space-y-2">
                  {Object.entries(formData.variables).map(([key, description], index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        value={key}
                        onChange={(e) => {
                          const newVars = { ...formData.variables }
                          delete newVars[key]
                          newVars[e.target.value] = description
                          setFormData({ ...formData, variables: newVars })
                        }}
                        placeholder="Variable name"
                        className="flex-1"
                      />
                      <Input
                        value={description}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            variables: {
                              ...formData.variables,
                              [key]: e.target.value
                            }
                          })
                        }}
                        placeholder="Description"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newVars = { ...formData.variables }
                          delete newVars[key]
                          setFormData({ ...formData, variables: newVars })
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        variables: {
                          ...formData.variables,
                          '': ''
                        }
                      })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variable
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate} className="bg-[#FF7A00] hover:bg-[#FF7A00]/90">
              <Save className="mr-2 h-4 w-4" />
              {editMode === 'create' ? 'Create Template' : 'Update Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of the email template with sample data
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="p-3 bg-muted rounded-md font-medium">
                  {previewData.subject}
                </div>
              </div>

              <Tabs defaultValue="html" className="w-full">
                <TabsList>
                  <TabsTrigger value="html">HTML Preview</TabsTrigger>
                  <TabsTrigger value="text">Text Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="html">
                  <div className="border rounded-md p-4 bg-white max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: previewData.html_body }} />
                  </div>
                </TabsContent>

                <TabsContent value="text">
                  <div className="border rounded-md p-4 bg-muted max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{previewData.text_body}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmailTemplateManager