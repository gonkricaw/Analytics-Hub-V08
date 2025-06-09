'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface OnlineUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  last_activity_at: string
  avatar_url?: string
  status: 'online' | 'away' | 'offline'
}

interface OnlineUsersProps {
  className?: string
  limit?: number
}

export default function OnlineUsers({ className = '', limit = 8 }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOnlineUsers()
    
    // Set up interval to refresh online users every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchOnlineUsers = async () => {
    try {
      setError(null)
      
      const response = await fetch(`/api/dashboard/online-users?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch online users data')
      }
      
      const data = await response.json()
      setOnlineUsers(data)
    } catch (error) {
      console.error('Error fetching online users:', error)
      setError('Failed to load online users data')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online'
      case 'away':
        return 'Away'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'manager':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'user':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatLastActivity = (lastActivity: string) => {
    const date = new Date(lastActivity)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const onlineCount = onlineUsers.filter(user => user.status === 'online').length
  const awayCount = onlineUsers.filter(user => user.status === 'away').length

  return (
    <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:account-circle" className="h-5 w-5" />
            Online Users
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">{onlineCount}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-xs">{awayCount}</span>
            </div>
            <button
              onClick={fetchOnlineUsers}
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
          <div className="flex items-center justify-center h-48">
            <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="mdi:alert-circle" className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-white/70 text-sm">{error}</p>
            <button
              onClick={fetchOnlineUsers}
              className="mt-2 text-orange-500 hover:text-orange-400 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="mdi:account-off" className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-white/70 text-sm">No users online</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {onlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
                    <AvatarFallback className="bg-orange-500/20 text-orange-300 text-xs">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0E0E44] ${getStatusColor(user.status)}`}
                    title={getStatusText(user.status)}
                  ></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1.5 py-0 ${getRoleColor(user.role)}`}
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/60 truncate">
                    {formatLastActivity(user.last_activity_at)}
                  </p>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 ${
                      user.status === 'online' 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : user.status === 'away'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    }`}
                  >
                    {getStatusText(user.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}