'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { BreadcrumbItem } from '@/types'

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname()

  // Generate breadcrumb items from pathname if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Add home/dashboard as first item
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
      active: pathname === '/dashboard'
    })

    // Build breadcrumbs from path segments
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Skip the first 'dashboard' segment as it's already added
      if (segment === 'dashboard') return

      const isLast = index === pathSegments.length - 1
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        active: isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbItems = items || generateBreadcrumbs()

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav
      className={cn(
        'flex items-center space-x-1 text-sm text-gray-600 mb-6',
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <Icon
                icon="mdi:chevron-right"
                className="mx-2 h-4 w-4 text-gray-400"
              />
            )}
            {item.href && !item.active ? (
              <Link
                href={item.href}
                className="hover:text-orange-500 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  item.active
                    ? 'text-orange-500 font-medium'
                    : 'text-gray-500'
                )}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}