import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { auditLog } from '@/lib/audit'
import { userProfileSchema } from '@/lib/validation'
import { z } from 'zod'

// Rate limiting: 30 requests per 15 minutes per IP
const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
})

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous'
    const { success } = await limiter.check(30, identifier)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user profile with role and permissions
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        username: true,
        phone: true,
        bio: true,
        avatar: true,
        is_active: true,
        email_verified: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        role: {
          select: {
            id: true,
            name: true,
            role_permissions: {
              select: {
                permission: {
                  select: {
                    id: true,
                    name: true,
                    resource: true,
                    action: true,
                    description: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch recent login history
    const loginHistory = await prisma.idbi_login_history.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true,
        ip_address: true,
        user_agent: true,
        location: true,
        created_at: true,
        success: true
      }
    })

    // Fetch recent activity logs
    const activityLogs = await prisma.idbi_audit_logs.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        details: true,
        created_at: true,
        ip_address: true
      }
    })

    // Transform data
    const profile = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      bio: user.bio,
      avatar: user.avatar,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      lastLoginAt: user.last_login_at?.toISOString(),
      createdAt: user.created_at.toISOString(),
      updatedAt: user.updated_at.toISOString(),
      role: {
        id: user.role.id,
        name: user.role.name,
        permissions: user.role.role_permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
          description: rp.permission.description
        }))
      },
      loginHistory: loginHistory.map(login => ({
        id: login.id,
        ipAddress: login.ip_address,
        userAgent: login.user_agent,
        location: login.location,
        timestamp: login.created_at.toISOString(),
        success: login.success
      })),
      activityLogs: activityLogs.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        timestamp: log.created_at.toISOString(),
        ipAddress: log.ip_address
      }))
    }

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: 'PROFILE_VIEWED',
      resource: 'USER_PROFILE',
      resourceId: user.id,
      details: 'User viewed their profile',
      ipAddress: request.ip
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous'
    const { success } = await limiter.check(30, identifier)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = userProfileSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.idbi_users.findUnique({
      where: { id: session.user.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check for username conflicts (if username is being updated)
    if (validatedData.username && validatedData.username !== existingUser.username) {
      const usernameExists = await prisma.idbi_users.findFirst({
        where: {
          username: validatedData.username,
          id: { not: session.user.id }
        }
      })

      if (usernameExists) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.idbi_users.update({
      where: { id: session.user.id },
      data: {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        username: validatedData.username || null,
        phone: validatedData.phone || null,
        bio: validatedData.bio || null,
        updated_at: new Date()
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        username: true,
        phone: true,
        bio: true,
        avatar: true,
        is_active: true,
        email_verified: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        role: {
          select: {
            id: true,
            name: true,
            role_permissions: {
              select: {
                permission: {
                  select: {
                    id: true,
                    name: true,
                    resource: true,
                    action: true,
                    description: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Transform response data
    const profile = {
      id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      email: updatedUser.email,
      username: updatedUser.username,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      isActive: updatedUser.is_active,
      emailVerified: updatedUser.email_verified,
      lastLoginAt: updatedUser.last_login_at?.toISOString(),
      createdAt: updatedUser.created_at.toISOString(),
      updatedAt: updatedUser.updated_at.toISOString(),
      role: {
        id: updatedUser.role.id,
        name: updatedUser.role.name,
        permissions: updatedUser.role.role_permissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
          description: rp.permission.description
        }))
      }
    }

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: 'PROFILE_UPDATED',
      resource: 'USER_PROFILE',
      resourceId: updatedUser.id,
      details: `Profile updated: ${Object.keys(validatedData).join(', ')}`,
      ipAddress: request.ip
    })

    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}