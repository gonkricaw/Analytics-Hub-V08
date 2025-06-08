import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { EmailConfig } from '@/types'

// Email configuration
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
}

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig)

// Template variable replacement interface
interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined
}

// Email template interface
interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_body: string
  text_body?: string | null
  variables?: any
  is_active: boolean
}

// Template engine class
export class EmailTemplateEngine {
  /**
   * Get template by name from database
   */
  static async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      const template = await prisma.idbi_email_templates.findFirst({
        where: {
          name: templateName,
          is_active: true
        }
      })

      return template
    } catch (error) {
      console.error('Error fetching email template:', error)
      return null
    }
  }

  /**
   * Replace variables in template content
   */
  static replaceVariables(content: string, variables: TemplateVariables): string {
    let processedContent = content

    // Replace all {{variable}} patterns
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      const replacement = value !== null && value !== undefined ? String(value) : ''
      processedContent = processedContent.replace(regex, replacement)
    })

    // Remove any remaining unreplaced variables
    processedContent = processedContent.replace(/{{[^}]+}}/g, '')

    return processedContent
  }

  /**
   * Send email using template
   */
  static async sendTemplatedEmail(
    templateName: string,
    to: string | string[],
    variables: TemplateVariables,
    options?: {
      from?: string
      replyTo?: string
      cc?: string | string[]
      bcc?: string | string[]
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Get template from database
      const template = await this.getTemplate(templateName)
      
      if (!template) {
        return {
          success: false,
          error: `Email template '${templateName}' not found or inactive`
        }
      }

      // Process template variables
      const processedSubject = this.replaceVariables(template.subject, variables)
      const processedHtmlBody = this.replaceVariables(template.html_body, variables)
      const processedTextBody = template.text_body 
        ? this.replaceVariables(template.text_body, variables)
        : undefined

      // Prepare email options
      const mailOptions = {
        from: options?.from || process.env.SMTP_FROM || 'noreply@analyticshub.com',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: processedSubject,
        html: processedHtmlBody,
        text: processedTextBody,
        replyTo: options?.replyTo,
        cc: options?.cc,
        bcc: options?.bcc
      }

      // Send email
      const info = await transporter.sendMail(mailOptions)

      return {
        success: true,
        messageId: info.messageId
      }

    } catch (error) {
      console.error('Error sending templated email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Create or update email template
   */
  static async upsertTemplate(
    name: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
    variables?: any,
    userId?: string
  ): Promise<{ success: boolean; template?: EmailTemplate; error?: string }> {
    try {
      const template = await prisma.idbi_email_templates.upsert({
        where: { name },
        update: {
          subject,
          html_body: htmlBody,
          text_body: textBody,
          variables,
          updated_by: userId,
          updated_at: new Date()
        },
        create: {
          name,
          subject,
          html_body: htmlBody,
          text_body: textBody,
          variables,
          created_by: userId
        }
      })

      return {
        success: true,
        template
      }
    } catch (error) {
      console.error('Error upserting email template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get all available templates
   */
  static async getAllTemplates(): Promise<EmailTemplate[]> {
    try {
      const templates = await prisma.idbi_email_templates.findMany({
        orderBy: {
          name: 'asc'
        }
      })

      return templates
    } catch (error) {
      console.error('Error fetching email templates:', error)
      return []
    }
  }

  /**
   * Delete email template
   */
  static async deleteTemplate(templateName: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.idbi_email_templates.delete({
        where: { name: templateName }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting email template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Preview template with variables
   */
  static async previewTemplate(
    templateName: string,
    variables: TemplateVariables
  ): Promise<{ success: boolean; preview?: { subject: string; html: string; text?: string }; error?: string }> {
    try {
      const template = await this.getTemplate(templateName)
      
      if (!template) {
        return {
          success: false,
          error: `Email template '${templateName}' not found or inactive`
        }
      }

      const preview = {
        subject: this.replaceVariables(template.subject, variables),
        html: this.replaceVariables(template.html_body, variables),
        text: template.text_body ? this.replaceVariables(template.text_body, variables) : undefined
      }

      return {
        success: true,
        preview
      }
    } catch (error) {
      console.error('Error previewing email template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

// Convenience functions for common email types
export const sendWelcomeEmail = async (
  to: string,
  variables: {
    firstName: string
    lastName: string
    email: string
    temporaryPassword?: string
    loginUrl: string
    supportEmail: string
  }
) => {
  return EmailTemplateEngine.sendTemplatedEmail('welcome', to, variables)
}

export const sendPasswordResetEmail = async (
  to: string,
  variables: {
    firstName: string
    resetUrl: string
    expirationTime: string
    requestIP: string
    supportEmail: string
  }
) => {
  return EmailTemplateEngine.sendTemplatedEmail('password_reset', to, variables)
}

export const sendInvitationEmail = async (
  to: string,
  variables: {
    firstName: string
    lastName: string
    inviterName: string
    role: string
    temporaryPassword: string
    loginUrl: string
    expirationDate: string
    supportEmail: string
  }
) => {
  return EmailTemplateEngine.sendTemplatedEmail('invitation', to, variables)
}

export const sendSuspensionEmail = async (
  to: string,
  variables: {
    firstName: string
    reason: string
    suspensionDate: string
    supportEmail: string
  }
) => {
  return EmailTemplateEngine.sendTemplatedEmail('suspension', to, variables)
}

export const sendAnnouncementEmail = async (
  to: string | string[],
  variables: {
    title: string
    content: string
    actionUrl?: string
    actionText?: string
    senderName: string
  }
) => {
  return EmailTemplateEngine.sendTemplatedEmail('announcement', to, variables)
}