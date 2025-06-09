'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TopUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  login_count: number
  last_login_at: string | null
  avatar_url?: string
}

interface TopUsersProps {
  className?: string
  limit?: number
}

export default function TopUsers({ className = '', limit = 5 }: TopUsersProps) {
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopUsers()
  }, [])

  const fetchTopUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/dashboard/top-users?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch top users data')
      }
      
      const data = await response.json()
      setTopUsers(data)
    } catch (error) {
      console.error('Error fetching top users:', error)
      setError('Failed to load top users data')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never'
    
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return date.toLocaleDateString()
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

  return (
    <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:account-star" className="h-5 w-5" />
            Top Active Users
          </div>
          <button
            onClick={fetchTopUsers}
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
              onClick={fetchTopUsers}
              className="mt-2 text-orange-500 hover:text-orange-400 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : topUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="mdi:account-group" className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-white/70 text-sm">No user data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-orange-500 w-6 text-center">
                    #{index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
                    <AvatarFallback className="bg-orange-500/20 text-orange-300 text-xs">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 ${getRoleColor(user.role)}`}
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/60 truncate">
                    {user.email}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-orange-400 mb-1">
                    <Icon icon="mdi:login" className="h-3 w-3" />
                    <span className="text-sm font-medium">{user.login_count}</span>
                  </div>
                  <p className="text-xs text-white/60">
                    {formatLastLogin(user.last_login_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}