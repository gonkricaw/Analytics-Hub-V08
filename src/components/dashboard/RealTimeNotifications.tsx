'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { NotificationData } from '@/lib/websocket'

interface RealTimeNotificationsProps {
  className?: string
  maxNotifications?: number
}

export default function RealTimeNotifications({ 
  className = '', 
  maxNotifications = 5 
}: RealTimeNotificationsProps) {
  const { 
    connected, 
    connecting, 
    notifications, 
    clearNotifications,
    hasUnreadNotifications,
    error
  } = useWebSocket()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Play notification sound
  useEffect(() => {
    if (notifications.length > 0 && soundEnabled && connected) {
      const latestNotification = notifications[0]
      
      // Create audio context for notification sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Different tones for different notification types
        switch (latestNotification.type) {
          case 'error':
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime) // A3
            break
          case 'warning':
            oscillator.frequency.setValueAtTime(330, audioContext.currentTime) // E4
            break
          case 'success':
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4
            break
          default:
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime) // C5
        }
        
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (error) {
        console.warn('Could not play notification sound:', error)
      }
    }
  }, [notifications.length, soundEnabled, connected])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'mdi:check-circle'
      case 'warning':
        return 'mdi:alert'
      case 'error':
        return 'mdi:alert-circle'
      default:
        return 'mdi:information'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      default:
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleTimeString()
  }

  const displayedNotifications = isExpanded 
    ? notifications 
    : notifications.slice(0, maxNotifications)

  return (
    <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon icon="mdi:bell" className="h-5 w-5" />
              {hasUnreadNotifications && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              )}
            </div>
            Real-time Notifications
            {notifications.length > 0 && (
              <Badge variant="outline" className="text-orange-400 border-orange-500/30">
                {notifications.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500 animate-pulse' : 
                connecting ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`}></div>
              <span className="text-xs text-white/60">
                {connected ? 'Live' : connecting ? 'Connecting' : 'Offline'}
              </span>
            </div>
            
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1 rounded transition-colors ${
                soundEnabled 
                  ? 'text-orange-400 hover:text-orange-300' 
                  : 'text-white/50 hover:text-white/70'
              }`}
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              <Icon 
                icon={soundEnabled ? 'mdi:volume-high' : 'mdi:volume-off'} 
                className="h-4 w-4" 
              />
            </button>
            
            {/* Clear Notifications */}
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="text-white/70 hover:text-white transition-colors"
                title="Clear all notifications"
              >
                <Icon icon="mdi:close" className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30 mb-4">
            <Icon icon="mdi:alert-circle" className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}
        
        {!connected && !connecting && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Icon icon="mdi:wifi-off" className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-white/70 text-sm">Real-time notifications unavailable</p>
            <p className="text-white/50 text-xs">Check your connection</p>
          </div>
        )}
        
        {connecting && (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:loading" className="h-6 w-6 animate-spin text-orange-500" />
              <span className="text-white/70 text-sm">Connecting to live updates...</span>
            </div>
          </div>
        )}
        
        {connected && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Icon icon="mdi:bell-outline" className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-white/70 text-sm">No notifications yet</p>
            <p className="text-white/50 text-xs">You'll see real-time updates here</p>
          </div>
        )}
        
        {connected && displayedNotifications.length > 0 && (
          <div className="space-y-3">
            {displayedNotifications.map((notification, index) => (
              <div
                key={`${notification.id}-${notification.timestamp}`}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                  index === 0 ? 'bg-white/10 border-orange-500/30 shadow-lg' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  getNotificationColor(notification.type)
                }`}>
                  <Icon 
                    icon={getNotificationIcon(notification.type)} 
                    className="h-4 w-4" 
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {notification.title}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1.5 py-0 ${getNotificationColor(notification.type)}`}
                    >
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/70 mb-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-white/50">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {notifications.length > maxNotifications && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="border-white/20 text-white hover:bg-orange-500/20 hover:border-orange-500"
                >
                  {isExpanded ? (
                    <>
                      <Icon icon="mdi:chevron-up" className="mr-1 h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:chevron-down" className="mr-1 h-4 w-4" />
                      Show {notifications.length - maxNotifications} More
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}