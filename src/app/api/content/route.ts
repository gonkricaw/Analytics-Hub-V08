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

// Content validation schema
const contentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  content_type: z.enum(['dashboard', 'report', 'widget', 'iframe', 'chart', 'table']),
  content_data: z.any().optional(),
  embed_url: z.string().url().optional(),
  is_public: z.boolean().default(false),
  category_ids: z.array(z.string()).optional().default([])
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

// GET /api/content - Fetch all content with filtering
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const content_type = searchParams.get('content_type')
    const category_id = searchParams.get('category_id')
    const is_public = searchParams.get('is_public')
    const is_active = searchParams.get('is_active')
    const created_by = searchParams.get('created_by')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (content_type) {
      where.content_type = content_type
    }
    
    if (is_public !== null) {
      where.is_public = is_public === 'true'
    }
    
    if (is_active !== null) {
      where.is_active = is_active === 'true'
    }
    
    if (created_by) {
      where.created_by = created_by
    }
    
    if (category_id) {
      where.categories = {
        some: {
          category_id: category_id
        }
      }
    }

    // Check if user can view all content
    const canViewAll = await hasPermission(PERMISSIONS.CONTENT_VIEW_ALL)
    if (!canViewAll) {
      // Only show public content or content created by user
      where.OR = [
        { is_public: true },
        { created_by: session.user.id }
      ]
    }

    const [content, total] = await Promise.all([
      prisma.idbi_content.findMany({
        where,
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
              role: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.idbi_content.count({ where })
    ])

    return NextResponse.json({
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Content fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// POST /api/content - Create new content
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    await limiter.check(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await createPermissionChecker(session.user.id)
    if (!await hasPermission(PERMISSIONS.CONTENT_CREATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = contentSchema.parse(body)

    // Encrypt embed URL if provided
    let encrypted_url = null
    if (validatedData.embed_url) {
      encrypted_url = encryptUrl(validatedData.embed_url)
    }

    // Create content in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create content
      const content = await tx.idbi_content.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          content_type: validatedData.content_type,
          content_data: validatedData.content_data,
          embed_url: validatedData.embed_url,
          encrypted_url,
          is_public: validatedData.is_public,
          created_by: session.user.id
        }
      })

      // Add categories if provided
      if (validatedData.category_ids && validatedData.category_ids.length > 0) {
        await tx.idbi_content_categories.createMany({
          data: validatedData.category_ids.map(category_id => ({
            content_id: content.id,
            category_id
          }))
        })
      }

      return content
    })

    // Audit log
    await auditLog({
      user_id: session.user.id,
      action: 'CREATE',
      resource: 'content',
      resource_id: result.id,
      details: {
        title: validatedData.title,
        content_type: validatedData.content_type
      }
    })

    // Fetch complete content with relations
    const content = await prisma.idbi_content.findUnique({
      where: { id: result.id },
      include: {
        creator: {
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

    return NextResponse.json(content, { status: 201 })

  } catch (error: any) {
    console.error('Content creation error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    )
  }
}