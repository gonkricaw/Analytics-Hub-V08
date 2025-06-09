'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Eye, FileText, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface TermsVersion {
  id: string
  version: string
  title: string
  content: string
  change_summary?: string
  effective_date?: string
  approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published'
  created_at: string
  updated_at?: string
  published_at?: string
  creator: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  updater?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  approver?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  acceptance_count?: number
}

interface TermsEditorProps {
  version?: TermsVersion
  onSave: (data: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const TermsEditor: React.FC<TermsEditorProps> = ({
  version,
  onSave,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    title: version?.title || '',
    content: version?.content || '',
    change_summary: version?.change_summary || '',
    effective_date: version?.effective_date ? new Date(version.effective_date).toISOString().split('T')[0] : '',
    approval_status: version?.approval_status || 'draft'
  })
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const contentRef = useRef<HTMLTextAreaElement>(null)

  // Rich text formatting functions
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = contentRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const newText = before + selectedText + after
    
    const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end)
    setFormData(prev => ({ ...prev, content: newValue }))
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const formatButtons = [
    { label: 'Bold', action: () => insertFormatting('**', '**'), icon: 'B' },
    { label: 'Italic', action: () => insertFormatting('*', '*'), icon: 'I' },
    { label: 'Heading 1', action: () => insertFormatting('# '), icon: 'H1' },
    { label: 'Heading 2', action: () => insertFormatting('## '), icon: 'H2' },
    { label: 'Heading 3', action: () => insertFormatting('### '), icon: 'H3' },
    { label: 'List', action: () => insertFormatting('- '), icon: '•' },
    { label: 'Numbered List', action: () => insertFormatting('1. '), icon: '1.' },
    { label: 'Link', action: () => insertFormatting('[', '](url)'), icon: '🔗' }
  ]

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }
    
    if (formData.effective_date && new Date(formData.effective_date) < new Date()) {
      newErrors.effective_date = 'Effective date cannot be in the past'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }
    
    try {
      setSaving(true)
      await onSave({
        ...formData,
        effective_date: formData.effective_date || undefined
      })
      toast.success(version ? 'Terms updated successfully' : 'Terms created successfully')
    } catch (error) {
      console.error('Error saving terms:', error)
      toast.error('Failed to save terms')
    } finally {
      setSaving(false)
    }
  }

  // Convert markdown to HTML for preview
  const renderMarkdown = (text: string) => {
    return text
      .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mb-2 text-orange-400">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="text-xl font-semibold mb-3 text-orange-400">$1</h2>')
      .replace(/# (.*)/g, '<h1 class="text-2xl font-bold mb-4 text-orange-500">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/^- (.*)/gm, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*)/gm, '<li class="ml-4">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-orange-400 hover:text-orange-300 underline">$1</a>')
      .replace(/\n/g, '<br>')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'pending_approval': return 'bg-yellow-500'
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      case 'published': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />
      case 'pending_approval': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'published': return <CheckCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Version Info */}
      {version && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-orange-500 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Version Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-400">Version</Label>
                <p className="text-white font-semibold">{version.version}</p>
              </div>
              <div>
                <Label className="text-gray-400">Status</Label>
                <Badge className={`${getStatusColor(version.approval_status)} text-white`}>
                  {getStatusIcon(version.approval_status)}
                  <span className="ml-1 capitalize">{version.approval_status.replace('_', ' ')}</span>
                </Badge>
              </div>
              <div>
                <Label className="text-gray-400">Created</Label>
                <p className="text-white text-sm">{new Date(version.created_at).toLocaleDateString()}</p>
              </div>
              {version.acceptance_count !== undefined && (
                <div>
                  <Label className="text-gray-400">Acceptances</Label>
                  <p className="text-white font-semibold">{version.acceptance_count}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-400">Created By</Label>
                <p className="text-white text-sm">
                  {version.creator.first_name} {version.creator.last_name}
                </p>
              </div>
              {version.updater && (
                <div>
                  <Label className="text-gray-400">Updated By</Label>
                  <p className="text-white text-sm">
                    {version.updater.first_name} {version.updater.last_name}
                  </p>
                </div>
              )}
              {version.approver && (
                <div>
                  <Label className="text-gray-400">Approved By</Label>
                  <p className="text-white text-sm">
                    {version.approver.first_name} {version.approver.last_name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor Form */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-orange-500 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {version ? 'Edit Terms & Conditions' : 'Create New Terms & Conditions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter terms title"
              />
              {errors.title && (
                <p className="text-red-400 text-sm">{errors.title}</p>
              )}
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-gray-300">Content *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreview(!preview)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {preview ? 'Edit' : 'Preview'}
                  </Button>
                </div>
              </div>
              
              {!preview ? (
                <>
                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap gap-1 p-2 bg-gray-700 rounded-t-lg border border-gray-600">
                    {formatButtons.map((button, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={button.action}
                        className="h-8 px-2 text-gray-300 hover:bg-gray-600"
                        title={button.label}
                      >
                        {button.icon}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Content Textarea */}
                  <Textarea
                    ref={contentRef}
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white min-h-[400px] rounded-t-none"
                    placeholder="Enter terms content using Markdown formatting..."
                  />
                </>
              ) : (
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-h-[400px] prose prose-invert max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.content) }}
                    className="text-gray-300"
                  />
                </div>
              )}
              
              {errors.content && (
                <p className="text-red-400 text-sm">{errors.content}</p>
              )}
            </div>

            {/* Change Summary */}
            <div className="space-y-2">
              <Label htmlFor="change_summary" className="text-gray-300">Change Summary</Label>
              <Textarea
                id="change_summary"
                value={formData.change_summary}
                onChange={(e) => setFormData(prev => ({ ...prev, change_summary: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Describe what changed in this version..."
                rows={3}
              />
            </div>

            {/* Effective Date */}
            <div className="space-y-2">
              <Label htmlFor="effective_date" className="text-gray-300">Effective Date</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
              {errors.effective_date && (
                <p className="text-red-400 text-sm">{errors.effective_date}</p>
              )}
            </div>

            {/* Approval Status (for existing versions) */}
            {version && (
              <div className="space-y-2">
                <Label htmlFor="approval_status" className="text-gray-300">Approval Status</Label>
                <Select
                  value={formData.approval_status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, approval_status: value as any }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={saving || loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={saving || loading}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {version ? 'Update' : 'Create'} Terms
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default TermsEditor