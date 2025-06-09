'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface FileData {
  id: string
  filename: string
  original_name: string
  mime_type: string
  file_size: number
  file_path: string
  category?: string
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
  uploader: {
    id: string
    name: string
    email: string
  }
}

interface UploadFormData {
  category: string
  description: string
  is_public: boolean
}

const FILE_CATEGORIES = [
  'images',
  'documents',
  'videos',
  'audio',
  'archives',
  'data',
  'other'
]

const MIME_TYPE_ICONS: { [key: string]: string } = {
  'image/': 'mdi:image',
  'video/': 'mdi:video',
  'audio/': 'mdi:music',
  'application/pdf': 'mdi:file-pdf-box',
  'application/msword': 'mdi:file-word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'mdi:file-word',
  'application/vnd.ms-excel': 'mdi:file-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'mdi:file-excel',
  'application/vnd.ms-powerpoint': 'mdi:file-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'mdi:file-powerpoint',
  'application/zip': 'mdi:zip-box',
  'application/x-rar-compressed': 'mdi:zip-box',
  'application/x-7z-compressed': 'mdi:zip-box',
  'text/': 'mdi:file-document',
  'application/json': 'mdi:code-json',
  'application/xml': 'mdi:file-xml',
  'text/csv': 'mdi:file-delimited'
}

function getFileIcon(mimeType: string): string {
  for (const [type, icon] of Object.entries(MIME_TYPE_ICONS)) {
    if (mimeType.startsWith(type)) {
      return icon
    }
  }
  return 'mdi:file'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FilesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [uploadFormData, setUploadFormData] = useState<UploadFormData>({
    category: 'other',
    description: '',
    is_public: false
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalFiles, setTotalFiles] = useState(0)

  // Fetch files
  const fetchFiles = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== 'all' && { category: categoryFilter })
      })
      
      const response = await fetch(`/api/upload?${params}`)
      if (!response.ok) throw new Error('Failed to fetch files')
      
      const data = await response.json()
      setFiles(data.files)
      setCurrentPage(data.pagination.page)
      setTotalPages(data.pagination.pages)
      setTotalFiles(data.pagination.total)
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles(1)
  }, [searchTerm, categoryFilter])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setSelectedFiles(files)
      setIsUploadDialogOpen(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      
      // Add files
      Array.from(selectedFiles).forEach((file) => {
        formData.append('files', file)
      })
      
      // Add metadata
      formData.append('category', uploadFormData.category)
      formData.append('description', uploadFormData.description)
      formData.append('is_public', uploadFormData.is_public.toString())
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload files')
      }
      
      const result = await response.json()
      toast.success(`${result.files.length} file(s) uploaded successfully`)
      
      setIsUploadDialogOpen(false)
      setSelectedFiles(null)
      resetUploadForm()
      fetchFiles(currentPage)
    } catch (error: any) {
      console.error('Error uploading files:', error)
      toast.error(error.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/upload/${fileId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete file')
      }
      
      toast.success('File deleted successfully')
      fetchFiles(currentPage)
    } catch (error: any) {
      console.error('Error deleting file:', error)
      toast.error(error.message || 'Failed to delete file')
    }
  }

  const resetUploadForm = () => {
    setUploadFormData({
      category: 'other',
      description: '',
      is_public: false
    })
  }

  const copyFileUrl = (file: FileData) => {
    const url = `${window.location.origin}/uploads/${file.filename}`
    navigator.clipboard.writeText(url)
    toast.success('File URL copied to clipboard')
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
          <h1 className="text-3xl font-bold">File Management</h1>
          <p className="text-gray-600 mt-1">
            Upload and manage your files
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="*/*"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-accent hover:bg-accent/90"
          >
            <Icon icon="mdi:upload" className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {FILE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Icon icon="mdi:file-multiple" className="w-8 h-8 text-accent mr-3" />
              <div>
                <p className="text-2xl font-bold">{totalFiles}</p>
                <p className="text-sm text-gray-600">Total Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Icon icon="mdi:image" className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {files.filter(f => f.mime_type.startsWith('image/')).length}
                </p>
                <p className="text-sm text-gray-600">Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Icon icon="mdi:file-document" className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {files.filter(f => 
                    f.mime_type.includes('pdf') || 
                    f.mime_type.includes('word') || 
                    f.mime_type.includes('document')
                  ).length}
                </p>
                <p className="text-sm text-gray-600">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Icon icon="mdi:video" className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {files.filter(f => f.mime_type.startsWith('video/')).length}
                </p>
                <p className="text-sm text-gray-600">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files Grid */}
      {files.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {files.map((file) => (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon
                        icon={getFileIcon(file.mime_type)}
                        className="w-8 h-8 text-accent mr-3"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate" title={file.original_name}>
                          {file.original_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyFileUrl(file)}
                        title="Copy URL"
                      >
                        <Icon icon="mdi:link" className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Icon icon="mdi:delete" className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{file.original_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteFile(file.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {file.description && (
                    <p className="text-gray-600 text-sm mb-3">{file.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {file.category && (
                        <Badge variant="secondary">{file.category}</Badge>
                      )}
                      {file.is_public && (
                        <Badge className="bg-green-100 text-green-800">Public</Badge>
                      )}
                    </div>
                    <span className="text-gray-500">
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Uploaded by {file.uploader.name}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => fetchFiles(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Icon icon="mdi:chevron-left" className="w-4 h-4" />
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => fetchFiles(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Icon icon="mdi:chevron-right" className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Icon icon="mdi:file-upload" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {searchTerm || categoryFilter !== 'all' ? 'No files found' : 'No files uploaded yet'}
          </h2>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Upload your first file to get started'
            }
          </p>
          {!searchTerm && categoryFilter === 'all' && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-accent hover:bg-accent/90"
            >
              <Icon icon="mdi:upload" className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Configure upload settings for your files.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedFiles && (
              <div>
                <Label>Selected Files</Label>
                <div className="mt-2 space-y-2">
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                      <Icon icon={getFileIcon(file.type)} className="w-4 h-4 mr-2 text-accent" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={uploadFormData.category}
                onValueChange={(value) => setUploadFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter file description (optional)"
                value={uploadFormData.description}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_public">Public Access</Label>
                <p className="text-sm text-gray-500">
                  Allow public access to these files
                </p>
              </div>
              <Switch
                id="is_public"
                checked={uploadFormData.is_public}
                onCheckedChange={(checked) => 
                  setUploadFormData(prev => ({ ...prev, is_public: checked }))
                }
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false)
                setSelectedFiles(null)
                resetUploadForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-accent hover:bg-accent/90"
            >
              {uploading ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Icon icon="mdi:upload" className="w-4 h-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}