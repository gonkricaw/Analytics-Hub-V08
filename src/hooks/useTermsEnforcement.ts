'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface TermsVersion {
  id: string
  version: string
  title: string
  content: string
  effective_date: string | null
  published_at: string
}

interface UserStatus {
  terms_accepted: boolean
  terms_accepted_at: string | null
  current_version: string | null
  acceptance_details: {
    accepted_at: string
    ip_address: string
  } | null
}

interface TermsStatusResponse {
  success: boolean
  requires_acceptance: boolean
  current_terms: TermsVersion | null
  user_status: UserStatus
  message?: string
}

interface UseTermsEnforcementReturn {
  // State
  requiresAcceptance: boolean
  currentTerms: TermsVersion | null
  userStatus: UserStatus | null
  loading: boolean
  error: string | null
  
  // Actions
  checkTermsStatus: () => Promise<void>
  acceptTerms: (versionId: string) => Promise<boolean>
  refreshStatus: () => Promise<void>
  
  // Modal state
  showModal: boolean
  setShowModal: (show: boolean) => void
}

export const useTermsEnforcement = (): UseTermsEnforcementReturn => {
  const { data: session, status } = useSession()
  const [requiresAcceptance, setRequiresAcceptance] = useState(false)
  const [currentTerms, setCurrentTerms] = useState<TermsVersion | null>(null)
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  // Check terms status
  const checkTermsStatus = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/accept-terms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data: TermsStatusResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch terms status')
      }

      setRequiresAcceptance(data.requires_acceptance)
      setCurrentTerms(data.current_terms)
      setUserStatus(data.user_status)
      
      // Auto-show modal if terms acceptance is required
      if (data.requires_acceptance && !hasChecked) {
        setShowModal(true)
      }
      
      setHasChecked(true)
    } catch (err) {
      console.error('Error checking terms status:', err)
      setError(err instanceof Error ? err.message : 'Failed to check terms status')
    } finally {
      setLoading(false)
    }
  }, [session, status, hasChecked])

  // Accept terms
  const acceptTerms = useCallback(async (versionId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/accept-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version_id: versionId,
          accepted: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept terms')
      }

      // Update local state
      setRequiresAcceptance(false)
      setUserStatus(prev => prev ? {
        ...prev,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        current_version: currentTerms?.version || null
      } : null)
      
      setShowModal(false)
      toast.success('Terms & Conditions accepted successfully')
      return true
    } catch (err) {
      console.error('Error accepting terms:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept terms')
      toast.error('Failed to accept terms')
      return false
    } finally {
      setLoading(false)
    }
  }, [currentTerms])

  // Refresh status
  const refreshStatus = useCallback(async () => {
    setHasChecked(false)
    await checkTermsStatus()
  }, [checkTermsStatus])

  // Check terms status when session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !hasChecked) {
      checkTermsStatus()
    }
  }, [session, status, checkTermsStatus, hasChecked])

  // Periodic check for terms updates (every 5 minutes)
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const interval = setInterval(() => {
        checkTermsStatus()
      }, 5 * 60 * 1000) // 5 minutes

      return () => clearInterval(interval)
    }
  }, [session, status, checkTermsStatus])

  return {
    // State
    requiresAcceptance,
    currentTerms,
    userStatus,
    loading,
    error,
    
    // Actions
    checkTermsStatus,
    acceptTerms,
    refreshStatus,
    
    // Modal state
    showModal,
    setShowModal
  }
}

export default useTermsEnforcement