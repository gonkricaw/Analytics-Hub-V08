import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { 
  getAllEmailTemplates, 
  createEmailTemplate, 
  updateEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate
} from '@/lib/email-templates'
import { z } from 'zod'

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  html_body: z.string().min(1, 'HTML body is required'),
  text_body: z.string().min(1, 'Text body is required'),
  variables: z.record(z.string()).optional().default({}),
  is_active: z.boolean().optional().default(true)
})

const updateTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required').optional(),
  subject: z.string().min(1, 'Subject is required').optional(),
  html_body: z.string().min(1, 'HTML body is required').optional(),
  text_body: z.string().min(1, 'Text body is required').optional(),
  variables: z.record(z.string()).optional(),
  is_active: z.boolean().optional()
})

const previewTemplateSchema = z.object({
  template_id: z.string().optional(),
  subject: z.string().optional(),
  html_body: z.string().optional(),
  text_body: z.string().optional(),
  variables: z.record(z.any())
})

// GET /api/email-templates - Get all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin role (you may need to adjust this based on your role system)
    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const templates = await getAllEmailTemplates()
    
    return NextResponse.json({
      success: true,
      data: templates
    })
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/email-templates - Create new email template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    const template = await createEmailTemplate({
      ...validatedData,
      created_by: session.user.id
    })
    
    return NextResponse.json({
      success: true,
      data: template,
      message: 'Email template created successfully'
    }, { status: 201 })
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
    
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/email-templates - Update email template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateTemplateSchema.parse(body)
    const { id, ...updateData } = validatedData

    const template = await updateEmailTemplate(id, {
      ...updateData,
      updated_by: session.user.id
    })
    
    return NextResponse.json({
      success: true,
      data: template,
      message: 'Email template updated successfully'
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
    
    console.error('Error updating email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/email-templates - Delete email template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    await deleteEmailTemplate(templateId)
    
    return NextResponse.json({
      success: true,
      message: 'Email template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}