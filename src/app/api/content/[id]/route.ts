import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'
import crypto from 'crypto'

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

// Content update validation schema
const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().optional(),
  content_type: z.enum(['dashboard', 'report', 'widget', 'iframe', 'chart', 'table']).optional(),
  content_data: z.any().optional(),
  embed_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
  is_public: z.boolean().optional(),
  category_ids: z.array(z.string()).optional()
})

// Encrypt URL function
function encryptUrl(url: string): string {
  const algorithm = 'aes-256-cbc'
  const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32)
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipher(algorithm, key)
  let encrypted = cipher.update(url, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return `${iv.toString('hex')}:${encrypted}`
}

// GET /api/content/[id] - Fetch specific content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    await limiter.check(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await createPermissionChecker(session.user.id)
    if (!await hasPermission(PERMISSIONS.CONTENT_READ)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const content = await prisma.idbi_content.findUnique({
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
        categories: {
          include: {
            category: true
          }
        },
        permissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Check if user can view this content
    const canViewAll = await hasPermission(PERMISSIONS.CONTENT_VIEW_ALL)
    const isOwner = content.created_by === session.user.id
    const isPublic = content.is_public

    if (!canViewAll && !isOwner && !isPublic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Increment view count if not owner
    if (!isOwner) {
      await prisma.idbi_content.update({
        where: { id: params.id },
        data: {
          view_count: { increment: 1 },
          last_viewed: new Date()
        }
      })
    }

    return NextResponse.json(content)

  } catch (error: any) {
    console.error('Content fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// PUT /api/content/[id] - Update content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    await limiter.check(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await createPermissionChecker(session.user.id)
    if (!await hasPermission(PERMISSIONS.CONTENT_UPDATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if content exists
    const existingContent = await prisma.idbi_content.findUnique({
      where: { id: params.id },
      include: {
        categories: true
      }
    })

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Check if user can edit this content
    const canManage = await hasPermission(PERMISSIONS.CONTENT_MANAGE)
    const isOwner = existingContent.created_by === session.user.id

    if (!canManage && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateContentSchema.parse(body)

    // Encrypt embed URL if provided
    let encrypted_url = existingContent.encrypted_url
    if (validatedData.embed_url) {
      encrypted_url = encryptUrl(validatedData.embed_url)
    }

    // Update content in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update content
      const content = await tx.idbi_content.update({
        where: { id: params.id },
        data: {
          ...validatedData,
          encrypted_url,
          updated_by: session.user.id
        }
      })

      // Update categories if provided
      if (validatedData.category_ids !== undefined) {
        // Remove existing categories
        await tx.idbi_content_categories.deleteMany({
          where: { content_id: params.id }
        })

        // Add new categories
        if (validatedData.category_ids.length > 0) {
          await tx.idbi_content_categories.createMany({
            data: validatedData.category_ids.map(category_id => ({
              content_id: params.id,
              category_id
            }))
          })
        }
      }

      return content
    })

    // Audit log
    await auditLog({
      user_id: session.user.id,
      action: 'UPDATE',
      resource: 'content',
      resource_id: params.id,
      details: {
        changes: validatedData
      }
    })

    // Fetch updated content with relations
    const content = await prisma.idbi_content.findUnique({
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
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(content)

  } catch (error: any) {
    console.error('Content update error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}

// DELETE /api/content/[id] - Delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    await limiter.check(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await createPermissionChecker(session.user.id)
    if (!await hasPermission(PERMISSIONS.CONTENT_DELETE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if content exists
    const existingContent = await prisma.idbi_content.findUnique({
      where: { id: params.id }
    })

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Check if user can delete this content
    const canManage = await hasPermission(PERMISSIONS.CONTENT_MANAGE)
    const isOwner = existingContent.created_by === session.user.id

    if (!canManage && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete content (cascade will handle related records)
    await prisma.idbi_content.delete({
      where: { id: params.id }
    })

    // Audit log
    await auditLog({
      user_id: session.user.id,
      action: 'DELETE',
      resource: 'content',
      resource_id: params.id,
      details: {
        title: existingContent.title,
        content_type: existingContent.content_type
      }
    })

    return NextResponse.json({ message: 'Content deleted successfully' })

  } catch (error: any) {
    console.error('Content deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}