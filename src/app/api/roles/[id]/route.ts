import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { updateRoleSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/utils'

// Rate limiting for role operations
const roleOperationsRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxAttempts: 20 // 20 operations per minute
})

// GET /api/roles/[id] - Get specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!permissionChecker.hasPermission(PERMISSIONS.ROLE_READ)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get role with permissions and user count
    const role = await prisma.idbi_roles.findUnique({
      where: { id: params.id },
      include: {
        role_permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'ROLE_NOT_FOUND', message: 'Role not found' },
        { status: 404 }
      )
    }

    // Format response
    const roleData = {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.is_active,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      userCount: role._count.users,
      permissions: role.role_permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description
      }))
    }

    // Log audit
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: currentUser.id,
        action: 'ROLE_VIEWED',
        resource_type: 'ROLE',
        resource_id: role.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ role: roleData })

  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PUT /api/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!permissionChecker.hasPermission(PERMISSIONS.ROLE_UPDATE)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Check if role exists
    const existingRole = await prisma.idbi_roles.findUnique({
      where: { id: params.id }
    })

    if (!existingRole) {
      return NextResponse.json(
        { error: 'ROLE_NOT_FOUND', message: 'Role not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateRoleSchema.safeParse(body)
    
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

    // Check if new name conflicts with existing role (if name is being changed)
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.idbi_roles.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: params.id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'ROLE_EXISTS', message: 'Role with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Verify all permissions exist (if permissions are being updated)
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

    // Update role in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update role basic info
      const updateData: any = {
        updated_at: new Date()
      }

      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (isActive !== undefined) updateData.is_active = isActive

      const updatedRole = await tx.idbi_roles.update({
        where: { id: params.id },
        data: updateData
      })

      // Update permissions if provided
      if (permissions !== undefined) {
        // Remove existing permissions
        await tx.idbi_role_permissions.deleteMany({
          where: { role_id: params.id }
        })

        // Add new permissions
        if (permissions.length > 0) {
          await tx.idbi_role_permissions.createMany({
            data: permissions.map(permissionId => ({
              role_id: params.id,
              permission_id: permissionId
            }))
          })
        }
      }

      // Get updated role with permissions
      const roleWithPermissions = await tx.idbi_roles.findUnique({
        where: { id: params.id },
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
        action: 'ROLE_UPDATED',
        resource_type: 'ROLE',
        resource_id: params.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          changes: validationResult.data,
          permissions_updated: permissions !== undefined
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
      updatedAt: result!.updated_at,
      permissions: result!.role_permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description
      }))
    }

    return NextResponse.json({ role: roleData })

  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!permissionChecker.hasPermission(PERMISSIONS.ROLE_DELETE)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Check if role exists and get user count
    const existingRole = await prisma.idbi_roles.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!existingRole) {
      return NextResponse.json(
        { error: 'ROLE_NOT_FOUND', message: 'Role not found' },
        { status: 404 }
      )
    }

    // Check if role has users assigned
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { 
          error: 'ROLE_IN_USE', 
          message: `Cannot delete role. ${existingRole._count.users} user(s) are assigned to this role.`,
          userCount: existingRole._count.users
        },
        { status: 409 }
      )
    }

    // Delete role in transaction
    await prisma.$transaction(async (tx) => {
      // Delete role permissions first
      await tx.idbi_role_permissions.deleteMany({
        where: { role_id: params.id }
      })

      // Delete the role
      await tx.idbi_roles.delete({
        where: { id: params.id }
      })
    })

    // Log audit
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: currentUser.id,
        action: 'ROLE_DELETED',
        resource_type: 'ROLE',
        resource_id: params.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          role_name: existingRole.name,
          had_users: existingRole._count.users
        }
      }
    })

    return NextResponse.json({ 
      message: 'Role deleted successfully',
      deletedRole: {
        id: existingRole.id,
        name: existingRole.name
      }
    })

  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete role' },
      { status: 500 }
    )
  }
}