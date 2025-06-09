'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import Navbar from '@/components/layout/Navbar'
import { Toaster } from '@/components/ui/toaster'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#0E0E44]">
        {/* Horizontal Sticky Navbar */}
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            {children}
          </div>
        </main>
        
        {/* Toast Notifications */}
        <Toaster />
      </div>
    </SessionProvider>
  )
}