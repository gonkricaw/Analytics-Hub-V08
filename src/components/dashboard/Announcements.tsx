'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  is_active: boolean
  created_at: string
  created_by_name: string
  expires_at?: string
}

interface AnnouncementsProps {
  className?: string
  limit?: number
}

export default function Announcements({ className = '', limit = 3 }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/dashboard/announcements?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch announcements')
      }
      
      const data = await response.json()
      setAnnouncements(data)
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setError('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'success':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return 'mdi:information'
      case 'warning':
        return 'mdi:alert'
      case 'success':
        return 'mdi:check-circle'
      case 'error':
        return 'mdi:alert-circle'
      default:
        return 'mdi:bell'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return date.toLocaleDateString()
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:bullhorn" className="h-5 w-5" />
            Announcements
          </div>
          <button
            onClick={fetchAnnouncements}
            className="text-white/70 hover:text-white transition-colors"
            disabled={loading}
          >
            <Icon 
              icon="mdi:refresh" 
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
            />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="mdi:alert-circle" className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-white/70 text-sm">{error}</p>
            <button
              onClick={fetchAnnouncements}
              className="mt-2 text-orange-500 hover:text-orange-400 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="mdi:bullhorn-outline" className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-white/70 text-sm">No announcements available</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-3 rounded-lg bg-white/5 border border-white/10 ${
                  isExpired(announcement.expires_at) ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon 
                    icon={getTypeIcon(announcement.type)} 
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      announcement.type === 'info' ? 'text-blue-400' :
                      announcement.type === 'warning' ? 'text-yellow-400' :
                      announcement.type === 'success' ? 'text-green-400' :
                      announcement.type === 'error' ? 'text-red-400' :
                      'text-gray-400'
                    }`}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium text-white truncate">
                        {announcement.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0 ${getTypeColor(announcement.type)}`}
                      >
                        {announcement.type}
                      </Badge>
                      {isExpired(announcement.expires_at) && (
                        <Badge variant="outline" className="text-xs px-2 py-0 bg-gray-500/20 text-gray-300 border-gray-500/30">
                          Expired
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-white/80 mb-2">
                      {expandedId === announcement.id ? (
                        <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
                      ) : (
                        <p>{truncateContent(announcement.content)}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/60">
                        <span>By {announcement.created_by_name}</span>
                        <span className="mx-1">•</span>
                        <span>{formatDate(announcement.created_at)}</span>
                        {announcement.expires_at && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Expires {formatDate(announcement.expires_at)}</span>
                          </>
                        )}
                      </div>
                      
                      {announcement.content.length > 100 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(announcement.id)}
                          className="text-orange-400 hover:text-orange-300 h-auto p-0 text-xs"
                        >
                          {expandedId === announcement.id ? 'Show Less' : 'Show More'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}