import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const acceptTermsSchema = z.object({
  version_id: z.string().min(1, 'Version ID is required'),
  accepted: z.boolean().refine(val => val === true, 'Terms must be accepted')
})

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
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = acceptTermsSchema.parse(body)

    // Check if user exists and is active
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'User not found or inactive' },
        { status: 401 }
      )
    }

    // Check if T&C version exists and is published
    const termsVersion = await prisma.idbi_terms_versions.findUnique({
      where: { id: validatedData.version_id }
    })

    if (!termsVersion) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Terms & Conditions version not found' },
        { status: 404 }
      )
    }

    if (termsVersion.approval_status !== 'published') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Can only accept published terms' },
        { status: 403 }
      )
    }

    // Check if user has already accepted this version
    const existingAcceptance = await prisma.idbi_user_terms_acceptance.findFirst({
      where: {
        user_id: user.id,
        terms_version_id: validatedData.version_id
      }
    })

    if (existingAcceptance) {
      return NextResponse.json(
        { error: 'ALREADY_ACCEPTED', message: 'Terms already accepted for this version' },
        { status: 400 }
      )
    }

    // Record terms acceptance
    const acceptance = await prisma.$transaction(async (tx) => {
      // Create acceptance record
      const newAcceptance = await tx.idbi_user_terms_acceptance.create({
        data: {
          user_id: user.id,
          terms_version_id: validatedData.version_id,
          accepted_at: new Date(),
          ip_address: clientIP,
          user_agent: userAgent
        },
        include: {
          terms_version: {
            select: {
              id: true,
              version: true,
              title: true
            }
          }
        }
      })

      // Update user's terms acceptance status
      await tx.idbi_users.update({
        where: { id: user.id },
        data: {
          terms_accepted: true,
          terms_accepted_at: new Date(),
          terms_accepted_ip: clientIP,
          terms_accepted_user_agent: userAgent,
          current_terms_version: termsVersion.version
        }
      })

      // Log the acceptance
      await tx.idbi_audit_logs.create({
        data: {
          user_id: user.id,
          action: 'ACCEPT',
          resource: 'terms_conditions',
          resource_id: validatedData.version_id,
          new_values: {
            version: termsVersion.version,
            accepted_at: new Date().toISOString()
          },
          ip_address: clientIP,
          user_agent: userAgent
        }
      })

      return newAcceptance
    })

    return NextResponse.json({
      success: true,
      message: 'Terms & Conditions accepted successfully',
      acceptance
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error accepting terms:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to accept terms' },
      { status: 500 }
    )
  }
}

// Get current terms status for user
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession(request)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user with current terms status
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        terms_accepted: true,
        terms_accepted_at: true,
        current_terms_version: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User not found' },
        { status: 404 }
      )
    }

    // Get current published terms version
    const currentTerms = await prisma.idbi_terms_versions.findFirst({
      where: {
        approval_status: 'published'
      },
      orderBy: {
        published_at: 'desc'
      },
      select: {
        id: true,
        version: true,
        title: true,
        content: true,
        effective_date: true,
        published_at: true
      }
    })

    if (!currentTerms) {
      return NextResponse.json({
        success: true,
        requires_acceptance: false,
        message: 'No published terms available'
      })
    }

    // Check if user needs to accept current terms
    const requiresAcceptance = !user.terms_accepted || 
      user.current_terms_version !== currentTerms.version

    // Get user's acceptance history for current terms
    const userAcceptance = await prisma.idbi_user_terms_acceptance.findFirst({
      where: {
        user_id: user.id,
        terms_version_id: currentTerms.id
      },
      select: {
        accepted_at: true,
        ip_address: true
      }
    })

    return NextResponse.json({
      success: true,
      requires_acceptance: requiresAcceptance,
      current_terms: currentTerms,
      user_status: {
        terms_accepted: user.terms_accepted,
        terms_accepted_at: user.terms_accepted_at,
        current_version: user.current_terms_version,
        acceptance_details: userAcceptance
      }
    })

  } catch (error) {
    console.error('Error fetching terms status:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch terms status' },
      { status: 500 }
    )
  }
}