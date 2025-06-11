'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalContent: number
  totalViews: number
  systemHealth: number
  storageUsed: number
  storageTotal: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  user?: {
    first_name: string
    last_name: string
  }
}

interface QuickAction {
  title: string
  description: string
  icon: string
  href: string
  color: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard statistics
      const statsResponse = await fetch('/api/dashboard/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/dashboard/activity')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login':
        return 'mdi:login'
      case 'user_register':
        return 'mdi:account-plus'
      case 'content_create':
        return 'mdi:file-plus'
      case 'content_update':
        return 'mdi:file-edit'
      case 'content_delete':
        return 'mdi:file-remove'
      case 'system_alert':
        return 'mdi:alert'
      default:
        return 'mdi:information'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {session?.user?.first_name}!
          </h1>
          <p className="text-gray-300 mt-1">
            Here's what's happening with your analytics platform today.
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
          Quick Action
        </Button>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <Icon icon="mdi:account-group" className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Users</p>
                  <p className="text-2xl font-bold text-white">{stats?.activeUsers || 0}</p>
                </div>
                <Icon icon="mdi:account-check" className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Content</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalContent || 0}</p>
                </div>
                <Icon icon="mdi:file-document" className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Views</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalViews || 0}</p>
                </div>
                <Icon icon="mdi:eye" className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health and Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Icon icon="mdi:heart-pulse" className="h-5 w-5 mr-2 text-red-500" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Overall Health</span>
                  <span className="text-white">{stats?.systemHealth || 0}%</span>
                </div>
                <Progress value={stats?.systemHealth || 0} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">CPU Usage</p>
                  <p className="text-white font-medium">45%</p>
                </div>
                <div>
                  <p className="text-gray-400">Memory Usage</p>
                  <p className="text-white font-medium">62%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Icon icon="mdi:harddisk" className="h-5 w-5 mr-2 text-blue-500" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Used Storage</span>
                  <span className="text-white">
                    {((stats?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(1)} GB / 
                    {((stats?.storageTotal || 0) / 1024 / 1024 / 1024).toFixed(1)} GB
                  </span>
                </div>
                <Progress 
                  value={stats?.storageTotal ? (stats.storageUsed / stats.storageTotal) * 100 : 0} 
                  className="h-2" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Database</p>
                  <p className="text-white font-medium">2.3 GB</p>
                </div>
                <div>
                  <p className="text-gray-400">Files</p>
                  <p className="text-white font-medium">1.8 GB</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Icon icon="mdi:clock-outline" className="h-5 w-5 mr-2 text-orange-500" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-gray-400">
            Latest system activities and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-700/50">
                  <div className="flex-shrink-0">
                    <Icon 
                      icon={getActivityIcon(activity.type)} 
                      className="h-8 w-8 text-orange-500" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {activity.user && (
                        <span className="text-gray-400 text-xs">
                          by {activity.user.first_name} {activity.user.last_name}
                        </span>
                      )}
                      <span className="text-gray-500 text-xs">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon icon="mdi:information-outline" className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No recent activity to display</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Icon icon="mdi:lightning-bolt" className="h-5 w-5 mr-2 text-yellow-500" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-gray-400">
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 border-gray-600 hover:border-orange-500 hover:bg-orange-500/10"
              onClick={() => window.location.href = '/dashboard/content/create'}
            >
              <div className="text-center">
                <Icon icon="mdi:file-plus" className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-white font-medium">Create Content</p>
                <p className="text-gray-400 text-xs">Add new content</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 border-gray-600 hover:border-blue-500 hover:bg-blue-500/10"
              onClick={() => window.location.href = '/dashboard/system/monitoring'}
            >
              <div className="text-center">
                <Icon icon="mdi:monitor-dashboard" className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-white font-medium">System Monitor</p>
                <p className="text-gray-400 text-xs">Check system status</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 border-gray-600 hover:border-green-500 hover:bg-green-500/10"
              onClick={() => window.location.href = '/dashboard/files'}
            >
              <div className="text-center">
                <Icon icon="mdi:folder" className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-white font-medium">File Manager</p>
                <p className="text-gray-400 text-xs">Manage files</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 border-gray-600 hover:border-purple-500 hover:bg-purple-500/10"
              onClick={() => window.location.href = '/dashboard/system/configuration'}
            >
              <div className="text-center">
                <Icon icon="mdi:cog" className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-white font-medium">Settings</p>
                <p className="text-gray-400 text-xs">System configuration</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}