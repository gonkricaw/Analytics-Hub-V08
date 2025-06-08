'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { createRoleSchema, updateRoleSchema } from '@/lib/validation'
import { z } from 'zod'

interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  permissions?: Permission[]
}

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

interface RoleFormProps {
  role?: Role
  permissions: Permission[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

type CreateRoleData = z.infer<typeof createRoleSchema>
type UpdateRoleData = z.infer<typeof updateRoleSchema>

export function RoleForm({ role, permissions, onSubmit, onCancel, isEditing = false }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    isActive: role?.isActive ?? true,
    permissions: role?.permissions?.map(p => p.id) || []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResource, setSelectedResource] = useState('')
  const [showAllPermissions, setShowAllPermissions] = useState(false)

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = []
    }
    acc[permission.resource].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  // Filter permissions based on search and resource
  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce((acc, [resource, resourcePermissions]) => {
    if (selectedResource && resource !== selectedResource) {
      return acc
    }

    const filtered = resourcePermissions.filter(permission => 
      !searchTerm || 
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (filtered.length > 0) {
      acc[resource] = filtered
    }

    return acc
  }, {} as Record<string, Permission[]>)

  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }))
  }

  // Handle resource-level permission toggle
  const handleResourceToggle = (resource: string, checked: boolean) => {
    const resourcePermissionIds = groupedPermissions[resource]?.map(p => p.id) || []
    
    setFormData(prev => {
      let newPermissions = [...prev.permissions]
      
      if (checked) {
        // Add all resource permissions
        resourcePermissionIds.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id)
          }
        })
      } else {
        // Remove all resource permissions
        newPermissions = newPermissions.filter(id => !resourcePermissionIds.includes(id))
      }
      
      return { ...prev, permissions: newPermissions }
    })
  }

  // Check if all permissions in a resource are selected
  const isResourceFullySelected = (resource: string) => {
    const resourcePermissionIds = groupedPermissions[resource]?.map(p => p.id) || []
    return resourcePermissionIds.length > 0 && resourcePermissionIds.every(id => formData.permissions.includes(id))
  }

  // Check if some permissions in a resource are selected
  const isResourcePartiallySelected = (resource: string) => {
    const resourcePermissionIds = groupedPermissions[resource]?.map(p => p.id) || []
    return resourcePermissionIds.some(id => formData.permissions.includes(id)) && !isResourceFullySelected(resource)
  }

  // Validate form
  const validateForm = () => {
    try {
      if (isEditing) {
        updateRoleSchema.parse({
          name: formData.name || undefined,
          description: formData.description || undefined,
          permissions: formData.permissions.length > 0 ? formData.permissions : undefined,
          isActive: formData.isActive
        })
      } else {
        createRoleSchema.parse({
          name: formData.name,
          description: formData.description || undefined,
          permissions: formData.permissions,
          isActive: formData.isActive
        })
      }
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: formData.name || undefined,
        description: formData.description || undefined,
        permissions: formData.permissions,
        isActive: formData.isActive
      })
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get unique resources for filter
  const uniqueResources = Object.keys(groupedPermissions).sort()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Role Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`bg-gray-700 border-gray-600 ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Enter role name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={`bg-gray-700 border-gray-600 ${errors.description ? 'border-red-500' : ''}`}
            placeholder="Enter role description"
            rows={3}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-400">{errors.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">
              Active Status
            </label>
            <p className="text-xs text-gray-500">
              Enable or disable this role
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => handleChange('isActive', checked)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Permissions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Permissions</h3>
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            {formData.permissions.length} selected
          </Badge>
        </div>

        {/* Permission Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Permissions
            </label>
            <Input
              type="text"
              placeholder="Search by name or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Resource
            </label>
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              disabled={isSubmitting}
            >
              <option value="">All Resources</option>
              {uniqueResources.map(resource => (
                <option key={resource} value={resource}>
                  {resource.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Permissions List */}
        <div className="bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
          {Object.keys(filteredGroupedPermissions).length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="mdi:shield-off" className="w-12 h-12 mx-auto text-gray-500 mb-2" />
              <p className="text-gray-400">No permissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(filteredGroupedPermissions).map(([resource, resourcePermissions]) => (
                <div key={resource} className="space-y-2">
                  {/* Resource Header */}
                  <div className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg">
                    <Checkbox
                      checked={isResourceFullySelected(resource)}
                      indeterminate={isResourcePartiallySelected(resource)}
                      onCheckedChange={(checked) => handleResourceToggle(resource, checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-white capitalize">
                        {resource.replace('_', ' ')}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {resourcePermissions.length} permission{resourcePermissions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {resourcePermissions.filter(p => formData.permissions.includes(p.id)).length} / {resourcePermissions.length}
                    </Badge>
                  </div>

                  {/* Resource Permissions */}
                  <div className="ml-6 space-y-2">
                    {resourcePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded">
                        <Checkbox
                          checked={formData.permissions.includes(permission.id)}
                          onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                          disabled={isSubmitting}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-white">
                              {permission.action}
                            </span>
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                              {permission.resource}
                            </Badge>
                          </div>
                          {permission.description && (
                            <p className="text-xs text-gray-400 mt-1">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {errors.permissions && (
          <p className="text-sm text-red-400">{errors.permissions}</p>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon icon="mdi:information" className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            {isEditing ? (
              <p>
                Changes to permissions will be applied immediately to all users with this role.
              </p>
            ) : (
              <p>
                Select the permissions that users with this role should have. You can modify these later.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? (
            <>
              <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Icon icon={isEditing ? 'mdi:content-save' : 'mdi:plus'} className="w-4 h-4 mr-2" />
              {isEditing ? 'Update Role' : 'Create Role'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}