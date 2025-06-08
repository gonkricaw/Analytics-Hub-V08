'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { z } from 'zod'
import toast from 'react-hot-toast'

// Registration schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  invitationToken: z.string().min(1, 'Invitation token is required'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  invitationToken: string
  agreeToTerms: boolean
}

interface RegisterFormProps {
  token: string
}

interface InvitationData {
  email: string
  first_name: string
  last_name: string
  role: {
    name: string
  }
  invited_by_name: string
  expires_at: string
}

export default function RegisterForm({ token }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      invitationToken: token
    }
  })

  const password = watch('password')

  // Validate invitation token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-invitation?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setInvitationData(data.invitation)
          setValue('email', data.invitation.email)
          setValue('firstName', data.invitation.first_name)
          setValue('lastName', data.invitation.last_name)
        } else {
          toast.error(data.message || 'Invalid invitation token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Token validation error:', error)
        toast.error('Failed to validate invitation token')
        router.push('/login')
      } finally {
        setIsValidatingToken(false)
      }
    }

    if (token) {
      validateToken()
    } else {
      setIsValidatingToken(false)
    }
  }, [token, setValue, router])

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          invitationToken: data.invitationToken
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'RATE_LIMIT_EXCEEDED') {
          toast.error(`Too many attempts. Try again in ${Math.ceil(result.retryAfter / 1000)} seconds.`)
        } else if (result.error === 'INVALID_INVITATION') {
          toast.error('Invalid or expired invitation token')
          router.push('/login')
        } else if (result.error === 'INVITATION_EXPIRED') {
          toast.error('Invitation has expired. Please request a new invitation.')
          router.push('/login')
        } else if (result.error === 'INVITATION_USED') {
          toast.error('This invitation has already been used.')
          router.push('/login')
        } else if (result.error === 'EMAIL_MISMATCH') {
          toast.error('Email does not match the invitation')
        } else if (result.error === 'USER_EXISTS') {
          toast.error('An account with this email already exists')
          router.push('/login')
        } else if (result.error === 'VALIDATION_ERROR') {
          toast.error('Please check your input and try again')
        } else {
          toast.error(result.message || 'Registration failed. Please try again.')
        }
        return
      }

      // Success
      toast.success('Registration successful! Welcome to Analytics Hub.')
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidatingToken) {
    return (
      <div className="text-center py-8">
        <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
        <p className="text-white/70">Validating invitation...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Invitation Info */}
      {invitationData && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon icon="mdi:email-check" className="h-5 w-5 text-accent" />
            <h3 className="font-medium text-white">Invitation Details</h3>
          </div>
          <div className="text-sm text-white/70 space-y-1">
            <p>Role: <span className="text-accent">{invitationData.role.name}</span></p>
            <p>Invited by: <span className="text-white">{invitationData.invited_by_name}</span></p>
            <p>Expires: <span className="text-white">{new Date(invitationData.expires_at).toLocaleDateString()}</span></p>
          </div>
        </div>
      )}

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
            className={`input-field pl-10 w-full bg-white/5 ${
              errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
            placeholder="Enter your email address"
            disabled={true} // Email is pre-filled from invitation
          />
        </div>
        {errors.email && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* First Name Field */}
      <div className="space-y-2">
        <label htmlFor="firstName" className="block text-sm font-medium text-white">
          First Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="mdi:account" className="h-5 w-5 text-white/60" />
          </div>
          <input
            {...register('firstName')}
            type="text"
            id="firstName"
            className={`input-field pl-10 w-full ${
              errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
            placeholder="Enter your first name"
            disabled={isLoading}
          />
        </div>
        {errors.firstName && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            {errors.firstName.message}
          </p>
        )}
      </div>

      {/* Last Name Field */}
      <div className="space-y-2">
        <label htmlFor="lastName" className="block text-sm font-medium text-white">
          Last Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="mdi:account" className="h-5 w-5 text-white/60" />
          </div>
          <input
            {...register('lastName')}
            type="text"
            id="lastName"
            className={`input-field pl-10 w-full ${
              errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
            placeholder="Enter your last name"
            disabled={isLoading}
          />
        </div>
        {errors.lastName && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            {errors.lastName.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-white">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="mdi:lock" className="h-5 w-5 text-white/60" />
          </div>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className={`input-field pl-10 pr-10 w-full ${
              errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
            placeholder="Create a strong password"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            <Icon 
              icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} 
              className="h-5 w-5 text-white/60 hover:text-white/80 transition-colors" 
            />
          </button>
        </div>
        {errors.password && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            {errors.password.message}
          </p>
        )}
        
        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2">
            <div className="text-xs text-white/60">
              Password strength:
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => {
                const hasLower = /[a-z]/.test(password)
                const hasUpper = /[A-Z]/.test(password)
                const hasNumber = /\d/.test(password)
                const hasSpecial = /[@$!%*?&]/.test(password)
                const isLongEnough = password.length >= 8
                
                let strength = 0
                if (hasLower) strength++
                if (hasUpper) strength++
                if (hasNumber) strength++
                if (hasSpecial) strength++
                if (isLongEnough) strength++
                
                const isActive = level <= Math.floor((strength / 5) * 4)
                return (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      isActive
                        ? strength <= 2
                          ? 'bg-red-500'
                          : strength <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-white/20'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="mdi:lock-check" className="h-5 w-5 text-white/60" />
          </div>
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            className={`input-field pl-10 pr-10 w-full ${
              errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
            placeholder="Confirm your password"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Icon 
              icon={showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'} 
              className="h-5 w-5 text-white/60 hover:text-white/80 transition-colors" 
            />
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms Agreement */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <input
            {...register('agreeToTerms')}
            type="checkbox"
            id="agreeToTerms"
            className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-accent focus:ring-accent/20 focus:ring-offset-0"
            disabled={isLoading}
          />
          <label htmlFor="agreeToTerms" className="text-sm text-white/70 leading-relaxed">
            I agree to the{' '}
            <a 
              href="/terms" 
              target="_blank" 
              className="text-accent hover:text-accent/80 transition-colors underline"
            >
              Terms and Conditions
            </a>
            {' '}and{' '}
            <a 
              href="/privacy" 
              target="_blank" 
              className="text-accent hover:text-accent/80 transition-colors underline"
            >
              Privacy Policy
            </a>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            {errors.agreeToTerms.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <Icon icon="mdi:account-plus" className="h-5 w-5" />
            Create Account
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="text-center pt-4 border-t border-white/10">
        <p className="text-white/50 text-xs flex items-center justify-center gap-1">
          <Icon icon="mdi:shield-check" className="h-4 w-4" />
          Your account will be secured with enterprise-grade encryption
        </p>
      </div>
    </form>
  )
}