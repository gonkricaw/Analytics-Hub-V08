'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { formatDistanceToNow, format } from 'date-fns'

interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  userCount?: number
  permissions?: Permission[]
  users?: User[]
}

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  username?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

interface ActivityLog {
  id: string
  action: string
  details: string
  timestamp: string
  userId?: string
  userName?: string
}

interface RoleDetailsModalProps {
  role: Role | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (role: Role) => void
}

export function RoleDetailsModal({ role, isOpen, onClose, onEdit }: RoleDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [roleDetails, setRoleDetails] = useState<Role | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isActivityLoading, setIsActivityLoading] = useState(false)

  // Fetch detailed role information
  useEffect(() => {
    if (role && isOpen) {
      fetchRoleDetails()
    }
  }, [role, isOpen])

  // Fetch activity logs when activity tab is selected
  useEffect(() => {
    if (activeTab === 'activity' && role && !activityLogs.length) {
      fetchActivityLogs()
    }
  }, [activeTab, role])

  const fetchRoleDetails = async () => {
    if (!role) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/roles/${role.id}?include=permissions,users`)
      if (response.ok) {
        const data = await response.json()
        setRoleDetails(data)
      } else {
        console.error('Failed to fetch role details')
        setRoleDetails(role) // Fallback to basic role data
      }
    } catch (error) {
      console.error('Error fetching role details:', error)
      setRoleDetails(role) // Fallback to basic role data
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActivityLogs = async () => {
    if (!role) return
    
    setIsActivityLoading(true)
    try {
      const response = await fetch(`/api/roles/${role.id}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivityLogs(data)
      } else {
        console.error('Failed to fetch activity logs')
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setIsActivityLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  // Get badge variant for status
  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary'
  }

  // Get icon for activity type
  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return 'mdi:plus-circle'
      case 'updated':
        return 'mdi:pencil'
      case 'deleted':
        return 'mdi:delete'
      case 'assigned':
        return 'mdi:account-plus'
      case 'unassigned':
        return 'mdi:account-minus'
      case 'permission_added':
        return 'mdi:shield-plus'
      case 'permission_removed':
        return 'mdi:shield-minus'
      default:
        return 'mdi:information'
    }
  }

  // Get color for activity type
  const getActivityColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return 'text-green-400'
      case 'updated':
        return 'text-blue-400'
      case 'deleted':
        return 'text-red-400'
      case 'assigned':
        return 'text-green-400'
      case 'unassigned':
        return 'text-yellow-400'
      case 'permission_added':
        return 'text-green-400'
      case 'permission_removed':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  // Group permissions by resource
  const groupedPermissions = roleDetails?.permissions?.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = []
    }
    acc[permission.resource].push(permission)
    return acc
  }, {} as Record<string, Permission[]>) || {}

  if (!role) return null

  const displayRole = roleDetails || role

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gray-800 border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Icon icon="mdi:shield-account" className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {displayRole.name}
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge 
                    variant={getStatusBadgeVariant(displayRole.isActive)}
                    className={displayRole.isActive ? 'bg-green-600' : 'bg-gray-600'}
                  >
                    {displayRole.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    Created {formatRelativeTime(displayRole.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            {onEdit && (
              <Button
                onClick={() => onEdit(displayRole)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Icon icon="mdi:pencil" className="w-4 h-4 mr-2" />
                Edit Role
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 bg-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-gray-600">
              Permissions
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-gray-600">
              Activity
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto flex-1">
            <TabsContent value="overview" className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Name</label>
                        <p className="text-white">{displayRole.name}</p>
                      </div>
                      {displayRole.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-400">Description</label>
                          <p className="text-white">{displayRole.description}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-400">Status</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={getStatusBadgeVariant(displayRole.isActive)}
                            className={displayRole.isActive ? 'bg-green-600' : 'bg-gray-600'}
                          >
                            {displayRole.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Icon icon="mdi:account-group" className="w-5 h-5 text-blue-400" />
                          <span className="text-sm text-gray-400">Users</span>
                        </div>
                        <p className="text-2xl font-bold text-white mt-1">
                          {displayRole.userCount || displayRole.users?.length || 0}
                        </p>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Icon icon="mdi:shield-check" className="w-5 h-5 text-green-400" />
                          <span className="text-sm text-gray-400">Permissions</span>
                        </div>
                        <p className="text-2xl font-bold text-white mt-1">
                          {displayRole.permissions?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Timestamps</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Created</label>
                        <p className="text-white text-sm">{formatDate(displayRole.createdAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-400">Last Updated</label>
                        <p className="text-white text-sm">{formatDate(displayRole.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Users */}
              {displayRole.users && displayRole.users.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Assigned Users</h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="space-y-3">
                      {displayRole.users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={getStatusBadgeVariant(user.isActive)}
                              className={user.isActive ? 'bg-green-600' : 'bg-gray-600'}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {user.lastLoginAt && (
                              <span className="text-xs text-gray-500">
                                Last login {formatRelativeTime(user.lastLoginAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {displayRole.users.length > 5 && (
                        <p className="text-gray-400 text-sm text-center pt-2">
                          And {displayRole.users.length - 5} more users...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : Object.keys(groupedPermissions).length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="mdi:shield-off" className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                  <p className="text-gray-400">No permissions assigned</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                    <div key={resource} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white capitalize">
                          {resource.replace('_', ' ')}
                        </h4>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-3 p-2 bg-gray-800 rounded">
                            <Icon icon="mdi:shield-check" className="w-4 h-4 text-green-400" />
                            <div className="flex-1">
                              <p className="text-white font-medium">{permission.action}</p>
                              {permission.description && (
                                <p className="text-gray-400 text-xs">{permission.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {isActivityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="mdi:history" className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                  <p className="text-gray-400">No activity logs found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                      <div className={`p-1 rounded ${getActivityColor(log.action)}`}>
                        <Icon icon={getActivityIcon(log.action)} className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{log.action.replace('_', ' ')}</p>
                        <p className="text-gray-400 text-sm">{log.details}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(log.timestamp)}
                          </span>
                          {log.userName && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">by {log.userName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}