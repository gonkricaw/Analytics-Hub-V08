import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit'

// DELETE - Remove IP from blacklist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Find the blacklist entry
    const blacklistEntry = await prisma.idbi_ip_blacklist.findUnique({
      where: { id }
    })

    if (!blacklistEntry) {
      return NextResponse.json(
        { error: 'Blacklist entry not found' },
        { status: 404 }
      )
    }

    // Delete the blacklist entry
    await prisma.idbi_ip_blacklist.delete({
      where: { id }
    })

    // Log the action
    await auditLog({
      user_id: session.user.id,
      action: 'IP_BLACKLIST_REMOVE',
      resource_type: 'security',
      resource_id: id,
      details: {
        ip_address: blacklistEntry.ip_address,
        reason: blacklistEntry.reason,
        was_permanent: blacklistEntry.is_permanent
      },
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown'
    })

    // Create security event
    await prisma.idbi_security_events.create({
      data: {
        event_type: 'IP_UNBLOCKED',
        ip_address: blacklistEntry.ip_address,
        user_id: session.user.id,
        severity: 'LOW',
        details: JSON.stringify({
          reason: 'Manually removed from blacklist',
          removed_by: session.user.email,
          original_reason: blacklistEntry.reason
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'IP address removed from blacklist successfully'
    })

  } catch (error) {
    console.error('Error removing IP from blacklist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get specific blacklist entry details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Find the blacklist entry
    const blacklistEntry = await prisma.idbi_ip_blacklist.findUnique({
      where: { id },
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

    if (!blacklistEntry) {
      return NextResponse.json(
        { error: 'Blacklist entry not found' },
        { status: 404 }
      )
    }

    // Check if block is still active
    const isActive = blacklistEntry.is_permanent || 
      (blacklistEntry.blocked_until && new Date(blacklistEntry.blocked_until) > new Date())

    // Get related security events for this IP
    const relatedEvents = await prisma.idbi_security_events.findMany({
      where: {
        ip_address: blacklistEntry.ip_address
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    })

    return NextResponse.json({
      success: true,
      entry: {
        id: blacklistEntry.id,
        ip_address: blacklistEntry.ip_address,
        reason: blacklistEntry.reason,
        blocked_at: blacklistEntry.blocked_at.toISOString(),
        blocked_until: blacklistEntry.blocked_until?.toISOString(),
        is_permanent: blacklistEntry.is_permanent,
        is_active: isActive,
        created_by: blacklistEntry.blocked_by_user ? 
          `${blacklistEntry.blocked_by_user.first_name} ${blacklistEntry.blocked_by_user.last_name}` : 
          'System',
        location: blacklistEntry.location ? JSON.parse(blacklistEntry.location as string) : null,
        attempts_count: blacklistEntry.attempts_count || 0,
        related_events: relatedEvents.map(event => ({
          id: event.id,
          event_type: event.event_type,
          severity: event.severity,
          created_at: event.created_at.toISOString(),
          details: event.details ? JSON.parse(event.details as string) : null
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching blacklist entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}