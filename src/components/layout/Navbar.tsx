'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedButton } from '@/components/animations/MicroInteractions'
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
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/dashboard" className="flex items-center space-x-2">
              <motion.div 
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent hover-glow"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Icon icon="mdi:chart-line" className="h-5 w-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold gradient-text">Analytics Hub</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div 
            className="hidden md:flex md:items-center md:space-x-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:loading" className="h-4 w-4 animate-spin text-accent" />
                <span className="text-sm text-white/70">Loading menu...</span>
              </div>
            ) : (
              <AnimatePresence>
                {menus.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {item.is_external ? (
                      <motion.a
                        href={item.path}
                        target={item.target}
                        className="navbar-item px-3 py-2 rounded-lg flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {item.icon && (
                          <Icon icon={item.icon} className="h-4 w-4" />
                        )}
                        {item.title}
                        <Icon icon="mdi:external-link" className="h-3 w-3" />
                      </motion.a>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link
                          href={item.path || '#'}
                          className={cn(
                            'navbar-item px-3 py-2 rounded-lg flex items-center gap-2',
                            item.path && isActiveLink(item.path) && 'text-accent bg-accent/10'
                          )}
                        >
                          {item.icon && (
                            <Icon icon={item.icon} className="h-4 w-4" />
                          )}
                          {item.title}
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>

          {/* Right Side Actions */}
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Notifications */}
            <motion.button
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon icon="mdi:bell" className="h-5 w-5 text-white/80 hover:text-accent transition-colors" />
              {notifications > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                >
                  {notifications > 99 ? '99+' : notifications}
                </motion.span>
              )}
            </motion.button>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-medium">
                  {session?.user?.first_name?.[0]}{session?.user?.last_name?.[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">
                    {session?.user?.first_name} {session?.user?.last_name}
                  </p>
                  <p className="text-xs text-white/60">
                    {session?.user?.role?.name}
                  </p>
                </div>
                <Icon icon="mdi:chevron-down" className="h-4 w-4 text-white/60" />
              </motion.button>

              {/* User Dropdown */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-56 glass-effect-strong rounded-lg shadow-xl border border-white/20 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">
                        {session?.user?.first_name} {session?.user?.last_name}
                      </p>
                      <p className="text-xs text-white/60">
                        {session?.user?.email}
                      </p>
                      <span className="status-active mt-2">
                        {session?.user?.role?.name}
                      </span>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center px-4 py-2 text-sm text-white/80 hover:text-accent hover:bg-accent/10 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon icon="mdi:account" className="mr-3 h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center px-4 py-2 text-sm text-white/80 hover:text-accent hover:bg-accent/10 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon icon="mdi:cog" className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                    </div>
                    
                    <div className="border-t border-white/10 pt-2">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <Icon icon="mdi:logout" className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Icon
                icon={isMenuOpen ? 'mdi:close' : 'mdi:menu'}
                className="h-5 w-5 text-white/80"
              />
            </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden border-t border-white/20 glass-effect-strong"
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="px-4 py-6 space-y-4"
            >
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-8"
                >
                  <Icon icon="mdi:loading" className="h-6 w-6 animate-spin text-accent" />
                </motion.div>
              ) : (
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
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
                        <div className="space-y-2">
                          <div className="px-3 py-2 text-sm font-semibold text-accent uppercase tracking-wider">
                            {item.title}
                          </div>
                          {item.children.map((child) => (
                            <motion.div
                              key={child.id}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {child.is_external ? (
                                <a
                                  href={child.path}
                                  target={child.target}
                                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center ${
                                    isActiveLink(child.path || '')
                                      ? 'bg-accent text-white shadow-lg'
                                      : 'text-white/80 hover:text-accent hover:bg-accent/10 hover:shadow-md'
                                  }`}
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
                                  href={child.path || '#'}
                                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center ${
                                    isActiveLink(child.path || '')
                                      ? 'bg-accent text-white shadow-lg'
                                      : 'text-white/80 hover:text-accent hover:bg-accent/10 hover:shadow-md'
                                  }`}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {child.icon && (
                                    <Icon icon={child.icon} className="mr-3 h-4 w-4" />
                                  )}
                                  {child.title}
                                </Link>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <motion.div
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {item.is_external ? (
                            <a
                              href={item.path}
                              target={item.target}
                              className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center ${
                                isActiveLink(item.path || '')
                                  ? 'bg-accent text-white shadow-lg'
                                  : 'text-white/80 hover:text-accent hover:bg-accent/10 hover:shadow-md'
                              }`}
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
                              className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 flex items-center ${
                                isActiveLink(item.path || '')
                                  ? 'bg-accent text-white shadow-lg'
                                  : 'text-white/80 hover:text-accent hover:bg-accent/10 hover:shadow-md'
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {item.icon && (
                                <Icon icon={item.icon} className="mr-3 h-4 w-4" />
                              )}
                              {item.title}
                            </Link>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}