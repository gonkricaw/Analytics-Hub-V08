import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting for invitation validation
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per interval
})

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = request.ip ?? 'anonymous'
    const { success, limit, reset, remaining } = await limiter.check(10, identifier) // 10 requests per minute
    
    if (!success) {
      return NextResponse.json(
        { 
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.round((reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          }
        }
      )
    }

    // Get token from query parameters
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { 
          error: 'MISSING_TOKEN',
          message: 'Invitation token is required' 
        },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.idbi_user_invitations.findFirst({
      where: {
        token: token,
        status: 'pending'
      },
      include: {
        role: {
          select: {
            name: true
          }
        },
        invited_by: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { 
          error: 'INVALID_INVITATION',
          message: 'Invalid or expired invitation token' 
        },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date() > invitation.expires_at) {
      // Update invitation status to expired
      await prisma.idbi_user_invitations.update({
        where: { id: invitation.id },
        data: { status: 'expired' }
      })

      return NextResponse.json(
        { 
          error: 'INVITATION_EXPIRED',
          message: 'This invitation has expired. Please request a new invitation.' 
        },
        { status: 410 }
      )
    }

    // Check if invitation has already been used
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'INVITATION_USED',
          message: 'This invitation has already been used.' 
        },
        { status: 410 }
      )
    }

    // Return invitation data
    const invitationData = {
      email: invitation.email,
      first_name: invitation.first_name,
      last_name: invitation.last_name,
      role: {
        name: invitation.role.name
      },
      invited_by_name: `${invitation.invited_by.first_name} ${invitation.invited_by.last_name}`,
      expires_at: invitation.expires_at?.toISOString() || null
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Invitation is valid',
        invitation: invitationData
      },
      { 
        status: 200,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        }
      }
    )

  } catch (error) {
    console.error('Invitation validation error:', error)
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR',
        message: 'An internal error occurred while validating the invitation' 
      },
      { status: 500 }
    )
  }
}