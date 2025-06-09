import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auditLog } from '@/lib/audit'

// Validation schema for adding IP to blacklist
const addIPSchema = z.object({
  ip_address: z.string().ip('Invalid IP address format'),
  reason: z.string().optional(),
  is_permanent: z.boolean().default(false),
  duration_hours: z.number().min(1).max(8760).optional() // Max 1 year
})

// GET - Fetch IP blacklist
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

    // Fetch IP blacklist entries
    const blacklist = await prisma.idbi_ip_blacklist.findMany({
      orderBy: {
        blocked_at: 'desc'
      },
      include: {
        blocked_by_user: {
          select: {
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    })

    // Transform data and check if blocks are still active
    const transformedBlacklist = blacklist.map(entry => {
      const isActive = entry.is_permanent || 
        (entry.blocked_until && new Date(entry.blocked_until) > new Date())
      
      return {
        id: entry.id,
        ip_address: entry.ip_address,
        reason: entry.reason,
        blocked_at: entry.blocked_at.toISOString(),
        blocked_until: entry.blocked_until?.toISOString(),
        is_permanent: entry.is_permanent,
        is_active: isActive,
        created_by: entry.blocked_by_user ? 
          `${entry.blocked_by_user.first_name} ${entry.blocked_by_user.last_name}` : 
          'System',
        location: entry.location ? JSON.parse(entry.location as string) : null,
        attempts_count: entry.attempts_count || 0
      }
    })

    return NextResponse.json({
      success: true,
      blacklist: transformedBlacklist
    })

  } catch (error) {
    console.error('Error fetching IP blacklist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add IP to blacklist
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
    const validatedData = addIPSchema.parse(body)

    // Check if IP is already blacklisted
    const existingEntry = await prisma.idbi_ip_blacklist.findFirst({
      where: {
        ip_address: validatedData.ip_address,
        OR: [
          { is_permanent: true },
          {
            blocked_until: {
              gt: new Date()
            }
          }
        ]
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'IP address is already blacklisted' },
        { status: 400 }
      )
    }

    // Calculate blocked_until date if not permanent
    let blockedUntil: Date | null = null
    if (!validatedData.is_permanent && validatedData.duration_hours) {
      blockedUntil = new Date()
      blockedUntil.setHours(blockedUntil.getHours() + validatedData.duration_hours)
    }

    // Get IP location info (simplified - in production you might use a geolocation service)
    let locationData = null
    try {
      // This is a placeholder - you would integrate with a real geolocation service
      locationData = {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown'
      }
    } catch (error) {
      console.error('Error getting location data:', error)
    }

    // Add IP to blacklist
    const blacklistEntry = await prisma.idbi_ip_blacklist.create({
      data: {
        ip_address: validatedData.ip_address,
        reason: validatedData.reason || 'Manually blocked',
        is_permanent: validatedData.is_permanent,
        blocked_until: blockedUntil,
        blocked_by: session.user.id,
        location: locationData ? JSON.stringify(locationData) : null,
        attempts_count: 0
      }
    })

    // Log the action
    await auditLog({
      user_id: session.user.id,
      action: 'IP_BLACKLIST_ADD',
      resource_type: 'security',
      resource_id: blacklistEntry.id,
      details: {
        ip_address: validatedData.ip_address,
        reason: validatedData.reason,
        is_permanent: validatedData.is_permanent,
        duration_hours: validatedData.duration_hours
      },
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown'
    })

    // Create security event
    await prisma.idbi_security_events.create({
      data: {
        event_type: 'IP_BLOCKED',
        ip_address: validatedData.ip_address,
        user_id: session.user.id,
        severity: 'MEDIUM',
        details: JSON.stringify({
          reason: validatedData.reason,
          is_permanent: validatedData.is_permanent,
          blocked_by: session.user.email
        }),
        location: locationData ? JSON.stringify(locationData) : null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'IP address added to blacklist successfully',
      entry: {
        id: blacklistEntry.id,
        ip_address: blacklistEntry.ip_address,
        reason: blacklistEntry.reason,
        is_permanent: blacklistEntry.is_permanent,
        blocked_at: blacklistEntry.blocked_at.toISOString(),
        blocked_until: blacklistEntry.blocked_until?.toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error adding IP to blacklist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}