'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { RoleForm } from './RoleForm'
import { RoleDetailsModal } from './RoleDetailsModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  userCount?: number
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
}

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

interface RoleManagementProps {
  className?: string
}

export function RoleManagement({ className = '' }: RoleManagementProps) {
  const { data: session } = useSession()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Load roles
  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles?includePermissions=true&includeUserCount=true')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load roles')
      }

      setRoles(data.roles)
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  // Load permissions
  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/permissions?groupBy=resource')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load permissions')
      }

      // Flatten grouped permissions
      const allPermissions: Permission[] = []
      Object.values(data.permissions).forEach((resourcePermissions: any) => {
        allPermissions.push(...resourcePermissions)
      })
      
      setPermissions(allPermissions)
    } catch (error) {
      console.error('Error loading permissions:', error)
      toast.error('Failed to load permissions')
    }
  }

  // Handle role creation
  const handleCreateRole = async (roleData: any) => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create role')
      }

      toast.success('Role created successfully')
      setShowCreateModal(false)
      loadRoles()
    } catch (error: any) {
      console.error('Error creating role:', error)
      toast.error(error.message || 'Failed to create role')
    }
  }

  // Handle role update
  const handleUpdateRole = async (roleData: any) => {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role')
      }

      toast.success('Role updated successfully')
      setShowEditModal(false)
      setSelectedRole(null)
      loadRoles()
    } catch (error: any) {
      console.error('Error updating role:', error)
      toast.error(error.message || 'Failed to update role')
    }
  }

  // Handle role deletion
  const handleDeleteRole = async () => {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete role')
      }

      toast.success('Role deleted successfully')
      setShowDeleteDialog(false)
      setSelectedRole(null)
      loadRoles()
    } catch (error: any) {
      console.error('Error deleting role:', error)
      toast.error(error.message || 'Failed to delete role')
    }
  }

  // Filter roles based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRoles(roles)
    } else {
      const filtered = roles.filter(role => 
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRoles(filtered)
    }
  }, [roles, searchTerm])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get role badge variant
  const getRoleBadgeVariant = (isActive: boolean) => {
    return isActive ? 'success' : 'secondary'
  }

  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Role Management</h2>
          <p className="text-gray-400 mt-1">
            Manage user roles and permissions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Search */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search Roles
          </label>
          <Input
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 border-gray-600"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-orange-500 mr-3" />
            <span className="text-gray-400">Loading roles...</span>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Icon icon="mdi:shield-off" className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {searchTerm ? 'No roles found' : 'No roles available'}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'Create your first role to get started'}
            </p>
          </div>
        ) : (
          filteredRoles.map((role) => (
            <div key={role.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              {/* Role Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {role.name}
                  </h3>
                  {role.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {role.description}
                    </p>
                  )}
                </div>
                <Badge variant={getRoleBadgeVariant(role.isActive)}>
                  {role.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Role Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Users</p>
                  <p className="text-lg font-semibold text-white">
                    {role.userCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Permissions</p>
                  <p className="text-lg font-semibold text-white">
                    {role.permissions?.length || 0}
                  </p>
                </div>
              </div>

              {/* Permissions Preview */}
              {role.permissions && role.permissions.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Key Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <Badge
                        key={permission.id}
                        variant="outline"
                        className="text-xs border-gray-600 text-gray-300"
                      >
                        {permission.action}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-gray-600 text-gray-400"
                      >
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Role Meta */}
              <div className="text-xs text-gray-500 mb-4">
                Created {formatDate(role.createdAt)}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRole(role)
                    setShowDetailsModal(true)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <Icon icon="mdi:eye" className="w-4 h-4 mr-1" />
                  View
                </Button>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role)
                      setShowEditModal(true)
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <Icon icon="mdi:pencil" className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role)
                      setShowDeleteDialog(true)
                    }}
                    className="text-gray-400 hover:text-red-400"
                    disabled={role.userCount && role.userCount > 0}
                  >
                    <Icon icon="mdi:delete" className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
        size="xl"
      >
        <RoleForm
          permissions={permissions}
          onSubmit={handleCreateRole}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedRole(null)
        }}
        title="Edit Role"
        size="xl"
      >
        {selectedRole && (
          <RoleForm
            role={selectedRole}
            permissions={permissions}
            onSubmit={handleUpdateRole}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedRole(null)
            }}
            isEditing
          />
        )}
      </Modal>

      {/* Role Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedRole(null)
        }}
        title="Role Details"
        size="xl"
      >
        {selectedRole && (
          <RoleDetailsModal
            role={selectedRole}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedRole(null)
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedRole(null)
        }}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${selectedRole?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  )
}