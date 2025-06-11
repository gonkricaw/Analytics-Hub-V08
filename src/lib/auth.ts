import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { User, UserSession } from '@/types'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

const alg = 'HS256'

export interface JWTPayload {
  userId: string
  email: string
  roleId: string
  sessionId: string
  iat?: number
  exp?: number
}

// JWT Token Management
export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Password Management
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Session Management
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<UserSession> {
  const sessionId = crypto.randomUUID()
  const token = await createToken({
    userId,
    email: '', // Will be filled from user data
    roleId: '', // Will be filled from user data
    sessionId
  })

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

  const session = await prisma.idbi_user_sessions.create({
    data: {
      id: sessionId,
      user_id: userId,
      token,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt
    }
  })

  return session as UserSession
}

export async function getSession(token: string): Promise<UserSession | null> {
  try {
    const payload = await verifyToken(token)
    if (!payload) return null

    const session = await prisma.idbi_user_sessions.findFirst({
      where: {
        id: payload.sessionId,
        expires_at: {
          gt: new Date()
        }
      }
    })

    return session as UserSession | null
  } catch (error) {
    console.error('Get session failed:', error)
    return null
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.idbi_user_sessions.delete({
    where: { id: sessionId }
  })
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.idbi_user_sessions.deleteMany({
    where: { user_id: userId }
  })
}

// Cookie Management
export function setAuthCookie(token: string): void {
  const cookieStore = cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 // 24 hours
  })
}

export function removeAuthCookie(): void {
  const cookieStore = cookies()
  cookieStore.delete('auth-token')
}

export function getAuthCookie(): string | undefined {
  const cookieStore = cookies()
  return cookieStore.get('auth-token')?.value
}

// User Authentication
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await prisma.idbi_users.findUnique({
      where: { email },
      include: {
        role: true
      }
    })

    if (!user || !user.password) {
      return null
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return null
    }

    // Check if user is active
    if (user.status !== 'active') {
      return null
    }

    return user as User
  } catch (error) {
    console.error('Authentication failed:', error)
    return null
  }
}

// Get current user from request
export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | undefined

    if (request) {
      // For middleware usage
      token = request.cookies.get('auth-token')?.value
    } else {
      // For server components
      token = getAuthCookie()
    }

    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload) return null

    const user = await prisma.idbi_users.findUnique({
      where: { id: payload.userId },
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

    return user as User | null
  } catch (error) {
    console.error('Get current user failed:', error)
    return null
  }
}

// Generate temporary password
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const allChars = uppercase + lowercase + numbers

  let password = ''
  
  // Ensure at least one character from each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  
  // Fill remaining 5 characters randomly
  for (let i = 3; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Password reset token management
export async function createPasswordResetToken(email: string): Promise<string | null> {
  try {
    const user = await prisma.idbi_users.findUnique({
      where: { email }
    })

    if (!user) return null

    // Delete any existing reset tokens for this user
    await prisma.idbi_password_resets.deleteMany({
      where: { email }
    })

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 120) // 120 minutes

    await prisma.idbi_password_resets.create({
      data: {
        id: crypto.randomUUID(),
        email,
        token,
        expires_at: expiresAt
      }
    })

    return token
  } catch (error) {
    console.error('Create password reset token failed:', error)
    return null
  }
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  try {
    const resetRecord = await prisma.idbi_password_resets.findFirst({
      where: {
        token,
        expires_at: {
          gt: new Date()
        },
        used_at: null
      }
    })

    return resetRecord?.email || null
  } catch (error) {
    console.error('Verify password reset token failed:', error)
    return null
  }
}

export async function usePasswordResetToken(token: string): Promise<void> {
  await prisma.idbi_password_resets.updateMany({
    where: { token },
    data: { used_at: new Date() }
  })
}

// Rate limiting helpers
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const windowStart = new Date()
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes)

  const attempts = await prisma.idbi_rate_limits.count({
    where: {
      identifier,
      action,
      created_at: {
        gte: windowStart
      }
    }
  })

  const allowed = attempts < maxAttempts
  const remainingAttempts = Math.max(0, maxAttempts - attempts)

  if (allowed) {
    // Record this attempt
    await prisma.idbi_rate_limits.create({
      data: {
        id: crypto.randomUUID(),
        identifier,
        action,
        ip_address: identifier // Assuming identifier is IP for now
      }
    })
  }

  return { allowed, remainingAttempts }
}

// IP Blacklist management
export async function isIPBlacklisted(ipAddress: string): Promise<boolean> {
  const blacklistEntry = await prisma.idbi_ip_blacklist.findFirst({
    where: {
      ip_address: ipAddress,
      is_active: true
    }
  })

  return !!blacklistEntry
}

export async function addToIPBlacklist(
  ipAddress: string,
  reason: string,
  blockedBy?: string
): Promise<void> {
  await prisma.idbi_ip_blacklist.create({
    data: {
      id: crypto.randomUUID(),
      ip_address: ipAddress,
      block_reason: reason,
      blocked_by: blockedBy,
      is_active: true
    }
  })
}

// NextAuth configuration for compatibility
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Use the custom login API
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          })

          const data = await response.json()

          if (response.ok && data.success) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: `${data.user.firstName} ${data.user.lastName}`,
              role: data.user.role,
              permissions: data.user.permissions
            }
          }

          // Return null if login failed
          return null
        } catch (error) {
          console.error('NextAuth authorize error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // Use custom auth session
      const customSession = await getSession()
      if (customSession) {
        session.user = customSession.user
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.permissions = user.permissions
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
  },
  secret: process.env.NEXTAUTH_SECRET,
}