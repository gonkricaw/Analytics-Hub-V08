import { ROLES, PERMISSIONS } from '@/lib/constants'
import { PERMISSION_GROUPS } from '@/lib/permissions'

// Role hierarchy definition (higher number = higher privilege)
export const ROLE_HIERARCHY = {
  [ROLES.OFFICER]: 1,
  [ROLES.LEADER]: 2,
  [ROLES.MANAGER]: 3,
  [ROLES.MANAGEMENT]: 4,
  [ROLES.STAKEHOLDER]: 5,
  [ROLES.ADMIN]: 6,
  [ROLES.SUPER_ADMIN]: 7
} as const

// Role inheritance mapping - each role inherits permissions from lower roles
export const ROLE_INHERITANCE = {
  [ROLES.SUPER_ADMIN]: [
    ROLES.ADMIN,
    ROLES.STAKEHOLDER,
    ROLES.MANAGEMENT,
    ROLES.MANAGER,
    ROLES.LEADER,
    ROLES.OFFICER
  ],
  [ROLES.ADMIN]: [
    ROLES.STAKEHOLDER,
    ROLES.MANAGEMENT,
    ROLES.MANAGER,
    ROLES.LEADER,
    ROLES.OFFICER
  ],
  [ROLES.STAKEHOLDER]: [
    ROLES.MANAGEMENT,
    ROLES.MANAGER,
    ROLES.LEADER,
    ROLES.OFFICER
  ],
  [ROLES.MANAGEMENT]: [
    ROLES.MANAGER,
    ROLES.LEADER,
    ROLES.OFFICER
  ],
  [ROLES.MANAGER]: [
    ROLES.LEADER,
    ROLES.OFFICER
  ],
  [ROLES.LEADER]: [
    ROLES.OFFICER
  ],
  [ROLES.OFFICER]: []
} as const

// Base permissions for each role (without inheritance)
export const BASE_ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Super admin has all permissions
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.ADMIN]: [
    ...PERMISSION_GROUPS.USER_MANAGEMENT,
    ...PERMISSION_GROUPS.ROLE_MANAGEMENT,
    ...PERMISSION_GROUPS.CONTENT_MANAGEMENT,
    PERMISSIONS.DASHBOARD_CREATE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.DASHBOARD_UPDATE,
    PERMISSIONS.DASHBOARD_DELETE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_CREATE,
    PERMISSIONS.ANALYTICS_UPDATE,
    PERMISSIONS.ANALYTICS_DELETE,
    PERMISSIONS.SETTING_READ,
    PERMISSIONS.SETTING_UPDATE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.MENU_READ,
    PERMISSIONS.MENU_CREATE,
    PERMISSIONS.MENU_UPDATE,
    PERMISSIONS.MENU_DELETE
  ],
  [ROLES.STAKEHOLDER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.ROLE_READ,
    ...PERMISSION_GROUPS.CONTENT_MANAGEMENT,
    PERMISSIONS.DASHBOARD_CREATE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.DASHBOARD_UPDATE,
    PERMISSIONS.DASHBOARD_DELETE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_CREATE,
    PERMISSIONS.ANALYTICS_UPDATE,
    PERMISSIONS.SETTING_READ,
    PERMISSIONS.AUDIT_READ
  ],
  [ROLES.MANAGEMENT]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.DASHBOARD_CREATE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.DASHBOARD_UPDATE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_CREATE,
    PERMISSIONS.ANALYTICS_UPDATE
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.DASHBOARD_CREATE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.DASHBOARD_UPDATE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_CREATE
  ],
  [ROLES.LEADER]: [
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.DASHBOARD_UPDATE,
    PERMISSIONS.ANALYTICS_READ
  ],
  [ROLES.OFFICER]: [
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ANALYTICS_READ
  ]
} as const

// Get all permissions for a role including inherited permissions
export function getRolePermissions(roleName: string): string[] {
  const basePermissions = BASE_ROLE_PERMISSIONS[roleName as keyof typeof BASE_ROLE_PERMISSIONS] || []
  const inheritedRoles = ROLE_INHERITANCE[roleName as keyof typeof ROLE_INHERITANCE] || []
  
  // Collect permissions from inherited roles
  const inheritedPermissions = inheritedRoles.flatMap(inheritedRole => 
    BASE_ROLE_PERMISSIONS[inheritedRole as keyof typeof BASE_ROLE_PERMISSIONS] || []
  )
  
  // Combine and deduplicate permissions
  const allPermissions = [...new Set([...basePermissions, ...inheritedPermissions])]
  
  return allPermissions
}

// Check if a role inherits from another role
export function roleInheritsFrom(childRole: string, parentRole: string): boolean {
  const inheritedRoles = ROLE_INHERITANCE[childRole as keyof typeof ROLE_INHERITANCE] || []
  return inheritedRoles.includes(parentRole)
}

// Get role hierarchy level
export function getRoleLevel(roleName: string): number {
  return ROLE_HIERARCHY[roleName as keyof typeof ROLE_HIERARCHY] || 0
}

// Check if role A has higher privilege than role B
export function isHigherRole(roleA: string, roleB: string): boolean {
  return getRoleLevel(roleA) > getRoleLevel(roleB)
}

// Check if role A has equal or higher privilege than role B
export function isEqualOrHigherRole(roleA: string, roleB: string): boolean {
  return getRoleLevel(roleA) >= getRoleLevel(roleB)
}

// Get all roles that a role can manage (lower hierarchy roles)
export function getManageableRoles(roleName: string): string[] {
  const currentLevel = getRoleLevel(roleName)
  return Object.keys(ROLE_HIERARCHY).filter(role => 
    getRoleLevel(role) < currentLevel
  )
}

// Get all roles that can manage a specific role (higher hierarchy roles)
export function getManagerRoles(roleName: string): string[] {
  const currentLevel = getRoleLevel(roleName)
  return Object.keys(ROLE_HIERARCHY).filter(role => 
    getRoleLevel(role) > currentLevel
  )
}

// Check if user with roleA can manage user with roleB
export function canManageRole(managerRole: string, targetRole: string): boolean {
  return isHigherRole(managerRole, targetRole)
}

// Get effective permissions for a user (including role inheritance)
export function getEffectivePermissions(userRole: string, additionalPermissions: string[] = []): string[] {
  const rolePermissions = getRolePermissions(userRole)
  const allPermissions = [...new Set([...rolePermissions, ...additionalPermissions])]
  return allPermissions
}

// Validate role assignment (ensure user can only assign roles they can manage)
export function validateRoleAssignment(assignerRole: string, targetRole: string): boolean {
  // Super admin can assign any role
  if (assignerRole === ROLES.SUPER_ADMIN) {
    return true
  }
  
  // Admin can assign any role except super admin
  if (assignerRole === ROLES.ADMIN && targetRole !== ROLES.SUPER_ADMIN) {
    return true
  }
  
  // Other roles can only assign roles lower than their own
  return canManageRole(assignerRole, targetRole)
}

// Get role display information
export function getRoleDisplayInfo(roleName: string) {
  const roleInfo = {
    [ROLES.SUPER_ADMIN]: {
      name: 'Super Administrator',
      description: 'Full system access with all permissions',
      color: 'red',
      icon: 'mdi:shield-crown'
    },
    [ROLES.ADMIN]: {
      name: 'Administrator',
      description: 'System administration and user management',
      color: 'orange',
      icon: 'mdi:shield-account'
    },
    [ROLES.STAKEHOLDER]: {
      name: 'Stakeholder',
      description: 'High-level access to analytics and content',
      color: 'purple',
      icon: 'mdi:account-star'
    },
    [ROLES.MANAGEMENT]: {
      name: 'Management',
      description: 'Content and analytics management',
      color: 'blue',
      icon: 'mdi:account-tie'
    },
    [ROLES.MANAGER]: {
      name: 'Manager',
      description: 'Team and content management',
      color: 'green',
      icon: 'mdi:account-supervisor'
    },
    [ROLES.LEADER]: {
      name: 'Leader',
      description: 'Team leadership and content access',
      color: 'yellow',
      icon: 'mdi:account-group'
    },
    [ROLES.OFFICER]: {
      name: 'Officer',
      description: 'Basic content and dashboard access',
      color: 'gray',
      icon: 'mdi:account'
    }
  }
  
  return roleInfo[roleName as keyof typeof roleInfo] || {
    name: roleName,
    description: 'Custom role',
    color: 'gray',
    icon: 'mdi:account'
  }
}

// Export role hierarchy for external use
export { ROLE_HIERARCHY as roleHierarchy }
export { ROLE_INHERITANCE as roleInheritance }
export { BASE_ROLE_PERMISSIONS as baseRolePermissions }