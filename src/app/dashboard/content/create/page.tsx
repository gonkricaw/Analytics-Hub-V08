'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

interface Category {
  id: string
  name: string
  color?: string
  icon?: string
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

export default function CreateContentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    content_type: '',
    content_data: {},
    embed_url: '',
    is_public: false,
    category_ids: []
  })

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
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    
    if (!formData.content_type) {
      toast.error('Content type is required')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create content')
      }
      
      const content = await response.json()
      toast.success('Content created successfully')
      router.push(`/dashboard/content/${content.id}`)
    } catch (error: any) {
      console.error('Error creating content:', error)
      toast.error(error.message || 'Failed to create content')
    } finally {
      setLoading(false)
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
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                URL will be encrypted for security
              </p>
            </div>
          </div>
        )
      
      case 'chart':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="chart_config">Chart Configuration</Label>
              <Textarea
                id="chart_config"
                placeholder="Enter chart configuration in JSON format"
                value={JSON.stringify(formData.content_data, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value)
                    setFormData(prev => ({ ...prev, content_data: data }))
                  } catch {
                    // Invalid JSON, keep as string for now
                  }
                }}
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                Chart.js or similar configuration object
              </p>
            </div>
          </div>
        )
      
      case 'table':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="table_config">Table Configuration</Label>
              <Textarea
                id="table_config"
                placeholder="Enter table configuration in JSON format"
                value={JSON.stringify(formData.content_data, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value)
                    setFormData(prev => ({ ...prev, content_data: data }))
                  } catch {
                    // Invalid JSON, keep as string for now
                  }
                }}
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                Table columns, data source, and display options
              </p>
            </div>
          </div>
        )
      
      case 'widget':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="widget_config">Widget Configuration</Label>
              <Textarea
                id="widget_config"
                placeholder="Enter widget configuration in JSON format"
                value={JSON.stringify(formData.content_data, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value)
                    setFormData(prev => ({ ...prev, content_data: data }))
                  } catch {
                    // Invalid JSON, keep as string for now
                  }
                }}
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                Widget type, data source, and display properties
              </p>
            </div>
          </div>
        )
      
      case 'dashboard':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="dashboard_config">Dashboard Layout</Label>
              <Textarea
                id="dashboard_config"
                placeholder="Enter dashboard layout configuration in JSON format"
                value={JSON.stringify(formData.content_data, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value)
                    setFormData(prev => ({ ...prev, content_data: data }))
                  } catch {
                    // Invalid JSON, keep as string for now
                  }
                }}
                rows={8}
              />
              <p className="text-sm text-gray-500 mt-1">
                Dashboard grid layout and widget positions
              </p>
            </div>
          </div>
        )
      
      case 'report':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="report_config">Report Configuration</Label>
              <Textarea
                id="report_config"
                placeholder="Enter report configuration in JSON format"
                value={JSON.stringify(formData.content_data, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value)
                    setFormData(prev => ({ ...prev, content_data: data }))
                  } catch {
                    // Invalid JSON, keep as string for now
                  }
                }}
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                Report parameters, data sources, and formatting
              </p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <Icon icon="mdi:arrow-left" className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Content</h1>
          <p className="text-gray-600 mt-1">
            Add new content to your library
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </CardContent>
        </Card>

        {/* Content Type Specific Fields */}
        {formData.content_type && (
          <Card>
            <CardHeader>
              <CardTitle>Content Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {renderContentTypeSpecificFields()}
            </CardContent>
          </Card>
        )}

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            ) : (
              <p className="text-gray-500">No categories available</p>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_public">Public Content</Label>
                <p className="text-sm text-gray-500">
                  Make this content visible to all users
                </p>
              </div>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_public: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent/90"
          >
            {loading ? (
              <>
                <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Icon icon="mdi:check" className="w-4 h-4 mr-2" />
                Create Content
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}