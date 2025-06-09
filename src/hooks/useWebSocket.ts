'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { DashboardUpdate, UserStatusUpdate, NotificationData } from '@/lib/websocket'

interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

interface WebSocketState {
  connected: boolean
  connecting: boolean
  error: string | null
  onlineUsers: number
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { data: session, status } = useSession()
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000
  } = options

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    onlineUsers: 0
  })

  const [dashboardUpdates, setDashboardUpdates] = useState<DashboardUpdate[]>([])
  const [userStatusUpdates, setUserStatusUpdates] = useState<UserStatusUpdate[]>([])
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const connect = useCallback(() => {
    if (!session?.user || socketRef.current?.connected) {
      return
    }

    setState(prev => ({ ...prev, connecting: true, error: null }))

    try {
      const socket = io({
        path: '/api/socket',
        autoConnect: false,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      })

      socket.on('connect', () => {
        console.log('WebSocket connected')
        setState(prev => ({ 
          ...prev, 
          connected: true, 
          connecting: false, 
          error: null 
        }))
        reconnectAttemptsRef.current = 0
      })

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        setState(prev => ({ 
          ...prev, 
          connected: false, 
          connecting: false 
        }))
        
        // Auto-reconnect if not manually disconnected
        if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < reconnectAttempts) {
          scheduleReconnect()
        }
      })

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        setState(prev => ({ 
          ...prev, 
          connected: false, 
          connecting: false, 
          error: error.message 
        }))
        
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          scheduleReconnect()
        }
      })

      // Dashboard update events
      socket.on('dashboard:update', (update: DashboardUpdate) => {
        setDashboardUpdates(prev => [update, ...prev.slice(0, 49)]) // Keep last 50 updates
      })

      // User status events
      socket.on('user:status', (update: UserStatusUpdate) => {
        setUserStatusUpdates(prev => {
          const filtered = prev.filter(u => u.userId !== update.userId)
          return [update, ...filtered.slice(0, 99)] // Keep last 100 updates
        })
      })

      // Notification events
      socket.on('notification:receive', (notification: NotificationData) => {
        setNotifications(prev => [notification, ...prev.slice(0, 19)]) // Keep last 20 notifications
      })

      // Dashboard refresh response
      socket.on('dashboard:refresh:response', (data: { widgetType: string; timestamp: string }) => {
        console.log('Dashboard refresh response:', data)
      })

      socketRef.current = socket
      socket.connect()
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setState(prev => ({ 
        ...prev, 
        connecting: false, 
        error: 'Failed to create connection' 
      }))
    }
  }, [session, reconnectAttempts])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectAttemptsRef.current += 1
    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1) // Exponential backoff
    
    console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, delay)
  }, [connect, reconnectDelay])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    setState({
      connected: false,
      connecting: false,
      error: null,
      onlineUsers: 0
    })
  }, [])

  const sendUserActivity = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user:activity')
    }
  }, [])

  const refreshDashboardWidget = useCallback((widgetType: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('dashboard:refresh', widgetType)
    }
  }, [])

  const sendNotification = useCallback((notification: Omit<NotificationData, 'timestamp'>) => {
    if (socketRef.current?.connected) {
      const fullNotification: NotificationData = {
        ...notification,
        timestamp: new Date().toISOString()
      }
      socketRef.current.emit('notification:send', fullNotification)
    }
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const clearDashboardUpdates = useCallback(() => {
    setDashboardUpdates([])
  }, [])

  // Auto-connect when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user && autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [session, status, autoConnect, connect, disconnect])

  // Send periodic activity updates
  useEffect(() => {
    if (!state.connected) return

    const activityInterval = setInterval(() => {
      sendUserActivity()
    }, 30000) // Send activity every 30 seconds

    return () => clearInterval(activityInterval)
  }, [state.connected, sendUserActivity])

  // Track mouse/keyboard activity
  useEffect(() => {
    if (!state.connected) return

    const handleActivity = () => {
      sendUserActivity()
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [state.connected, sendUserActivity])

  return {
    // Connection state
    ...state,
    
    // Connection methods
    connect,
    disconnect,
    
    // Data
    dashboardUpdates,
    userStatusUpdates,
    notifications,
    
    // Actions
    sendUserActivity,
    refreshDashboardWidget,
    sendNotification,
    clearNotifications,
    clearDashboardUpdates,
    
    // Computed values
    hasUnreadNotifications: notifications.length > 0,
    latestNotification: notifications[0] || null,
    reconnectAttempts: reconnectAttemptsRef.current
  }
}