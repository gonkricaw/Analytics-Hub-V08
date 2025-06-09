import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating announcements
const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  type: z.enum(['info', 'success', 'warning', 'error']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  target_roles: z.array(z.string()).optional().default([]),
  action_url: z.string().url().optional().or(z.literal('')),
  action_text: z.string().max(50, 'Action text too long').optional(),
  starts_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().default(true),
  is_pinned: z.boolean().default(false)
})

// GET - Fetch all announcements for management
export async function GET(request: NextRequest) {
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

    // Fetch all announcements with creator information
    const announcements = await prisma.idbi_announcements.findMany({
      where: {
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
      },
      orderBy: [
        { is_pinned: 'desc' },
        { priority: 'desc' },
        { created_at: 'desc' }
      ]
    })

    // Transform the data to match the expected format
    const transformedAnnouncements = announcements.map(announcement => ({
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
    }))

    return NextResponse.json(transformedAnnouncements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new announcement
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = createAnnouncementSchema.parse(body)

    // Validate dates if provided
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

    // Create the announcement
    const announcement = await prisma.idbi_announcements.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        priority: validatedData.priority,
        target_roles: validatedData.target_roles,
        action_url: validatedData.action_url || null,
        action_text: validatedData.action_text || null,
        starts_at: validatedData.starts_at ? new Date(validatedData.starts_at) : null,
        expires_at: validatedData.expires_at ? new Date(validatedData.expires_at) : null,
        is_active: validatedData.is_active,
        is_pinned: validatedData.is_pinned,
        created_by: session.user.id,
        created_at: new Date(),
        updated_at: new Date()
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

    // Log the action
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: session.user.id,
        action: 'CREATE',
        resource_type: 'announcement',
        resource_id: announcement.id,
        details: {
          title: announcement.title,
          type: announcement.type,
          priority: announcement.priority
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

    return NextResponse.json(transformedAnnouncement, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}