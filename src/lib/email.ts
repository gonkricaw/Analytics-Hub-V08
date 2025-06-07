import nodemailer from 'nodemailer';
import { EmailConfig, EmailTemplate, EmailOptions } from '@/types';

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

// Email templates
const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Welcome to Analytics Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF7A00;">Welcome to Analytics Hub!</h1>
        <p>Hello {{name}},</p>
        <p>Welcome to Analytics Hub! Your account has been successfully created.</p>
        <p>You can now access your dashboard and start exploring our analytics platform.</p>
        <a href="{{loginUrl}}" style="background-color: #FF7A00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
        <p>Best regards,<br>Analytics Hub Team</p>
      </div>
    `,
    text: 'Welcome to Analytics Hub! Hello {{name}}, your account has been successfully created. Login at: {{loginUrl}}',
  },
  passwordReset: {
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF7A00;">Password Reset Request</h1>
        <p>Hello {{name}},</p>
        <p>You have requested to reset your password. Click the button below to reset it:</p>
        <a href="{{resetUrl}}" style="background-color: #FF7A00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in {{expiryTime}} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Analytics Hub Team</p>
      </div>
    `,
    text: 'Password Reset Request. Hello {{name}}, click this link to reset your password: {{resetUrl}}. Link expires in {{expiryTime}} minutes.',
  },
  invitation: {
    subject: 'Invitation to Analytics Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF7A00;">You're Invited to Analytics Hub!</h1>
        <p>Hello,</p>
        <p>{{inviterName}} has invited you to join Analytics Hub with the role of {{role}}.</p>
        <p>Click the button below to accept the invitation and create your account:</p>
        <a href="{{invitationUrl}}" style="background-color: #FF7A00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        <p>This invitation will expire in {{expiryTime}} hours.</p>
        <p>Best regards,<br>Analytics Hub Team</p>
      </div>
    `,
    text: 'Invitation to Analytics Hub. {{inviterName}} has invited you to join with role {{role}}. Accept at: {{invitationUrl}}. Expires in {{expiryTime}} hours.',
  },
  notification: {
    subject: 'Analytics Hub Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF7A00;">{{title}}</h1>
        <p>Hello {{name}},</p>
        <div>{{content}}</div>
        <p>Best regards,<br>Analytics Hub Team</p>
      </div>
    `,
    text: '{{title}}. Hello {{name}}, {{content}}',
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
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetUrl: string,
  expiryTime: string = '30'
): Promise<boolean> => {
  return sendEmail({
    to,
    template: 'passwordReset',
    variables: {
      name,
      resetUrl,
      expiryTime,
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

// Send notification email
export const sendNotificationEmail = async (
  to: string,
  name: string,
  title: string,
  content: string
): Promise<boolean> => {
  return sendEmail({
    to,
    template: 'notification',
    variables: {
      name,
      title,
      content,
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