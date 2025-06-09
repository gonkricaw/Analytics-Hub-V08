'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@iconify/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface UserActivityData {
  totalActivity: number
  activityByDay: Array<{ date: string; count: number }>
  activityByAction: Array<{ action: string; count: number }>
  topUsers: Array<{
    user_id: string
    activity_count: number
    user_name: string
    user_email: string
    user_role: string
  }>
  dateRange: {
    from: string
    to: string
    days: number
  }
}

interface ContentAnalyticsData {
  summary: {
    total_content: number
    content_by_type: Array<{ type: string; count: number }>
    content_by_status: Array<{ status: string; count: number }>
  }
  trends: {
    content_by_day: Array<{
      date: string
      total_count: number
      published_count: number
      draft_count: number
    }>
  }
  top_content: Array<{
    id: string
    title: string
    type: string
    status: string
    author: { name: string; email: string }
    metrics: {
      views: number
      likes: number
      shares: number
      comments: number
      downloads: number
    }
    created_at: string
  }>
  recent_content: Array<{
    id: string
    title: string
    type: string
    status: string
    author: { name: string; email: string }
    created_at: string
    updated_at: string
  }>
}

interface SystemAnalyticsData {
  summary: {
    users: { total: number; new: number; active_24h: number }
    content: { total: number; new: number; published: number }
    activity: { total: number; daily: number }
    errors: {
      total: number
      by_type: Array<{ type: string; count: number }>
    }
  }
  trends: {
    activity_by_day: Array<{ date: string; count: number }>
  }
  system_health: {
    database: { status: string; connection_count: number; response_time: number }
    server: {
      cpu_usage: number
      memory_usage: number
      disk_usage: number
      load_average: number[]
    }
    uptime: number
    memory_usage: any
    node_version: string
  }
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [userActivity, setUserActivity] = useState<UserActivityData | null>(null)
  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalyticsData | null>(null)
  const [systemAnalytics, setSystemAnalytics] = useState<SystemAnalyticsData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchAnalyticsData()
    }
  }, [session, timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      const [userResponse, contentResponse, systemResponse] = await Promise.all([
        fetch(`/api/analytics/user-activity?days=${timeRange}`),
        fetch(`/api/analytics/content?days=${timeRange}`),
        fetch(`/api/analytics/system?days=${timeRange}`)
      ])

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserActivity(userData)
      }

      if (contentResponse.ok) {
        const contentData = await contentResponse.json()
        setContentAnalytics(contentData)
      }

      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        setSystemAnalytics(systemData)
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Chart configurations
  const activityChartData = {
    labels: userActivity?.activityByDay.map(day => 
      new Date(day.date).toLocaleDateString()
    ) || [],
    datasets: [
      {
        label: 'Daily Activity',
        data: userActivity?.activityByDay.map(day => day.count) || [],
        borderColor: '#FF7A00',
        backgroundColor: 'rgba(255, 122, 0, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const contentTypeChartData = {
    labels: contentAnalytics?.summary.content_by_type.map(type => 
      type.type.charAt(0).toUpperCase() + type.type.slice(1)
    ) || [],
    datasets: [
      {
        data: contentAnalytics?.summary.content_by_type.map(type => type.count) || [],
        backgroundColor: [
          '#FF7A00',
          '#FF9A33',
          '#FFBA66',
          '#FFDA99',
          '#FFEACC',
          '#FFF5E6'
        ],
        borderWidth: 2,
        borderColor: '#0E0E44',
      },
    ],
  }

  const systemHealthChartData = {
    labels: ['CPU Usage', 'Memory Usage', 'Disk Usage'],
    datasets: [
      {
        label: 'System Usage (%)',
        data: [
          systemAnalytics?.system_health.server.cpu_usage || 0,
          systemAnalytics?.system_health.server.memory_usage || 0,
          systemAnalytics?.system_health.server.disk_usage || 0
        ],
        backgroundColor: ['#FF7A00', '#FF9A33', '#FFBA66'],
        borderColor: '#0E0E44',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#FFFFFF'
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#FFFFFF'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#FFFFFF'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#FFFFFF',
          padding: 20
        }
      },
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E44] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:loading" className="w-8 h-8 text-[#FF7A00] animate-spin" />
              <span className="text-white text-lg">Loading analytics...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0E0E44] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-300">
              Comprehensive insights into system performance and user engagement
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-[#FF7A00] hover:bg-[#FF7A00]/80 text-white"
            >
              <Icon 
                icon={refreshing ? "mdi:loading" : "mdi:refresh"} 
                className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white/10 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: 'mdi:view-dashboard' },
            { id: 'users', label: 'User Activity', icon: 'mdi:account-group' },
            { id: 'content', label: 'Content Analytics', icon: 'mdi:file-document' },
            { id: 'system', label: 'System Health', icon: 'mdi:server' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#FF7A00] text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon icon={tab.icon} className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/10 border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {systemAnalytics?.summary.users.total || 0}
                  </div>
                  <p className="text-xs text-gray-400">
                    +{systemAnalytics?.summary.users.new || 0} new this period
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Total Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {systemAnalytics?.summary.content.total || 0}
                  </div>
                  <p className="text-xs text-gray-400">
                    +{systemAnalytics?.summary.content.new || 0} new this period
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Daily Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {systemAnalytics?.summary.activity.daily || 0}
                  </div>
                  <p className="text-xs text-gray-400">
                    Total: {systemAnalytics?.summary.activity.total || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      systemAnalytics?.system_health.database.status === 'healthy'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`} />
                    <span className="text-white font-medium">
                      {systemAnalytics?.system_health.database.status === 'healthy'
                        ? 'Healthy'
                        : 'Issues Detected'
                      }
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Uptime: {systemAnalytics ? formatUptime(systemAnalytics.system_health.uptime) : '0d 0h 0m'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Activity Trends</CardTitle>
                  <CardDescription className="text-gray-300">
                    Daily user activity over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line data={activityChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Content Distribution</CardTitle>
                  <CardDescription className="text-gray-300">
                    Content breakdown by type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut data={contentTypeChartData} options={doughnutOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* User Activity Tab */}
        {activeTab === 'users' && userActivity && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Activity Timeline</CardTitle>
                    <CardDescription className="text-gray-300">
                      User activity over the last {timeRange} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Line data={activityChartData} options={chartOptions} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Top Active Users</CardTitle>
                    <CardDescription className="text-gray-300">
                      Most active users this period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userActivity.topUsers.slice(0, 5).map((user, index) => (
                        <div key={user.user_id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">{user.user_name}</p>
                              <p className="text-gray-400 text-sm">{user.user_role}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {user.activity_count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Activity by Action */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Activity Breakdown</CardTitle>
                <CardDescription className="text-gray-300">
                  Actions performed by users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {userActivity.activityByAction.map((action) => (
                    <div key={action.action} className="text-center">
                      <div className="text-2xl font-bold text-white">{action.count}</div>
                      <div className="text-sm text-gray-300">{action.action}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Analytics Tab */}
        {activeTab === 'content' && contentAnalytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Content by Type</CardTitle>
                  <CardDescription className="text-gray-300">
                    Distribution of content types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut data={contentTypeChartData} options={doughnutOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Content Status</CardTitle>
                  <CardDescription className="text-gray-300">
                    Content by publication status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contentAnalytics.summary.content_by_status.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status.status === 'published' ? 'bg-green-500' :
                            status.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`} />
                          <span className="text-white capitalize">{status.status}</span>
                        </div>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {status.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Content */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Top Performing Content</CardTitle>
                <CardDescription className="text-gray-300">
                  Most viewed and engaged content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contentAnalytics.top_content.slice(0, 5).map((content) => (
                    <div key={content.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{content.title}</h4>
                        <p className="text-gray-400 text-sm">
                          {content.type} • by {content.author.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <div className="text-white font-medium">{content.metrics.views}</div>
                          <div className="text-gray-400">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-medium">{content.metrics.likes}</div>
                          <div className="text-gray-400">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-medium">{content.metrics.shares}</div>
                          <div className="text-gray-400">Shares</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && systemAnalytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">System Resources</CardTitle>
                  <CardDescription className="text-gray-300">
                    Current system resource usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar data={systemHealthChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">System Information</CardTitle>
                  <CardDescription className="text-gray-300">
                    Server and runtime details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Uptime</span>
                      <span className="text-white">
                        {formatUptime(systemAnalytics.system_health.uptime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Node.js Version</span>
                      <span className="text-white">{systemAnalytics.system_health.node_version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Memory Usage</span>
                      <span className="text-white">
                        {formatBytes(systemAnalytics.system_health.memory_usage.heapUsed)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Database Status</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          systemAnalytics.system_health.database.status === 'healthy'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`} />
                        <span className="text-white capitalize">
                          {systemAnalytics.system_health.database.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">DB Response Time</span>
                      <span className="text-white">
                        {systemAnalytics.system_health.database.response_time}ms
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error Statistics */}
            {systemAnalytics.summary.errors.total > 0 && (
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Error Statistics</CardTitle>
                  <CardDescription className="text-gray-300">
                    System errors in the last {timeRange} days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {systemAnalytics.summary.errors.by_type.map((error) => (
                      <div key={error.type} className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="text-xl font-bold text-red-400">{error.count}</div>
                        <div className="text-sm text-gray-300">{error.type}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}