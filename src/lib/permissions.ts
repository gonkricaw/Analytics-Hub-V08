import { PERMISSIONS, ROLES } from './constants';
import { User, Role, Permission } from '@/types';

// Permission checker class
export class PermissionChecker {
  private user: User | null;
  private userPermissions: Set<string>;
  
  constructor(user: User | null) {
    this.user = user;
    this.userPermissions = new Set();
    this.loadUserPermissions();
  }
  
  private loadUserPermissions(): void {
    if (!this.user || !this.user.role) {
      return;
    }
    
    // Load permissions from user's role
    if (this.user.role.permissions) {
      this.user.role.permissions.forEach(permission => {
        this.userPermissions.add(permission.name);
      });
    }
  }
  
  // Check if user has a specific permission
  hasPermission(permission: string): boolean {
    if (!this.user || !this.user.isActive) {
      return false;
    }
    
    // Super admin has all permissions
    if (this.user.role?.name === ROLES.SUPER_ADMIN) {
      return true;
    }
    
    return this.userPermissions.has(permission);
  }
  
  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }
  
  // Check if user has all of the specified permissions
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }
  
  // Check if user has a specific role
  hasRole(roleName: string): boolean {
    if (!this.user || !this.user.role) {
      return false;
    }
    
    return this.user.role.name === roleName;
  }
  
  // Check if user has any of the specified roles
  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some(roleName => this.hasRole(roleName));
  }
  
  // Check if user is admin (Admin or Super Admin)
  isAdmin(): boolean {
    return this.hasAnyRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  }
  
  // Check if user is super admin
  isSuperAdmin(): boolean {
    return this.hasRole(ROLES.SUPER_ADMIN);
  }
  
  // Check if user can manage other users
  canManageUsers(): boolean {
    return this.hasPermission(PERMISSIONS.USER_MANAGE);
  }
  
  // Check if user can manage roles
  canManageRoles(): boolean {
    return this.hasPermission(PERMISSIONS.ROLE_MANAGE);
  }
  
  // Check if user can manage content
  canManageContent(): boolean {
    return this.hasPermission(PERMISSIONS.CONTENT_MANAGE);
  }
  
  // Check if user can manage system settings
  canManageSettings(): boolean {
    return this.hasPermission(PERMISSIONS.SETTING_MANAGE);
  }
  
  // Check if user can access admin panel
  canAccessAdmin(): boolean {
    return this.isAdmin() || this.hasAnyPermission([
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.ROLE_MANAGE,
      PERMISSIONS.CONTENT_MANAGE,
      PERMISSIONS.SETTING_MANAGE,
    ]);
  }
  
  // Check if user can perform action on resource
  canPerformAction(resource: string, action: string): boolean {
    const permission = `${resource}.${action}`;
    return this.hasPermission(permission);
  }
  
  // Check if user owns the resource
  ownsResource(resourceOwnerId: string): boolean {
    if (!this.user) {
      return false;
    }
    
    return this.user.id === resourceOwnerId;
  }
  
  // Check if user can access resource (owns it or has permission)
  canAccessResource(resourceOwnerId: string, permission: string): boolean {
    return this.ownsResource(resourceOwnerId) || this.hasPermission(permission);
  }
  
  // Get all user permissions
  getAllPermissions(): string[] {
    return Array.from(this.userPermissions);
  }
  
  // Get user role
  getUserRole(): string | null {
    return this.user?.role?.name || null;
  }
}

// Helper functions

// Create permission checker instance
export const createPermissionChecker = (user: User | null): PermissionChecker => {
  return new PermissionChecker(user);
};

// Check if user has permission (standalone function)
export const hasPermission = (user: User | null, permission: string): boolean => {
  const checker = createPermissionChecker(user);
  return checker.hasPermission(permission);
};

// Check if user has role (standalone function)
export const hasRole = (user: User | null, roleName: string): boolean => {
  const checker = createPermissionChecker(user);
  return checker.hasRole(roleName);
};

// Check if user is admin (standalone function)
export const isAdmin = (user: User | null): boolean => {
  const checker = createPermissionChecker(user);
  return checker.isAdmin();
};

// Check if user is super admin (standalone function)
export const isSuperAdmin = (user: User | null): boolean => {
  const checker = createPermissionChecker(user);
  return checker.isSuperAdmin();
};

// Permission middleware for API routes
export const requirePermission = (permission: string) => {
  return (user: User | null): boolean => {
    const checker = createPermissionChecker(user);
    return checker.hasPermission(permission);
  };
};

// Role middleware for API routes
export const requireRole = (roleName: string) => {
  return (user: User | null): boolean => {
    const checker = createPermissionChecker(user);
    return checker.hasRole(roleName);
  };
};

// Admin middleware for API routes
export const requireAdmin = (user: User | null): boolean => {
  const checker = createPermissionChecker(user);
  return checker.isAdmin();
};

// Super admin middleware for API routes
export const requireSuperAdmin = (user: User | null): boolean => {
  const checker = createPermissionChecker(user);
  return checker.isSuperAdmin();
};

// Resource ownership middleware
export const requireOwnership = (resourceOwnerId: string) => {
  return (user: User | null): boolean => {
    const checker = createPermissionChecker(user);
    return checker.ownsResource(resourceOwnerId);
  };
};

// Resource access middleware (ownership or permission)
export const requireResourceAccess = (resourceOwnerId: string, permission: string) => {
  return (user: User | null): boolean => {
    const checker = createPermissionChecker(user);
    return checker.canAccessResource(resourceOwnerId, permission);
  };
};

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE,
  ],
  ROLE_MANAGEMENT: [
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE,
    PERMISSIONS.ROLE_MANAGE,
  ],
  CONTENT_MANAGEMENT: [
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CONTENT_PUBLISH,
    PERMISSIONS.CONTENT_MANAGE,
  ],
  DASHBOARD_MANAGEMENT: [
    PERMISSIONS.DASHBOARD_CREATE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.DASHBOARD_UPDATE,
    PERMISSIONS.DASHBOARD_DELETE,
    PERMISSIONS.DASHBOARD_MANAGE,
  ],
  FILE_MANAGEMENT: [
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_READ,
    PERMISSIONS.FILE_UPDATE,
    PERMISSIONS.FILE_DELETE,
    PERMISSIONS.FILE_MANAGE,
  ],
  SYSTEM_ADMINISTRATION: [
    PERMISSIONS.SETTING_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.SYSTEM_MAINTENANCE,
  ],
} as const;

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    ...PERMISSION_GROUPS.USER_MANAGEMENT,
    ...PERMISSION_GROUPS.ROLE_MANAGEMENT,
    ...PERMISSION_GROUPS.CONTENT_MANAGEMENT,
    ...PERMISSION_GROUPS.DASHBOARD_MANAGEMENT,
    ...PERMISSION_GROUPS.FILE_MANAGEMENT,
    PERMISSIONS.SETTING_READ,
    PERMISSIONS.AUDIT_READ,
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.USER_READ,
    ...PERMISSION_GROUPS.CONTENT_MANAGEMENT,
    PERMISSIONS.DASHBOARD_CREATE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.DASHBOARD_UPDATE,
    PERMISSIONS.DASHBOARD_DELETE,
    ...PERMISSION_GROUPS.FILE_MANAGEMENT,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_UPDATE,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.FILE_READ,
    PERMISSIONS.CATEGORY_READ,
  ],
} as const;

// Check if permission exists
export const isValidPermission = (permission: string): boolean => {
  return Object.values(PERMISSIONS).includes(permission as any);
};

// Check if role exists
export const isValidRole = (roleName: string): boolean => {
  return Object.values(ROLES).includes(roleName as any);
};

// Get permissions for a role
export const getRolePermissions = (roleName: string): string[] => {
  return DEFAULT_ROLE_PERMISSIONS[roleName as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
};

// Check if user can perform bulk operations
export const canPerformBulkOperation = (user: User | null, operation: string): boolean => {
  const checker = createPermissionChecker(user);
  
  // Only admins can perform bulk operations
  if (!checker.isAdmin()) {
    return false;
  }
  
  // Check specific bulk operation permissions
  switch (operation) {
    case 'delete_users':
      return checker.hasPermission(PERMISSIONS.USER_DELETE);
    case 'delete_content':
      return checker.hasPermission(PERMISSIONS.CONTENT_DELETE);
    case 'export_data':
      return checker.hasPermission(PERMISSIONS.AUDIT_EXPORT);
    default:
      return false;
  }
};

// Permission decorator for class methods
export const RequirePermission = (permission: string) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const user = this.user || args[0]?.user;
      const checker = createPermissionChecker(user);
      
      if (!checker.hasPermission(permission)) {
        throw new Error('Insufficient permissions');
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
};

// Role decorator for class methods
export const RequireRole = (roleName: string) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const user = this.user || args[0]?.user;
      const checker = createPermissionChecker(user);
      
      if (!checker.hasRole(roleName)) {
        throw new Error('Insufficient role');
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
};

// Permission checker is already exported as a class above