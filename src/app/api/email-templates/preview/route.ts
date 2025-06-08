import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { previewEmailTemplate } from '@/lib/email-templates'
import { z } from 'zod'

// Validation schema for preview request
const previewTemplateSchema = z.object({
  template_id: z.string().optional(),
  subject: z.string().optional(),
  html_body: z.string().optional(),
  text_body: z.string().optional(),
  variables: z.record(z.any())
})

// POST /api/email-templates/preview - Preview email template with variables
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
    const validatedData = previewTemplateSchema.parse(body)

    const preview = await previewEmailTemplate(validatedData)
    
    return NextResponse.json({
      success: true,
      data: preview
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
    
    console.error('Error previewing email template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}