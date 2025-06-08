import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { auditLog } from '@/lib/audit'
import { changePasswordSchema } from '@/lib/validation'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Rate limiting: 5 password change attempts per 15 minutes per IP
const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
})

// PUT /api/profile/password - Change current user's password
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous'
    const { success } = await limiter.check(5, identifier)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many password change attempts. Please try again later.' },
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
    const validatedData = changePasswordSchema.parse(body)

    // Get current user with password
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
        is_active: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    )

    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await auditLog({
        userId: session.user.id,
        action: 'PASSWORD_CHANGE_FAILED',
        resource: 'USER_PROFILE',
        resourceId: user.id,
        details: 'Invalid current password provided',
        ipAddress: request.ip
      })

      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      validatedData.newPassword,
      user.password
    )

    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, saltRounds)

    // Update password
    await prisma.idbi_users.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword,
        updated_at: new Date()
      }
    })

    // Log successful password change
    await auditLog({
      userId: session.user.id,
      action: 'PASSWORD_CHANGED',
      resource: 'USER_PROFILE',
      resourceId: user.id,
      details: 'Password successfully changed',
      ipAddress: request.ip
    })

    // Log password change in login history for security tracking
    await prisma.idbi_login_history.create({
      data: {
        user_id: session.user.id,
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        success: true,
        action: 'PASSWORD_CHANGED',
        created_at: new Date()
      }
    })

    return NextResponse.json({
      message: 'Password changed successfully'
    })
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

    console.error('Password change error:', error)
    
    // Log error for security monitoring
    if (error instanceof Error) {
      try {
        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
          await auditLog({
            userId: session.user.id,
            action: 'PASSWORD_CHANGE_ERROR',
            resource: 'USER_PROFILE',
            resourceId: session.user.id,
            details: `Password change failed: ${error.message}`,
            ipAddress: request.ip
          })
        }
      } catch (auditError) {
        console.error('Audit log error:', auditError)
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}