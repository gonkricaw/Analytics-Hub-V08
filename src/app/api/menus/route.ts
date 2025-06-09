import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'

// GET /api/menus - Get all menus with hierarchy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionChecker = createPermissionChecker(session.user)
    if (!permissionChecker.hasPermission(PERMISSIONS.MENU_READ)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const menus = await prisma.idbi_menus.findMany({
      include: {
        menu_roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { order_index: 'asc' }
      ]
    })

    return NextResponse.json(menus)
  } catch (error) {
    console.error('Error fetching menus:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/menus - Create new menu
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionChecker = createPermissionChecker(session.user)
    if (!permissionChecker.hasPermission(PERMISSIONS.MENU_CREATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      slug,
      icon,
      path,
      parent_id,
      is_active,
      is_external,
      target,
      description,
      role_ids
    } = body

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingMenu = await prisma.idbi_menus.findUnique({
      where: { slug }
    })

    if (existingMenu) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }

    // Determine level based on parent
    let level = 1
    if (parent_id) {
      const parentMenu = await prisma.idbi_menus.findUnique({
        where: { id: parent_id }
      })
      
      if (!parentMenu) {
        return NextResponse.json(
          { error: 'Parent menu not found' },
          { status: 400 }
        )
      }
      
      level = parentMenu.level + 1
      
      // Check maximum depth (3 levels)
      if (level > 3) {
        return NextResponse.json(
          { error: 'Maximum menu depth (3 levels) exceeded' },
          { status: 400 }
        )
      }
    }

    // Get next order index
    const lastMenu = await prisma.idbi_menus.findFirst({
      where: {
        parent_id: parent_id || null,
        level
      },
      orderBy: { order_index: 'desc' }
    })

    const order_index = lastMenu ? lastMenu.order_index + 1 : 0

    // Create menu in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the menu
      const menu = await tx.idbi_menus.create({
        data: {
          title,
          slug,
          icon: icon || null,
          path: path || null,
          parent_id: parent_id || null,
          level,
          order_index,
          is_active: is_active ?? true,
          is_external: is_external ?? false,
          target: target || '_self',
          description: description || null,
          created_by: session.user.id
        }
      })

      // Create role associations if provided
      if (role_ids && role_ids.length > 0) {
        await tx.idbi_menu_roles.createMany({
          data: role_ids.map((role_id: string) => ({
            menu_id: menu.id,
            role_id
          }))
        })
      }

      return menu
    })

    // Fetch the created menu with relations
    const createdMenu = await prisma.idbi_menus.findUnique({
      where: { id: result.id },
      include: {
        menu_roles: {
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

    return NextResponse.json(createdMenu, { status: 201 })
  } catch (error) {
    console.error('Error creating menu:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}