import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { sendPasswordResetEmailFromTemplate } from '@/lib/email'
import crypto from 'crypto'

// Rate limiting configuration
const forgotPasswordRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
  maxAttempts: 3 // Maximum 3 forgot password requests per 15 minutes
})

// Cooldown configuration
const COOLDOWN_DURATION = 30 * 1000 // 30 seconds
const TOKEN_EXPIRATION = 120 * 60 * 1000 // 120 minutes (2 hours)

interface ForgotPasswordRequest {
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check rate limiting
    try {
      await forgotPasswordRateLimit.check(clientIP)
    } catch {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many password reset requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body: ForgotPasswordRequest = await request.json()
    
    const validation = forgotPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid email address', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Find user by email (case insensitive)
    const user = await prisma.idbi_users.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success for security (don't reveal if email exists)
    // But only send email if user actually exists
    if (user && user.is_active) {
      // Check for recent password reset requests (cooldown)
      const recentRequest = await prisma.idbi_password_resets.findFirst({
        where: {
          user_id: user.id,
          created_at: {
            gte: new Date(Date.now() - COOLDOWN_DURATION)
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      if (recentRequest) {
        const timeSinceLastRequest = Date.now() - recentRequest.created_at.getTime()
        const remainingCooldown = COOLDOWN_DURATION - timeSinceLastRequest
        
        if (remainingCooldown > 0) {
          return NextResponse.json(
            { 
              error: 'COOLDOWN_ACTIVE', 
              message: 'Please wait before requesting another password reset.',
              remainingTime: remainingCooldown
            },
            { status: 429 }
          )
        }
      }

      // Generate secure reset token
      const resetToken = crypto.randomUUID()
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION)

      // Invalidate any existing reset tokens for this user
      await prisma.idbi_password_resets.updateMany({
        where: {
          user_id: user.id,
          expires_at: {
            gt: new Date()
          }
        },
        data: {
          is_used: true
        }
      })

      // Create new password reset record
      await prisma.idbi_password_resets.create({
        data: {
          user_id: user.id,
          token_hash: hashedToken,
          expires_at: expiresAt,
          ip_address: clientIP,
          user_agent: userAgent
        }
      })

      // Generate reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

      // Send password reset email using template system
      try {
        await sendPasswordResetEmailFromTemplate(user.email, {
          firstName: user.first_name,
          resetUrl,
          expirationTime: '2 hours',
          requestIP: clientIP,
          supportEmail: process.env.SUPPORT_EMAIL || 'support@analyticshub.com',
          appName: 'Analytics Hub'
        })
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        // Don't reveal email sending failure to user for security
      }

      // Log the password reset request
      await prisma.idbi_audit_logs.create({
        data: {
          user_id: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          resource_type: 'AUTH',
          resource_id: user.id,
          ip_address: clientIP,
          user_agent: userAgent,
          details: {
            email: user.email,
            tokenExpiration: expiresAt.toISOString()
          }
        }
      })
    } else {
      // Log attempt for non-existent or inactive user
      await prisma.idbi_audit_logs.create({
        data: {
          user_id: null,
          action: 'PASSWORD_RESET_ATTEMPTED',
          resource_type: 'AUTH',
          resource_id: null,
          ip_address: clientIP,
          user_agent: userAgent,
          details: {
            email,
            reason: user ? 'user_inactive' : 'user_not_found'
          }
        }
      })
    }

    // Always return success message for security
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent password reset instructions.'
    })

  } catch (error) {
    console.error('Forgot password API error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An internal server error occurred' },
      { status: 500 }
    )
  }
}