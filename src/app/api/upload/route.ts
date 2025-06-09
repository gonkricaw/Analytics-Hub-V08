import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'
import { auditLog } from '@/lib/audit'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import crypto from 'crypto'
import { z } from 'zod'

// Rate limiting: 20 uploads per hour per IP
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
})

// File validation
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'text/plain'
]

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.csv', '.xls', '.xlsx', '.json', '.txt'
]

// Sanitize filename
function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  // Ensure it doesn't start with dots
  return sanitized.replace(/^\.+/, '')
}

// Generate unique filename
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'))
  const sanitizedBaseName = sanitizeFilename(baseName)
  
  return `${timestamp}_${random}_${sanitizedBaseName}${extension}`
}

// Validate file type by content (magic numbers)
function validateFileType(buffer: Buffer, filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  
  // Check magic numbers for common file types
  const magicNumbers = {
    '.jpg': [0xFF, 0xD8, 0xFF],
    '.jpeg': [0xFF, 0xD8, 0xFF],
    '.png': [0x89, 0x50, 0x4E, 0x47],
    '.gif': [0x47, 0x49, 0x46],
    '.pdf': [0x25, 0x50, 0x44, 0x46],
    '.webp': [0x52, 0x49, 0x46, 0x46] // RIFF header for WebP
  }
  
  const magic = magicNumbers[extension as keyof typeof magicNumbers]
  if (magic) {
    for (let i = 0; i < magic.length; i++) {
      if (buffer[i] !== magic[i]) {
        return false
      }
    }
  }
  
  return true
}

// POST /api/upload - Upload file
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    await limiter.check(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await createPermissionChecker(session.user.id)
    if (!await hasPermission(PERMISSIONS.FILE_UPLOAD)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'general'
    const description = formData.get('description') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Validate file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: 'File extension not allowed' },
        { status: 400 }
      )
    }

    // Read file buffer for validation
    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate file content (magic numbers)
    if (!validateFileType(buffer, file.name)) {
      return NextResponse.json(
        { error: 'File content does not match extension' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name)
    
    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'public', 'uploads', category)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filePath = join(uploadDir, uniqueFilename)
    await writeFile(filePath, buffer)

    // Generate public URL
    const publicUrl = `/uploads/${category}/${uniqueFilename}`

    // Save file record to database
    const fileRecord = await prisma.idbi_files.create({
      data: {
        original_name: file.name,
        filename: uniqueFilename,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        category,
        description,
        uploaded_by: session.user.id
      }
    })

    // Audit log
    await auditLog({
      user_id: session.user.id,
      action: 'UPLOAD',
      resource: 'file',
      resource_id: fileRecord.id,
      details: {
        filename: file.name,
        size: file.size,
        type: file.type,
        category
      }
    })

    return NextResponse.json({
      id: fileRecord.id,
      filename: uniqueFilename,
      original_name: file.name,
      url: publicUrl,
      size: file.size,
      type: file.type,
      category,
      uploaded_at: fileRecord.created_at
    }, { status: 201 })

  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// GET /api/upload - List uploaded files
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    await limiter.check(request)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await createPermissionChecker(session.user.id)
    if (!await hasPermission(PERMISSIONS.FILE_READ)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const search = searchParams.get('search') || ''
    const uploaded_by = searchParams.get('uploaded_by')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { original_name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category) {
      where.category = category
    }
    
    if (uploaded_by) {
      where.uploaded_by = uploaded_by
    }

    // Check if user can view all files
    const canViewAll = await hasPermission(PERMISSIONS.FILE_MANAGE)
    if (!canViewAll) {
      // Only show files uploaded by user
      where.uploaded_by = session.user.id
    }

    const [files, total] = await Promise.all([
      prisma.idbi_files.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.idbi_files.count({ where })
    ])

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Files fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}