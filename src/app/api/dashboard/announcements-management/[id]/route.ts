import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for updating announcements
const updateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long').optional(),
  type: z.enum(['info', 'success', 'warning', 'error']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  target_roles: z.array(z.string()).optional(),
  action_url: z.string().url().optional().or(z.literal('')),
  action_text: z.string().max(50, 'Action text too long').optional(),
  starts_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional(),
  is_pinned: z.boolean().optional()
})

// GET - Fetch specific announcement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage announcements
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hasPermission = user.role?.permissions.some(
      rp => rp.permission.name === 'manage_announcements' || rp.permission.name === 'admin_access'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const announcement = await prisma.idbi_announcements.findUnique({
      where: {
        id: params.id,
        deleted_at: null
      },
      include: {
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Transform the response
    const transformedAnnouncement = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      is_active: announcement.is_active,
      is_pinned: announcement.is_pinned,
      priority: announcement.priority,
      target_roles: announcement.target_roles || [],
      action_url: announcement.action_url,
      action_text: announcement.action_text,
      starts_at: announcement.starts_at?.toISOString(),
      expires_at: announcement.expires_at?.toISOString(),
      created_at: announcement.created_at.toISOString(),
      created_by_user: announcement.created_by_user
    }

    return NextResponse.json(transformedAnnouncement)
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update announcement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage announcements
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hasPermission = user.role?.permissions.some(
      rp => rp.permission.name === 'manage_announcements' || rp.permission.name === 'admin_access'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if announcement exists
    const existingAnnouncement = await prisma.idbi_announcements.findUnique({
      where: {
        id: params.id,
        deleted_at: null
      }
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateAnnouncementSchema.parse(body)

    // Validate dates if provided
    if (validatedData.starts_at !== undefined && validatedData.expires_at !== undefined) {
      if (validatedData.starts_at && validatedData.expires_at) {
        const startsAt = new Date(validatedData.starts_at)
        const expiresAt = new Date(validatedData.expires_at)
        
        if (startsAt >= expiresAt) {
          return NextResponse.json(
            { error: 'Start date must be before expiration date' },
            { status: 400 }
          )
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    }

    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.target_roles !== undefined) updateData.target_roles = validatedData.target_roles
    if (validatedData.action_url !== undefined) updateData.action_url = validatedData.action_url || null
    if (validatedData.action_text !== undefined) updateData.action_text = validatedData.action_text || null
    if (validatedData.starts_at !== undefined) updateData.starts_at = validatedData.starts_at ? new Date(validatedData.starts_at) : null
    if (validatedData.expires_at !== undefined) updateData.expires_at = validatedData.expires_at ? new Date(validatedData.expires_at) : null
    if (validatedData.is_active !== undefined) updateData.is_active = validatedData.is_active
    if (validatedData.is_pinned !== undefined) updateData.is_pinned = validatedData.is_pinned

    // Update the announcement
    const announcement = await prisma.idbi_announcements.update({
      where: { id: params.id },
      data: updateData,
      include: {
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    })

    // Log the action
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: session.user.id,
        action: 'UPDATE',
        resource_type: 'announcement',
        resource_id: announcement.id,
        details: {
          title: announcement.title,
          changes: Object.keys(validatedData)
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date()
      }
    })

    // Transform the response
    const transformedAnnouncement = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      is_active: announcement.is_active,
      is_pinned: announcement.is_pinned,
      priority: announcement.priority,
      target_roles: announcement.target_roles || [],
      action_url: announcement.action_url,
      action_text: announcement.action_text,
      starts_at: announcement.starts_at?.toISOString(),
      expires_at: announcement.expires_at?.toISOString(),
      created_at: announcement.created_at.toISOString(),
      created_by_user: announcement.created_by_user
    }

    return NextResponse.json(transformedAnnouncement)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete announcement (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage announcements
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hasPermission = user.role?.permissions.some(
      rp => rp.permission.name === 'manage_announcements' || rp.permission.name === 'admin_access'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if announcement exists
    const existingAnnouncement = await prisma.idbi_announcements.findUnique({
      where: {
        id: params.id,
        deleted_at: null
      }
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Soft delete the announcement
    await prisma.idbi_announcements.update({
      where: { id: params.id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date()
      }
    })

    // Log the action
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: session.user.id,
        action: 'DELETE',
        resource_type: 'announcement',
        resource_id: params.id,
        details: {
          title: existingAnnouncement.title
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date()
      }
    })

    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}