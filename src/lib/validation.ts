import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

const urlSchema = z.string().url('Invalid URL format');

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// User management schemas
export const userProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: urlSchema.optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  avatar: z.string().optional(),
});

export const createUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  roleId: z.string().uuid('Invalid role ID'),
  isActive: z.boolean().default(true),
  sendWelcomeEmail: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  email: emailSchema.optional(),
  roleId: z.string().uuid('Invalid role ID').optional(),
  isActive: z.boolean().optional(),
});

export const inviteUserSchema = z.object({
  email: emailSchema,
  roleId: z.string().uuid('Invalid role ID'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
  expiresIn: z.number().min(1).max(168).default(24), // 1-168 hours
});

// Role and permission schemas
export const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  permissions: z.array(z.string().uuid('Invalid permission ID')),
  isActive: z.boolean().default(true),
});

export const updateRoleSchema = z.object({
  id: z.string().uuid('Invalid role ID'),
  name: z.string().min(2, 'Role name must be at least 2 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  permissions: z.array(z.string().uuid('Invalid permission ID')).optional(),
  isActive: z.boolean().optional(),
});

// Content management schemas
export const createContentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().max(300, 'Excerpt must be less than 300 characters').optional(),
  slug: z.string().min(3, 'Slug must be at least 3 characters').optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  type: z.enum(['page', 'post', 'article', 'documentation']).default('post'),
  categoryIds: z.array(z.string().uuid('Invalid category ID')).optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().optional(),
  metaTitle: z.string().max(60, 'Meta title must be less than 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
  publishedAt: z.date().optional(),
});

export const updateContentSchema = z.object({
  id: z.string().uuid('Invalid content ID'),
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  excerpt: z.string().max(300, 'Excerpt must be less than 300 characters').optional(),
  slug: z.string().min(3, 'Slug must be at least 3 characters').optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  type: z.enum(['page', 'post', 'article', 'documentation']).optional(),
  categoryIds: z.array(z.string().uuid('Invalid category ID')).optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().optional(),
  metaTitle: z.string().max(60, 'Meta title must be less than 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
  publishedAt: z.date().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  slug: z.string().min(2, 'Slug must be at least 2 characters').optional(),
  parentId: z.string().uuid('Invalid parent category ID').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Dashboard schemas
export const createDashboardSchema = z.object({
  name: z.string().min(3, 'Dashboard name must be at least 3 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  layout: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export const updateDashboardSchema = z.object({
  id: z.string().uuid('Invalid dashboard ID'),
  name: z.string().min(3, 'Dashboard name must be at least 3 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  layout: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export const createDashboardItemSchema = z.object({
  dashboardId: z.string().uuid('Invalid dashboard ID'),
  type: z.enum(['chart', 'table', 'metric', 'text', 'image']),
  title: z.string().min(1, 'Title is required'),
  config: z.record(z.any()),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
  }),
  dataSource: z.string().optional(),
  refreshInterval: z.number().min(0).optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.any().refine(file => file instanceof File, 'File is required'),
  category: z.enum(['avatar', 'content', 'document', 'image', 'other']).default('other'),
  isPublic: z.boolean().default(false),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export const updateFileSchema = z.object({
  id: z.string().uuid('Invalid file ID'),
  filename: z.string().min(1, 'Filename is required').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isPublic: z.boolean().optional(),
  category: z.enum(['avatar', 'content', 'document', 'image', 'other']).optional(),
});

// System settings schemas
export const updateSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required').optional(),
  siteDescription: z.string().max(500, 'Description must be less than 500 characters').optional(),
  siteUrl: urlSchema.optional(),
  adminEmail: emailSchema.optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  maintenanceMode: z.boolean().optional(),
  registrationEnabled: z.boolean().optional(),
  emailVerificationRequired: z.boolean().optional(),
  maxLoginAttempts: z.number().min(1).max(10).optional(),
  sessionTimeout: z.number().min(1).max(1440).optional(), // minutes
  passwordResetExpiry: z.number().min(1).max(1440).optional(), // minutes
  fileUploadMaxSize: z.number().min(1).max(100).optional(), // MB
  allowedFileTypes: z.array(z.string()).optional(),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'users', 'content', 'files']).default('all'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const filterSchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).optional(),
  role: z.string().uuid('Invalid role ID').optional(),
  category: z.string().uuid('Invalid category ID').optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// API schemas
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  phone: phoneSchema.optional(),
  company: z.string().optional(),
});

// Newsletter subscription schema
export const newsletterSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  interests: z.array(z.string()).optional(),
});

// Comment schema
export const createCommentSchema = z.object({
  contentId: z.string().uuid('Invalid content ID'),
  content: z.string().min(1, 'Comment content is required'),
  parentId: z.string().uuid('Invalid parent comment ID').optional(),
});

export const updateCommentSchema = z.object({
  id: z.string().uuid('Invalid comment ID'),
  content: z.string().min(1, 'Comment content is required'),
});

// Analytics schemas
export const analyticsQuerySchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  metrics: z.array(z.string()).min(1, 'At least one metric is required'),
  dimensions: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
  limit: z.number().min(1).max(1000).default(100),
});

// Webhook schema
export const webhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().min(8, 'Secret must be at least 8 characters').optional(),
  isActive: z.boolean().default(true),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateDashboardInput = z.infer<typeof createDashboardSchema>;
export type UpdateDashboardInput = z.infer<typeof updateDashboardSchema>;
export type CreateDashboardItemInput = z.infer<typeof createDashboardItemSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type FilterInput = z.infer<typeof filterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type WebhookInput = z.infer<typeof webhookSchema>;