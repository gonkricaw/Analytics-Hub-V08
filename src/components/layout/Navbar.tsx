'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { filterMenuByPermissions } from '@/lib/menu-filter'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  title: string
  icon?: string
  path?: string
  children?: MenuItem[]
  menu_roles: {
    role: {
      id: string
      name: string
    }
  }[]
  is_active: boolean
  is_external: boolean
  target: string
}

interface NavbarProps {
  className?: string
}

export default function Navbar({ className }: NavbarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [notifications, setNotifications] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenus()
    fetchNotifications()
  }, [session])

  const fetchMenus = async () => {
    try {
      const response = await fetch('/api/menus')
      if (response.ok) {
        const data = await response.json()
        // Filter menus based on user permissions
        const filteredMenus = filterMenuByPermissions(data, session?.user || null)
        setMenus(filteredMenus)
      }
    } catch (error) {
      console.error('Error fetching menus:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      // This would fetch actual notifications from an API
      // For now, we'll use a mock count
      setNotifications(3)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const isActiveLink = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isActive = item.path ? isActiveLink(item.path) : false

    if (hasChildren) {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'h-10 px-3 text-sm font-medium transition-all duration-200 hover:bg-orange-500/10 hover:text-orange-500',
                isActive && 'bg-orange-500/20 text-orange-500',
                level > 0 && 'ml-4'
              )}
            >
              {item.icon && (
                <Icon icon={item.icon} className="w-4 h-4 mr-2" />
              )}
              {item.title}
              <Icon icon="mdi:chevron-down" className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {item.children?.map((child) => (
              <DropdownMenuItem key={child.id} asChild>
                {child.is_external ? (
                  <a
                    href={child.path}
                    target={child.target}
                    className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer"
                  >
                    {child.icon && (
                      <Icon icon={child.icon} className="w-4 h-4 mr-2" />
                    )}
                    {child.title}
                    {child.is_external && (
                      <Icon icon="mdi:external-link" className="w-3 h-3 ml-auto" />
                    )}
                  </a>
                ) : (
                  <Link
                    href={child.path || '#'}
                    className="flex items-center w-full px-2 py-1.5 text-sm"
                  >
                    {child.icon && (
                      <Icon icon={child.icon} className="w-4 h-4 mr-2" />
                    )}
                    {child.title}
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return item.is_external ? (
      <a
        key={item.id}
        href={item.path}
        target={item.target}
        className={cn(
          'inline-flex items-center h-10 px-3 text-sm font-medium transition-all duration-200 rounded-md hover:bg-orange-500/10 hover:text-orange-500',
          isActive && 'bg-orange-500/20 text-orange-500',
          level > 0 && 'ml-4'
        )}
      >
        {item.icon && (
          <Icon icon={item.icon} className="w-4 h-4 mr-2" />
        )}
        {item.title}
        <Icon icon="mdi:external-link" className="w-3 h-3 ml-1" />
      </a>
    ) : (
      <Link
        key={item.id}
        href={item.path || '#'}
        className={cn(
          'inline-flex items-center h-10 px-3 text-sm font-medium transition-all duration-200 rounded-md hover:bg-orange-500/10 hover:text-orange-500',
          isActive && 'bg-orange-500/20 text-orange-500',
          level > 0 && 'ml-4'
        )}
      >
        {item.icon && (
          <Icon icon={item.icon} className="w-4 h-4 mr-2" />
        )}
        {item.title}
      </Link>
    )
  }

  const buildMenuTree = (menus: MenuItem[]): MenuItem[] => {
    const menuMap = new Map<string, MenuItem>()
    const rootMenus: MenuItem[] = []

    // Create a map of all menus
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] })
    })

    // Build the tree structure
    menus.forEach(menu => {
      const menuItem = menuMap.get(menu.id)!
      if (menu.parent_id && menuMap.has(menu.parent_id)) {
        const parent = menuMap.get(menu.parent_id)!
        if (!parent.children) parent.children = []
        parent.children.push(menuItem)
      } else {
        rootMenus.push(menuItem)
      }
    })

    return rootMenus.sort((a, b) => a.order_index - b.order_index)
  }

  const menuTree = buildMenuTree(menus.filter(menu => menu.is_active))

  if (!session) {
    return null
  }

  return (
    <nav className={cn(
      'sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60',
      className
    )}>
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
              <Icon icon="mdi:chart-line" className="h-5 w-5 text-white" />
            </div>
            <span className="hidden font-bold text-gray-900 sm:inline-block">
              Analytics Hub
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-1">
          {loading ? (
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">Loading menu...</span>
            </div>
          ) : (
            menuTree.map(item => renderMenuItem(item))
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Icon icon="mdi:bell" className="h-5 w-5" />
            {notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {notifications > 99 ? '99+' : notifications}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session.user.avatar_url || ''}
                    alt={session.user.first_name || ''}
                  />
                  <AvatarFallback className="bg-orange-500 text-white">
                    {session.user.first_name?.[0]}{session.user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session.user.first_name} {session.user.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                  <Badge variant="outline" className="w-fit text-xs">
                    {session.user.role?.name}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <Icon icon="mdi:account" className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Icon icon="mdi:cog" className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleSignOut}
              >
                <Icon icon="mdi:logout" className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Icon
              icon={isMenuOpen ? 'mdi:close' : 'mdi:menu'}
              className="h-5 w-5"
            />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {loading ? (
              <div className="flex items-center space-x-2 py-2">
                <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading menu...</span>
              </div>
            ) : (
              menuTree.map(item => (
                <div key={item.id} className="space-y-1">
                  {item.is_external ? (
                    <a
                      href={item.path}
                      target={item.target}
                      className={cn(
                        'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-orange-500/10 hover:text-orange-500',
                        item.path && isActiveLink(item.path) && 'bg-orange-500/20 text-orange-500'
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.icon && (
                        <Icon icon={item.icon} className="mr-3 h-4 w-4" />
                      )}
                      {item.title}
                      <Icon icon="mdi:external-link" className="ml-auto h-3 w-3" />
                    </a>
                  ) : (
                    <Link
                      href={item.path || '#'}
                      className={cn(
                        'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-orange-500/10 hover:text-orange-500',
                        item.path && isActiveLink(item.path) && 'bg-orange-500/20 text-orange-500'
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.icon && (
                        <Icon icon={item.icon} className="mr-3 h-4 w-4" />
                      )}
                      {item.title}
                    </Link>
                  )}
                  {item.children && item.children.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {item.children.map(child => (
                        child.is_external ? (
                          <a
                            key={child.id}
                            href={child.path}
                            target={child.target}
                            className={cn(
                              'flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-orange-500/10 hover:text-orange-500',
                              child.path && isActiveLink(child.path) && 'bg-orange-500/20 text-orange-500'
                            )}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {child.icon && (
                              <Icon icon={child.icon} className="mr-3 h-4 w-4" />
                            )}
                            {child.title}
                            <Icon icon="mdi:external-link" className="ml-auto h-3 w-3" />
                          </a>
                        ) : (
                          <Link
                            key={child.id}
                            href={child.path || '#'}
                            className={cn(
                              'flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-orange-500/10 hover:text-orange-500',
                              child.path && isActiveLink(child.path) && 'bg-orange-500/20 text-orange-500'
                            )}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {child.icon && (
                              <Icon icon={child.icon} className="mr-3 h-4 w-4" />
                            )}
                            {child.title}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </nav>
  )
}