'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { UserForm } from './UserForm'
import { UserDetailsModal } from './UserDetailsModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  username?: string
  role: {
    id: string
    name: string
  }
  status: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

interface Role {
  id: string
  name: string
  description?: string
}

interface UserManagementProps {
  className?: string
}

export function UserManagement({ className = '' }: UserManagementProps) {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [pageSize] = useState(10)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole && { role: selectedRole }),
        ...(selectedStatus && { status: selectedStatus })
      })

      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load users')
      }

      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
      setTotalUsers(data.pagination.total)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Load roles
  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load roles')
      }

      setRoles(data.roles)
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load roles')
    }
  }

  // Handle user creation
  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user')
      }

      toast.success('User created successfully')
      setShowCreateModal(false)
      loadUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Failed to create user')
    }
  }

  // Handle user update
  const handleUpdateUser = async (userData: any) => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user')
      }

      toast.success('User updated successfully')
      setShowEditModal(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast.error(error.message || 'Failed to update user')
    }
  }

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user')
      }

      toast.success('User deleted successfully')
      setShowDeleteDialog(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Failed to delete user')
    }
  }

  // Handle sort change
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedRole('')
    setSelectedStatus('')
    setCurrentPage(1)
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string, isActive: boolean) => {
    if (!isActive) return 'secondary'
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'PENDING': return 'warning'
      case 'SUSPENDED': return 'destructive'
      default: return 'secondary'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    loadUsers()
  }, [currentPage, sortBy, sortOrder, searchTerm, selectedRole, selectedStatus])

  useEffect(() => {
    loadRoles()
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-gray-700 border-gray-600"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-700 border-gray-600"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Icon icon="mdi:filter-off" className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('firstName')}
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <span>User</span>
                    <Icon 
                      icon={sortBy === 'firstName' ? 
                        (sortOrder === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down') : 
                        'mdi:unfold-more-horizontal'
                      } 
                      className="w-4 h-4" 
                    />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <span>Role</span>
                    <Icon 
                      icon={sortBy === 'role' ? 
                        (sortOrder === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down') : 
                        'mdi:unfold-more-horizontal'
                      } 
                      className="w-4 h-4" 
                    />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('lastLoginAt')}
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <span>Last Login</span>
                    <Icon 
                      icon={sortBy === 'lastLoginAt' ? 
                        (sortOrder === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down') : 
                        'mdi:unfold-more-horizontal'
                      } 
                      className="w-4 h-4" 
                    />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <span>Created</span>
                    <Icon 
                      icon={sortBy === 'createdAt' ? 
                        (sortOrder === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down') : 
                        'mdi:unfold-more-horizontal'
                      } 
                      className="w-4 h-4" 
                    />
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <Icon icon="mdi:loading" className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                      <span className="text-gray-400">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="text-gray-400">
                      <Icon icon="mdi:account-off" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-400">
                            {user.email}
                          </div>
                          {user.username && (
                            <div className="text-xs text-gray-500">
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {user.role.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(user.status, user.isActive)}>
                        {user.isActive ? user.status : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowDetailsModal(true)
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <Icon icon="mdi:eye" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
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
                            setSelectedUser(user)
                            setShowDeleteDialog(true)
                          }}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Icon icon="mdi:delete" className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showInfo
              totalItems={totalUsers}
              itemsPerPage={pageSize}
            />
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="lg"
      >
        <UserForm
          roles={roles}
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        title="Edit User"
        size="lg"
      >
        {selectedUser && (
          <UserForm
            user={selectedUser}
            roles={roles}
            onSubmit={handleUpdateUser}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedUser(null)
            }}
            isEditing
          />
        )}
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedUser(null)
        }}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedUser(null)
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedUser(null)
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  )
}