import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { auditLog } from '@/lib/audit'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

// Rate limiting: 10 avatar uploads per hour per IP
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
})

// POST /api/profile/avatar - Upload user avatar
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous'
    const { success } = await limiter.check(10, identifier)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user exists and is active
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        is_active: true,
        avatar: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${user.id}_${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    try {
      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Process image with Sharp
      let processedBuffer: Buffer
      
      if (file.type === 'image/gif') {
        // For GIFs, just resize without changing format to preserve animation
        processedBuffer = await sharp(buffer, { animated: true })
          .resize(400, 400, {
            fit: 'cover',
            position: 'center'
          })
          .toBuffer()
      } else {
        // For other formats, convert to WebP for better compression
        processedBuffer = await sharp(buffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: 85 })
          .toBuffer()
        
        // Update filename for WebP
        const webpFilename = `${user.id}_${timestamp}.webp`
        const webpFilepath = join(uploadsDir, webpFilename)
        await writeFile(webpFilepath, processedBuffer)
        
        // Update variables for database
        filename = webpFilename
      }

      if (file.type === 'image/gif') {
        await writeFile(filepath, processedBuffer)
      }

      // Generate avatar URL
      const avatarUrl = `/uploads/avatars/${filename}`

      // Update user avatar in database
      const updatedUser = await prisma.idbi_users.update({
        where: { id: session.user.id },
        data: {
          avatar: avatarUrl,
          updated_at: new Date()
        },
        select: {
          id: true,
          avatar: true
        }
      })

      // Log avatar update
      await auditLog({
        userId: session.user.id,
        action: 'AVATAR_UPDATED',
        resource: 'USER_PROFILE',
        resourceId: user.id,
        details: `Avatar updated: ${filename}`,
        ipAddress: request.ip
      })

      return NextResponse.json({
        message: 'Avatar uploaded successfully',
        avatarUrl: updatedUser.avatar
      })
    } catch (imageError) {
      console.error('Image processing error:', imageError)
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Avatar upload error:', error)
    
    // Log error for monitoring
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        await auditLog({
          userId: session.user.id,
          action: 'AVATAR_UPLOAD_ERROR',
          resource: 'USER_PROFILE',
          resourceId: session.user.id,
          details: `Avatar upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ipAddress: request.ip
        })
      }
    } catch (auditError) {
      console.error('Audit log error:', auditError)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/profile/avatar - Remove user avatar
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous'
    const { success } = await limiter.check(10, identifier)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user exists and is active
    const user = await prisma.idbi_users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        is_active: true,
        avatar: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Remove avatar from database
    await prisma.idbi_users.update({
      where: { id: session.user.id },
      data: {
        avatar: null,
        updated_at: new Date()
      }
    })

    // Note: We don't delete the physical file to maintain data integrity
    // and allow for potential recovery. A cleanup job can handle old files.

    // Log avatar removal
    await auditLog({
      userId: session.user.id,
      action: 'AVATAR_REMOVED',
      resource: 'USER_PROFILE',
      resourceId: user.id,
      details: 'Avatar removed from profile',
      ipAddress: request.ip
    })

    return NextResponse.json({
      message: 'Avatar removed successfully'
    })
  } catch (error) {
    console.error('Avatar removal error:', error)
    
    // Log error for monitoring
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        await auditLog({
          userId: session.user.id,
          action: 'AVATAR_REMOVAL_ERROR',
          resource: 'USER_PROFILE',
          resourceId: session.user.id,
          details: `Avatar removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ipAddress: request.ip
        })
      }
    } catch (auditError) {
      console.error('Audit log error:', auditError)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}