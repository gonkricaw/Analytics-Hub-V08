import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createToken, createSession } from '@/lib/auth'
import { rateLimit } from '@/lib/utils'
import { sendWelcomeEmailFromTemplate, hasEmailTemplate } from '@/lib/email'
import { z } from 'zod'

// Rate limiting configuration
const registerRateLimit = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
  maxAttempts: 3 // Maximum 3 registration attempts per hour per IP
})

// Registration schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  invitationToken: z.string().min(1, 'Invitation token is required')
})

interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  invitationToken: string
}

export async function POST(request: NextRequest) {
  try {
    // Get client information
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Apply rate limiting
    const rateLimitResult = await registerRateLimit.check(clientIP)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'RATE_LIMIT_EXCEEDED', 
          message: `Too many registration attempts. Try again in ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds.`,
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body: RegisterRequest = await request.json()
    const validationResult = registerSchema.safeParse(body)
    
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

    const { email, password, firstName, lastName, invitationToken } = validationResult.data

    // Check if invitation exists and is valid
    const invitation = await prisma.idbi_user_invitations.findUnique({
      where: { invitation_token: invitationToken },
      include: {
        role: true
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'INVALID_INVITATION', message: 'Invalid or expired invitation token' },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (invitation.expires_at < new Date()) {
      return NextResponse.json(
        { error: 'INVITATION_EXPIRED', message: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation has already been accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'INVITATION_USED', message: 'Invitation has already been used' },
        { status: 400 }
      )
    }

    // Check if invitation email matches
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'EMAIL_MISMATCH', message: 'Email does not match invitation' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.idbi_users.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'USER_EXISTS', message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user and update invitation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.idbi_users.create({
        data: {
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role_id: invitation.role_id,
          is_active: true,
          is_email_verified: true, // Email is verified through invitation
          must_change_password: false,
          terms_accepted: false,
          created_by: invitation.invited_by
        },
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

      // Update invitation as accepted
      await tx.idbi_user_invitations.update({
        where: { id: invitation.id },
        data: {
          accepted_at: new Date()
        }
      })

      // Create session
      const token = await createToken({
        userId: newUser.id,
        email: newUser.email,
        roleId: newUser.role_id,
        sessionId: ''
      })

      const session = await createSession({
        userId: newUser.id,
        token,
        ipAddress: clientIP,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      })

      // Log registration
      await tx.idbi_audit_logs.create({
        data: {
          user_id: newUser.id,
          action: 'USER_REGISTERED',
          resource: 'USER',
          resource_id: newUser.id,
          ip_address: clientIP,
          user_agent: userAgent,
          new_values: {
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            roleId: newUser.role_id,
            invitationId: invitation.id
          }
        }
      })

      return { user: newUser, session, token }
    })

    // Send welcome email using template system
    try {
      await sendWelcomeEmailFromTemplate(result.user.email, {
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        email: result.user.email,
        loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@analyticshub.com',
        appName: 'Analytics Hub'
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail registration if email fails
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        fullName: `${result.user.first_name} ${result.user.last_name}`,
        role: {
          id: result.user.role.id,
          name: result.user.role.name,
          permissions: result.user.role.role_permissions.map(rp => ({
            id: rp.permission.id,
            name: rp.permission.name,
            resource: rp.permission.resource,
            action: rp.permission.action
          }))
        },
        isActive: result.user.is_active,
        isEmailVerified: result.user.is_email_verified,
        mustChangePassword: result.user.must_change_password,
        termsAccepted: result.user.terms_accepted
      }
    })

    // Set session cookie
    response.cookies.set('session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}