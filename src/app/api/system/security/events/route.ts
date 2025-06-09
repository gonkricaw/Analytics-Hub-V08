import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Query parameters validation schema
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  event_type: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  ip_address: z.string().optional(),
  user_id: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional()
})

// GET - Fetch security events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to view security data
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

    const hasPermission = user?.role?.permissions.some(
      rp => rp.permission.name === 'system.security.view' || rp.permission.name === 'system.admin'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    let validatedParams
    try {
      validatedParams = querySchema.parse(queryParams)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    const {
      page,
      limit,
      event_type,
      severity,
      ip_address,
      user_id,
      from_date,
      to_date
    } = validatedParams

    // Build where clause for filtering
    const whereClause: any = {}
    
    if (event_type) {
      whereClause.event_type = event_type
    }
    
    if (severity) {
      whereClause.severity = severity
    }
    
    if (ip_address) {
      whereClause.ip_address = {
        contains: ip_address
      }
    }
    
    if (user_id) {
      whereClause.user_id = user_id
    }
    
    if (from_date || to_date) {
      whereClause.created_at = {}
      if (from_date) {
        whereClause.created_at.gte = new Date(from_date)
      }
      if (to_date) {
        whereClause.created_at.lte = new Date(to_date)
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch security events with pagination
    const [events, totalCount] = await Promise.all([
      prisma.idbi_security_events.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.idbi_security_events.count({
        where: whereClause
      })
    ])

    // Transform events data
    const transformedEvents = events.map(event => ({
      id: event.id,
      event_type: event.event_type,
      ip_address: event.ip_address,
      user_id: event.user_id,
      user_email: event.user?.email,
      user_name: event.user ? `${event.user.first_name} ${event.user.last_name}` : null,
      severity: event.severity,
      details: event.details ? JSON.parse(event.details as string) : null,
      location: event.location ? JSON.parse(event.location as string) : null,
      created_at: event.created_at.toISOString()
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      events: transformedEvents,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: totalCount,
        limit,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      }
    })

  } catch (error) {
    console.error('Error fetching security events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new security event (for system use)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to manage security
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

    const hasPermission = user?.role?.permissions.some(
      rp => rp.permission.name === 'system.security.manage' || rp.permission.name === 'system.admin'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validation schema for creating security events
    const createEventSchema = z.object({
      event_type: z.string().min(1),
      ip_address: z.string().ip('Invalid IP address'),
      user_id: z.string().optional(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      details: z.record(z.any()).optional(),
      location: z.object({
        country: z.string(),
        city: z.string(),
        region: z.string()
      }).optional()
    })

    const validatedData = createEventSchema.parse(body)

    // Create security event
    const securityEvent = await prisma.idbi_security_events.create({
      data: {
        event_type: validatedData.event_type,
        ip_address: validatedData.ip_address,
        user_id: validatedData.user_id,
        severity: validatedData.severity,
        details: validatedData.details ? JSON.stringify(validatedData.details) : null,
        location: validatedData.location ? JSON.stringify(validatedData.location) : null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Security event created successfully',
      event: {
        id: securityEvent.id,
        event_type: securityEvent.event_type,
        ip_address: securityEvent.ip_address,
        severity: securityEvent.severity,
        created_at: securityEvent.created_at.toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating security event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}