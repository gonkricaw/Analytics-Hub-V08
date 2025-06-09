import nodemailer from 'nodemailer';
import { EmailConfig, EmailTemplate, EmailOptions } from '@/types';
import { sendTemplatedEmail, getEmailTemplate } from './email-templates';

// Email configuration
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter(emailConfig);
};

// Email templates with enhanced styling and security features
const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Welcome to Analytics Hub - Account Created',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Analytics Hub</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0E0E44 0%, #1a1a5e 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background-color: rgba(255, 122, 0, 0.2); border: 2px solid #FF7A00; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #FF7A00; font-size: 24px; font-weight: bold;">AH</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Analytics Hub!</h1>
            <p style="color: rgba(255, 255, 255, 0.8); margin: 10px 0 0; font-size: 16px;">Your analytics journey begins now</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello <strong>{{name}}</strong>,</p>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Welcome to Analytics Hub! Your account has been successfully created and you now have access to our powerful analytics platform.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #FF7A00; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #FF7A00; margin: 0 0 10px; font-size: 18px;">What's Next?</h3>
              <ul style="color: #333333; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Log in to your dashboard</li>
                <li>Complete your profile setup</li>
                <li>Explore our analytics tools</li>
                <li>Start creating your first reports</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="display: inline-block; background-color: #FF7A00; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 122, 0, 0.3);">Access Your Dashboard</a>
            </div>
            
            <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #1976d2; margin: 0; font-size: 14px; line-height: 1.5;"><strong>Security Tip:</strong> Keep your login credentials secure and never share them with others. If you notice any suspicious activity, contact our support team immediately.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0 0 10px; font-size: 14px;">Best regards,<br><strong>Analytics Hub Team</strong></p>
            <p style="color: #6c757d; margin: 0; font-size: 12px;">This email was sent to {{email}}. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: 'Welcome to Analytics Hub! Hello {{name}}, your account has been successfully created. You can now access your dashboard and start exploring our analytics platform. Login at: {{loginUrl}}',
  },
  
  passwordReset: {
    subject: 'Analytics Hub - Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border: 2px solid #ffffff; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #ffffff; font-size: 24px;">🔒</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Password Reset Request</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Secure your account with a new password</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello <strong>{{name}}</strong>,</p>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We received a request to reset your password for your Analytics Hub account. If you made this request, click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetUrl}}" style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);">Reset My Password</a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;"><strong>⏰ Time Sensitive:</strong> This password reset link will expire in <strong>{{expiryTime}} minutes</strong> for security reasons.</p>
            </div>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #721c24; margin: 0; font-size: 14px; line-height: 1.5;"><strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged. Consider reviewing your account security.</p>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">For your security, this request was made from IP address: <code style="background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px;">{{requestIP}}</code></p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0 0 10px; font-size: 14px;">Best regards,<br><strong>Analytics Hub Security Team</strong></p>
            <p style="color: #6c757d; margin: 0; font-size: 12px;">If you need help, contact our support team immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: 'Password Reset Request for Analytics Hub. Hello {{name}}, click this link to reset your password: {{resetUrl}}. This link expires in {{expiryTime}} minutes. If you didn\'t request this, please ignore this email.',
  },
  
  invitation: {
    subject: 'You\'re Invited to Join Analytics Hub',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Analytics Hub Invitation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border: 2px solid #ffffff; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #ffffff; font-size: 24px;">📊</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">You're Invited!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Join the Analytics Hub platform</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello,</p>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;"><strong>{{inviterName}}</strong> has invited you to join Analytics Hub with the role of <strong>{{role}}</strong>.</p>
            
            <div style="background-color: #e8f5e8; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #28a745; margin: 0 0 10px; font-size: 18px;">Your Role: {{role}}</h3>
              <p style="color: #333333; margin: 0; line-height: 1.6;">As a {{role}}, you'll have access to powerful analytics tools and insights to help drive data-driven decisions.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{invitationUrl}}" style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);">Accept Invitation</a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;"><strong>⏰ Limited Time:</strong> This invitation will expire in <strong>{{expiryTime}} hours</strong>. Please accept it soon to secure your access.</p>
            </div>
            
            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h4 style="color: #0c5460; margin: 0 0 10px; font-size: 16px;">What happens next?</h4>
              <ol style="color: #0c5460; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Click the invitation link above</li>
                <li>Create your secure password</li>
                <li>Complete your profile setup</li>
                <li>Start exploring Analytics Hub</li>
              </ol>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0 0 10px; font-size: 14px;">Best regards,<br><strong>Analytics Hub Team</strong></p>
            <p style="color: #6c757d; margin: 0; font-size: 12px;">This invitation was sent by {{inviterName}}. If you believe this was sent in error, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: 'Invitation to Analytics Hub. {{inviterName}} has invited you to join Analytics Hub with the role of {{role}}. Accept your invitation at: {{invitationUrl}}. This invitation expires in {{expiryTime}} hours.',
  },
  
  temporaryPassword: {
    subject: 'Analytics Hub - Temporary Password Created',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Temporary Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border: 2px solid #ffffff; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #ffffff; font-size: 24px;">🔑</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Temporary Password</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Your account is ready for first login</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello <strong>{{name}}</strong>,</p>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Your Analytics Hub account has been created with a temporary password. For security reasons, you'll need to update this password on your first login.</p>
            
            <div style="background-color: #f8f9fa; border: 2px solid #FF7A00; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
              <h3 style="color: #FF7A00; margin: 0 0 15px; font-size: 18px;">Your Login Credentials</h3>
              <p style="color: #333333; margin: 0 0 10px; font-size: 14px;"><strong>Email:</strong> {{email}}</p>
              <p style="color: #333333; margin: 0; font-size: 14px;"><strong>Temporary Password:</strong></p>
              <div style="background-color: #ffffff; border: 1px solid #dee2e6; padding: 15px; margin: 10px 0; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #dc3545; letter-spacing: 2px;">{{temporaryPassword}}</div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="display: inline-block; background-color: #FF7A00; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(255, 122, 0, 0.3);">Login Now</a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;"><strong>⚠️ Important:</strong> You must change this temporary password on your first login. The system will prompt you to create a new, secure password.</p>
            </div>
            
            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h4 style="color: #0c5460; margin: 0 0 10px; font-size: 16px;">Security Guidelines:</h4>
              <ul style="color: #0c5460; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Use a strong, unique password</li>
                <li>Include uppercase, lowercase, numbers, and symbols</li>
                <li>Don't reuse passwords from other accounts</li>
                <li>Keep your credentials confidential</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0 0 10px; font-size: 14px;">Best regards,<br><strong>Analytics Hub Team</strong></p>
            <p style="color: #6c757d; margin: 0; font-size: 12px;">If you didn't expect this email or have security concerns, contact our support team immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: 'Analytics Hub - Temporary Password. Hello {{name}}, your account has been created with a temporary password: {{temporaryPassword}}. Please login at {{loginUrl}} and change your password immediately for security.',
  },
  
  notification: {
    subject: 'Analytics Hub - {{title}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{title}}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0E0E44; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border: 2px solid #ffffff; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #ffffff; font-size: 24px;">🔔</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">{{title}}</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Analytics Hub Notification</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello <strong>{{name}}</strong>,</p>
            
            <div style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              {{content}}
            </div>
            
            <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #1976d2; margin: 0; font-size: 14px; line-height: 1.5;">This notification was sent from Analytics Hub. If you have any questions, please contact our support team.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0 0 10px; font-size: 14px;">Best regards,<br><strong>Analytics Hub Team</strong></p>
            <p style="color: #6c757d; margin: 0; font-size: 12px;">{{timestamp}}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: '{{title}} - Analytics Hub Notification. Hello {{name}}, {{content}}',
  },
};

// Replace template variables
const replaceTemplateVariables = (template: string, variables: Record<string, string>): string => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
};

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    // Get template if specified
    let subject = options.subject;
    let html = options.html;
    let text = options.text;
    
    if (options.template && emailTemplates[options.template]) {
      const template = emailTemplates[options.template];
      subject = options.subject || template.subject;
      html = template.html;
      text = template.text;
      
      // Replace variables in template
      if (options.variables) {
        subject = replaceTemplateVariables(subject, options.variables);
        html = replaceTemplateVariables(html, options.variables);
        text = replaceTemplateVariables(text, options.variables);
      }
    }
    
    const mailOptions = {
      from: options.from || process.env.SMTP_FROM || 'noreply@analyticshub.com',
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject,
      html,
      text,
      attachments: options.attachments,
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Send welcome email
export const sendWelcomeEmail = async (
  to: string,
  name: string,
  loginUrl: string
): Promise<boolean> => {
  return sendEmail({
    to,
    template: 'welcome',
    variables: {
      name,
      loginUrl,
      email: to,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetUrl: string,
  expiryTime: string = '30',
  requestIP?: string
): Promise<boolean> => {
  return sendEmail({
    to,
    template: 'passwordReset',
    variables: {
      name,
      resetUrl,
      expiryTime,
      requestIP: requestIP || 'Unknown',
    },
  });
};

// Send invitation email
export const sendInvitationEmail = async (
  to: string,
  inviterName: string,
  role: string,
  invitationUrl: string,
  expiryTime: string = '24'
): Promise<boolean> => {
  return sendEmail({
    to,
    template: 'invitation',
    variables: {
      inviterName,
      role,
      invitationUrl,
      expiryTime,
    },
  });
};

// Send temporary password email
export const sendTemporaryPasswordEmail = async (
  to: string,
  name: string,
  temporaryPassword: string,
  loginUrl: string
): Promise<boolean> => {
  return sendEmail({
    to,
    template: 'temporaryPassword',
    variables: {
      name,
      temporaryPassword,
      loginUrl,
      email: to,
    },
  });
};

// Send notification email
export const sendNotificationEmail = async (
  to: string,
  name: string,
  title: string,
  content: string
): Promise<boolean> => {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  return sendEmail({
    to,
    template: 'notification',
    variables: {
      name,
      title,
      content,
      timestamp,
    },
  });
};

// Test email connection
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email connection test failed:', error);
    return false;
  }
};

// Send bulk emails
export const sendBulkEmails = async (
  emails: EmailOptions[]
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;
  
  for (const email of emails) {
    const result = await sendEmail(email);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed };
};

// Email queue for rate limiting
class EmailQueue {
  private queue: EmailOptions[] = [];
  private processing = false;
  private rateLimit = 10; // emails per minute
  
  add(email: EmailOptions): void {
    this.queue.push(email);
    this.process();
  }
  
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const email = this.queue.shift();
      if (email) {
        await sendEmail(email);
        // Rate limiting: wait 6 seconds between emails (10 per minute)
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }
    
    this.processing = false;
  }
}

export const emailQueue = new EmailQueue();

// Enhanced email functions using database templates
export async function sendWelcomeEmailFromTemplate(to: string, variables: Record<string, any>) {
  try {
    await sendTemplatedEmail('welcome', to, variables);
  } catch (error) {
    console.error('Failed to send welcome email from template, falling back to hardcoded template:', error);
    // Fallback to existing hardcoded template
    await sendWelcomeEmail(to, variables.name, variables.loginUrl);
  }
}

export async function sendPasswordResetEmailFromTemplate(to: string, variables: Record<string, any>) {
  try {
    await sendTemplatedEmail('password_reset', to, variables);
  } catch (error) {
    console.error('Failed to send password reset email from template, falling back to hardcoded template:', error);
    // Fallback to existing hardcoded template
    await sendPasswordResetEmail(to, variables.name || variables.firstName, variables.resetUrl, variables.expiryTime, variables.requestIP);
  }
}

export async function sendInvitationEmailFromTemplate(to: string, variables: Record<string, any>) {
  try {
    await sendTemplatedEmail('invitation', to, variables);
  } catch (error) {
    console.error('Failed to send invitation email from template:', error);
    throw error;
  }
}

export async function sendSuspensionEmailFromTemplate(to: string, variables: Record<string, any>) {
  try {
    await sendTemplatedEmail('suspension', to, variables);
  } catch (error) {
    console.error('Failed to send suspension email from template:', error);
    throw error;
  }
}

export async function sendAnnouncementEmailFromTemplate(to: string, variables: Record<string, any>) {
  try {
    await sendTemplatedEmail('announcement', to, variables);
  } catch (error) {
    console.error('Failed to send announcement email from template:', error);
    throw error;
  }
}

// Function to check if a template exists in database
export async function hasEmailTemplate(templateName: string): Promise<boolean> {
  try {
    const template = await getEmailTemplate(templateName);
    return !!template;
  } catch (error) {
    return false;
  }
}