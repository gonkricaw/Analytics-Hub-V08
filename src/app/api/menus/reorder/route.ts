import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'

// PUT /api/menus/reorder - Reorder menus
export async function PUT(request: NextRequest) {
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
    const { menus } = body

    if (!Array.isArray(menus)) {
      return NextResponse.json(
        { error: 'Menus must be an array' },
        { status: 400 }
      )
    }

    // Validate that all menus have id and order_index
    for (const menu of menus) {
      if (!menu.id || typeof menu.order_index !== 'number') {
        return NextResponse.json(
          { error: 'Each menu must have id and order_index' },
          { status: 400 }
        )
      }
    }

    // Update all menu orders in a transaction
    await prisma.$transaction(async (tx) => {
      for (const menu of menus) {
        await tx.idbi_menus.update({
          where: { id: menu.id },
          data: {
            order_index: menu.order_index,
            updated_by: session.user.id
          }
        })
      }
    })

    return NextResponse.json({ message: 'Menu order updated successfully' })
  } catch (error) {
    console.error('Error reordering menus:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}