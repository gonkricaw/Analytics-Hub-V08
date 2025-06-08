'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { toast } from 'react-hot-toast'

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

interface UserActivity {
  id: string
  action: string
  resourceType: string
  resourceId?: string
  ipAddress: string
  userAgent: string
  createdAt: string
  details?: any
}

interface UserDetailsModalProps {
  user: User
  onClose: () => void
}

export function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const [userDetails, setUserDetails] = useState<any>(null)
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Load detailed user information
  const loadUserDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${user.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load user details')
      }

      setUserDetails(data.user)
    } catch (error) {
      console.error('Error loading user details:', error)
      toast.error('Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  // Load user activity logs
  const loadUserActivity = async () => {
    try {
      setActivityLoading(true)
      const response = await fetch(`/api/users/${user.id}/activity?limit=20`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load user activity')
      }

      setUserActivity(data.activities || [])
    } catch (error) {
      console.error('Error loading user activity:', error)
      // Don't show error toast for activity as it's not critical
    } finally {
      setActivityLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return formatDate(dateString)
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

  // Get activity icon
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'mdi:login'
      case 'LOGOUT': return 'mdi:logout'
      case 'PASSWORD_CHANGED': return 'mdi:key-change'
      case 'PROFILE_UPDATED': return 'mdi:account-edit'
      case 'ROLE_CHANGED': return 'mdi:account-key'
      case 'USER_CREATED': return 'mdi:account-plus'
      case 'USER_UPDATED': return 'mdi:account-edit'
      case 'USER_DELETED': return 'mdi:account-remove'
      case 'CONTENT_CREATED': return 'mdi:file-plus'
      case 'CONTENT_UPDATED': return 'mdi:file-edit'
      case 'CONTENT_DELETED': return 'mdi:file-remove'
      default: return 'mdi:information'
    }
  }

  // Get activity color
  const getActivityColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'text-green-400'
      case 'LOGOUT': return 'text-blue-400'
      case 'PASSWORD_CHANGED': return 'text-yellow-400'
      case 'USER_DELETED': 
      case 'CONTENT_DELETED': return 'text-red-400'
      case 'USER_CREATED':
      case 'CONTENT_CREATED': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  useEffect(() => {
    loadUserDetails()
  }, [user.id])

  useEffect(() => {
    if (activeTab === 'activity') {
      loadUserActivity()
    }
  }, [activeTab, user.id])

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-orange-500 mr-3" />
          <span className="text-gray-400">Loading user details...</span>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-orange-600">
              Permissions
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-orange-600">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* User Header */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-orange-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-gray-400">{user.email}</p>
                {user.username && (
                  <p className="text-sm text-gray-500">@{user.username}</p>
                )}
              </div>
              <div className="text-right">
                <Badge variant={getStatusBadgeVariant(user.status, user.isActive)} className="mb-2">
                  {user.isActive ? user.status : 'INACTIVE'}
                </Badge>
                <p className="text-sm text-gray-400">
                  {user.role.name}
                </p>
              </div>
            </div>

            {/* User Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Icon icon="mdi:account" className="w-5 h-5 mr-2" />
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Full Name</label>
                    <p className="text-white">{user.firstName} {user.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p className="text-white">{user.email}</p>
                  </div>
                  {user.username && (
                    <div>
                      <label className="text-sm text-gray-400">Username</label>
                      <p className="text-white">@{user.username}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-400">Role</label>
                    <p className="text-white">{user.role.name}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Icon icon="mdi:shield-account" className="w-5 h-5 mr-2" />
                  Account Status
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Status</label>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeVariant(user.status, user.isActive)}>
                        {user.isActive ? user.status : 'INACTIVE'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Last Login</label>
                    <p className="text-white">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Account Created</label>
                    <p className="text-white">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Last Updated</label>
                    <p className="text-white">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            {userDetails && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Icon icon="mdi:information" className="w-5 h-5 mr-2" />
                  Additional Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userDetails.contentCount !== undefined && (
                    <div>
                      <label className="text-sm text-gray-400">Content Created</label>
                      <p className="text-white text-lg font-semibold">{userDetails.contentCount}</p>
                    </div>
                  )}
                  {userDetails.loginCount !== undefined && (
                    <div>
                      <label className="text-sm text-gray-400">Total Logins</label>
                      <p className="text-white text-lg font-semibold">{userDetails.loginCount}</p>
                    </div>
                  )}
                  {userDetails.lastActivity && (
                    <div>
                      <label className="text-sm text-gray-400">Last Activity</label>
                      <p className="text-white">{formatRelativeTime(userDetails.lastActivity)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Icon icon="mdi:key" className="w-5 h-5 mr-2" />
                Role Permissions
              </h4>
              {userDetails?.permissions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(
                    userDetails.permissions.reduce((acc: any, permission: any) => {
                      if (!acc[permission.resource]) {
                        acc[permission.resource] = []
                      }
                      acc[permission.resource].push(permission)
                      return acc
                    }, {})
                  ).map(([resource, permissions]: [string, any]) => (
                    <div key={resource} className="bg-gray-800 rounded-lg p-3">
                      <h5 className="font-medium text-white mb-2 capitalize">
                        {resource.replace('_', ' ')}
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {permissions.map((permission: any) => (
                          <Badge
                            key={permission.id}
                            variant="outline"
                            className="text-xs border-gray-600 text-gray-300"
                          >
                            {permission.action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Loading permissions...</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Icon icon="mdi:history" className="w-5 h-5 mr-2" />
                Recent Activity
              </h4>
              {activityLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Icon icon="mdi:loading" className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                  <span className="text-gray-400">Loading activity...</span>
                </div>
              ) : userActivity.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                      <Icon 
                        icon={getActivityIcon(activity.action)} 
                        className={`w-5 h-5 mt-0.5 ${getActivityColor(activity.action)}`} 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">
                          {activity.action.replace('_', ' ').toLowerCase()}
                          {activity.resourceType && (
                            <span className="text-gray-400"> • {activity.resourceType}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                        {activity.ipAddress && (
                          <p className="text-xs text-gray-500">
                            IP: {activity.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon icon="mdi:history" className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-gray-700">
        <Button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700"
        >
          Close
        </Button>
      </div>
    </div>
  )
}