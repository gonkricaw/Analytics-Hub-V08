import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { rateLimit } from '@/lib/utils'

// Rate limiting for permission operations
const permissionOperationsRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxAttempts: 30 // 30 operations per minute
})

// GET /api/permissions - List all permissions
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'

    // Rate limiting
    const rateLimitResult = await permissionOperationsRateLimit(clientIP)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
        { status: 429 }
      )
    }

    // Get user session
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current user with permissions
    const currentUser = await prisma.idbi_users.findUnique({
      where: { id: session.userId },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions - user needs to be able to read roles to see permissions
    const permissionChecker = createPermissionChecker(currentUser as any)
    if (!permissionChecker.hasPermission(PERMISSIONS.ROLE_READ)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const action = searchParams.get('action')
    const groupBy = searchParams.get('groupBy') // 'resource' or 'action'

    // Build where clause
    const whereClause: any = {}
    if (resource) {
      whereClause.resource = resource
    }
    if (action) {
      whereClause.action = action
    }

    // Get permissions
    const permissions = await prisma.idbi_permissions.findMany({
      where: whereClause,
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
        { name: 'asc' }
      ]
    })

    // Format response based on groupBy parameter
    let formattedResponse: any

    if (groupBy === 'resource') {
      // Group permissions by resource
      const groupedByResource = permissions.reduce((acc, permission) => {
        const resource = permission.resource
        if (!acc[resource]) {
          acc[resource] = []
        }
        acc[resource].push({
          id: permission.id,
          name: permission.name,
          action: permission.action,
          description: permission.description,
          createdAt: permission.created_at
        })
        return acc
      }, {} as Record<string, any[]>)

      formattedResponse = {
        permissions: groupedByResource,
        total: permissions.length,
        groupedBy: 'resource'
      }
    } else if (groupBy === 'action') {
      // Group permissions by action
      const groupedByAction = permissions.reduce((acc, permission) => {
        const action = permission.action
        if (!acc[action]) {
          acc[action] = []
        }
        acc[action].push({
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          description: permission.description,
          createdAt: permission.created_at
        })
        return acc
      }, {} as Record<string, any[]>)

      formattedResponse = {
        permissions: groupedByAction,
        total: permissions.length,
        groupedBy: 'action'
      }
    } else {
      // Return flat list
      formattedResponse = {
        permissions: permissions.map(permission => ({
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          createdAt: permission.created_at
        })),
        total: permissions.length
      }
    }

    // Get unique resources and actions for metadata
    const uniqueResources = [...new Set(permissions.map(p => p.resource))].sort()
    const uniqueActions = [...new Set(permissions.map(p => p.action))].sort()

    formattedResponse.metadata = {
      resources: uniqueResources,
      actions: uniqueActions,
      filters: {
        resource: resource || null,
        action: action || null
      }
    }

    // Log audit
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: currentUser.id,
        action: 'PERMISSIONS_LIST_VIEWED',
        resource_type: 'PERMISSION',
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          filters: {
            resource,
            action,
            groupBy
          },
          total_permissions: permissions.length
        }
      }
    })

    return NextResponse.json(formattedResponse)

  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}