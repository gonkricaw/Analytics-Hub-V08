import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createToken, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/utils'

// Rate limiting configuration
const loginRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per windowMs
  maxAttempts: 5 // Maximum 5 login attempts per 15 minutes
})

// Brute force protection configuration
const MAX_FAILED_ATTEMPTS = 30
const BLACKLIST_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

interface LoginRequest {
  email: string
  password: string
  remember?: boolean
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
      await loginRateLimit.check(clientIP)
    } catch {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Check if IP is blacklisted
    const blacklistedIP = await prisma.idbi_ip_blacklist.findFirst({
      where: {
        ip_address: clientIP,
        expires_at: {
          gt: new Date()
        }
      }
    })

    if (blacklistedIP) {
      return NextResponse.json(
        { error: 'IP_BLACKLISTED', message: 'Your IP address has been temporarily blocked due to too many failed login attempts.' },
        { status:403 }
      )
    }

    // Parse and validate request body
    const body: LoginRequest = await request.json()
    
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid input data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, password, remember } = validation.data

    // Find user by email
    const user = await prisma.idbi_users.findUnique({
      where: { email: email.toLowerCase() },
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

    // Track failed login attempt
    const trackFailedAttempt = async () => {
      // Log the failed attempt
      await prisma.idbi_audit_logs.create({
        data: {
          user_id: user?.id || null,
          action: 'LOGIN_FAILED',
          resource_type: 'AUTH',
          resource_id: null,
          ip_address: clientIP,
          user_agent: userAgent,
          details: {
            email,
            reason: user ? 'invalid_password' : 'user_not_found',
            ip: clientIP
          }
        }
      })

      // Count recent failed attempts from this IP
      const recentFailedAttempts = await prisma.idbi_audit_logs.count({
        where: {
          action: 'LOGIN_FAILED',
          ip_address: clientIP,
          created_at: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      })

      // Blacklist IP if too many failed attempts
      if (recentFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        await prisma.idbi_ip_blacklist.create({
          data: {
            ip_address: clientIP,
            reason: 'Excessive failed login attempts',
            expires_at: new Date(Date.now() + BLACKLIST_DURATION),
            created_by: 'SYSTEM'
          }
        })
      }
    }

    if (!user) {
      await trackFailedAttempt()
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.is_active) {
      await trackFailedAttempt()
      return NextResponse.json(
        { error: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      await trackFailedAttempt()
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    const session = await createSession(user.id, clientIP, userAgent)

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      sessionId: session.id
    })

    // Set secure cookie
    const cookieStore = cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days if remember, 1 day otherwise
      path: '/'
    })

    // Update last login
    await prisma.idbi_users.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        last_login_ip: clientIP
      }
    })

    // Log successful login
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: user.id,
        action: 'LOGIN_SUCCESS',
        resource_type: 'AUTH',
        resource_id: user.id,
        ip_address: clientIP,
        user_agent: userAgent,
        details: {
          email: user.email,
          sessionId: session.id,
          remember
        }
      }
    })

    // Check if user needs to update password (temporary password)
    const requiresPasswordUpdate = user.is_temp_password || false

    // Check if user needs to accept terms
    const requiresTermsAcceptance = !user.terms_accepted_at

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role.name,
        permissions: user.role.role_permissions.map(rp => rp.permission.name)
      },
      requiresPasswordUpdate,
      requiresTermsAcceptance
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An internal server error occurred' },
      { status: 500 }
    )
  }
}