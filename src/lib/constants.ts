// Application constants

// System roles
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
} as const;

// Permission categories
export const PERMISSION_CATEGORIES = {
  USER: 'user',
  ROLE: 'role',
  CONTENT: 'content',
  CATEGORY: 'category',
  DASHBOARD: 'dashboard',
  FILE: 'file',
  SETTING: 'setting',
  AUDIT: 'audit',
  SYSTEM: 'system',
} as const;

// Permission actions
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  VIEW: 'view',
  EDIT: 'edit',
  PUBLISH: 'publish',
  ARCHIVE: 'archive',
  RESTORE: 'restore',
  EXPORT: 'export',
  IMPORT: 'import',
} as const;

// All permissions list
export const PERMISSIONS = {
  // User permissions
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_MANAGE: 'user.manage',
  USER_VIEW_ALL: 'user.view_all',
  USER_INVITE: 'user.invite',
  USER_ACTIVATE: 'user.activate',
  USER_DEACTIVATE: 'user.deactivate',
  USER_RESET_PASSWORD: 'user.reset_password',
  
  // Role permissions
  ROLE_CREATE: 'role.create',
  ROLE_READ: 'role.read',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  ROLE_MANAGE: 'role.manage',
  ROLE_ASSIGN: 'role.assign',
  
  // Content permissions
  CONTENT_CREATE: 'content.create',
  CONTENT_READ: 'content.read',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_ARCHIVE: 'content.archive',
  CONTENT_RESTORE: 'content.restore',
  CONTENT_VIEW_ALL: 'content.view_all',
  CONTENT_MANAGE: 'content.manage',
  
  // Category permissions
  CATEGORY_CREATE: 'category.create',
  CATEGORY_READ: 'category.read',
  CATEGORY_UPDATE: 'category.update',
  CATEGORY_DELETE: 'category.delete',
  CATEGORY_MANAGE: 'category.manage',
  
  // Dashboard permissions
  DASHBOARD_CREATE: 'dashboard.create',
  DASHBOARD_READ: 'dashboard.read',
  DASHBOARD_UPDATE: 'dashboard.update',
  DASHBOARD_DELETE: 'dashboard.delete',
  DASHBOARD_MANAGE: 'dashboard.manage',
  DASHBOARD_VIEW_ALL: 'dashboard.view_all',
  DASHBOARD_SHARE: 'dashboard.share',
  
  // File permissions
  FILE_UPLOAD: 'file.upload',
  FILE_READ: 'file.read',
  FILE_UPDATE: 'file.update',
  FILE_DELETE: 'file.delete',
  FILE_MANAGE: 'file.manage',
  FILE_VIEW_ALL: 'file.view_all',
  
  // Settings permissions
  SETTING_READ: 'setting.read',
  SETTING_UPDATE: 'setting.update',
  SETTING_MANAGE: 'setting.manage',
  
  // Audit permissions
  AUDIT_READ: 'audit.read',
  AUDIT_EXPORT: 'audit.export',
  
  // System permissions
  SYSTEM_ADMIN: 'system.admin',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_RESTORE: 'system.restore',
} as const;

// Content types
export const CONTENT_TYPES = {
  PAGE: 'page',
  POST: 'post',
  ARTICLE: 'article',
  DOCUMENTATION: 'documentation',
} as const;

// Content statuses
export const CONTENT_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// User statuses
export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const;

// File categories
export const FILE_CATEGORIES = {
  AVATAR: 'avatar',
  CONTENT: 'content',
  DOCUMENT: 'document',
  IMAGE: 'image',
  OTHER: 'other',
} as const;

// Dashboard item types
export const DASHBOARD_ITEM_TYPES = {
  CHART: 'chart',
  TABLE: 'table',
  METRIC: 'metric',
  TEXT: 'text',
  IMAGE: 'image',
} as const;

// Chart types
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  AREA: 'area',
  SCATTER: 'scatter',
  RADAR: 'radar',
} as const;

// Themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

// Languages
export const LANGUAGES = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  IT: 'it',
  PT: 'pt',
  RU: 'ru',
  ZH: 'zh',
  JA: 'ja',
  KO: 'ko',
} as const;

// Timezones (common ones)
export const TIMEZONES = {
  UTC: 'UTC',
  EST: 'America/New_York',
  CST: 'America/Chicago',
  MST: 'America/Denver',
  PST: 'America/Los_Angeles',
  GMT: 'Europe/London',
  CET: 'Europe/Paris',
  JST: 'Asia/Tokyo',
  AEST: 'Australia/Sydney',
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  MEDIUM: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  FULL: 'EEEE, MMMM dd, yyyy',
  ISO: 'yyyy-MM-dd',
  DATETIME: 'MM/dd/yyyy HH:mm',
  TIME: 'HH:mm',
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DEFAULT: 5 * 1024 * 1024, // 5MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  VIDEOS: ['video/mp4', 'video/webm', 'video/ogg'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg'],
} as const;

// API response codes
export const API_RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid or expired token',
  PASSWORD_TOO_WEAK: 'Password does not meet security requirements',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit',
  INVALID_FILE_TYPE: 'File type is not allowed',
  MAINTENANCE_MODE: 'System is currently under maintenance',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_SENT: 'Email sent successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  CONTENT_CREATED: 'Content created successfully',
  CONTENT_UPDATED: 'Content updated successfully',
  CONTENT_DELETED: 'Content deleted successfully',
  CONTENT_PUBLISHED: 'Content published successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Rate limiting
export const RATE_LIMITS = {
  LOGIN: {
    WINDOW: 15 * 60 * 1000, // 15 minutes
    MAX_ATTEMPTS: 5,
  },
  API: {
    WINDOW: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100,
  },
  PASSWORD_RESET: {
    WINDOW: 60 * 60 * 1000, // 1 hour
    MAX_ATTEMPTS: 3,
  },
} as const;

// Session configuration
export const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_THRESHOLD: 60 * 60 * 1000, // 1 hour
  COOKIE_NAME: 'analytics-hub-session',
} as const;

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'passwordReset',
  INVITATION: 'invitation',
  NOTIFICATION: 'notification',
} as const;

// Audit log actions
export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  EXPORT: 'export',
  IMPORT: 'import',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// Dashboard refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  REAL_TIME: 5000, // 5 seconds
  FAST: 30000, // 30 seconds
  MEDIUM: 60000, // 1 minute
  SLOW: 300000, // 5 minutes
  VERY_SLOW: 900000, // 15 minutes
} as const;

// Color palette
export const COLORS = {
  PRIMARY: '#FF7A00',
  SECONDARY: '#0E0E44',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  GRAY: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints (in pixels)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Z-index values
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const;

// Environment types
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// Export all constants as a single object for convenience
export const CONSTANTS = {
  ROLES,
  PERMISSION_CATEGORIES,
  PERMISSION_ACTIONS,
  PERMISSIONS,
  CONTENT_TYPES,
  CONTENT_STATUSES,
  USER_STATUSES,
  FILE_CATEGORIES,
  DASHBOARD_ITEM_TYPES,
  CHART_TYPES,
  THEMES,
  LANGUAGES,
  TIMEZONES,
  DATE_FORMATS,
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES,
  API_RESPONSE_CODES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION_DEFAULTS,
  CACHE_DURATIONS,
  RATE_LIMITS,
  SESSION_CONFIG,
  EMAIL_TEMPLATES,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
  REFRESH_INTERVALS,
  COLORS,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
  Z_INDEX,
  REGEX_PATTERNS,
  ENVIRONMENTS,
} as const;