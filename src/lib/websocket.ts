import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export interface SocketUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  permissions: string[]
}

export interface DashboardUpdate {
  type: 'stats' | 'activity' | 'users' | 'content' | 'notification'
  data: any
  timestamp: string
}

export interface UserStatusUpdate {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastActivity: string
}

export interface NotificationData {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  userId?: string // If null, it's a broadcast notification
  timestamp: string
}

// Store connected users and their socket IDs
const connectedUsers = new Map<string, { socketId: string; user: SocketUser; lastActivity: Date }>()

// Initialize Socket.IO server
export const initializeSocketIO = (server: NetServer) => {
  if (!server.io) {
    console.log('Initializing Socket.IO server...')
    
    const io = new SocketIOServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
          return next(new Error('Unauthorized'))
        }

        // Check if user has permission to access real-time data
        const canAccessRealtime = await hasPermission(
          session.user.id,
          PERMISSIONS.DASHBOARD_READ
        )

        if (!canAccessRealtime) {
          return next(new Error('Insufficient permissions'))
        }

        // Attach user data to socket
        socket.data.user = {
          id: session.user.id,
          email: session.user.email,
          first_name: session.user.first_name,
          last_name: session.user.last_name,
          role: session.user.role?.name || 'User',
          permissions: [] // Add user permissions here if needed
        }

        next()
      } catch (error) {
        console.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })

    io.on('connection', (socket) => {
      const user = socket.data.user as SocketUser
      console.log(`User ${user.email} connected with socket ${socket.id}`)

      // Store connected user
      connectedUsers.set(user.id, {
        socketId: socket.id,
        user,
        lastActivity: new Date()
      })

      // Join user to their personal room
      socket.join(`user:${user.id}`)
      
      // Join user to role-based room
      socket.join(`role:${user.role}`)

      // Broadcast user online status
      socket.broadcast.emit('user:status', {
        userId: user.id,
        status: 'online',
        lastActivity: new Date().toISOString()
      } as UserStatusUpdate)

      // Handle user activity updates
      socket.on('user:activity', () => {
        const userData = connectedUsers.get(user.id)
        if (userData) {
          userData.lastActivity = new Date()
          connectedUsers.set(user.id, userData)
        }
      })

      // Handle dashboard widget refresh requests
      socket.on('dashboard:refresh', (widgetType: string) => {
        console.log(`User ${user.email} requested refresh for ${widgetType}`)
        // Emit refresh event back to the user
        socket.emit('dashboard:refresh:response', { widgetType, timestamp: new Date().toISOString() })
      })

      // Handle real-time notifications
      socket.on('notification:send', (notification: NotificationData) => {
        if (notification.userId) {
          // Send to specific user
          io.to(`user:${notification.userId}`).emit('notification:receive', notification)
        } else {
          // Broadcast to all users
          io.emit('notification:receive', notification)
        }
      })

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User ${user.email} disconnected: ${reason}`)
        
        // Remove from connected users
        connectedUsers.delete(user.id)
        
        // Broadcast user offline status
        socket.broadcast.emit('user:status', {
          userId: user.id,
          status: 'offline',
          lastActivity: new Date().toISOString()
        } as UserStatusUpdate)
      })
    })

    server.io = io
  }
  
  return server.io
}

// Utility functions for broadcasting updates
export const broadcastDashboardUpdate = (io: SocketIOServer, update: DashboardUpdate) => {
  io.emit('dashboard:update', update)
}

export const broadcastToRole = (io: SocketIOServer, role: string, event: string, data: any) => {
  io.to(`role:${role}`).emit(event, data)
}

export const sendToUser = (io: SocketIOServer, userId: string, event: string, data: any) => {
  io.to(`user:${userId}`).emit(event, data)
}

export const getConnectedUsers = (): SocketUser[] => {
  return Array.from(connectedUsers.values()).map(userData => userData.user)
}

export const getOnlineUserCount = (): number => {
  return connectedUsers.size
}

export const getUserStatus = (userId: string): 'online' | 'away' | 'offline' => {
  const userData = connectedUsers.get(userId)
  if (!userData) return 'offline'
  
  const now = new Date()
  const lastActivity = userData.lastActivity
  const diffInMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60))
  
  if (diffInMinutes <= 5) return 'online'
  if (diffInMinutes <= 30) return 'away'
  return 'offline'
}

// Periodic cleanup of inactive connections
setInterval(() => {
  const now = new Date()
  const inactiveThreshold = 30 * 60 * 1000 // 30 minutes
  
  for (const [userId, userData] of connectedUsers.entries()) {
    const timeSinceActivity = now.getTime() - userData.lastActivity.getTime()
    
    if (timeSinceActivity > inactiveThreshold) {
      console.log(`Removing inactive user ${userData.user.email}`)
      connectedUsers.delete(userId)
    }
  }
}, 5 * 60 * 1000) // Run every 5 minutes