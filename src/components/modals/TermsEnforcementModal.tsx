'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, Calendar, User, Shield } from 'lucide-react'
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

interface TermsEnforcementModalProps {
  isOpen: boolean
  onClose: () => void
  onAccepted: () => void
  forceShow?: boolean
}

const TermsEnforcementModal: React.FC<TermsEnforcementModalProps> = ({
  isOpen,
  onClose,
  onAccepted,
  forceShow = false
}) => {
  const [termsData, setTermsData] = useState<TermsStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current terms status
  const fetchTermsStatus = async () => {
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

      setTermsData(data)
    } catch (err) {
      console.error('Error fetching terms status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load terms')
    } finally {
      setLoading(false)
    }
  }

  // Accept terms
  const handleAcceptTerms = async () => {
    if (!termsData?.current_terms || !hasAccepted) {
      toast.error('Please accept the terms and conditions')
      return
    }

    try {
      setAccepting(true)
      setError(null)

      const response = await fetch('/api/user/accept-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version_id: termsData.current_terms.id,
          accepted: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept terms')
      }

      toast.success('Terms & Conditions accepted successfully')
      onAccepted()
      onClose()
    } catch (err) {
      console.error('Error accepting terms:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept terms')
      toast.error('Failed to accept terms')
    } finally {
      setAccepting(false)
    }
  }

  // Load terms when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTermsStatus()
    }
  }, [isOpen])

  // Don't show modal if terms don't require acceptance (unless forced)
  if (!forceShow && termsData && !termsData.requires_acceptance) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={forceShow ? undefined : onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-orange-500">
            <Shield className="h-6 w-6" />
            Terms & Conditions
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-300">Loading terms...</span>
          </div>
        ) : error ? (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        ) : termsData?.current_terms ? (
          <div className="space-y-6">
            {/* Terms Info */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-orange-400">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">{termsData.current_terms.title}</span>
                <span className="text-sm text-gray-400">v{termsData.current_terms.version}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span>Published: {new Date(termsData.current_terms.published_at).toLocaleDateString()}</span>
                </div>
                {termsData.current_terms.effective_date && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4" />
                    <span>Effective: {new Date(termsData.current_terms.effective_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-400">Terms & Conditions Content</h3>
              <ScrollArea className="h-64 w-full border border-gray-700 rounded-lg p-4 bg-gray-800">
                <div 
                  className="prose prose-invert prose-sm max-w-none text-gray-300"
                  dangerouslySetInnerHTML={{ __html: termsData.current_terms.content }}
                />
              </ScrollArea>
            </div>

            {/* User Status */}
            {termsData.user_status.acceptance_details && (
              <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <User className="h-5 w-5" />
                  <span className="font-semibold">Previous Acceptance</span>
                </div>
                <div className="text-sm text-gray-300">
                  <p>Accepted on: {new Date(termsData.user_status.acceptance_details.accepted_at).toLocaleString()}</p>
                  <p>IP Address: {termsData.user_status.acceptance_details.ip_address}</p>
                </div>
              </div>
            )}

            {/* Acceptance Required Notice */}
            {termsData.requires_acceptance && (
              <Alert className="border-orange-500 bg-orange-500/10">
                <AlertDescription className="text-orange-400">
                  You must accept the updated Terms & Conditions to continue using the system.
                </AlertDescription>
              </Alert>
            )}

            {/* Acceptance Checkbox */}
            <div className="flex items-start space-x-3 p-4 bg-gray-800 rounded-lg">
              <Checkbox
                id="accept-terms"
                checked={hasAccepted}
                onCheckedChange={(checked) => setHasAccepted(checked as boolean)}
                className="mt-1 border-gray-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
              />
              <label htmlFor="accept-terms" className="text-sm text-gray-300 cursor-pointer">
                I have read and agree to the Terms & Conditions outlined above. I understand that by accepting these terms, I am entering into a legally binding agreement.
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              {!forceShow && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleAcceptTerms}
                disabled={!hasAccepted || accepting}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Accepting...
                  </>
                ) : (
                  'Accept Terms & Conditions'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No terms and conditions available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default TermsEnforcementModal