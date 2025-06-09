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

// Category update validation schema
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().optional(),
  is_active: z.boolean().optional()
})

// GET /api/categories/[id] - Fetch specific category
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
    if (!await hasPermission(PERMISSIONS.CATEGORY_READ)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const include_content = searchParams.get('include_content') === 'true'

    const category = await prisma.idbi_categories.findUnique({
      where: { id: params.id },
      include: include_content ? {
        content_categories: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                content_type: true,
                is_active: true,
                is_public: true,
                view_count: true,
                created_at: true,
                creator: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true
                  }
                }
              }
            }
          }
        }
      } : undefined
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Format response with content if requested
    const response = include_content ? {
      ...category,
      content: category.content_categories?.map(cc => cc.content) || [],
      content_categories: undefined
    } : category

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Category fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category
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
    if (!await hasPermission(PERMISSIONS.CATEGORY_UPDATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if category exists
    const existingCategory = await prisma.idbi_categories.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    // Check if new name conflicts with existing category (if name is being changed)
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.idbi_categories.findUnique({
        where: { name: validatedData.name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 409 }
        )
      }
    }

    // Update category
    const category = await prisma.idbi_categories.update({
      where: { id: params.id },
      data: validatedData
    })

    // Audit log
    await auditLog({
      user_id: session.user.id,
      action: 'UPDATE',
      resource: 'category',
      resource_id: params.id,
      details: {
        changes: validatedData
      }
    })

    return NextResponse.json(category)

  } catch (error: any) {
    console.error('Category update error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category
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
    if (!await hasPermission(PERMISSIONS.CATEGORY_DELETE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if category exists
    const existingCategory = await prisma.idbi_categories.findUnique({
      where: { id: params.id },
      include: {
        content_categories: true
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category has associated content
    if (existingCategory.content_categories.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category with associated content',
          content_count: existingCategory.content_categories.length
        },
        { status: 409 }
      )
    }

    // Delete category
    await prisma.idbi_categories.delete({
      where: { id: params.id }
    })

    // Audit log
    await auditLog({
      user_id: session.user.id,
      action: 'DELETE',
      resource: 'category',
      resource_id: params.id,
      details: {
        name: existingCategory.name
      }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })

  } catch (error: any) {
    console.error('Category deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}