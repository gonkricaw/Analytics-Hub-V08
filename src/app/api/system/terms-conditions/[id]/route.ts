import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateTermsSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  change_summary: z.string().optional(),
  effective_date: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  approval_status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'published']).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const session = await getSession(request)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
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

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'User not found or inactive' },
        { status: 401 }
      )
    }

    const hasPermission = user.role.name === 'Super Admin' || 
      user.role.role_permissions.some(rp => 
        rp.permission.resource === 'system' && rp.permission.action === 'manage'
      )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch specific T&C version
    const version = await prisma.idbi_terms_versions.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        user_acceptances: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          },
          orderBy: {
            accepted_at: 'desc'
          }
        }
      }
    })

    if (!version) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'T&C version not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      version
    })

  } catch (error) {
    console.error('Error fetching T&C version:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch T&C version' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check permissions
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
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

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'User not found or inactive' },
        { status: 401 }
      )
    }

    const hasPermission = user.role.name === 'Super Admin' || 
      user.role.role_permissions.some(rp => 
        rp.permission.resource === 'system' && rp.permission.action === 'manage'
      )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateTermsSchema.parse(body)

    // Check if version exists
    const existingVersion = await prisma.idbi_terms_versions.findUnique({
      where: { id: params.id }
    })

    if (!existingVersion) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'T&C version not found' },
        { status: 404 }
      )
    }

    // Check if version can be edited (only draft and rejected versions)
    if (!['draft', 'rejected'].includes(existingVersion.approval_status)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Cannot edit approved or published versions' },
        { status: 403 }
      )
    }

    // Update T&C version
    const updatedVersion = await prisma.$transaction(async (tx) => {
      const version = await tx.idbi_terms_versions.update({
        where: { id: params.id },
        data: {
          ...validatedData,
          updated_by: user.id,
          updated_at: new Date(),
          // If approving, set approval details
          ...(validatedData.approval_status === 'approved' && {
            approved_by: user.id,
            approved_at: new Date()
          }),
          // If publishing, set publish details
          ...(validatedData.approval_status === 'published' && {
            published_at: new Date()
          })
        },
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          updater: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          approver: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      })

      // Log the update
      await tx.idbi_audit_logs.create({
        data: {
          user_id: user.id,
          action: 'UPDATE',
          resource: 'terms_version',
          resource_id: version.id,
          old_values: {
            title: existingVersion.title,
            approval_status: existingVersion.approval_status
          },
          new_values: {
            title: version.title,
            approval_status: version.approval_status
          },
          ip_address: clientIP,
          user_agent: userAgent
        }
      })

      // If publishing, update all users' current_terms_version
      if (validatedData.approval_status === 'published') {
        await tx.idbi_users.updateMany({
          data: {
            current_terms_version: version.version,
            terms_accepted: false, // Reset acceptance for new version
            terms_accepted_at: null
          }
        })
      }

      return version
    })

    return NextResponse.json({
      success: true,
      message: 'T&C version updated successfully',
      version: updatedVersion
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating T&C version:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update T&C version' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check permissions (only Super Admin can delete)
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      include: {
        role: true
      }
    })

    if (!user || !user.is_active || user.role.name !== 'Super Admin') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only Super Admin can delete T&C versions' },
        { status: 403 }
      )
    }

    // Check if version exists
    const existingVersion = await prisma.idbi_terms_versions.findUnique({
      where: { id: params.id }
    })

    if (!existingVersion) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'T&C version not found' },
        { status: 404 }
      )
    }

    // Check if version can be deleted (only draft versions)
    if (existingVersion.approval_status !== 'draft') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Can only delete draft versions' },
        { status: 403 }
      )
    }

    // Delete T&C version
    await prisma.$transaction(async (tx) => {
      await tx.idbi_terms_versions.delete({
        where: { id: params.id }
      })

      // Log the deletion
      await tx.idbi_audit_logs.create({
        data: {
          user_id: user.id,
          action: 'DELETE',
          resource: 'terms_version',
          resource_id: params.id,
          old_values: {
            version: existingVersion.version,
            title: existingVersion.title,
            approval_status: existingVersion.approval_status
          },
          ip_address: clientIP,
          user_agent: userAgent
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'T&C version deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting T&C version:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete T&C version' },
      { status: 500 }
    )
  }
}