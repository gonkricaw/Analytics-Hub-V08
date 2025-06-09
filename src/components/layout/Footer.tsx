'use client'

import React from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

interface FooterProps {
  className?: string
}

export default function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn(
        'bg-white border-t border-gray-200 mt-auto',
        className
      )}
    >
      <div className="container mx-auto px-4 py-6 lg:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Brand and copyright */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500">
                <Icon icon="mdi:chart-line" className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Analytics Hub</span>
            </div>
            <span className="text-sm text-gray-500">
              © {currentYear} All rights reserved.
            </span>
          </div>

          {/* Right side - Links and info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <Link
                href="/dashboard/help"
                className="hover:text-orange-500 transition-colors duration-200"
              >
                Help
              </Link>
              <Link
                href="/dashboard/support"
                className="hover:text-orange-500 transition-colors duration-200"
              >
                Support
              </Link>
              <Link
                href="/dashboard/privacy"
                className="hover:text-orange-500 transition-colors duration-200"
              >
                Privacy
              </Link>
            </div>
            
            {/* Version info */}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Icon icon="mdi:information-outline" className="h-4 w-4" />
              <span>v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Bottom section - Additional info */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-xs text-gray-500">
              Built with Next.js, TypeScript, and Tailwind CSS
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Last updated: {new Date().toLocaleDateString()}</span>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}