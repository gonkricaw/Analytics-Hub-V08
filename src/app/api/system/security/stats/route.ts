import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch security statistics
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

    // Calculate date ranges
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch basic statistics
    const [totalBlockedIPs, activeBlocks, failedLogins24h, securityEvents24h] = await Promise.all([
      // Total blocked IPs (all time)
      prisma.idbi_ip_blacklist.count(),
      
      // Active blocks (permanent or not yet expired)
      prisma.idbi_ip_blacklist.count({
        where: {
          OR: [
            { is_permanent: true },
            {
              blocked_until: {
                gt: now
              }
            }
          ]
        }
      }),
      
      // Failed logins in last 24 hours
      prisma.idbi_security_events.count({
        where: {
          event_type: 'LOGIN_FAILED',
          created_at: {
            gte: twentyFourHoursAgo
          }
        }
      }),
      
      // Security events in last 24 hours
      prisma.idbi_security_events.count({
        where: {
          created_at: {
            gte: twentyFourHoursAgo
          }
        }
      })
    ])

    // Get top threat countries from security events
    const securityEventsWithLocation = await prisma.idbi_security_events.findMany({
      where: {
        location: {
          not: null
        },
        created_at: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        location: true
      }
    })

    // Process location data to get country counts
    const countryThreatCounts: { [key: string]: number } = {}
    
    securityEventsWithLocation.forEach(event => {
      if (event.location) {
        try {
          const location = JSON.parse(event.location as string)
          const country = location.country || 'Unknown'
          countryThreatCounts[country] = (countryThreatCounts[country] || 0) + 1
        } catch (error) {
          // Skip invalid location data
        }
      }
    })

    // Sort countries by threat count and get top 10
    const topThreatCountries = Object.entries(countryThreatCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }))

    // Get security events by severity (last 7 days)
    const eventsBySeverity = await prisma.idbi_security_events.groupBy({
      by: ['severity'],
      where: {
        created_at: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        severity: true
      }
    })

    // Get security events by type (last 7 days)
    const eventsByType = await prisma.idbi_security_events.groupBy({
      by: ['event_type'],
      where: {
        created_at: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        event_type: true
      },
      orderBy: {
        _count: {
          event_type: 'desc'
        }
      },
      take: 10
    })

    // Get daily security events for the last 30 days
    const dailyEvents = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        severity
      FROM idbi_security_events 
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at), severity
      ORDER BY date DESC
    ` as Array<{ date: Date; count: bigint; severity: string }>

    // Process daily events data
    const dailyEventsProcessed = dailyEvents.map(item => ({
      date: item.date.toISOString().split('T')[0],
      count: Number(item.count),
      severity: item.severity
    }))

    // Get recent blocked IPs (last 7 days)
    const recentBlockedIPs = await prisma.idbi_ip_blacklist.findMany({
      where: {
        blocked_at: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        blocked_at: 'desc'
      },
      take: 10,
      select: {
        ip_address: true,
        reason: true,
        blocked_at: true,
        location: true,
        attempts_count: true
      }
    })

    // Get login activity statistics
    const [successfulLogins24h, uniqueUsers24h] = await Promise.all([
      prisma.idbi_security_events.count({
        where: {
          event_type: 'LOGIN_SUCCESS',
          created_at: {
            gte: twentyFourHoursAgo
          }
        }
      }),
      
      prisma.idbi_security_events.findMany({
        where: {
          event_type: 'LOGIN_SUCCESS',
          created_at: {
            gte: twentyFourHoursAgo
          },
          user_id: {
            not: null
          }
        },
        select: {
          user_id: true
        },
        distinct: ['user_id']
      }).then(results => results.length)
    ])

    // Calculate security score (simplified algorithm)
    const securityScore = Math.max(0, Math.min(100, 
      100 - 
      (failedLogins24h * 2) - 
      (securityEvents24h * 1) - 
      (activeBlocks * 5)
    ))

    const stats = {
      total_blocked_ips: totalBlockedIPs,
      active_blocks: activeBlocks,
      failed_logins_24h: failedLogins24h,
      successful_logins_24h: successfulLogins24h,
      unique_users_24h: uniqueUsers24h,
      security_events_24h: securityEvents24h,
      security_score: Math.round(securityScore),
      top_threat_countries: topThreatCountries,
      events_by_severity: eventsBySeverity.map(item => ({
        severity: item.severity,
        count: item._count.severity
      })),
      events_by_type: eventsByType.map(item => ({
        event_type: item.event_type,
        count: item._count.event_type
      })),
      daily_events: dailyEventsProcessed,
      recent_blocked_ips: recentBlockedIPs.map(ip => ({
        ip_address: ip.ip_address,
        reason: ip.reason,
        blocked_at: ip.blocked_at.toISOString(),
        location: ip.location ? JSON.parse(ip.location as string) : null,
        attempts_count: ip.attempts_count || 0
      }))
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching security statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}