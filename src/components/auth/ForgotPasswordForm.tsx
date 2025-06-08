'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Icon } from '@iconify/react'
import { forgotPasswordSchema } from '@/lib/validation'
import toast from 'react-hot-toast'

interface ForgotPasswordFormData {
  email: string
}

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (cooldownTime > 0) {
      toast.error(`Please wait ${cooldownTime} seconds before requesting another reset.`)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'RATE_LIMITED') {
          toast.error('Too many reset requests. Please wait before trying again.')
        } else if (result.error === 'COOLDOWN_ACTIVE') {
          const remainingTime = Math.ceil(result.remainingTime / 1000)
          setCooldownTime(remainingTime)
          toast.error(`Please wait ${remainingTime} seconds before requesting another reset.`)
          
          // Start countdown
          const countdown = setInterval(() => {
            setCooldownTime(prev => {
              if (prev <= 1) {
                clearInterval(countdown)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        } else {
          toast.error(result.message || 'Failed to send reset email. Please try again.')
        }
        return
      }

      // Success - always show success message for security
      setIsSubmitted(true)
      toast.success('If an account with that email exists, we\'ve sent password reset instructions.')
      
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    if (cooldownTime > 0) {
      toast.error(`Please wait ${cooldownTime} seconds before requesting another reset.`)
      return
    }
    
    const email = getValues('email')
    if (email) {
      onSubmit({ email })
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <Icon icon="mdi:email-check" className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">
            Check Your Email
          </h3>
          <p className="text-white/70 text-sm">
            If an account with that email exists, we've sent password reset instructions to your email address.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:information" className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-white/80 text-sm">
                <strong>Next steps:</strong>
              </p>
              <ul className="text-white/70 text-sm mt-2 space-y-1">
                <li>• Check your email inbox and spam folder</li>
                <li>• Click the reset link in the email</li>
                <li>• The link will expire in 2 hours</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={isLoading || cooldownTime > 0}
          className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : cooldownTime > 0 ? (
            <>
              <Icon icon="mdi:timer" className="h-5 w-5" />
              Resend in {cooldownTime}s
            </>
          ) : (
            <>
              <Icon icon="mdi:email-send" className="h-5 w-5" />
              Resend Email
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-white">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="mdi:email" className="h-5 w-5 text-white/60" />
          </div>
          <input
            {...register('email')}
            type="email"
            id="email"
            className={`input-field pl-10 w-full ${
              errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
            placeholder="Enter your email address"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:information" className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="text-white/80 text-sm">
              <strong>Password Reset Process:</strong>
            </p>
            <ul className="text-white/70 text-sm mt-2 space-y-1">
              <li>• We'll send a secure reset link to your email</li>
              <li>• The link expires in 2 hours for security</li>
              <li>• You can request a new link if needed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || cooldownTime > 0}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
            Sending Reset Email...
          </>
        ) : cooldownTime > 0 ? (
          <>
            <Icon icon="mdi:timer" className="h-5 w-5" />
            Wait {cooldownTime}s
          </>
        ) : (
          <>
            <Icon icon="mdi:email-send" className="h-5 w-5" />
            Send Reset Email
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-white/50">
          <Icon icon="mdi:shield-check" className="inline h-3 w-3 mr-1" />
          For security, we don't confirm if an email exists in our system
        </p>
      </div>
    </form>
  )
}