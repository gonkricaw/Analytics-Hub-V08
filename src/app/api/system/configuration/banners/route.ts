import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { auditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const files = formData.getAll('banners') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate file count (max 10 images)
    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Too many files. Maximum 10 images allowed.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'banners')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    const uploadedImages: string[] = []
    const uploadDetails: any[] = []

    // Process each file
    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type for ${file.name}. Only JPEG, PNG, and WebP are allowed.` },
          { status: 400 }
        )
      }

      // Validate file size (max 5MB per image)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 5MB per image.` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const extension = file.name.split('.').pop()
      const filename = `banner-${timestamp}-${randomSuffix}.${extension}`
      const filepath = join(uploadsDir, filename)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Generate public URL
      const imageUrl = `/uploads/banners/${filename}`
      uploadedImages.push(imageUrl)
      
      uploadDetails.push({
        filename,
        original_name: file.name,
        file_size: file.size,
        file_type: file.type,
        image_url: imageUrl
      })
    }

    // Get current configuration to append new images
    const currentConfig = await prisma.idbi_system_config.findFirst({
      orderBy: { updated_at: 'desc' }
    })

    const existingImages = currentConfig?.banner_images || []
    const allBannerImages = [...existingImages, ...uploadedImages]

    // Update configuration with new banner images
    await prisma.idbi_system_config.upsert({
      where: { id: currentConfig?.id || 'new' },
      create: {
        site_title: 'Analytics Hub',
        marquee_text: 'Welcome to Analytics Hub',
        marquee_enabled: false,
        banner_images: allBannerImages,
        banner_enabled: true,
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
        updated_by: session.user.id
      },
      update: {
        banner_images: allBannerImages,
        updated_by: session.user.id,
        updated_at: new Date()
      }
    })

    // Get client IP for audit log
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Log the banner upload
    await auditLog({
      user_id: session.user.id,
      action: 'BANNER_UPLOAD',
      resource_type: 'SYSTEM_CONFIG',
      resource_id: currentConfig?.id || null,
      details: {
        uploaded_count: files.length,
        upload_details: uploadDetails,
        total_banners: allBannerImages.length
      },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent')
    })

    return NextResponse.json({
      message: `${files.length} banner image(s) uploaded successfully`,
      banner_images: allBannerImages,
      uploaded_images: uploadedImages
    })

  } catch (error) {
    console.error('Error uploading banner images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}