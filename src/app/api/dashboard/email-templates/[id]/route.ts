import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for updating email templates
const updateEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long').optional(),
  html_content: z.string().min(1, 'HTML content is required').optional(),
  text_content: z.string().optional().nullable(),
  variables: z.array(z.string()).optional(),
  is_active: z.boolean().optional()
})

// GET - Fetch specific email template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const template = await prisma.idbi_email_templates.findUnique({
      where: { id: params.id },
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

    if (!template) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
    }

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

    return NextResponse.json(transformedTemplate)
  } catch (error) {
    console.error('Error fetching email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update email template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if template exists
    const existingTemplate = await prisma.idbi_email_templates.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateEmailTemplateSchema.parse(body)

    // Check if template name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingTemplate.name) {
      const nameExists = await prisma.idbi_email_templates.findFirst({
        where: {
          name: validatedData.name,
          id: { not: params.id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Template name already exists' },
          { status: 400 }
        )
      }
    }

    // Extract variables from content if content is being updated
    const extractVariables = (content: string) => {
      const regex = /\{\{([^}]+)\}\}/g
      const matches = content.match(regex) || []
      return [...new Set(matches)]
    }

    let extractedVariables = existingTemplate.variables || []
    if (validatedData.subject || validatedData.html_content || validatedData.text_content !== undefined) {
      const subject = validatedData.subject || existingTemplate.subject
      const htmlContent = validatedData.html_content || existingTemplate.html_content
      const textContent = validatedData.text_content !== undefined ? validatedData.text_content : existingTemplate.text_content
      
      const allContent = `${subject} ${htmlContent} ${textContent || ''}`
      extractedVariables = extractVariables(allContent)
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date(),
      variables: extractedVariables
    }

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.subject !== undefined) updateData.subject = validatedData.subject
    if (validatedData.html_content !== undefined) updateData.html_content = validatedData.html_content
    if (validatedData.text_content !== undefined) updateData.text_content = validatedData.text_content
    if (validatedData.is_active !== undefined) updateData.is_active = validatedData.is_active

    // Update the template
    const template = await prisma.idbi_email_templates.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'UPDATE',
        resource_type: 'email_template',
        resource_id: template.id,
        details: {
          name: template.name,
          changes: Object.keys(validatedData)
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

    return NextResponse.json(transformedTemplate)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if template exists
    const existingTemplate = await prisma.idbi_email_templates.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
    }

    // Check if template is being used (you might want to add this check)
    // For now, we'll allow deletion but you could add validation here

    // Delete the template
    await prisma.idbi_email_templates.delete({
      where: { id: params.id }
    })

    // Log the action
    await prisma.idbi_audit_logs.create({
      data: {
        user_id: session.user.id,
        action: 'DELETE',
        resource_type: 'email_template',
        resource_id: params.id,
        details: {
          name: existingTemplate.name
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        created_at: new Date()
      }
    })

    return NextResponse.json({ message: 'Email template deleted successfully' })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}