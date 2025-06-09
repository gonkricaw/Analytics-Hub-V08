'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalContent: number
  publishedContent: number
  totalDashboards: number
  activeDashboards: number
}

interface RecentActivity {
  id: string
  type: 'user_login' | 'content_created' | 'dashboard_created' | 'menu_updated'
  description: string
  timestamp: string
  user?: {
    first_name: string
    last_name: string
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login':
        return 'mdi:login'
      case 'content_created':
        return 'mdi:file-document-plus'
      case 'dashboard_created':
        return 'mdi:view-dashboard-plus'
      case 'menu_updated':
        return 'mdi:menu'
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
        <Badge variant="outline" className="text-orange-500 border-orange-500">
          {session?.user?.role?.name}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Users</CardTitle>
            <Icon icon="mdi:account-multiple" className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 bg-white/20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-white/60">
                  {stats?.activeUsers || 0} active this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Content Items</CardTitle>
            <Icon icon="mdi:file-document" className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 bg-white/20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{stats?.totalContent || 0}</div>
                <p className="text-xs text-white/60">
                  {stats?.publishedContent || 0} published
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Dashboards</CardTitle>
            <Icon icon="mdi:view-dashboard" className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 bg-white/20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{stats?.totalDashboards || 0}</div>
                <p className="text-xs text-white/60">
                  {stats?.activeDashboards || 0} active
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-white/70">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/content/create">
              <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-orange-500/20 hover:border-orange-500">
                <Icon icon="mdi:file-document-plus" className="mr-2 h-4 w-4" />
                Create New Content
              </Button>
            </Link>
            <Link href="/dashboard/system/menus">
              <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-orange-500/20 hover:border-orange-500">
                <Icon icon="mdi:menu" className="mr-2 h-4 w-4" />
                Manage Menus
              </Button>
            </Link>
            <Link href="/dashboard/users">
              <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-orange-500/20 hover:border-orange-500">
                <Icon icon="mdi:account-multiple" className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-orange-500/20 hover:border-orange-500">
                <Icon icon="mdi:chart-line" className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-white/70">
              Latest system activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-3/4 bg-white/20" />
                      <Skeleton className="h-3 w-1/2 bg-white/20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
                      <Icon 
                        icon={getActivityIcon(activity.type)} 
                        className="h-4 w-4 text-orange-500" 
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="text-xs text-white/60">
                        {formatTimestamp(activity.timestamp)}
                        {activity.user && (
                          <span className="ml-1">
                            by {activity.user.first_name} {activity.user.last_name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <Icon icon="mdi:history" className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No recent activity to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">System Status</CardTitle>
          <CardDescription className="text-white/70">
            Current system health and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                <Icon icon="mdi:database" className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Database</p>
                <p className="text-xs text-white/60">Connected</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                <Icon icon="mdi:server" className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">API Server</p>
                <p className="text-xs text-white/60">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
                <Icon icon="mdi:memory" className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Memory Usage</p>
                <p className="text-xs text-white/60">68% Used</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}