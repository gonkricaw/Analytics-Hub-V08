import { idbi_users, idbi_roles, idbi_permissions, idbi_content, idbi_categories, idbi_dashboards } from '@prisma/client'

// User Types
export interface User extends idbi_users {
  role: Role
}

export interface UserWithRelations extends idbi_users {
  role: RoleWithPermissions
  sessions?: UserSession[]
  audit_logs?: AuditLog[]
}

export interface CreateUserData {
  email: string
  first_name: string
  last_name: string
  role_id: string
  username?: string
}

export interface UpdateUserData {
  email?: string
  first_name?: string
  last_name?: string
  role_id?: string
  username?: string
  is_active?: boolean
}

export interface UserInvitation {
  id: string
  email: string
  first_name: string
  last_name: string
  role_id: string
  invited_by: string
  invitation_token: string
  expires_at: Date
  accepted_at?: Date
  created_at: Date
}

// Role & Permission Types
export interface Role extends idbi_roles {}

export interface Permission extends idbi_permissions {}

export interface RoleWithPermissions extends idbi_roles {
  role_permissions: {
    permission: Permission
  }[]
}

export interface RolePermission {
  role_id: string
  permission_id: string
}

// Authentication Types
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  invitation_token: string
}

export interface PasswordResetData {
  token: string
  password: string
  confirm_password: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface UserSession {
  id: string
  user_id: string
  token: string
  ip_address?: string
  user_agent?: string
  expires_at: Date
  created_at: Date
}

// Content Types
export interface Content extends idbi_content {
  creator: User
  updater?: User
  categories: ContentCategory[]
}

export interface ContentWithRelations extends idbi_content {
  creator: User
  updater?: User
  categories: {
    category: Category
  }[]
  permissions: ContentPermission[]
}

export interface CreateContentData {
  title: string
  description?: string
  content_type: ContentType
  content_data?: any
  embed_url?: string
  is_public?: boolean
  category_ids?: string[]
}

export interface UpdateContentData {
  title?: string
  description?: string
  content_type?: ContentType
  content_data?: any
  embed_url?: string
  is_active?: boolean
  is_public?: boolean
  category_ids?: string[]
}

export type ContentType = 'dashboard' | 'report' | 'widget' | 'iframe' | 'chart' | 'table'

export interface ContentPermission {
  id: string
  content_id: string
  role_id: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
}

// Category Types
export interface Category extends idbi_categories {}

export interface ContentCategory {
  id: string
  content_id: string
  category_id: string
  category: Category
}

// Dashboard Types
export interface Dashboard extends idbi_dashboards {
  creator: User
  dashboard_items: DashboardItem[]
}

export interface DashboardWithRelations extends idbi_dashboards {
  creator: User
  dashboard_items: {
    content: ContentWithRelations
    position_x: number
    position_y: number
    width: number
    height: number
    order_index: number
  }[]
}

export interface DashboardItem {
  id: string
  dashboard_id: string
  content_id: string
  position_x: number
  position_y: number
  width: number
  height: number
  order_index: number
  content?: Content
}

export interface CreateDashboardData {
  name: string
  description?: string
  layout_data?: any
  is_default?: boolean
}

export interface UpdateDashboardData {
  name?: string
  description?: string
  layout_data?: any
  is_active?: boolean
  is_default?: boolean
}

export interface DashboardLayout {
  columns: number
  rows: number
  gap: number
  items: DashboardLayoutItem[]
}

export interface DashboardLayoutItem {
  id: string
  content_id: string
  x: number
  y: number
  w: number
  h: number
}

// Audit & Security Types
export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource?: string
  resource_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  created_at: Date
  user?: User
}

export interface IPBlacklist {
  id: string
  ip_address: string
  reason?: string
  blocked_at: Date
  blocked_until?: Date
  is_permanent: boolean
  created_by?: string
}

// System Types
export interface SystemSetting {
  id: string
  key: string
  value: string
  description?: string
  is_public: boolean
  created_at: Date
  updated_at: Date
}

export interface FileUpload {
  id: string
  filename: string
  original_name: string
  mime_type: string
  file_size: number
  file_path: string
  uploaded_by: string
  is_public: boolean
  created_at: Date
  uploader: User
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  filter?: Record<string, any>
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'number'
  placeholder?: string
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  options?: { value: string; label: string }[]
  defaultValue?: any
}

export interface FormErrors {
  [key: string]: string
}

// UI Types
export interface MenuItem {
  id: string
  label: string
  icon?: string
  href?: string
  children?: MenuItem[]
  permission?: string
  active?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

export interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
}

// Chart & Analytics Types
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

export interface ChartOptions {
  responsive?: boolean
  maintainAspectRatio?: boolean
  plugins?: {
    legend?: {
      display?: boolean
      position?: 'top' | 'bottom' | 'left' | 'right'
    }
    title?: {
      display?: boolean
      text?: string
    }
  }
  scales?: {
    x?: {
      display?: boolean
      title?: {
        display?: boolean
        text?: string
      }
    }
    y?: {
      display?: boolean
      title?: {
        display?: boolean
        text?: string
      }
    }
  }
}

export interface MetricCard {
  id: string
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon?: string
  color?: string
}

// Error Types
export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: any
}

// Environment Types
export interface EnvironmentConfig {
  NODE_ENV: string
  DATABASE_URL: string
  NEXTAUTH_URL: string
  NEXTAUTH_SECRET: string
  JWT_SECRET: string
  ENCRYPTION_KEY: string
  ENCRYPTION_IV: string
  SMTP_HOST: string
  SMTP_PORT: string
  SMTP_USER: string
  SMTP_PASS: string
  SMTP_FROM: string
  APP_NAME: string
  APP_URL: string
  MAX_LOGIN_ATTEMPTS: string
  RATE_LIMIT_WINDOW: string
  RATE_LIMIT_MAX: string
}