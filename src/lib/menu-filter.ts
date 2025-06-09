import { User } from '@/types'
import { createPermissionChecker } from '@/lib/permissions'
import { PERMISSIONS, ROLES } from '@/lib/constants'

// Menu item interface
export interface MenuItem {
  id: string
  title: string
  icon?: string
  path?: string
  children?: MenuItem[]
  permissions?: string[]
  roles?: string[]
  isActive?: boolean
  order?: number
  level?: number
}

// Filter menu items based on user permissions and roles
export function filterMenuByPermissions(menuItems: MenuItem[], user: User | null): MenuItem[] {
  if (!user) {
    return []
  }

  const permissionChecker = createPermissionChecker(user)

  const filterItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => {
        // Check if item is active
        if (item.isActive === false) {
          return false
        }

        // If no permissions or roles specified, item is accessible to all authenticated users
        if (!item.permissions && !item.roles) {
          return true
        }

        // Check role requirements
        if (item.roles && item.roles.length > 0) {
          const hasRequiredRole = item.roles.some(role => permissionChecker.hasRole(role))
          if (!hasRequiredRole) {
            return false
          }
        }

        // Check permission requirements
        if (item.permissions && item.permissions.length > 0) {
          const hasRequiredPermission = item.permissions.some(permission => 
            permissionChecker.hasPermission(permission)
          )
          if (!hasRequiredPermission) {
            return false
          }
        }

        return true
      })
      .map(item => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined
      }))
      .filter(item => {
        // Remove items that have no accessible children (if they have children)
        if (item.children && item.children.length === 0 && !item.path) {
          return false
        }
        return true
      })
  }

  return filterItems(menuItems)
}

// Get default menu structure
export function getDefaultMenuStructure(): MenuItem[] {
  return [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'mdi:view-dashboard',
      path: '/dashboard',
      order: 1,
      level: 1
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'mdi:chart-line',
      path: '/dashboard/analytics',
      permissions: [PERMISSIONS.ANALYTICS_READ],
      order: 2,
      level: 1
    },
    {
      id: 'content',
      title: 'Content Management',
      icon: 'mdi:file-document-multiple',
      permissions: [PERMISSIONS.CONTENT_READ],
      order: 3,
      level: 1,
      children: [
        {
          id: 'content-list',
          title: 'All Content',
          icon: 'mdi:file-document',
          path: '/dashboard/content',
          permissions: [PERMISSIONS.CONTENT_READ],
          order: 1,
          level: 2
        },
        {
          id: 'content-create',
          title: 'Create Content',
          icon: 'mdi:file-document-plus',
          path: '/dashboard/content/create',
          permissions: [PERMISSIONS.CONTENT_CREATE],
          order: 2,
          level: 2
        }
      ]
    },
    {
      id: 'system',
      title: 'System Management',
      icon: 'mdi:cog',
      roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      order: 4,
      level: 1,
      children: [
        {
          id: 'users',
          title: 'User Management',
          icon: 'mdi:account-multiple',
          path: '/dashboard/system/users',
          permissions: [PERMISSIONS.USER_READ],
          order: 1,
          level: 2
        },
        {
          id: 'roles',
          title: 'Role Management',
          icon: 'mdi:shield-account',
          path: '/dashboard/system/roles',
          permissions: [PERMISSIONS.ROLE_READ],
          order: 2,
          level: 2
        },
        {
          id: 'permissions',
          title: 'Permissions',
          icon: 'mdi:key',
          path: '/dashboard/system/permissions',
          permissions: [PERMISSIONS.PERMISSION_READ],
          order: 3,
          level: 2
        },
        {
          id: 'menus',
          title: 'Menu Management',
          icon: 'mdi:menu',
          path: '/dashboard/system/menus',
          permissions: [PERMISSIONS.MENU_READ],
          order: 4,
          level: 2
        },
        {
          id: 'settings',
          title: 'System Settings',
          icon: 'mdi:cog-outline',
          path: '/dashboard/system/settings',
          permissions: [PERMISSIONS.SETTING_READ],
          order: 5,
          level: 2
        },
        {
          id: 'audit',
          title: 'Audit Logs',
          icon: 'mdi:history',
          path: '/dashboard/system/audit',
          permissions: [PERMISSIONS.AUDIT_READ],
          order: 6,
          level: 2
        }
      ]
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: 'mdi:account',
      path: '/dashboard/profile',
      order: 5,
      level: 1
    }
  ]
}

// Sort menu items by order
export function sortMenuItems(menuItems: MenuItem[]): MenuItem[] {
  const sortItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(item => ({
        ...item,
        children: item.children ? sortItems(item.children) : undefined
      }))
  }

  return sortItems(menuItems)
}

// Get breadcrumb trail for a given path
export function getBreadcrumbTrail(menuItems: MenuItem[], currentPath: string): MenuItem[] {
  const trail: MenuItem[] = []

  const findPath = (items: MenuItem[], path: string, currentTrail: MenuItem[]): boolean => {
    for (const item of items) {
      const newTrail = [...currentTrail, item]
      
      if (item.path === path) {
        trail.push(...newTrail)
        return true
      }
      
      if (item.children && findPath(item.children, path, newTrail)) {
        return true
      }
    }
    return false
  }

  findPath(menuItems, currentPath, [])
  return trail
}

// Check if user can access a specific menu item
export function canAccessMenuItem(menuItem: MenuItem, user: User | null): boolean {
  if (!user) {
    return false
  }

  // Check if item is active
  if (menuItem.isActive === false) {
    return false
  }

  const permissionChecker = createPermissionChecker(user)

  // If no permissions or roles specified, item is accessible to all authenticated users
  if (!menuItem.permissions && !menuItem.roles) {
    return true
  }

  // Check role requirements
  if (menuItem.roles && menuItem.roles.length > 0) {
    const hasRequiredRole = menuItem.roles.some(role => permissionChecker.hasRole(role))
    if (!hasRequiredRole) {
      return false
    }
  }

  // Check permission requirements
  if (menuItem.permissions && menuItem.permissions.length > 0) {
    const hasRequiredPermission = menuItem.permissions.some(permission => 
      permissionChecker.hasPermission(permission)
    )
    if (!hasRequiredPermission) {
      return false
    }
  }

  return true
}

// Get active menu item based on current path
export function getActiveMenuItem(menuItems: MenuItem[], currentPath: string): MenuItem | null {
  const findActiveItem = (items: MenuItem[]): MenuItem | null => {
    for (const item of items) {
      if (item.path === currentPath) {
        return item
      }
      
      if (item.children) {
        const activeChild = findActiveItem(item.children)
        if (activeChild) {
          return activeChild
        }
      }
    }
    return null
  }

  return findActiveItem(menuItems)
}

// Flatten menu structure for search
export function flattenMenuItems(menuItems: MenuItem[]): MenuItem[] {
  const flattened: MenuItem[] = []

  const flatten = (items: MenuItem[]) => {
    for (const item of items) {
      flattened.push(item)
      if (item.children) {
        flatten(item.children)
      }
    }
  }

  flatten(menuItems)
  return flattened
}