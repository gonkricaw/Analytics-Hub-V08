import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

// Rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
})

// Validation schemas
const updateFileSchema = z.object({
  category: z.string().optional(),
  description: z.string().optional(),
  is_public: z.boolean().optional()
})

// GET /api/upload/[id] - Get file details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    await limiter.check(request, 10, 'CACHE_TOKEN')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    const hasFileRead = session.user.permissions?.includes('FILE_READ')
    const hasFileManage = session.user.permissions?.includes('FILE_MANAGE')
    
    if (!hasFileRead && !hasFileManage) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const fileId = params.id

    // Get file details
    const file = await prisma.idbi_files.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check if user can access this file
    const canAccess = 
      hasFileManage || 
      file.uploader_id === session.user.id ||
      file.is_public

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Log activity
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: session.user.id,
        action: 'FILE_VIEW',
        resource_type: 'file',
        resource_id: fileId,
        details: {
          filename: file.filename,
          original_name: file.original_name
        },
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json(file)
  } catch (error: any) {
    console.error('Error fetching file:', error)
    
    if (error.code === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/upload/[id] - Update file metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    await limiter.check(request, 5, 'CACHE_TOKEN')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    const hasFileUpdate = session.user.permissions?.includes('FILE_UPDATE')
    const hasFileManage = session.user.permissions?.includes('FILE_MANAGE')
    
    if (!hasFileUpdate && !hasFileManage) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const fileId = params.id
    const body = await request.json()

    // Validate input
    const validatedData = updateFileSchema.parse(body)

    // Check if file exists
    const existingFile = await prisma.idbi_files.findUnique({
      where: { id: fileId }
    })

    if (!existingFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check if user can update this file
    const canUpdate = 
      hasFileManage || 
      existingFile.uploader_id === session.user.id

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update file metadata
    const updatedFile = await prisma.idbi_files.update({
      where: { id: fileId },
      data: {
        ...validatedData,
        updated_at: new Date()
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log activity
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: session.user.id,
        action: 'FILE_UPDATE',
        resource_type: 'file',
        resource_id: fileId,
        details: {
          filename: updatedFile.filename,
          original_name: updatedFile.original_name,
          changes: validatedData
        },
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json(updatedFile)
  } catch (error: any) {
    console.error('Error updating file:', error)
    
    if (error.code === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/upload/[id] - Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    await limiter.check(request, 5, 'CACHE_TOKEN')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check permissions
    const hasFileDelete = session.user.permissions?.includes('FILE_DELETE')
    const hasFileManage = session.user.permissions?.includes('FILE_MANAGE')
    
    if (!hasFileDelete && !hasFileManage) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const fileId = params.id

    // Check if file exists
    const existingFile = await prisma.idbi_files.findUnique({
      where: { id: fileId }
    })

    if (!existingFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check if user can delete this file
    const canDelete = 
      hasFileManage || 
      existingFile.uploader_id === session.user.id

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete physical file
    try {
      const filePath = path.join(process.cwd(), 'public', 'uploads', existingFile.filename)
      await fs.unlink(filePath)
    } catch (fileError) {
      console.warn('Could not delete physical file:', fileError)
      // Continue with database deletion even if physical file deletion fails
    }

    // Delete from database
    await prisma.idbi_files.delete({
      where: { id: fileId }
    })

    // Log activity
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: session.user.id,
        action: 'FILE_DELETE',
        resource_type: 'file',
        resource_id: fileId,
        details: {
          filename: existingFile.filename,
          original_name: existingFile.original_name,
          file_size: existingFile.file_size
        },
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      message: 'File deleted successfully',
      deleted_file: {
        id: existingFile.id,
        filename: existingFile.filename,
        original_name: existingFile.original_name
      }
    })
  } catch (error: any) {
    console.error('Error deleting file:', error)
    
    if (error.code === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}