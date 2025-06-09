import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS, ROLES } from '@/lib/constants'

// Permission checking middleware for API routes
export function withPermission(permission: string) {
  return async function middleware(request: NextRequest, handler: Function) {
    try {
      // Get current session
      const session = await getSession(request)
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Create permission checker
      const permissionChecker = createPermissionChecker(session.user)
      
      // Check if user has required permission
      if (!permissionChecker.hasPermission(permission)) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Call the actual handler
      return await handler(request)
    } catch (error) {
      console.error('Permission middleware error:', error)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Role checking middleware for API routes
export function withRole(roleName: string) {
  return async function middleware(request: NextRequest, handler: Function) {
    try {
      // Get current session
      const session = await getSession(request)
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Create permission checker
      const permissionChecker = createPermissionChecker(session.user)
      
      // Check if user has required role
      if (!permissionChecker.hasRole(roleName)) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Insufficient role privileges' },
          { status: 403 }
        )
      }

      // Call the actual handler
      return await handler(request)
    } catch (error) {
      console.error('Role middleware error:', error)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Admin role checking middleware
export function withAdmin() {
  return async function middleware(request: NextRequest, handler: Function) {
    try {
      // Get current session
      const session = await getSession(request)
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Create permission checker
      const permissionChecker = createPermissionChecker(session.user)
      
      // Check if user is admin
      if (!permissionChecker.isAdmin()) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Admin privileges required' },
          { status: 403 }
        )
      }

      // Call the actual handler
      return await handler(request)
    } catch (error) {
      console.error('Admin middleware error:', error)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Super admin role checking middleware
export function withSuperAdmin() {
  return async function middleware(request: NextRequest, handler: Function) {
    try {
      // Get current session
      const session = await getSession(request)
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Create permission checker
      const permissionChecker = createPermissionChecker(session.user)
      
      // Check if user is super admin
      if (!permissionChecker.isSuperAdmin()) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Super admin privileges required' },
          { status: 403 }
        )
      }

      // Call the actual handler
      return await handler(request)
    } catch (error) {
      console.error('Super admin middleware error:', error)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Multiple permissions checking middleware
export function withPermissions(permissions: string[]) {
  return async function middleware(request: NextRequest, handler: Function) {
    try {
      // Get current session
      const session = await getSession(request)
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Create permission checker
      const permissionChecker = createPermissionChecker(session.user)
      
      // Check if user has all required permissions
      const hasAllPermissions = permissions.every(permission => 
        permissionChecker.hasPermission(permission)
      )
      
      if (!hasAllPermissions) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Call the actual handler
      return await handler(request)
    } catch (error) {
      console.error('Permissions middleware error:', error)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Any permission checking middleware (user needs at least one of the permissions)
export function withAnyPermission(permissions: string[]) {
  return async function middleware(request: NextRequest, handler: Function) {
    try {
      // Get current session
      const session = await getSession(request)
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Create permission checker
      const permissionChecker = createPermissionChecker(session.user)
      
      // Check if user has any of the required permissions
      const hasAnyPermission = permissions.some(permission => 
        permissionChecker.hasPermission(permission)
      )
      
      if (!hasAnyPermission) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Call the actual handler
      return await handler(request)
    } catch (error) {
      console.error('Any permission middleware error:', error)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Resource ownership checking middleware
export function withResourceOwnership(getResourceOwnerId: (request: NextRequest) => Promise<string>) {
  return async function middleware(request: NextRequest, handler: Function) {
    try {
      // Get current session
      const session = await getSession(request)
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Get resource owner ID
      const resourceOwnerId = await getResourceOwnerId(request)
      
      // Create permission checker
      const permissionChecker = createPermissionChecker(session.user)
      
      // Check if user owns the resource or is admin
      if (!permissionChecker.ownsResource(resourceOwnerId) && !permissionChecker.isAdmin()) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Resource access denied' },
          { status: 403 }
        )
      }

      // Call the actual handler
      return await handler(request)
    } catch (error) {
      console.error('Resource ownership middleware error:', error)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}