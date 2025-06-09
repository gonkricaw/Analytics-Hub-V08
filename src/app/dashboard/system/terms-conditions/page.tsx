'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TermsEditor from '@/components/forms/TermsEditor'
import { 
  Plus, 
  FileText, 
  Calendar, 
  User, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Loader2,
  RefreshCw
} from 'lucide-react'
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
  user_acceptances?: any[]
}

interface TermsFormData {
  title: string
  content: string
  change_summary: string
  effective_date: string
}

export default function TermsConditionsPage() {
  const [versions, setVersions] = useState<TermsVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<TermsVersion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState<TermsFormData>({
    title: '',
    content: '',
    change_summary: '',
    effective_date: ''
  })

  useEffect(() => {
    fetchVersions()
  }, [])

  const fetchVersions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/system/terms-conditions')
      if (!response.ok) throw new Error('Failed to fetch versions')
      const data = await response.json()
      setVersions(data.versions || [])
      
      // Select the active version by default
      const activeVersion = data.versions?.find((v: TermsVersion) => v.is_active)
      if (activeVersion) {
        setSelectedVersion(activeVersion)
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
      toast.error('Failed to load T&C versions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setIsEditing(true)
    setFormData({
      title: 'Terms & Conditions',
      content: '',
      change_summary: '',
      effective_date: ''
    })
    setSelectedVersion(null)
  }

  const handleEdit = (version: TermsVersion) => {
    setIsEditing(true)
    setIsCreating(false)
    setFormData({
      title: version.title,
      content: version.content,
      change_summary: '',
      effective_date: version.effective_date || ''
    })
    setSelectedVersion(version)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    try {
      setIsSaving(true)
      const url = isCreating 
        ? '/api/system/terms-conditions'
        : `/api/system/terms-conditions/${selectedVersion?.id}`
      
      const response = await fetch(url, {
        method: isCreating ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save')
      }

      const result = await response.json()
      toast.success(isCreating ? 'New version created successfully' : 'Version updated successfully')
      
      setIsEditing(false)
      setIsCreating(false)
      await fetchVersions()
      
      // Select the newly created/updated version
      if (result.version) {
        setSelectedVersion(result.version)
      }
    } catch (error: any) {
      console.error('Error saving version:', error)
      toast.error(error.message || 'Failed to save version')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async (versionId: string) => {
    try {
      const response = await fetch(`/api/system/terms-conditions/${versionId}/publish`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to publish')
      }

      toast.success('Version published successfully')
      await fetchVersions()
    } catch (error: any) {
      console.error('Error publishing version:', error)
      toast.error(error.message || 'Failed to publish version')
    }
  }

  const handleApprove = async (versionId: string) => {
    try {
      const response = await fetch(`/api/system/terms-conditions/${versionId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to approve')
      }

      toast.success('Version approved successfully')
      await fetchVersions()
    } catch (error: any) {
      console.error('Error approving version:', error)
      toast.error(error.message || 'Failed to approve version')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400'
      case 'pending': return 'text-yellow-400'
      case 'rejected': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'mdi:check-circle'
      case 'pending': return 'mdi:clock-outline'
      case 'rejected': return 'mdi:close-circle'
      default: return 'mdi:file-document-outline'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-white/60">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
          <span>Loading T&C versions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Terms & Conditions Management</h1>
          <p className="text-white/60">Manage, version, and publish your terms and conditions</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-accent hover:bg-accent/80 text-white"
          disabled={isEditing}
        >
          <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
          Create New Version
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Versions List */}
        <div className="lg:col-span-1">
          <div className="card backdrop-blur-md bg-white/5 border border-white/10">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Icon icon="mdi:history" className="w-5 h-5 text-accent" />
                Version History
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedVersion?.id === version.id
                        ? 'border-accent bg-accent/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                    onClick={() => !isEditing && setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white text-sm">
                        v{version.version}
                      </span>
                      <div className="flex items-center gap-2">
                        {version.is_active && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                            Active
                          </span>
                        )}
                        {version.is_published && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            Published
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Icon 
                        icon={getStatusIcon(version.approval_status)} 
                        className={`w-4 h-4 ${getStatusColor(version.approval_status)}`} 
                      />
                      <span className={`text-xs capitalize ${getStatusColor(version.approval_status)}`}>
                        {version.approval_status}
                      </span>
                    </div>
                    
                    <p className="text-white/60 text-xs">
                      Created by {version.creator.first_name} {version.creator.last_name}
                    </p>
                    <p className="text-white/40 text-xs">
                      {new Date(version.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                
                {versions.length === 0 && (
                  <div className="text-center py-8">
                    <Icon icon="mdi:file-document-outline" className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60 text-sm">No versions found</p>
                    <p className="text-white/40 text-xs">Create your first T&C version</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2">
          <div className="card backdrop-blur-md bg-white/5 border border-white/10">
            <div className="p-6">
              {isEditing ? (
                /* Edit Form */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Icon icon="mdi:pencil" className="w-5 h-5 text-accent" />
                      {isCreating ? 'Create New Version' : 'Edit Version'}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setShowPreview(!showPreview)}
                        variant="outline"
                        size="sm"
                      >
                        <Icon icon={showPreview ? 'mdi:pencil' : 'mdi:eye'} className="w-4 h-4 mr-2" />
                        {showPreview ? 'Edit' : 'Preview'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false)
                          setIsCreating(false)
                          setShowPreview(false)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Icon icon="mdi:close" className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-accent hover:bg-accent/80 text-white"
                        size="sm"
                      >
                        {isSaving ? (
                          <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Icon icon="mdi:content-save" className="w-4 h-4 mr-2" />
                        )}
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>

                  {showPreview ? (
                    /* Preview Mode */
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">{formData.title}</h3>
                        <div 
                          className="prose prose-invert max-w-none text-white/80 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formData.content.replace(/\n/g, '<br>') }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent"
                          placeholder="Enter title..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Content
                        </label>
                        <textarea
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          rows={15}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent resize-none"
                          placeholder="Enter terms and conditions content..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Change Summary
                          </label>
                          <input
                            type="text"
                            value={formData.change_summary}
                            onChange={(e) => setFormData({ ...formData, change_summary: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent"
                            placeholder="Describe what changed..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Effective Date
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.effective_date}
                            onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedVersion ? (
                /* View Mode */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Icon icon="mdi:file-document" className="w-5 h-5 text-accent" />
                        {selectedVersion.title}
                      </h2>
                      <p className="text-white/60 text-sm mt-1">
                        Version {selectedVersion.version} • {selectedVersion.approval_status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleEdit(selectedVersion)}
                        variant="outline"
                        size="sm"
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {selectedVersion.approval_status === 'draft' && (
                        <Button
                          onClick={() => handleApprove(selectedVersion.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <Icon icon="mdi:check" className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      )}
                      {selectedVersion.approval_status === 'approved' && !selectedVersion.is_published && (
                        <Button
                          onClick={() => handlePublish(selectedVersion.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <Icon icon="mdi:publish" className="w-4 h-4 mr-2" />
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Version Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white/60 text-xs mb-1">Created By</p>
                      <p className="text-white text-sm">
                        {selectedVersion.creator.first_name} {selectedVersion.creator.last_name}
                      </p>
                      <p className="text-white/40 text-xs">
                        {new Date(selectedVersion.created_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedVersion.updater && (
                      <div>
                        <p className="text-white/60 text-xs mb-1">Last Updated By</p>
                        <p className="text-white text-sm">
                          {selectedVersion.updater.first_name} {selectedVersion.updater.last_name}
                        </p>
                        <p className="text-white/40 text-xs">
                          {new Date(selectedVersion.updated_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedVersion.effective_date && (
                      <div>
                        <p className="text-white/60 text-xs mb-1">Effective Date</p>
                        <p className="text-white text-sm">
                          {new Date(selectedVersion.effective_date).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedVersion.change_summary && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-400 text-sm font-medium mb-1">Change Summary</p>
                      <p className="text-white/80 text-sm">{selectedVersion.change_summary}</p>
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-white/80 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedVersion.content.replace(/\n/g, '<br>') }}
                    />
                  </div>
                </div>
              ) : (
                /* No Selection */
                <div className="text-center py-12">
                  <Icon icon="mdi:file-document-outline" className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Version Selected</h3>
                  <p className="text-white/60 text-sm mb-4">
                    Select a version from the history or create a new one
                  </p>
                  <Button
                    onClick={handleCreateNew}
                    className="bg-accent hover:bg-accent/80 text-white"
                  >
                    <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
                    Create First Version
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}