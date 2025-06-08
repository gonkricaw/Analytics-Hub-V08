'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

export default function TermsAcceptanceForm() {
  const [isAccepted, setIsAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleAccept = async () => {
    if (!isAccepted) {
      toast.error('Please accept the terms and conditions to continue')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/accept-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accepted: true }),
      })

      const result = await response.json()

      if (!response.ok) {
        switch (result.error) {
          case 'UNAUTHORIZED':
            toast.error('Please log in to continue')
            router.push('/login')
            break
          case 'ALREADY_ACCEPTED':
            toast.success('Terms already accepted. Redirecting...')
            router.push('/dashboard')
            break
          default:
            toast.error(result.message || 'Failed to accept terms')
        }
        return
      }

      setIsSuccess(true)
      toast.success('Terms accepted successfully!')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Accept terms error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = () => {
    toast.error('You must accept the terms to use Analytics Hub')
    // Optionally redirect to logout or login page
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full border border-green-500/30 mb-4">
          <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Terms Accepted Successfully!
        </h3>
        <p className="text-white/70 mb-4">
          Thank you for accepting our terms. Redirecting to dashboard...
        </p>
        <div className="flex items-center justify-center gap-2 text-white/50">
          <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
          <span className="text-sm">Redirecting...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Acceptance Checkbox */}
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="acceptTerms"
            checked={isAccepted}
            onChange={(e) => setIsAccepted(e.target.checked)}
            className="sr-only"
            disabled={isLoading}
          />
          <label
            htmlFor="acceptTerms"
            className={`flex items-center justify-center w-5 h-5 border-2 rounded cursor-pointer transition-all duration-200 ${
              isAccepted
                ? 'bg-accent border-accent text-white'
                : 'border-white/30 hover:border-white/50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isAccepted && (
              <Icon icon="mdi:check" className="w-3 h-3" />
            )}
          </label>
        </div>
        <div className="flex-1">
          <label htmlFor="acceptTerms" className="text-white/90 text-sm cursor-pointer">
            I have read, understood, and agree to be bound by the{' '}
            <span className="text-accent font-medium">Terms & Conditions</span>{' '}
            and{' '}
            <span className="text-accent font-medium">Privacy Policy</span>{' '}
            of Analytics Hub.
          </label>
          <p className="text-white/60 text-xs mt-1">
            By checking this box, you acknowledge that you understand your rights and responsibilities as a user of this platform.
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white/90 text-sm font-medium mb-1">
              Important Notice
            </p>
            <p className="text-white/70 text-sm">
              Acceptance of these terms is required to access Analytics Hub. If you do not agree with any part of these terms, you will not be able to use the platform.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAccept}
          disabled={!isAccepted || isLoading}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isAccepted && !isLoading
              ? 'bg-accent hover:bg-accent/90 text-white shadow-lg hover:shadow-xl'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Icon icon="mdi:check-circle" className="w-5 h-5" />
              Accept & Continue
            </>
          )}
        </button>
        
        <button
          onClick={handleDecline}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:close-circle" className="w-5 h-5" />
          Decline
        </button>
      </div>

      {/* Legal Information */}
      <div className="text-center space-y-2">
        <p className="text-white/50 text-xs flex items-center justify-center gap-1">
          <Icon icon="mdi:shield-check" className="w-3 h-3" />
          Your acceptance is recorded for legal compliance
        </p>
        <p className="text-white/40 text-xs">
          Last updated: {new Date().toLocaleDateString()} • Version 1.0
        </p>
      </div>

      {/* Help Section */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:help-circle" className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white/90 text-sm font-medium mb-1">
              Need Help?
            </p>
            <p className="text-white/70 text-sm">
              If you have questions about these terms or need clarification on any section, please contact our support team before proceeding.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}