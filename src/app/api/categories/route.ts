import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

// Category validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().optional(),
  is_active: z.boolean().default(true)
})

// GET /api/categories - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    await limiter.check(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await createPermissionChecker(session.user.id)
    if (!await hasPermission(PERMISSIONS.CATEGORY_READ)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const is_active = searchParams.get('is_active')
    const include_counts = searchParams.get('include_counts') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (is_active !== null) {
      where.is_active = is_active === 'true'
    }

    const [categories, total] = await Promise.all([
      prisma.idbi_categories.findMany({
        where,
        include: include_counts ? {
          content_categories: {
            include: {
              content: {
                select: {
                  id: true,
                  is_active: true
                }
              }
            }
          }
        } : undefined,
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.idbi_categories.count({ where })
    ])

    // Add content counts if requested
    const categoriesWithCounts = include_counts ? categories.map(category => ({
      ...category,
      content_count: category.content_categories?.length || 0,
      active_content_count: category.content_categories?.filter(
        cc => cc.content.is_active
      ).length || 0,
      content_categories: undefined // Remove from response
    })) : categories

    return NextResponse.json({
      categories: categoriesWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    await limiter.check(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await createPermissionChecker(session.user.id)
    if (!await hasPermission(PERMISSIONS.CATEGORY_CREATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    // Check if category name already exists
    const existingCategory = await prisma.idbi_categories.findUnique({
      where: { name: validatedData.name }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      )
    }

    // Create category
    const category = await prisma.idbi_categories.create({
      data: validatedData
    })

    // Audit log
    await auditLog({
      user_id: session.user.id,
      action: 'CREATE',
      resource: 'category',
      resource_id: category.id,
      details: {
        name: validatedData.name
      }
    })

    return NextResponse.json(category, { status: 201 })

  } catch (error: any) {
    console.error('Category creation error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}