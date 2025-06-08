import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

interface AcceptTermsRequest {
  accepted: boolean
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get current user session
    const session = await getSession(request)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Please log in to continue' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: AcceptTermsRequest = await request.json()
    
    if (typeof body.accepted !== 'boolean') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid acceptance value' },
        { status: 400 }
      )
    }

    if (!body.accepted) {
      return NextResponse.json(
        { error: 'TERMS_NOT_ACCEPTED', message: 'Terms must be accepted to continue' },
        { status: 400 }
      )
    }

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

    // Check if terms are already accepted
    if (user.terms_accepted_at) {
      return NextResponse.json(
        { error: 'ALREADY_ACCEPTED', message: 'Terms have already been accepted' },
        { status: 400 }
      )
    }

    // Update user to mark terms as accepted
    await prisma.$transaction(async (tx) => {
      // Update user record
      await tx.idbi_users.update({
        where: { id: user.id },
        data: {
          terms_accepted_at: new Date(),
          terms_accepted_ip: clientIP,
          terms_accepted_user_agent: userAgent
        }
      })

      // Log the terms acceptance
      await tx.idbi_audit_logs.create({
        data: {
          user_id: user.id,
          action: 'TERMS_ACCEPTED',
          resource_type: 'AUTH',
          resource_id: user.id,
          ip_address: clientIP,
          user_agent: userAgent,
          details: {
            email: user.email,
            acceptedAt: new Date().toISOString(),
            termsVersion: '1.0' // You can track different versions of terms
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Terms accepted successfully'
    })

  } catch (error) {
    console.error('Accept terms API error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An internal server error occurred' },
      { status: 500 }
    )
  }
}