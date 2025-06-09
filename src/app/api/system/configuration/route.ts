import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

// Rate limiting: 30 requests per 15 minutes per IP
const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
})

const configSchema = z.object({
  site_title: z.string().min(1).max(100),
  marquee_text: z.string().optional(),
  marquee_enabled: z.boolean(),
  banner_images: z.array(z.string()),
  banner_enabled: z.boolean(),
  banner_autoplay: z.boolean(),
  banner_interval: z.number().min(1).max(60),
  footer_content: z.string().optional(),
  footer_enabled: z.boolean(),
  theme_primary_color: z.string().regex(/^#[0-9A-F]{6}$/i),
  theme_secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i),
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().optional(),
})

const securitySchema = z.object({
  failed_login_threshold: z.number().min(3).max(100),
  ip_blacklist_duration: z.number().min(1).max(168),
  session_timeout: z.number().min(5).max(1440),
  password_min_length: z.number().min(6).max(50),
  password_require_uppercase: z.boolean(),
  password_require_lowercase: z.boolean(),
  password_require_numbers: z.boolean(),
  password_require_symbols: z.boolean(),
  two_factor_enabled: z.boolean(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin permissions
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    const hasSystemAccess = user?.role?.role_permissions.some(
      rp => rp.permission.action === 'SYSTEM_MANAGE'
    )

    if (!hasSystemAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    try {
      await limiter.check(30, clientIP)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Get system configuration
    let config = await prisma.idbi_system_config.findFirst({
      orderBy: { updated_at: 'desc' }
    })

    // Create default config if none exists
    if (!config) {
      config = await prisma.idbi_system_config.create({
        data: {
          site_title: 'Analytics Hub',
          marquee_text: 'Welcome to Analytics Hub - Your data visualization platform',
          marquee_enabled: false,
          banner_images: [],
          banner_enabled: false,
          banner_autoplay: true,
          banner_interval: 5,
          footer_content: '© 2024 Analytics Hub. All rights reserved.',
          footer_enabled: true,
          theme_primary_color: '#FF7A00',
          theme_secondary_color: '#0E0E44',
          failed_login_threshold: 30,
          ip_blacklist_duration: 24,
          session_timeout: 30,
          maintenance_mode: false,
          maintenance_message: 'The system is currently under maintenance. Please check back later.',
          updated_by: session.user.id
        }
      })
    }

    // Get security settings
    let securitySettings = await prisma.idbi_security_settings.findFirst({
      orderBy: { updated_at: 'desc' }
    })

    // Create default security settings if none exist
    if (!securitySettings) {
      securitySettings = await prisma.idbi_security_settings.create({
        data: {
          failed_login_threshold: 30,
          ip_blacklist_duration: 24,
          session_timeout: 30,
          password_min_length: 8,
          password_require_uppercase: true,
          password_require_lowercase: true,
          password_require_numbers: true,
          password_require_symbols: false,
          two_factor_enabled: false,
          updated_by: session.user.id
        }
      })
    }

    return NextResponse.json({
      config,
      security: securitySettings
    })

  } catch (error) {
    console.error('Error fetching system configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin permissions
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    const hasSystemAccess = user?.role?.role_permissions.some(
      rp => rp.permission.action === 'SYSTEM_MANAGE'
    )

    if (!hasSystemAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Apply rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    try {
      await limiter.check(10, clientIP)
    } catch {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { config: configData, security: securityData } = body

    // Validate input data
    const validatedConfig = configSchema.parse(configData)
    const validatedSecurity = securitySchema.parse(securityData)

    // Get current configuration for audit log
    const currentConfig = await prisma.idbi_system_config.findFirst({
      orderBy: { updated_at: 'desc' }
    })

    const currentSecurity = await prisma.idbi_security_settings.findFirst({
      orderBy: { updated_at: 'desc' }
    })

    // Update system configuration
    const updatedConfig = await prisma.idbi_system_config.upsert({
      where: { id: currentConfig?.id || 'new' },
      create: {
        ...validatedConfig,
        updated_by: session.user.id
      },
      update: {
        ...validatedConfig,
        updated_by: session.user.id,
        updated_at: new Date()
      }
    })

    // Update security settings
    const updatedSecurity = await prisma.idbi_security_settings.upsert({
      where: { id: currentSecurity?.id || 'new' },
      create: {
        ...validatedSecurity,
        updated_by: session.user.id
      },
      update: {
        ...validatedSecurity,
        updated_by: session.user.id,
        updated_at: new Date()
      }
    })

    // Log the configuration change
    await auditLog({
      user_id: session.user.id,
      action: 'SYSTEM_CONFIG_UPDATE',
      resource_type: 'SYSTEM_CONFIG',
      resource_id: updatedConfig.id,
      details: {
        config_changes: {
          old: currentConfig,
          new: updatedConfig
        },
        security_changes: {
          old: currentSecurity,
          new: updatedSecurity
        }
      },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      message: 'Configuration updated successfully',
      config: updatedConfig,
      security: updatedSecurity
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error updating system configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}