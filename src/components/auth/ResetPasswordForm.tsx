'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Icon } from '@iconify/react'
import { resetPasswordSchema } from '@/lib/validation'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface ResetPasswordFormData {
  token: string
  password: string
  confirmPassword: string
}

interface ResetPasswordFormProps {
  token: string
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token
    }
  })

  const password = watch('password')

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: data.token,
          password: data.password,
          confirmPassword: data.confirmPassword
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'INVALID_TOKEN') {
          toast.error('Invalid or expired reset token. Please request a new password reset.')
          setTimeout(() => {
            router.push('/forgot-password')
          }, 2000)
        } else if (result.error === 'TOKEN_EXPIRED') {
          toast.error('Reset token has expired. Please request a new password reset.')
          setTimeout(() => {
            router.push('/forgot-password')
          }, 2000)
        } else if (result.error === 'TOKEN_USED') {
          toast.error('This reset token has already been used. Please request a new password reset.')
          setTimeout(() => {
            router.push('/forgot-password')
          }, 2000)
        } else if (result.error === 'VALIDATION_ERROR') {
          toast.error('Please check your password requirements and try again.')
        } else {
          toast.error(result.message || 'Failed to reset password. Please try again.')
        }
        return
      }

      // Success
      setIsSuccess(true)
      toast.success('Password reset successful! You can now log in with your new password.')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    }
    
    strength = Object.values(checks).filter(Boolean).length
    
    const strengthMap = {
      0: { label: 'Very Weak', color: 'bg-red-500' },
      1: { label: 'Weak', color: 'bg-red-400' },
      2: { label: 'Fair', color: 'bg-yellow-500' },
      3: { label: 'Good', color: 'bg-yellow-400' },
      4: { label: 'Strong', color: 'bg-green-400' },
      5: { label: 'Very Strong', color: 'bg-green-500' }
    }
    
    return { strength, ...strengthMap[strength as keyof typeof strengthMap], checks }
  }

  const passwordStrength = getPasswordStrength(password || '')

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">
            Password Reset Successful!
          </h3>
          <p className="text-white/70 text-sm">
            Your password has been updated successfully. You will be redirected to the login page shortly.
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={() => router.push('/login')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Icon icon="mdi:login" className="h-4 w-4" />
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Hidden token field */}
      <input {...register('token')} type="hidden" />

      {/* New Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-white">
          New Password
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
            placeholder="Enter your new password"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            <Icon 
              icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} 
              className="h-5 w-5 text-white/60 hover:text-white transition-colors" 
            />
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                {passwordStrength.label}
              </span>
            </div>
            
            {/* Password Requirements */}
            <div className="grid grid-cols-1 gap-1 text-xs">
              <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-400' : 'text-white/50'}`}>
                <Icon icon={passwordStrength.checks.length ? 'mdi:check' : 'mdi:close'} className="h-3 w-3" />
                At least 8 characters
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-400' : 'text-white/50'}`}>
                <Icon icon={passwordStrength.checks.lowercase ? 'mdi:check' : 'mdi:close'} className="h-3 w-3" />
                One lowercase letter
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-400' : 'text-white/50'}`}>
                <Icon icon={passwordStrength.checks.uppercase ? 'mdi:check' : 'mdi:close'} className="h-3 w-3" />
                One uppercase letter
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.checks.number ? 'text-green-400' : 'text-white/50'}`}>
                <Icon icon={passwordStrength.checks.number ? 'mdi:check' : 'mdi:close'} className="h-3 w-3" />
                One number
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.checks.special ? 'text-green-400' : 'text-white/50'}`}>
                <Icon icon={passwordStrength.checks.special ? 'mdi:check' : 'mdi:close'} className="h-3 w-3" />
                One special character (@$!%*?&)
              </div>
            </div>
          </div>
        )}
        
        {errors.password && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
          Confirm New Password
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
            placeholder="Confirm your new password"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            <Icon 
              icon={showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'} 
              className="h-5 w-5 text-white/60 hover:text-white transition-colors" 
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || passwordStrength.strength < 4}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
            Updating Password...
          </>
        ) : (
          <>
            <Icon icon="mdi:lock-reset" className="h-5 w-5" />
            Update Password
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-white/50">
          <Icon icon="mdi:shield-check" className="inline h-3 w-3 mr-1" />
          Your password will be securely encrypted and stored
        </p>
      </div>
    </form>
  )
}