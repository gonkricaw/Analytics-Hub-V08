'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface ContentMetric {
  id: string
  title: string
  type: string
  views: number
  likes: number
  shares: number
  comments: number
  created_at: string
  author_name: string
  status: string
}

interface ContentAnalyticsData {
  topContent: ContentMetric[]
  totalViews: number
  totalContent: number
  publishedContent: number
  draftContent: number
  viewsByType: { [key: string]: number }
  viewsOverTime: { date: string; views: number }[]
}

interface ContentAnalyticsProps {
  className?: string
  days?: number
}

export default function ContentAnalytics({ className = '', days = 7 }: ContentAnalyticsProps) {
  const [data, setData] = useState<ContentAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart')

  useEffect(() => {
    fetchContentAnalytics()
  }, [days])

  const fetchContentAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/dashboard/content-analytics?days=${days}`)
      if (!response.ok) {
        throw new Error('Failed to fetch content analytics')
      }
      
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching content analytics:', error)
      setError('Failed to load content analytics')
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dashboard':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'report':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'widget':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'chart':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'archived':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const chartData = data ? {
    labels: Object.keys(data.viewsByType),
    datasets: [
      {
        label: 'Views by Content Type',
        data: Object.values(data.viewsByType),
        backgroundColor: [
          'rgba(59, 130, 246, 0.3)',
          'rgba(34, 197, 94, 0.3)',
          'rgba(168, 85, 247, 0.3)',
          'rgba(249, 115, 22, 0.3)',
          'rgba(239, 68, 68, 0.3)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 1
      }
    ]
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 122, 0, 0.3)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  }

  return (
    <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:chart-line" className="h-5 w-5" />
            Content Analytics ({days} days)
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('chart')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'chart' 
                    ? 'bg-orange-500/20 text-orange-300' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon icon="mdi:chart-bar" className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-orange-500/20 text-orange-300' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon icon="mdi:format-list-bulleted" className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={fetchContentAnalytics}
              className="text-white/70 hover:text-white transition-colors"
              disabled={loading}
            >
              <Icon 
                icon="mdi:refresh" 
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
              />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Icon icon="mdi:alert-circle" className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-white/70 text-sm">{error}</p>
            <button
              onClick={fetchContentAnalytics}
              className="mt-2 text-orange-500 hover:text-orange-400 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Icon icon="mdi:chart-line-variant" className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-white/70 text-sm">No content analytics available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white">{formatNumber(data.totalViews)}</p>
                <p className="text-xs text-white/60">Total Views</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white">{data.totalContent}</p>
                <p className="text-xs text-white/60">Total Content</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{data.publishedContent}</p>
                <p className="text-xs text-white/60">Published</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{data.draftContent}</p>
                <p className="text-xs text-white/60">Drafts</p>
              </div>
            </div>

            {/* Chart or List View */}
            {viewMode === 'chart' && chartData ? (
              <div className="h-48">
                <Bar data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.topContent.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {content.title}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1.5 py-0 ${getTypeColor(content.type)}`}
                        >
                          {content.type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1.5 py-0 ${getStatusColor(content.status)}`}
                        >
                          {content.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-white/60 mb-1">
                        by {content.author_name}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-white/70">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:eye" className="h-3 w-3" />
                        <span>{formatNumber(content.views)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:heart" className="h-3 w-3" />
                        <span>{formatNumber(content.likes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:share" className="h-3 w-3" />
                        <span>{formatNumber(content.shares)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}