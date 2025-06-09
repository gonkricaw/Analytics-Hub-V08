'use client'

import React, { useState, useEffect } from 'react'
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
import Link from 'next/link'

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

interface AnalyticsData {
  userActivity: {
    totalActivity: number
    activityByDay: Array<{ date: string; count: number }>
    topUsers: Array<{
      user_id: string
      activity_count: number
      user_name: string
      user_role: string
    }>
  }
  contentAnalytics: {
    summary: {
      total_content: number
      content_by_type: Array<{ type: string; count: number }>
    }
    top_content: Array<{
      id: string
      title: string
      type: string
      metrics: {
        views: number
        likes: number
      }
    }>
  }
  systemHealth: {
    database: { status: string; response_time: number }
    server: {
      cpu_usage: number
      memory_usage: number
      disk_usage: number
    }
  }
}

interface AnalyticsOverviewProps {
  className?: string
}

export default function AnalyticsOverview({ className = '' }: AnalyticsOverviewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setError(null)
      
      const [userResponse, contentResponse, systemResponse] = await Promise.all([
        fetch('/api/analytics/user-activity?days=7'),
        fetch('/api/analytics/content?days=7'),
        fetch('/api/analytics/system?days=7')
      ])

      const [userData, contentData, systemData] = await Promise.all([
        userResponse.ok ? userResponse.json() : null,
        contentResponse.ok ? contentResponse.json() : null,
        systemResponse.ok ? systemResponse.json() : null
      ])

      setData({
        userActivity: userData || {
          totalActivity: 0,
          activityByDay: [],
          topUsers: []
        },
        contentAnalytics: contentData || {
          summary: {
            total_content: 0,
            content_by_type: []
          },
          top_content: []
        },
        systemHealth: systemData?.system_health || {
          database: { status: 'unknown', response_time: 0 },
          server: {
            cpu_usage: 0,
            memory_usage: 0,
            disk_usage: 0
          }
        }
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError('Failed to load analytics data')
      
      // Set sample data on error
      setData({
        userActivity: {
          totalActivity: 1250,
          activityByDay: [
            { date: '2024-01-07', count: 45 },
            { date: '2024-01-06', count: 52 },
            { date: '2024-01-05', count: 38 },
            { date: '2024-01-04', count: 61 },
            { date: '2024-01-03', count: 29 },
            { date: '2024-01-02', count: 43 },
            { date: '2024-01-01', count: 35 }
          ],
          topUsers: [
            {
              user_id: '1',
              activity_count: 89,
              user_name: 'John Smith',
              user_role: 'Admin'
            },
            {
              user_id: '2',
              activity_count: 76,
              user_name: 'Sarah Johnson',
              user_role: 'Manager'
            },
            {
              user_id: '3',
              activity_count: 64,
              user_name: 'Mike Davis',
              user_role: 'User'
            }
          ]
        },
        contentAnalytics: {
          summary: {
            total_content: 156,
            content_by_type: [
              { type: 'article', count: 45 },
              { type: 'video', count: 32 },
              { type: 'image', count: 28 },
              { type: 'document', count: 25 },
              { type: 'other', count: 26 }
            ]
          },
          top_content: [
            {
              id: '1',
              title: 'Getting Started with Analytics Hub',
              type: 'article',
              metrics: {
                views: 1245,
                likes: 89
              }
            },
            {
              id: '2',
              title: 'Advanced Dashboard Features',
              type: 'video',
              metrics: {
                views: 987,
                likes: 76
              }
            }
          ]
        },
        systemHealth: {
          database: { status: 'healthy', response_time: 12 },
          server: {
            cpu_usage: 15.6,
            memory_usage: 68.2,
            disk_usage: 45.8
          }
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
  }

  // Chart configurations
  const activityChartData = {
    labels: data?.userActivity.activityByDay.map(day => 
      new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Daily Activity',
        data: data?.userActivity.activityByDay.map(day => day.count) || [],
        borderColor: '#FF7A00',
        backgroundColor: 'rgba(255, 122, 0, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const contentTypeChartData = {
    labels: data?.contentAnalytics.summary.content_by_type.map(type => 
      type.type.charAt(0).toUpperCase() + type.type.slice(1)
    ) || [],
    datasets: [
      {
        data: data?.contentAnalytics.summary.content_by_type.map(type => type.count) || [],
        backgroundColor: [
          '#FF7A00',
          '#FF9A33',
          '#FFBA66',
          '#FFDA99',
          '#FFEACC'
        ],
        borderWidth: 2,
        borderColor: '#0E0E44',
      },
    ],
  }

  const systemHealthChartData = {
    labels: ['CPU', 'Memory', 'Disk'],
    datasets: [
      {
        label: 'Usage (%)',
        data: [
          data?.systemHealth.server.cpu_usage || 0,
          data?.systemHealth.server.memory_usage || 0,
          data?.systemHealth.server.disk_usage || 0
        ],
        backgroundColor: ['#FF7A00', '#FF9A33', '#FFBA66'],
        borderColor: '#0E0E44',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#FFFFFF',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#FFFFFF',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#FFFFFF',
          font: {
            size: 10
          },
          padding: 10
        }
      },
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#FFFFFF',
          font: {
            size: 10
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        ticks: {
          color: '#FFFFFF',
          font: {
            size: 10
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        max: 100
      }
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Analytics Overview
          </h2>
          <p className="text-gray-300">
            Key insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            className="bg-[#FF7A00] hover:bg-[#FF7A00]/80 text-white"
          >
            <Icon 
              icon={refreshing ? "mdi:loading" : "mdi:refresh"} 
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
            />
            Refresh
          </Button>
          <Link href="/analytics">
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Icon icon="mdi:chart-line" className="w-4 h-4 mr-2" />
              View Full Analytics
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Activity</p>
                <p className="text-2xl font-bold text-white">
                  {data?.userActivity.totalActivity.toLocaleString() || 0}
                </p>
              </div>
              <Icon icon="mdi:chart-line" className="w-8 h-8 text-[#FF7A00]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Content</p>
                <p className="text-2xl font-bold text-white">
                  {data?.contentAnalytics.summary.total_content || 0}
                </p>
              </div>
              <Icon icon="mdi:file-document" className="w-8 h-8 text-[#FF7A00]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">DB Response</p>
                <p className="text-2xl font-bold text-white">
                  {data?.systemHealth.database.response_time || 0}ms
                </p>
              </div>
              <Icon icon="mdi:database" className="w-8 h-8 text-[#FF7A00]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">System Health</p>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    data?.systemHealth.database.status === 'healthy'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`} />
                  <span className="text-white font-medium">
                    {data?.systemHealth.database.status === 'healthy' ? 'Healthy' : 'Issues'}
                  </span>
                </div>
              </div>
              <Icon icon="mdi:server" className="w-8 h-8 text-[#FF7A00]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Activity Trend</CardTitle>
            <CardDescription className="text-gray-300 text-sm">
              Last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <Line data={activityChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Content Distribution */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Content Types</CardTitle>
            <CardDescription className="text-gray-300 text-sm">
              Distribution by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <Doughnut data={contentTypeChartData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">System Resources</CardTitle>
            <CardDescription className="text-gray-300 text-sm">
              Current usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <Bar data={systemHealthChartData} options={barOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users and Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Top Active Users</CardTitle>
            <CardDescription className="text-gray-300">
              Most active users this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.userActivity.topUsers.slice(0, 3).map((user, index) => (
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
              )) || (
                <div className="text-center text-gray-400 py-4">
                  No user activity data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Content */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Top Content</CardTitle>
            <CardDescription className="text-gray-300">
              Most viewed content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.contentAnalytics.top_content.slice(0, 3).map((content, index) => (
                <div key={content.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{content.title}</p>
                      <p className="text-gray-400 text-sm capitalize">{content.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{content.metrics.views}</p>
                    <p className="text-gray-400 text-sm">views</p>
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-400 py-4">
                  No content data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}