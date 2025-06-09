'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Category {
  id: string
  name: string
  color?: string
  icon?: string
}

interface ContentData {
  id: string
  title: string
  description: string
  content_type: string
  content_data: any
  embed_url: string
  is_public: boolean
  status: string
  view_count: number
  created_at: string
  updated_at: string
  creator: {
    id: string
    name: string
    email: string
  }
  categories: {
    category: Category
  }[]
}

interface ContentFormData {
  title: string
  description: string
  content_type: string
  content_data: any
  embed_url: string
  is_public: boolean
  category_ids: string[]
}

const CONTENT_TYPE_OPTIONS = [
  { 
    value: 'dashboard', 
    label: 'Dashboard', 
    icon: 'mdi:view-dashboard',
    description: 'Interactive dashboard with multiple widgets'
  },
  { 
    value: 'report', 
    label: 'Report', 
    icon: 'mdi:file-chart',
    description: 'Static or dynamic report with data analysis'
  },
  { 
    value: 'widget', 
    label: 'Widget', 
    icon: 'mdi:widgets',
    description: 'Single interactive component or visualization'
  },
  { 
    value: 'iframe', 
    label: 'IFrame', 
    icon: 'mdi:web',
    description: 'Embedded external content via iframe'
  },
  { 
    value: 'chart', 
    label: 'Chart', 
    icon: 'mdi:chart-line',
    description: 'Data visualization chart or graph'
  },
  { 
    value: 'table', 
    label: 'Table', 
    icon: 'mdi:table',
    description: 'Tabular data display with sorting and filtering'
  }
]

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-gray-100 text-gray-800'
}

export default function ContentDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const contentId = params.id as string
  
  const [content, setContent] = useState<ContentData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    content_type: '',
    content_data: {},
    embed_url: '',
    is_public: false,
    category_ids: []
  })

  // Fetch content details
  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/content/${contentId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Content not found')
          router.push('/dashboard/content')
          return
        }
        throw new Error('Failed to fetch content')
      }
      
      const data = await response.json()
      setContent(data)
      
      // Initialize form data
      setFormData({
        title: data.title,
        description: data.description || '',
        content_type: data.content_type,
        content_data: data.content_data || {},
        embed_url: data.embed_url || '',
        is_public: data.is_public,
        category_ids: data.categories.map((cat: any) => cat.category.id)
      })
    } catch (error) {
      console.error('Error fetching content:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      
      const data = await response.json()
      setCategories(data.categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  useEffect(() => {
    if (contentId) {
      fetchContent()
      fetchCategories()
    }
  }, [contentId])

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    
    if (!formData.content_type) {
      toast.error('Content type is required')
      return
    }

    setSaving(true)
    
    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update content')
      }
      
      toast.success('Content updated successfully')
      setIsEditing(false)
      fetchContent() // Refresh data
    } catch (error: any) {
      console.error('Error updating content:', error)
      toast.error(error.message || 'Failed to update content')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    
    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete content')
      }
      
      toast.success('Content deleted successfully')
      router.push('/dashboard/content')
    } catch (error: any) {
      console.error('Error deleting content:', error)
      toast.error(error.message || 'Failed to delete content')
    } finally {
      setDeleting(false)
    }
  }

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      category_ids: checked
        ? [...prev.category_ids, categoryId]
        : prev.category_ids.filter(id => id !== categoryId)
    }))
  }

  const renderContentTypeSpecificFields = () => {
    switch (formData.content_type) {
      case 'iframe':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="embed_url">Embed URL *</Label>
              <Input
                id="embed_url"
                type="url"
                placeholder="https://example.com/embed"
                value={formData.embed_url}
                onChange={(e) => setFormData(prev => ({ ...prev, embed_url: e.target.value }))}
                disabled={!isEditing}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                URL will be encrypted for security
              </p>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content_data">Content Configuration</Label>
              <Textarea
                id="content_data"
                placeholder="Enter configuration in JSON format"
                value={JSON.stringify(formData.content_data, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value)
                    setFormData(prev => ({ ...prev, content_data: data }))
                  } catch {
                    // Invalid JSON, keep as string for now
                  }
                }}
                disabled={!isEditing}
                rows={8}
              />
            </div>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:file-remove" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
        <p className="text-gray-600 mb-4">The content you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/dashboard/content')}>
          Back to Content
        </Button>
      </div>
    )
  }

  const selectedContentType = CONTENT_TYPE_OPTIONS.find(opt => opt.value === content.content_type)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            <Icon icon="mdi:arrow-left" className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{content.title}</h1>
              <Badge className={STATUS_COLORS[content.status as keyof typeof STATUS_COLORS]}>
                {content.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Created by {content.creator.name}</span>
              <span>•</span>
              <span>{new Date(content.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>{content.view_count} views</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Icon icon="mdi:pencil" className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Icon icon="mdi:delete" className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Content</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{content.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? (
                        <>
                          <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  // Reset form data
                  setFormData({
                    title: content.title,
                    description: content.description || '',
                    content_type: content.content_type,
                    content_data: content.content_data || {},
                    embed_url: content.embed_url || '',
                    is_public: content.is_public,
                    category_ids: content.categories.map((cat: any) => cat.category.id)
                  })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-accent hover:bg-accent/90"
              >
                {saving ? (
                  <>
                    <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:check" className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter content title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  disabled={!isEditing}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter content description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Type */}
          <Card>
            <CardHeader>
              <CardTitle>Content Type</CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="flex items-center p-4 border rounded-lg">
                  <Icon icon={selectedContentType?.icon || 'mdi:file'} className="w-6 h-6 mr-3 text-accent" />
                  <div>
                    <div className="font-medium">{selectedContentType?.label}</div>
                    <div className="text-sm text-gray-600">{selectedContentType?.description}</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CONTENT_TYPE_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.content_type === option.value
                          ? 'border-accent bg-accent/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, content_type: option.value }))}
                    >
                      <div className="flex items-center mb-2">
                        <Icon icon={option.icon} className="w-6 h-6 mr-3 text-accent" />
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Content Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {renderContentTypeSpecificFields()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="space-y-2">
                  {content.categories.length > 0 ? (
                    content.categories.map(({ category }) => (
                      <div key={category.id} className="flex items-center">
                        {category.icon && (
                          <Icon icon={category.icon} className="w-4 h-4 mr-2" />
                        )}
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color || '#6B7280' }}
                        />
                        <span>{category.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No categories assigned</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.category_ids.includes(category.id)}
                        onCheckedChange={(checked) => 
                          handleCategoryToggle(category.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="flex items-center cursor-pointer"
                      >
                        {category.icon && (
                          <Icon icon={category.icon} className="w-4 h-4 mr-2" />
                        )}
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color || '#6B7280' }}
                        />
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_public">Public Content</Label>
                  <p className="text-sm text-gray-500">
                    Visible to all users
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_public: checked }))
                  }
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Created:</span>
                <p className="text-gray-600">{new Date(content.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium">Updated:</span>
                <p className="text-gray-600">{new Date(content.updated_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium">Creator:</span>
                <p className="text-gray-600">{content.creator.name}</p>
              </div>
              <div>
                <span className="font-medium">Views:</span>
                <p className="text-gray-600">{content.view_count}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}