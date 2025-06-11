'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedButton } from '@/components/animations/MicroInteractions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  parent_id?: string
  order_index: number
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
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Icon icon="mdi:chart-line" className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Analytics Hub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {loading ? (
              <div className="flex space-x-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              menus.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.is_external ? (
                    <a
                      href={item.path}
                      target={item.target}
                      className={cn(
                        'inline-flex items-center h-10 px-3 text-sm font-medium transition-all duration-200 rounded-md hover:bg-orange-500/10 hover:text-orange-500'
                      )}
                    >
                      {item.icon && (
                        <Icon icon={item.icon} className="w-4 h-4 mr-2" />
                      )}
                      {item.title}
                    </a>
                  ) : (
                    <Link
                      href={item.path || '#'}
                      className={cn(
                        'inline-flex items-center h-10 px-3 text-sm font-medium transition-all duration-200 rounded-md hover:bg-orange-500/10 hover:text-orange-500',
                        isActiveLink(item.path || '') && 'bg-orange-500/20 text-orange-500'
                      )}
                    >
                      {item.icon && (
                        <Icon icon={item.icon} className="w-4 h-4 mr-2" />
                      )}
                      {item.title}
                    </Link>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <AnimatedButton
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0"
              >
                <Icon icon="mdi:bell" className="h-5 w-5" />
                {notifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs font-medium text-white flex items-center justify-center"
                  >
                    {notifications}
                  </motion.span>
                )}
              </AnimatedButton>
            </motion.div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatedButton
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </AnimatedButton>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{session?.user?.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
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
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <Icon icon="mdi:logout" className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <AnimatedButton
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="h-9 w-9 p-0"
              >
                <Icon 
                  icon={isMenuOpen ? "mdi:close" : "mdi:menu"} 
                  className="h-5 w-5" 
                />
              </AnimatedButton>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-white/10 py-4"
            >
              <div className="flex flex-col space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-300 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.1
                          }
                        }
                      }}
                      className="space-y-2"
                    >
                      {menuTree.map((item, index) => (
                        <motion.div
                          key={item.id}
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            show: { opacity: 1, x: 0 }
                          }}
                        >
                          {item.children && item.children.length > 0 ? (
                            <div className="space-y-1">
                              <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                                {item.title}
                              </div>
                              {item.children.map((child) => (
                                <motion.div
                                  key={child.id}
                                  whileHover={{ x: 4 }}
                                  className="pl-4"
                                >
                                  {child.is_external ? (
                                    <a
                                      href={child.path}
                                      target={child.target}
                                      className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center ${
                                        child.path && isActiveLink(child.path)
                                          ? 'bg-orange-500/20 text-orange-500'
                                          : 'text-foreground hover:bg-orange-500/10 hover:text-orange-500'
                                      }`}
                                    >
                                      {child.icon && (
                                        <Icon icon={child.icon} className="w-5 h-5 mr-3" />
                                      )}
                                      {child.title}
                                    </a>
                                  ) : (
                                    <Link
                                      href={child.path || '#'}
                                      className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center ${
                                        child.path && isActiveLink(child.path)
                                          ? 'bg-orange-500/20 text-orange-500'
                                          : 'text-foreground hover:bg-orange-500/10 hover:text-orange-500'
                                      }`}
                                    >
                                      {child.icon && (
                                        <Icon icon={child.icon} className="w-5 h-5 mr-3" />
                                      )}
                                      {child.title}
                                    </Link>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <motion.div whileHover={{ x: 4 }}>
                              {item.is_external ? (
                                <a
                                  href={item.path}
                                  target={item.target}
                                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center ${
                                    item.path && isActiveLink(item.path)
                                      ? 'bg-orange-500/20 text-orange-500'
                                      : 'text-foreground hover:bg-orange-500/10 hover:text-orange-500'
                                  }`}
                                >
                                  {item.icon && (
                                    <Icon icon={item.icon} className="w-5 h-5 mr-3" />
                                  )}
                                  {item.title}
                                </a>
                              ) : (
                                <Link
                                  href={item.path || '#'}
                                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center ${
                                    item.path && isActiveLink(item.path)
                                      ? 'bg-orange-500/20 text-orange-500'
                                      : 'text-foreground hover:bg-orange-500/10 hover:text-orange-500'
                                  }`}
                                >
                                  {item.icon && (
                                    <Icon icon={item.icon} className="w-5 h-5 mr-3" />
                                  )}
                                  {item.title}
                                </Link>
                              )}
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}