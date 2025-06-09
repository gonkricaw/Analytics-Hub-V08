'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { createPermissionChecker } from '@/lib/permissions'
import { User } from '@/types'
import { ROLES } from '@/lib/constants'

// Hook for checking permissions
export function usePermissions() {
  const { data: session } = useSession()
  
  const permissionChecker = useMemo(() => {
    return createPermissionChecker(session?.user || null)
  }, [session?.user])

  return {
    // Check if user has specific permission
    hasPermission: (permission: string): boolean => {
      return permissionChecker.hasPermission(permission)
    },

    // Check if user has any of the specified permissions
    hasAnyPermission: (permissions: string[]): boolean => {
      return permissionChecker.hasAnyPermissions(permissions)
    },

    // Check if user has all specified permissions
    hasAllPermissions: (permissions: string[]): boolean => {
      return permissions.every(permission => permissionChecker.hasPermission(permission))
    },

    // Check if user has specific role
    hasRole: (role: string): boolean => {
      return permissionChecker.hasRole(role)
    },

    // Check if user has any of the specified roles
    hasAnyRole: (roles: string[]): boolean => {
      return permissionChecker.hasAnyRole(roles)
    },

    // Check if user is admin
    isAdmin: (): boolean => {
      return permissionChecker.isAdmin()
    },

    // Check if user is super admin
    isSuperAdmin: (): boolean => {
      return permissionChecker.isSuperAdmin()
    },

    // Check if user can perform action on resource
    canPerformAction: (resource: string, action: string): boolean => {
      return permissionChecker.canPerformAction(resource, action)
    },

    // Check if user owns resource
    ownsResource: (resourceOwnerId: string): boolean => {
      return permissionChecker.ownsResource(resourceOwnerId)
    },

    // Check if user can access resource (owns it or has permission)
    canAccessResource: (resourceOwnerId: string, permission: string): boolean => {
      return permissionChecker.canAccessResource(resourceOwnerId, permission)
    },

    // Check if user can manage other users
    canManageUsers: (): boolean => {
      return permissionChecker.canManageUsers()
    },

    // Get current user
    user: session?.user || null,

    // Get user permissions
    permissions: permissionChecker.getPermissions(),

    // Get user role
    role: session?.user?.role || null
  }
}

// Hook for specific permission checking
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = usePermissions()
  return hasPermission(permission)
}

// Hook for role checking
export function useHasRole(role: string): boolean {
  const { hasRole } = usePermissions()
  return hasRole(role)
}

// Hook for admin checking
export function useIsAdmin(): boolean {
  const { isAdmin } = usePermissions()
  return isAdmin()
}

// Hook for super admin checking
export function useIsSuperAdmin(): boolean {
  const { isSuperAdmin } = usePermissions()
  return isSuperAdmin()
}

// Hook for multiple permissions checking
export function useHasAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission } = usePermissions()
  return hasAnyPermission(permissions)
}

// Hook for all permissions checking
export function useHasAllPermissions(permissions: string[]): boolean {
  const { hasAllPermissions } = usePermissions()
  return hasAllPermissions(permissions)
}

// Hook for resource access checking
export function useCanAccessResource(resourceOwnerId: string, permission: string): boolean {
  const { canAccessResource } = usePermissions()
  return canAccessResource(resourceOwnerId, permission)
}

// Hook for user management checking
export function useCanManageUsers(): boolean {
  const { canManageUsers } = usePermissions()
  return canManageUsers()
}