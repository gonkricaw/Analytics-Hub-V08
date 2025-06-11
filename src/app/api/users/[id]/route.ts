import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { updateUserSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for user operations
const userOperationsRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxAttempts: 30 // 30 operations per minute
})

// GET /api/users/[id] - Get specific user
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
    const rateLimitResult = await userOperationsRateLimit(clientIP)
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
        { error: 'USER_NOT_FOUND', message: 'Current user not found' },
        { status: 404 }
      )
    }

    // Check permissions (can view own profile or has USER_READ permission)
    const permissionChecker = createPermissionChecker(currentUser as any)
    const canViewUser = params.id === currentUser.id || permissionChecker.hasPermission(PERMISSIONS.USER_READ)
    
    if (!canViewUser) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get target user
    const user = await prisma.idbi_users.findUnique({
      where: { id: params.id },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        sessions: {
          where: {
            expires_at: {
              gt: new Date()
            }
          },
          select: {
            id: true,
            ip_address: true,
            user_agent: true,
            created_at: true,
            expires_at: true
          }
        },
        _count: {
          select: {
            audit_logs: true,
            created_users: true,
            created_content: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Format permissions
    const permissions = user.role.role_permissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      resource: rp.permission.resource,
      action: rp.permission.action
    }))

    // Format response
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      isActive: user.is_active,
      isEmailVerified: user.is_email_verified,
      mustChangePassword: user.must_change_password,
      termsAccepted: user.terms_accepted,
      lastLogin: user.last_login,
      lastLoginIp: user.last_login_ip,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        permissions
      },
      activeSessions: user.sessions,
      stats: {
        auditLogCount: user._count.audit_logs,
        createdUsersCount: user._count.created_users,
        createdContentCount: user._count.created_content
      }
    }

    // Log audit (only if viewing another user)
    if (params.id !== currentUser.id) {
      await prisma.idbi_audit_logs.create({
        data: {
          user_id: currentUser.id,
          action: 'USER_VIEWED',
          resource_type: 'USER',
          resource_id: user.id,
          ip_address: clientIP,
          user_agent: request.headers.get('user-agent') || 'unknown'
        }
      })
    }

    return NextResponse.json({ user: userData })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
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
    const rateLimitResult = await userOperationsRateLimit(clientIP)
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
        { error: 'USER_NOT_FOUND', message: 'Current user not found' },
        { status: 404 }
      )
    }

    // Check permissions (can update own profile or has USER_UPDATE permission)
    const permissionChecker = createPermissionChecker(currentUser as any)
    const canUpdateUser = params.id === currentUser.id || permissionChecker.hasPermission(PERMISSIONS.USER_UPDATE)
    
    if (!canUpdateUser) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get target user
    const targetUser = await prisma.idbi_users.findUnique({
      where: { id: params.id },
      include: {
        role: true
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateUserSchema.safeParse(body)
    
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

    const updateData = validationResult.data

    // Check if email/username conflicts exist
    if (updateData.email || updateData.username) {
      const conflictWhere: any = {
        AND: [
          { id: { not: params.id } },
          {
            OR: [
              ...(updateData.email ? [{ email: updateData.email.toLowerCase() }] : []),
              ...(updateData.username ? [{ username: updateData.username }] : [])
            ]
          }
        ]
      }

      const conflictUser = await prisma.idbi_users.findFirst({
        where: conflictWhere
      })

      if (conflictUser) {
        return NextResponse.json(
          { 
            error: 'CONFLICT', 
            message: conflictUser.email === updateData.email?.toLowerCase()
              ? 'Email already in use by another user'
              : 'Username already in use by another user'
          },
          { status: 409 }
        )
      }
    }

    // Verify role exists if role_id is being updated
    if (updateData.role_id) {
      const role = await prisma.idbi_roles.findUnique({
        where: { id: updateData.role_id }
      })

      if (!role) {
        return NextResponse.json(
          { error: 'ROLE_NOT_FOUND', message: 'Invalid role specified' },
          { status: 400 }
        )
      }

      // Check if user can assign this role
      if (params.id !== currentUser.id && !permissionChecker.hasPermission(PERMISSIONS.ROLE_ASSIGN)) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Insufficient permissions to change user role' },
          { status: 403 }
        )
      }
    }

    // Prepare update data
    const prismaUpdateData: any = {}
    
    if (updateData.email) prismaUpdateData.email = updateData.email.toLowerCase()
    if (updateData.username !== undefined) prismaUpdateData.username = updateData.username
    if (updateData.first_name) prismaUpdateData.first_name = updateData.first_name
    if (updateData.last_name) prismaUpdateData.last_name = updateData.last_name
    if (updateData.role_id) prismaUpdateData.role_id = updateData.role_id
    if (updateData.is_active !== undefined) prismaUpdateData.is_active = updateData.is_active
    
    prismaUpdateData.updated_at = new Date()

    // Store old values for audit
    const oldValues = {
      email: targetUser.email,
      username: targetUser.username,
      first_name: targetUser.first_name,
      last_name: targetUser.last_name,
      role_id: targetUser.role_id,
      is_active: targetUser.is_active
    }

    // Update user
    const updatedUser = await prisma.idbi_users.update({
      where: { id: params.id },
      data: prismaUpdateData,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    // Log audit
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: currentUser.id,
        action: 'USER_UPDATED',
        resource_type: 'USER',
        resource_id: updatedUser.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
        old_values: oldValues,
        new_values: prismaUpdateData,
        details: {
          updated_by_self: params.id === currentUser.id,
          fields_changed: Object.keys(prismaUpdateData)
        }
      }
    })

    // Format response
    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      fullName: `${updatedUser.first_name} ${updatedUser.last_name}`,
      isActive: updatedUser.is_active,
      isEmailVerified: updatedUser.is_email_verified,
      mustChangePassword: updatedUser.must_change_password,
      termsAccepted: updatedUser.terms_accepted,
      role: updatedUser.role,
      updatedAt: updatedUser.updated_at
    }

    return NextResponse.json({ user: userData })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
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
    const rateLimitResult = await userOperationsRateLimit(clientIP)
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
        { error: 'USER_NOT_FOUND', message: 'Current user not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const permissionChecker = createPermissionChecker(currentUser as any)
    if (!permissionChecker.hasPermission(PERMISSIONS.USER_DELETE)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Prevent self-deletion
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Cannot delete your own account' },
        { status: 403 }
      )
    }

    // Get target user
    const targetUser = await prisma.idbi_users.findUnique({
      where: { id: params.id },
      include: {
        role: true,
        _count: {
          select: {
            created_users: true,
            created_content: true,
            audit_logs: true
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has created content or other users
    const hasCreatedContent = targetUser._count.created_users > 0 || targetUser._count.created_content > 0
    
    if (hasCreatedContent) {
      // Instead of hard delete, deactivate the user
      const deactivatedUser = await prisma.idbi_users.update({
        where: { id: params.id },
        data: {
          is_active: false,
          email: `deleted_${Date.now()}_${targetUser.email}`,
          username: targetUser.username ? `deleted_${Date.now()}_${targetUser.username}` : null,
          updated_at: new Date()
        }
      })

      // Log audit
      await prisma.idbi_audit_logs.create({
        data: {
          user_id: currentUser.id,
          action: 'USER_DEACTIVATED',
          resource_type: 'USER',
          resource_id: targetUser.id,
          ip_address: clientIP,
          user_agent: request.headers.get('user-agent') || 'unknown',
          details: {
            reason: 'User has created content, deactivated instead of deleted',
            original_email: targetUser.email,
            original_username: targetUser.username
          }
        }
      })

      return NextResponse.json({
        message: 'User deactivated successfully (user had created content)',
        deactivated: true
      })
    }

    // Hard delete user and related data
    await prisma.$transaction(async (tx) => {
      // Delete user sessions
      await tx.idbi_user_sessions.deleteMany({
        where: { user_id: params.id }
      })

      // Delete password reset tokens
      await tx.idbi_password_resets.deleteMany({
        where: { user_id: params.id }
      })

      // Delete invitations
      await tx.idbi_user_invitations.deleteMany({
        where: { email: targetUser.email }
      })

      // Delete the user
      await tx.idbi_users.delete({
        where: { id: params.id }
      })
    })

    // Log audit
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: currentUser.id,
        action: 'USER_DELETED',
        resource_type: 'USER',
        resource_id: targetUser.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          deleted_user: {
            email: targetUser.email,
            username: targetUser.username,
            role: targetUser.role.name
          }
        }
      }
    })

    return NextResponse.json({
      message: 'User deleted successfully',
      deleted: true
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete user' },
      { status: 500 }
    )
  }
}