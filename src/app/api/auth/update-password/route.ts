import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { changePasswordSchema } from '@/lib/validation'
import { hashPassword, verifyPassword, getSession } from '@/lib/auth'
import { rateLimit } from '@/lib/utils'

interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Rate limiting: 5 attempts per 15 minutes per IP
const updatePasswordLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
  maxAttempts: 5
})

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Rate limiting check
    const rateLimitResult = await updatePasswordLimiter.check(clientIP)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'RATE_LIMITED', 
          message: `Too many password update attempts. Try again in ${Math.ceil(rateLimitResult.resetTime / 60000)} minutes.` 
        },
        { status: 429 }
      )
    }

    // Get current user session
    const session = await getSession(request)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Please log in to continue' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body: UpdatePasswordRequest = await request.json()
    
    const validation = changePasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid input data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validation.data

    // Get user from database
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found or inactive' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash)
    if (!isCurrentPasswordValid) {
      // Log failed attempt
      await prisma.idbi_audit_logs.create({
        data: {
          user_id: user.id,
          action: 'PASSWORD_UPDATE_FAILED',
          resource_type: 'AUTH',
          resource_id: user.id,
          ip_address: clientIP,
          user_agent: userAgent,
          details: {
            reason: 'Invalid current password',
            email: user.email
          }
        }
      })

      return NextResponse.json(
        { error: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Check if new password is different from current
    const isSamePassword = await verifyPassword(newPassword, user.password_hash)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'SAME_PASSWORD', message: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password in database
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.idbi_users.update({
        where: { id: user.id },
        data: {
          password_hash: hashedNewPassword,
          is_temp_password: false, // Clear temporary password flag
          password_updated_at: new Date()
        }
      })

      // Invalidate all other sessions for this user (keep current session)
      await tx.idbi_user_sessions.updateMany({
        where: {
          user_id: user.id,
          id: { not: session.sessionId }, // Keep current session
          expires_at: {
            gt: new Date()
          }
        },
        data: {
          expires_at: new Date() // Expire all other sessions immediately
        }
      })

      // Log successful password update
      await tx.idbi_audit_logs.create({
        data: {
          user_id: user.id,
          action: 'PASSWORD_UPDATED',
          resource_type: 'AUTH',
          resource_id: user.id,
          ip_address: clientIP,
          user_agent: userAgent,
          details: {
            email: user.email,
            wasTemporary: user.is_temp_password,
            otherSessionsInvalidated: true
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Update password API error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An internal server error occurred' },
      { status: 500 }
    )
  }
}