import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get current user session
    const session = await getSession(request)
    
    if (session && session.user && session.sessionId) {
      // Update session in database to mark as expired
      await prisma.$transaction(async (tx) => {
        // Expire the current session
        await tx.idbi_user_sessions.update({
          where: { id: session.sessionId },
          data: {
            expires_at: new Date(), // Expire immediately
            logout_at: new Date(),
            logout_ip: clientIP,
            logout_user_agent: userAgent
          }
        })

        // Log the logout action
        await tx.idbi_audit_logs.create({
          data: {
            user_id: session.user.id,
            action: 'USER_LOGOUT',
            resource_type: 'AUTH',
            resource_id: session.user.id,
            ip_address: clientIP,
            user_agent: userAgent,
            details: {
              email: session.user.email,
              sessionId: session.sessionId,
              logoutType: 'manual'
            }
          }
        })
      })
    }

    // Clear the session cookie
    const cookieStore = cookies()
    cookieStore.delete('session')

    // Create response with cleared cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Ensure cookie is cleared in response
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Logout API error:', error)
    
    // Even if there's an error, we should still clear the cookie
    const response = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An error occurred during logout' },
      { status: 500 }
    )

    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response
  }
}

// Also support GET method for logout links
export async function GET(request: NextRequest) {
  return POST(request)
}