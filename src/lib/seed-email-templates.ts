import { prisma } from '@/lib/prisma'

// Default email templates
const defaultTemplates = [
  {
    name: 'welcome',
    subject: 'Welcome to {{appName}} - Account Created Successfully',
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to {{appName}}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0E0E44 0%, #1a1a5e 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to {{appName}}</h1>
            <p style="color: #FF7A00; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Your account has been created successfully!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #0E0E44; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Hello {{firstName}} {{lastName}}!</h2>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We're excited to have you join our analytics platform. Your account has been successfully created and you can now access all the powerful features we offer.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #FF7A00; padding: 20px; margin: 25px 0;">
              <h3 style="color: #0E0E44; margin: 0 0 15px; font-size: 18px;">Account Details:</h3>
              <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> {{email}}</p>
              {{#temporaryPassword}}
              <p style="margin: 5px 0; color: #333;"><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: monospace;">{{temporaryPassword}}</code></p>
              {{/temporaryPassword}}
            </div>
            
            {{#temporaryPassword}}
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;"><strong>⚠️ Important:</strong> You must change this temporary password on your first login. The system will prompt you to create a new, secure password.</p>
            </div>
            {{/temporaryPassword}}
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="display: inline-block; background-color: #FF7A00; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 122, 0, 0.3);">Login to Your Account</a>
            </div>
            
            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h4 style="color: #0c5460; margin: 0 0 10px; font-size: 16px;">Security Guidelines:</h4>
              <ul style="color: #0c5460; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Use a strong, unique password</li>
                <li>Include uppercase, lowercase, numbers, and symbols</li>
                <li>Don't reuse passwords from other accounts</li>
                <li>Enable two-factor authentication when available</li>
              </ul>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:{{supportEmail}}" style="color: #FF7A00;">{{supportEmail}}</a>.</p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2024 {{appName}}. All rights reserved.</p>
            <p style="color: #6c757d; margin: 10px 0 0; font-size: 12px;">This email was sent to {{email}}. If you didn't expect this email, please contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `Welcome to {{appName}}!\n\nHello {{firstName}} {{lastName}},\n\nYour account has been created successfully. You can now login using:\nEmail: {{email}}\n{{#temporaryPassword}}Temporary Password: {{temporaryPassword}}\n\nIMPORTANT: You must change this temporary password on your first login.{{/temporaryPassword}}\n\nLogin URL: {{loginUrl}}\n\nIf you need help, contact us at {{supportEmail}}.\n\nBest regards,\n{{appName}} Team`,
    variables: {
      appName: 'Application name',
      firstName: 'User first name',
      lastName: 'User last name',
      email: 'User email address',
      temporaryPassword: 'Temporary password (optional)',
      loginUrl: 'Login page URL',
      supportEmail: 'Support email address'
    }
  },
  {
    name: 'password_reset',
    subject: 'Password Reset Request - {{appName}}',
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - {{appName}}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0E0E44 0%, #1a1a5e 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Password Reset</h1>
            <p style="color: #FF7A00; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Secure password reset request</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #0E0E44; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Hello {{firstName}}!</h2>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We received a request to reset your password for your {{appName}} account. If you made this request, click the button below to reset your password.</p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetUrl}}" style="display: inline-block; background-color: #FF7A00; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 122, 0, 0.3);">Reset My Password</a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;"><strong>⏰ Time Sensitive:</strong> This password reset link will expire in {{expirationTime}}. Please use it as soon as possible.</p>
            </div>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #721c24; margin: 0; font-size: 14px; line-height: 1.5;"><strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged. Consider reviewing your account security.</p>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">For your security, this request was made from IP address: <code style="background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px;">{{requestIP}}</code></p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2024 {{appName}}. All rights reserved.</p>
            <p style="color: #6c757d; margin: 10px 0 0; font-size: 12px;">If you need help, contact us at <a href="mailto:{{supportEmail}}" style="color: #FF7A00;">{{supportEmail}}</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `Password Reset Request - {{appName}}\n\nHello {{firstName}},\n\nWe received a request to reset your password. Click the link below to reset it:\n{{resetUrl}}\n\nThis link expires in {{expirationTime}}.\n\nIf you didn't request this, please ignore this email.\n\nRequest from IP: {{requestIP}}\n\nNeed help? Contact {{supportEmail}}`,
    variables: {
      appName: 'Application name',
      firstName: 'User first name',
      resetUrl: 'Password reset URL with token',
      expirationTime: 'Link expiration time',
      requestIP: 'IP address of the request',
      supportEmail: 'Support email address'
    }
  },
  {
    name: 'invitation',
    subject: 'You\'re Invited to Join {{appName}} - {{role}} Access',
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to {{appName}}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0E0E44 0%, #1a1a5e 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">You're Invited!</h1>
            <p style="color: #FF7A00; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Join {{appName}} as {{role}}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #0E0E44; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Hello {{firstName}} {{lastName}}!</h2>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">{{inviterName}} has invited you to join {{appName}} with {{role}} access. We're excited to have you as part of our analytics platform!</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #FF7A00; padding: 20px; margin: 25px 0;">
              <h3 style="color: #0E0E44; margin: 0 0 15px; font-size: 18px;">Invitation Details:</h3>
              <p style="margin: 5px 0; color: #333;"><strong>Role:</strong> {{role}}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Invited by:</strong> {{inviterName}}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: monospace;">{{temporaryPassword}}</code></p>
              <p style="margin: 5px 0; color: #333;"><strong>Expires:</strong> {{expirationDate}}</p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="display: inline-block; background-color: #FF7A00; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 122, 0, 0.3);">Accept Invitation</a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;"><strong>⚠️ Important:</strong> You must change this temporary password on your first login. The system will prompt you to create a new, secure password.</p>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">If you have any questions about this invitation, please contact our support team at <a href="mailto:{{supportEmail}}" style="color: #FF7A00;">{{supportEmail}}</a>.</p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2024 {{appName}}. All rights reserved.</p>
            <p style="color: #6c757d; margin: 10px 0 0; font-size: 12px;">This invitation was sent to {{email}}. If you didn't expect this, please contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `You're Invited to {{appName}}!\n\nHello {{firstName}} {{lastName}},\n\n{{inviterName}} has invited you to join {{appName}} as {{role}}.\n\nTemporary Password: {{temporaryPassword}}\nExpires: {{expirationDate}}\n\nAccept invitation: {{loginUrl}}\n\nIMPORTANT: Change your password on first login.\n\nQuestions? Contact {{supportEmail}}`,
    variables: {
      appName: 'Application name',
      firstName: 'User first name',
      lastName: 'User last name',
      email: 'User email address',
      inviterName: 'Name of person who sent invitation',
      role: 'User role/position',
      temporaryPassword: 'Temporary password',
      loginUrl: 'Login page URL',
      expirationDate: 'Invitation expiration date',
      supportEmail: 'Support email address'
    }
  },
  {
    name: 'suspension',
    subject: 'Account Suspended - {{appName}}',
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspended - {{appName}}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Account Suspended</h1>
            <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; font-weight: 500; opacity: 0.9;">Important security notice</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #dc3545; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Hello {{firstName}}!</h2>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We're writing to inform you that your {{appName}} account has been suspended due to a security concern or policy violation.</p>
            
            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 25px 0;">
              <h3 style="color: #721c24; margin: 0 0 15px; font-size: 18px;">Suspension Details:</h3>
              <p style="margin: 5px 0; color: #721c24;"><strong>Reason:</strong> {{reason}}</p>
              <p style="margin: 5px 0; color: #721c24;"><strong>Date:</strong> {{suspensionDate}}</p>
            </div>
            
            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h4 style="color: #0c5460; margin: 0 0 10px; font-size: 16px;">What happens next?</h4>
              <ul style="color: #0c5460; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Your account access has been temporarily disabled</li>
                <li>Our security team will review your case</li>
                <li>You will be contacted with further instructions</li>
                <li>If this was done in error, please contact support immediately</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:{{supportEmail}}" style="display: inline-block; background-color: #0c5460; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Contact Support</a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">If you believe this suspension was made in error or if you have any questions, please contact our support team immediately at <a href="mailto:{{supportEmail}}" style="color: #FF7A00;">{{supportEmail}}</a>.</p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2024 {{appName}}. All rights reserved.</p>
            <p style="color: #6c757d; margin: 10px 0 0; font-size: 12px;">This is an automated security notification.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `Account Suspended - {{appName}}\n\nHello {{firstName}},\n\nYour account has been suspended.\n\nReason: {{reason}}\nDate: {{suspensionDate}}\n\nYour account access is temporarily disabled. Our security team will review your case.\n\nIf you believe this is an error, contact support immediately: {{supportEmail}}`,
    variables: {
      appName: 'Application name',
      firstName: 'User first name',
      reason: 'Reason for suspension',
      suspensionDate: 'Date of suspension',
      supportEmail: 'Support email address'
    }
  },
  {
    name: 'announcement',
    subject: '{{title}} - {{appName}}',
    html_body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{title}} - {{appName}}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0E0E44 0%, #1a1a5e 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">{{title}}</h1>
            <p style="color: #FF7A00; margin: 10px 0 0; font-size: 16px; font-weight: 500;">Important announcement from {{appName}}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
              {{content}}
            </div>
            
            {{#actionUrl}}
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{actionUrl}}" style="display: inline-block; background-color: #FF7A00; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 122, 0, 0.3);">{{actionText}}</a>
            </div>
            {{/actionUrl}}
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">Best regards,<br><strong>{{senderName}}</strong><br>{{appName}} Team</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">© 2024 {{appName}}. All rights reserved.</p>
            <p style="color: #6c757d; margin: 10px 0 0; font-size: 12px;">This announcement was sent to all {{appName}} users.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text_body: `{{title}} - {{appName}}\n\n{{content}}\n\n{{#actionUrl}}{{actionText}}: {{actionUrl}}\n\n{{/actionUrl}}Best regards,\n{{senderName}}\n{{appName}} Team`,
    variables: {
      appName: 'Application name',
      title: 'Announcement title',
      content: 'Announcement content (HTML supported)',
      actionUrl: 'Optional action URL',
      actionText: 'Optional action button text',
      senderName: 'Name of sender'
    }
  }
]

// Function to seed email templates
export async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...')
  
  try {
    for (const template of defaultTemplates) {
      await prisma.idbi_email_templates.upsert({
        where: { name: template.name },
        update: {
          subject: template.subject,
          html_body: template.html_body,
          text_body: template.text_body,
          variables: template.variables,
          updated_at: new Date()
        },
        create: {
          name: template.name,
          subject: template.subject,
          html_body: template.html_body,
          text_body: template.text_body,
          variables: template.variables,
          created_by: 'SYSTEM'
        }
      })
      
      console.log(`✅ Seeded email template: ${template.name}`)
    }
    
    console.log('🎉 Email templates seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding email templates:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedEmailTemplates()
    .then(() => {
      console.log('✅ Email template seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Email template seeding failed:', error)
      process.exit(1)
    })
}