'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Content {
  id: string
  title: string
  description?: string
  content_type: string
  is_active: boolean
  is_public: boolean
  view_count: number
  created_at: string
  updated_at: string
  creator: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  categories: {
    category: {
      id: string
      name: string
      color?: string
    }
  }[]
}

interface Category {
  id: string
  name: string
  color?: string
  icon?: string
  content_count?: number
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard' },
  { value: 'report', label: 'Report', icon: 'mdi:file-chart' },
  { value: 'widget', label: 'Widget', icon: 'mdi:widgets' },
  { value: 'iframe', label: 'IFrame', icon: 'mdi:web' },
  { value: 'chart', label: 'Chart', icon: 'mdi:chart-line' },
  { value: 'table', label: 'Table', icon: 'mdi:table' }
]

export default function ContentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [content, setContent] = useState<Content[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contentToDelete, setContentToDelete] = useState<Content | null>(null)

  // Fetch content
  const fetchContent = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedType) params.append('content_type', selectedType)
      if (selectedCategory) params.append('category_id', selectedCategory)
      if (selectedStatus) params.append('is_active', selectedStatus)

      const response = await fetch(`/api/content?${params}`)
      if (!response.ok) throw new Error('Failed to fetch content')
      
      const data = await response.json()
      setContent(data.content)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Error fetching content:', error)
      toast.error('Failed to load content')
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?include_counts=true')
      if (!response.ok) throw new Error('Failed to fetch categories')
      
      const data = await response.json()
      setCategories(data.categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Delete content
  const handleDelete = async (content: Content) => {
    try {
      const response = await fetch(`/api/content/${content.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete content')
      
      toast.success('Content deleted successfully')
      setDeleteDialogOpen(false)
      setContentToDelete(null)
      fetchContent()
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error('Failed to delete content')
    }
  }

  // Toggle content status
  const toggleStatus = async (content: Content) => {
    try {
      const response = await fetch(`/api/content/${content.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !content.is_active
        })
      })
      
      if (!response.ok) throw new Error('Failed to update content')
      
      toast.success(`Content ${content.is_active ? 'deactivated' : 'activated'} successfully`)
      fetchContent()
    } catch (error) {
      console.error('Error updating content:', error)
      toast.error('Failed to update content')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchContent(), fetchCategories()])
      setLoading(false)
    }
    loadData()
  }, [currentPage, searchTerm, selectedType, selectedCategory, selectedStatus])

  const getTypeIcon = (type: string) => {
    const option = CONTENT_TYPE_OPTIONS.find(opt => opt.value === type)
    return option?.icon || 'mdi:file'
  }

  const getTypeLabel = (type: string) => {
    const option = CONTENT_TYPE_OPTIONS.find(opt => opt.value === type)
    return option?.label || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your content library and organize by categories
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/content/create')}
          className="bg-accent hover:bg-accent/90"
        >
          <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
          Create Content
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <Icon icon="mdi:file-multiple" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{content.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Content</CardTitle>
            <Icon icon="mdi:check-circle" className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {content.filter(c => c.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Content</CardTitle>
            <Icon icon="mdi:earth" className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {content.filter(c => c.is_public).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Icon icon="mdi:folder" className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      <Icon icon={option.icon} className="w-4 h-4 mr-2" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center">
                      {category.icon && (
                        <Icon icon={category.icon} className="w-4 h-4 mr-2" />
                      )}
                      {category.name}
                      {category.content_count !== undefined && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({category.content_count})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedType('')
                setSelectedCategory('')
                setSelectedStatus('')
                setCurrentPage(1)
              }}
            >
              <Icon icon="mdi:filter-remove" className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Icon icon={getTypeIcon(item.content_type)} className="w-4 h-4 mr-2" />
                      {getTypeLabel(item.content_type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.categories.map((cat) => (
                        <Badge
                          key={cat.category.id}
                          variant="secondary"
                          style={{
                            backgroundColor: cat.category.color ? `${cat.category.color}20` : undefined,
                            borderColor: cat.category.color,
                            color: cat.category.color
                          }}
                        >
                          {cat.category.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {item.is_public && (
                        <Badge variant="outline">
                          <Icon icon="mdi:earth" className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Icon icon="mdi:eye" className="w-4 h-4 mr-1 text-gray-500" />
                      {item.view_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {item.creator.first_name} {item.creator.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/content/${item.id}`)}
                      >
                        <Icon icon="mdi:eye" className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/content/${item.id}/edit`)}
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(item)}
                      >
                        <Icon 
                          icon={item.is_active ? 'mdi:pause' : 'mdi:play'} 
                          className="w-4 h-4" 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setContentToDelete(item)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <Icon icon="mdi:chevron-left" className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete "{contentToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => contentToDelete && handleDelete(contentToDelete)}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}