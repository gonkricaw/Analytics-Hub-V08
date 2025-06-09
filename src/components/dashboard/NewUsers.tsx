'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@iconify/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface NewUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  created_at: string
  last_login_at: string | null
  avatar_url?: string
  is_active: boolean
  invitation_status: 'pending' | 'accepted' | 'expired'
}

interface NewUsersProps {
  className?: string
  limit?: number
  days?: number
}

export default function NewUsers({ className = '', limit = 5, days = 30 }: NewUsersProps) {
  const [newUsers, setNewUsers] = useState<NewUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNewUsers()
  }, [])

  const fetchNewUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/dashboard/new-users?limit=${limit}&days=${days}`)
      if (!response.ok) {
        throw new Error('Failed to fetch new users data')
      }
      
      const data = await response.json()
      setNewUsers(data)
    } catch (error) {
      console.error('Error fetching new users:', error)
      setError('Failed to load new users data')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) {
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
    
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'expired':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusText = (status: string, isActive: boolean, lastLogin: string | null) => {
    if (!isActive) return 'Inactive'
    if (lastLogin) return 'Active'
    
    switch (status) {
      case 'accepted':
        return 'Joined'
      case 'pending':
        return 'Invited'
      case 'expired':
        return 'Expired'
      default:
        return 'Unknown'
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

  const pendingCount = newUsers.filter(user => user.invitation_status === 'pending').length
  const acceptedCount = newUsers.filter(user => user.invitation_status === 'accepted').length

  return (
    <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:account-plus" className="h-5 w-5" />
            New Users ({days} days)
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">{acceptedCount}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-xs">{pendingCount}</span>
            </div>
            <button
              onClick={fetchNewUsers}
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
              onClick={fetchNewUsers}
              className="mt-2 text-orange-500 hover:text-orange-400 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : newUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="mdi:account-plus-outline" className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-white/70 text-sm">No new users in the last {days} days</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {newUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
                  <AvatarFallback className="bg-orange-500/20 text-orange-300 text-xs">
                    {getInitials(user.first_name, user.last_name)}
                  </AvatarFallback>
                </Avatar>
                
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
                  <p className="text-xs text-white/60 truncate mb-1">
                    {user.email}
                  </p>
                  <p className="text-xs text-white/50">
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 mb-1 ${getStatusColor(user.invitation_status, user.is_active)}`}
                  >
                    {getStatusText(user.invitation_status, user.is_active, user.last_login_at)}
                  </Badge>
                  {user.last_login_at && (
                    <p className="text-xs text-white/50">
                      Last login: {formatDate(user.last_login_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}