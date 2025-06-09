'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import Navbar from '@/components/layout/Navbar'
import Breadcrumb from '@/components/layout/Breadcrumb'
import Footer from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'
import TermsEnforcementModal from '@/components/modals/TermsEnforcementModal'
import { useTermsEnforcement } from '@/hooks/useTermsEnforcement'

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardContent({ children }: DashboardLayoutProps) {
  const {
    requiresAcceptance,
    currentTerms,
    showModal,
    setShowModal,
    refreshStatus
  } = useTermsEnforcement()

  const handleTermsAccepted = () => {
    refreshStatus()
  }

  return (
    <>
      <div className="min-h-screen bg-[#0E0E44] flex flex-col">
        {/* Horizontal Sticky Navbar */}
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            {/* Breadcrumb Navigation */}
            <Breadcrumb />
            
            {/* Page Content */}
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <Footer />
        
        {/* Toast Notifications */}
        <Toaster />
      </div>

      {/* Terms Enforcement Modal */}
      <TermsEnforcementModal
        isOpen={showModal && requiresAcceptance}
        onClose={() => setShowModal(false)}
        onAccepted={handleTermsAccepted}
        forceShow={requiresAcceptance}
      />
    </>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  )
}