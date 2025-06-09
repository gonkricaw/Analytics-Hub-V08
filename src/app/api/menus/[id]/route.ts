import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/menus/[id] - Get specific menu
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionChecker = createPermissionChecker(session.user)
    if (!permissionChecker.hasPermission(PERMISSIONS.MENU_READ)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const menu = await prisma.idbi_menus.findUnique({
      where: { id: params.id },
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
        },
        children: {
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
        }
      }
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/menus/[id] - Update menu
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionChecker = createPermissionChecker(session.user)
    if (!permissionChecker.hasPermission(PERMISSIONS.MENU_UPDATE)) {
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

    // Check if menu exists
    const existingMenu = await prisma.idbi_menus.findUnique({
      where: { id: params.id }
    })

    if (!existingMenu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists (excluding current menu)
    if (slug !== existingMenu.slug) {
      const slugExists = await prisma.idbi_menus.findFirst({
        where: {
          slug,
          id: { not: params.id }
        }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Determine level based on parent
    let level = 1
    if (parent_id) {
      // Prevent circular reference
      if (parent_id === params.id) {
        return NextResponse.json(
          { error: 'Menu cannot be its own parent' },
          { status: 400 }
        )
      }

      // Check if the new parent would create a circular reference
      const wouldCreateCircle = await checkCircularReference(params.id, parent_id)
      if (wouldCreateCircle) {
        return NextResponse.json(
          { error: 'This would create a circular reference' },
          { status: 400 }
        )
      }

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

    // Update menu in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the menu
      const menu = await tx.idbi_menus.update({
        where: { id: params.id },
        data: {
          title,
          slug,
          icon: icon || null,
          path: path || null,
          parent_id: parent_id || null,
          level,
          is_active: is_active ?? true,
          is_external: is_external ?? false,
          target: target || '_self',
          description: description || null,
          updated_by: session.user.id
        }
      })

      // Update role associations
      // First, delete existing associations
      await tx.idbi_menu_roles.deleteMany({
        where: { menu_id: params.id }
      })

      // Then create new associations if provided
      if (role_ids && role_ids.length > 0) {
        await tx.idbi_menu_roles.createMany({
          data: role_ids.map((role_id: string) => ({
            menu_id: params.id,
            role_id
          }))
        })
      }

      return menu
    })

    // Fetch the updated menu with relations
    const updatedMenu = await prisma.idbi_menus.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(updatedMenu)
  } catch (error) {
    console.error('Error updating menu:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/menus/[id] - Delete menu
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissionChecker = createPermissionChecker(session.user)
    if (!permissionChecker.hasPermission(PERMISSIONS.MENU_DELETE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if menu exists
    const menu = await prisma.idbi_menus.findUnique({
      where: { id: params.id },
      include: {
        children: true
      }
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    // Check if menu has children
    if (menu.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete menu with child items. Please delete or move child items first.' },
        { status: 400 }
      )
    }

    // Delete menu and its role associations (cascade will handle menu_roles)
    await prisma.idbi_menus.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Menu deleted successfully' })
  } catch (error) {
    console.error('Error deleting menu:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check for circular references
async function checkCircularReference(menuId: string, parentId: string): Promise<boolean> {
  let currentParentId = parentId
  const visited = new Set<string>()

  while (currentParentId) {
    if (visited.has(currentParentId)) {
      return true // Circular reference detected
    }
    
    if (currentParentId === menuId) {
      return true // Would create circular reference
    }

    visited.add(currentParentId)

    const parent = await prisma.idbi_menus.findUnique({
      where: { id: currentParentId },
      select: { parent_id: true }
    })

    currentParentId = parent?.parent_id || null
  }

  return false
}