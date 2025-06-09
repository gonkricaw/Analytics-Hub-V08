import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating/updating email templates
const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  html_content: z.string().min(1, 'HTML content is required'),
  text_content: z.string().optional(),
  variables: z.array(z.string()).optional().default([]),
  is_active: z.boolean().default(true)
})

// GET - Fetch all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage email templates
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
      rp => rp.permission.name === 'manage_email_templates' || rp.permission.name === 'admin_access'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch all email templates
    const templates = await prisma.idbi_email_templates.findMany({
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
        { is_active: 'desc' },
        { name: 'asc' }
      ]
    })

    // Transform the data to match the expected format
    const transformedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables || [],
      is_active: template.is_active,
      created_at: template.created_at.toISOString(),
      updated_at: template.updated_at.toISOString(),
      created_by_user: template.created_by_user
    }))

    return NextResponse.json(transformedTemplates)
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new email template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage email templates
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
      rp => rp.permission.name === 'manage_email_templates' || rp.permission.name === 'admin_access'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = emailTemplateSchema.parse(body)

    // Check if template name already exists
    const existingTemplate = await prisma.idbi_email_templates.findFirst({
      where: {
        name: validatedData.name
      }
    })

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template name already exists' },
        { status: 400 }
      )
    }

    // Extract variables from content
    const extractVariables = (content: string) => {
      const regex = /\{\{([^}]+)\}\}/g
      const matches = content.match(regex) || []
      return [...new Set(matches)]
    }

    const allContent = `${validatedData.subject} ${validatedData.html_content} ${validatedData.text_content || ''}`
    const extractedVariables = extractVariables(allContent)

    // Create the email template
    const template = await prisma.idbi_email_templates.create({
      data: {
        name: validatedData.name,
        subject: validatedData.subject,
        html_content: validatedData.html_content,
        text_content: validatedData.text_content || null,
        variables: extractedVariables,
        is_active: validatedData.is_active,
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
        resource_type: 'email_template',
        resource_id: template.id,
        details: {
          name: template.name,
          subject: template.subject
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date()
      }
    })

    // Transform the response
    const transformedTemplate = {
      id: template.id,
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables || [],
      is_active: template.is_active,
      created_at: template.created_at.toISOString(),
      updated_at: template.updated_at.toISOString(),
      created_by_user: template.created_by_user
    }

    return NextResponse.json(transformedTemplate, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}