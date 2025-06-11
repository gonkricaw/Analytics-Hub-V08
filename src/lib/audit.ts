import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export interface AuditLogData {
  user_id?: string
  action: string
  resource?: string
  resource_id?: string
  old_values?: any
  new_values?: any
  details?: any
  ip_address?: string
  user_agent?: string
}

/**
 * Create an audit log entry
 */
export async function auditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: data.user_id,
        action: data.action,
        resource: data.resource,
        resource_id: data.resource_id,
        old_values: data.old_values ? JSON.stringify(data.old_values) : null,
        new_values: data.new_values ? JSON.stringify(data.new_values) : null,
        details: data.details ? JSON.stringify(data.details) : null,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        created_at: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Create an audit log entry from a Next.js request
 */
export async function auditLogFromRequest(
  request: NextRequest,
  data: Omit<AuditLogData, 'ip_address' | 'user_agent'>
): Promise<void> {
  const ip_address = getClientIP(request)
  const user_agent = request.headers.get('user-agent') || undefined

  await auditLog({
    ...data,
    ip_address,
    user_agent
  })
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to a default IP if none found
  return '127.0.0.1'
}

/**
 * Audit log actions constants
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  // User management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ACTIVATE: 'USER_ACTIVATE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',
  
  // Content management
  CONTENT_CREATE: 'CONTENT_CREATE',
  CONTENT_UPDATE: 'CONTENT_UPDATE',
  CONTENT_DELETE: 'CONTENT_DELETE',
  CONTENT_PUBLISH: 'CONTENT_PUBLISH',
  CONTENT_UNPUBLISH: 'CONTENT_UNPUBLISH',
  
  // File management
  UPLOAD: 'UPLOAD',
  FILE_DELETE: 'FILE_DELETE',
  FILE_UPDATE: 'FILE_UPDATE',
  
  // System configuration
  CONFIG_UPDATE: 'CONFIG_UPDATE',
  SECURITY_UPDATE: 'SECURITY_UPDATE',
  
  // Role and permission management
  ROLE_CREATE: 'ROLE_CREATE',
  ROLE_UPDATE: 'ROLE_UPDATE',
  ROLE_DELETE: 'ROLE_DELETE',
  PERMISSION_GRANT: 'PERMISSION_GRANT',
  PERMISSION_REVOKE: 'PERMISSION_REVOKE',
  
  // Other actions
  VIEW: 'VIEW',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT'
} as const

/**
 * Audit log resources constants
 */
export const AUDIT_RESOURCES = {
  USER: 'user',
  CONTENT: 'content',
  FILE: 'file',
  ROLE: 'role',
  PERMISSION: 'permission',
  SYSTEM_CONFIG: 'system_config',
  SECURITY_SETTINGS: 'security_settings',
  CATEGORY: 'category',
  ANNOUNCEMENT: 'announcement',
  NOTIFICATION: 'notification'
} as const