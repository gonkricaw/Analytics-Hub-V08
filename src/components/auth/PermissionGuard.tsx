'use client'

import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { User } from '@/types'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  requireAll?: boolean // For permissions array, require all or any
  fallback?: React.ReactNode
  inverse?: boolean // Show content when user DOESN'T have permission/role
}

// Component for conditional rendering based on permissions
export function PermissionGuard({
  children,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  fallback = null,
  inverse = false
}: PermissionGuardProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    user
  } = usePermissions()

  // If no user, don't show content (unless inverse is true)
  if (!user) {
    return inverse ? <>{children}</> : <>{fallback}</>
  }

  let hasAccess = true

  // Check single permission
  if (permission) {
    hasAccess = hasAccess && hasPermission(permission)
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAccess && hasAllPermissions(permissions)
    } else {
      hasAccess = hasAccess && hasAnyPermission(permissions)
    }
  }

  // Check single role
  if (role) {
    hasAccess = hasAccess && hasRole(role)
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    hasAccess = hasAccess && hasAnyRole(roles)
  }

  // Apply inverse logic if specified
  if (inverse) {
    hasAccess = !hasAccess
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Specific guards for common use cases
export function AdminGuard({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const { isAdmin } = usePermissions()
  return isAdmin() ? <>{children}</> : <>{fallback}</>
}

export function SuperAdminGuard({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const { isSuperAdmin } = usePermissions()
  return isSuperAdmin() ? <>{children}</> : <>{fallback}</>
}

export function UserManagementGuard({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const { canManageUsers } = usePermissions()
  return canManageUsers() ? <>{children}</> : <>{fallback}</>
}

// Resource ownership guard
interface ResourceGuardProps {
  children: React.ReactNode
  resourceOwnerId: string
  permission?: string
  fallback?: React.ReactNode
}

export function ResourceGuard({ children, resourceOwnerId, permission, fallback = null }: ResourceGuardProps) {
  const { ownsResource, hasPermission, isAdmin } = usePermissions()
  
  const hasAccess = ownsResource(resourceOwnerId) || 
                   isAdmin() || 
                   (permission && hasPermission(permission))
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// HOC for permission checking
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  fallback?: React.ReactNode
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

// HOC for role checking
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  role: string,
  fallback?: React.ReactNode
) {
  return function RoleWrappedComponent(props: P) {
    return (
      <PermissionGuard role={role} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

// HOC for admin checking
export function withAdmin<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function AdminWrappedComponent(props: P) {
    return (
      <AdminGuard fallback={fallback}>
        <Component {...props} />
      </AdminGuard>
    )
  }
}