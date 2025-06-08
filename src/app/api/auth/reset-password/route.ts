import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validation'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'

interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Parse and validate request body
    const body: ResetPasswordRequest = await request.json()
    
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid input data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { token, password } = validation.data

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find the password reset record
    const resetRecord = await prisma.idbi_password_resets.findFirst({
      where: {
        token_hash: hashedToken,
        is_used: false
      },
      include: {
        user: true
      }
    })

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (resetRecord.expires_at < new Date()) {
      // Mark token as used to prevent reuse
      await prisma.idbi_password_resets.update({
        where: { id: resetRecord.id },
        data: { is_used: true }
      })

      return NextResponse.json(
        { error: 'TOKEN_EXPIRED', message: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Check if user exists and is active
    if (!resetRecord.user || !resetRecord.user.is_active) {
      return NextResponse.json(
        { error: 'USER_INACTIVE', message: 'User account is not active' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password)

    // Start transaction to update password and mark token as used
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.idbi_users.update({
        where: { id: resetRecord.user_id },
        data: {
          password_hash: hashedPassword,
          is_temp_password: false, // Clear temporary password flag
          password_updated_at: new Date()
        }
      })

      // Mark reset token as used
      await tx.idbi_password_resets.update({
        where: { id: resetRecord.id },
        data: {
          is_used: true,
          used_at: new Date(),
          used_ip: clientIP,
          used_user_agent: userAgent
        }
      })

      // Invalidate all existing sessions for this user (force re-login)
      await tx.idbi_user_sessions.updateMany({
        where: {
          user_id: resetRecord.user_id,
          expires_at: {
            gt: new Date()
          }
        },
        data: {
          expires_at: new Date() // Expire all sessions immediately
        }
      })

      // Log the password reset completion
      await tx.idbi_audit_logs.create({
        data: {
          user_id: resetRecord.user_id,
          action: 'PASSWORD_RESET_COMPLETED',
          resource_type: 'AUTH',
          resource_id: resetRecord.user_id,
          ip_address: clientIP,
          user_agent: userAgent,
          details: {
            email: resetRecord.user.email,
            resetTokenId: resetRecord.id,
            sessionsInvalidated: true
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An internal server error occurred' },
      { status: 500 }
    )
  }
}