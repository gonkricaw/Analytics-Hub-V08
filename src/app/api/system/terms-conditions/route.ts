import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const createTermsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  change_summary: z.string().optional(),
  effective_date: z.string().optional().transform((val) => val ? new Date(val) : undefined)
})

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

    // Check permissions (only admins can manage T&C)
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

    // Fetch all T&C versions
    const versions = await prisma.idbi_terms_versions.findMany({
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
        _count: {
          select: {
            user_acceptances: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      versions: versions.map(version => ({
        ...version,
        acceptance_count: version._count.user_acceptances
      }))
    })

  } catch (error) {
    console.error('Error fetching T&C versions:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch T&C versions' },
      { status: 500 }
    )
  }
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
    const validatedData = createTermsSchema.parse(body)

    // Generate version number
    const lastVersion = await prisma.idbi_terms_versions.findFirst({
      orderBy: {
        created_at: 'desc'
      },
      select: {
        version: true
      }
    })

    let newVersionNumber = '1.0'
    if (lastVersion) {
      const [major, minor] = lastVersion.version.split('.').map(Number)
      newVersionNumber = `${major}.${minor + 1}`
    }

    // Create new T&C version
    const newVersion = await prisma.$transaction(async (tx) => {
      const version = await tx.idbi_terms_versions.create({
        data: {
          version: newVersionNumber,
          title: validatedData.title,
          content: validatedData.content,
          change_summary: validatedData.change_summary,
          effective_date: validatedData.effective_date,
          created_by: user.id,
          approval_status: 'draft'
        },
        include: {
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      })

      // Log the creation
      await tx.idbi_audit_logs.create({
        data: {
          user_id: user.id,
          action: 'CREATE',
          resource: 'terms_version',
          resource_id: version.id,
          new_values: {
            version: version.version,
            title: version.title,
            approval_status: version.approval_status
          },
          ip_address: clientIP,
          user_agent: userAgent
        }
      })

      return version
    })

    return NextResponse.json({
      success: true,
      message: 'T&C version created successfully',
      version: newVersion
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating T&C version:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create T&C version' },
      { status: 500 }
    )
  }
}