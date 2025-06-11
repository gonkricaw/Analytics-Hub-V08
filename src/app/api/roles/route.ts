import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { createRoleSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for role operations
const roleOperationsRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxAttempts: 20 // 20 operations per minute
})

// GET /api/roles - List all roles with permissions
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'

    // Rate limiting
    const rateLimitResult = await roleOperationsRateLimit(clientIP)
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

    // Get user with permissions
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

    // Check permissions
    const permissionChecker = createPermissionChecker(currentUser as any)
    if (!permissionChecker.hasPermission(PERMISSIONS.ROLE_READ)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const includePermissions = searchParams.get('includePermissions') === 'true'
    const includeUserCount = searchParams.get('includeUserCount') === 'true'

    // Get roles
    const roles = await prisma.idbi_roles.findMany({
      include: {
        role_permissions: includePermissions ? {
          include: {
            permission: true
          }
        } : false,
        ...(includeUserCount ? {
          _count: {
            select: {
              users: true
            }
          }
        } : {})
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Format response
    const formattedRoles = roles.map(role => {
      const roleData: any = {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.is_active,
        createdAt: role.created_at,
        updatedAt: role.updated_at
      }

      if (includePermissions && role.role_permissions) {
        roleData.permissions = role.role_permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
          description: rp.permission.description
        }))
      }

      if (includeUserCount && '_count' in role) {
        roleData.userCount = (role as any)._count.users
      }

      return roleData
    })

    // Log audit
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: currentUser.id,
        action: 'ROLE_LIST_VIEWED',
        resource_type: 'ROLE',
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          include_permissions: includePermissions,
          include_user_count: includeUserCount,
          total_roles: roles.length
        }
      }
    })

    return NextResponse.json({ roles: formattedRoles })

  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST /api/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'

    // Rate limiting
    const rateLimitResult = await roleOperationsRateLimit(clientIP)
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

    // Check permissions
    const permissionChecker = createPermissionChecker(currentUser as any)
    if (!permissionChecker.hasPermission(PERMISSIONS.ROLE_CREATE)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createRoleSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR', 
          message: 'Invalid input data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { name, description, permissions, isActive } = validationResult.data

    // Check if role name already exists
    const existingRole = await prisma.idbi_roles.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'ROLE_EXISTS', message: 'Role with this name already exists' },
        { status: 409 }
      )
    }

    // Verify all permissions exist
    if (permissions && permissions.length > 0) {
      const existingPermissions = await prisma.idbi_permissions.findMany({
        where: { id: { in: permissions } }
      })

      if (existingPermissions.length !== permissions.length) {
        return NextResponse.json(
          { error: 'INVALID_PERMISSIONS', message: 'One or more permissions do not exist' },
          { status: 400 }
        )
      }
    }

    // Create role in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create role
      const newRole = await tx.idbi_roles.create({
        data: {
          name,
          description,
          is_active: isActive,
          created_by: currentUser.id
        }
      })

      // Create role-permission relationships
      if (permissions && permissions.length > 0) {
        await tx.idbi_role_permissions.createMany({
          data: permissions.map(permissionId => ({
            role_id: newRole.id,
            permission_id: permissionId
          }))
        })
      }

      // Get role with permissions
      const roleWithPermissions = await tx.idbi_roles.findUnique({
        where: { id: newRole.id },
        include: {
          role_permissions: {
            include: {
              permission: true
            }
          }
        }
      })

      return roleWithPermissions
    })

    // Log audit
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: currentUser.id,
        action: 'ROLE_CREATED',
        resource_type: 'ROLE',
        resource_id: result!.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          role_name: name,
          permissions_assigned: permissions?.length || 0
        }
      }
    })

    // Format response
    const roleData = {
      id: result!.id,
      name: result!.name,
      description: result!.description,
      isActive: result!.is_active,
      createdAt: result!.created_at,
      permissions: result!.role_permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description
      }))
    }

    return NextResponse.json({ role: roleData }, { status: 201 })

  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create role' },
      { status: 500 }
    )
  }
}