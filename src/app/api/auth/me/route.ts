import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user details with role information
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        is_active: true,
        is_email_verified: true,
        must_change_password: true,
        terms_accepted: true,
        last_login: true,
        created_at: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            role_permissions: {
              select: {
                permission: {
                  select: {
                    id: true,
                    name: true,
                    resource: true,
                    action: true
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
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'USER_INACTIVE', message: 'User account is not active' },
        { status: 403 }
      )
    }

    // Format permissions
    const permissions = user.role.role_permissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      resource: rp.permission.resource,
      action: rp.permission.action
    }))

    // Return user data
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
      createdAt: user.created_at,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        permissions
      },
      sessionId: session.sessionId
    }

    return NextResponse.json({
      success: true,
      user: userData
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}