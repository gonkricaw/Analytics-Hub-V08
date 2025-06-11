import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { createUserSchema, updateUserSchema } from '@/lib/validation'
import { hashPassword } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

// Rate limiting for user operations
const userOperationsRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxAttempts: 30 // 30 operations per minute
})

// GET /api/users - List users with pagination and filtering
export async function GET(request: NextRequest) {
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
    if (!permissionChecker.hasPermission(PERMISSIONS.USER_READ)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = { name: role }
    }

    if (status === 'active') {
      where.is_active = true
    } else if (status === 'inactive') {
      where.is_active = false
    }

    // Get total count
    const total = await prisma.idbi_users.count({ where })

    // Get users
    const users = await prisma.idbi_users.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            sessions: true,
            audit_logs: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Format response
    const formattedUsers = users.map(user => ({
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
      role: user.role,
      sessionCount: user._count.sessions,
      auditLogCount: user._count.audit_logs
    }))

    // Log audit
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: currentUser.id,
        action: 'USER_LIST_VIEWED',
        resource_type: 'USER',
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          filters: { search, role, status },
          pagination: { page, limit },
          total_results: total
        }
      }
    })

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
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
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const permissionChecker = createPermissionChecker(currentUser as any)
    if (!permissionChecker.hasPermission(PERMISSIONS.USER_CREATE)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createUserSchema.safeParse(body)
    
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

    const { email, firstName, lastName, roleId, username, sendInvitation = true } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.idbi_users.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          ...(username ? [{ username }] : [])
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'USER_EXISTS', 
          message: existingUser.email === email.toLowerCase() 
            ? 'User with this email already exists'
            : 'User with this username already exists'
        },
        { status: 409 }
      )
    }

    // Verify role exists
    const role = await prisma.idbi_roles.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'ROLE_NOT_FOUND', message: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 12)
    const hashedPassword = await hashPassword(tempPassword)

    // Create user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.idbi_users.create({
        data: {
          email: email.toLowerCase(),
          username,
          first_name: firstName,
          last_name: lastName,
          password_hash: hashedPassword,
          role_id: roleId,
          is_active: true,
          is_email_verified: false,
          must_change_password: true,
          terms_accepted: false,
          created_by: currentUser.id
        },
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

      // Create invitation if requested
      let invitation = null
      if (sendInvitation) {
        const invitationToken = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        invitation = await tx.idbi_user_invitations.create({
          data: {
            email: email.toLowerCase(),
            token: invitationToken,
            role_id: roleId,
            invited_by: currentUser.id,
            expires_at: expiresAt,
            temp_password: tempPassword
          }
        })
      }

      return { user: newUser, invitation, tempPassword }
    })

    // Log audit
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: currentUser.id,
        action: 'USER_CREATED',
        resource_type: 'USER',
        resource_id: result.user.id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
        details: {
          created_user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role.name
          },
          invitation_sent: sendInvitation
        }
      }
    })

    // Format response
    const responseData: any = {
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        fullName: `${result.user.first_name} ${result.user.last_name}`,
        isActive: result.user.is_active,
        role: result.user.role,
        createdAt: result.user.created_at
      }
    }

    // Include invitation details if created
    if (result.invitation) {
      responseData.invitation = {
        token: result.invitation.token,
        expiresAt: result.invitation.expires_at,
        tempPassword: result.tempPassword
      }
    }

    return NextResponse.json(responseData, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create user' },
      { status: 500 }
    )
  }
}