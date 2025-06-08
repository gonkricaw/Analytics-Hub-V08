'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { changePasswordSchema } from '@/lib/validation'
import type { ChangePasswordData } from '@/types'
import toast from 'react-hot-toast'

interface UpdatePasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange'
  })

  const newPassword = watch('newPassword')

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' }
    
    let score = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    score = Object.values(checks).filter(Boolean).length
    
    if (score < 3) return { score, label: 'Weak', color: 'text-red-400' }
    if (score < 4) return { score, label: 'Fair', color: 'text-yellow-400' }
    if (score < 5) return { score, label: 'Good', color: 'text-blue-400' }
    return { score, label: 'Strong', color: 'text-green-400' }
  }

  const passwordStrength = getPasswordStrength(newPassword || '')

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        switch (result.error) {
          case 'VALIDATION_ERROR':
            toast.error('Please check your input and try again')
            break
          case 'UNAUTHORIZED':
            toast.error('Please log in to continue')
            router.push('/login')
            break
          case 'INVALID_CURRENT_PASSWORD':
            toast.error('Current password is incorrect')
            break
          case 'SAME_PASSWORD':
            toast.error('New password must be different from current password')
            break
          case 'RATE_LIMITED':
            toast.error('Too many attempts. Please try again later')
            break
          default:
            toast.error(result.message || 'Failed to update password')
        }
        return
      }

      setIsSuccess(true)
      toast.success('Password updated successfully!')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Update password error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full border border-green-500/30 mb-4">
          <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Password Updated Successfully!
        </h3>
        <p className="text-white/70 mb-4">
          Your password has been updated. Redirecting to dashboard...
        </p>
        <div className="flex items-center justify-center gap-2 text-white/50">
          <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
          <span className="text-sm">Redirecting...</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Current Password */}
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-white/80 mb-2">
          Current Password
        </label>
        <div className="relative">
          <input
            {...register('currentPassword')}
            type={showCurrentPassword ? 'text' : 'password'}
            id="currentPassword"
            className={`input-field pr-10 ${
              errors.currentPassword ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="Enter your current password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
            disabled={isLoading}
          >
            <Icon 
              icon={showCurrentPassword ? 'mdi:eye-off' : 'mdi:eye'} 
              className="w-5 h-5" 
            />
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="w-4 h-4" />
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      {/* New Password */}
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-white/80 mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            {...register('newPassword')}
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            className={`input-field pr-10 ${
              errors.newPassword ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="Enter your new password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
            disabled={isLoading}
          >
            <Icon 
              icon={showNewPassword ? 'mdi:eye-off' : 'mdi:eye'} 
              className="w-5 h-5" 
            />
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="w-4 h-4" />
            {errors.newPassword.message}
          </p>
        )}
        
        {/* Password Strength Indicator */}
        {newPassword && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/60">Password Strength:</span>
              <span className={`text-xs font-medium ${passwordStrength.color}`}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  passwordStrength.score < 3 ? 'bg-red-400' :
                  passwordStrength.score < 4 ? 'bg-yellow-400' :
                  passwordStrength.score < 5 ? 'bg-blue-400' : 'bg-green-400'
                }`}
                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            className={`input-field pr-10 ${
              errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="Confirm your new password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
            disabled={isLoading}
          >
            <Icon 
              icon={showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'} 
              className="w-5 h-5" 
            />
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="w-4 h-4" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Password Requirements */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
          <Icon icon="mdi:information" className="w-4 h-4" />
          Password Requirements
        </h4>
        <ul className="text-white/60 text-xs space-y-1">
          <li className="flex items-center gap-2">
            <Icon 
              icon={newPassword?.length >= 8 ? 'mdi:check' : 'mdi:close'} 
              className={`w-3 h-3 ${newPassword?.length >= 8 ? 'text-green-400' : 'text-red-400'}`} 
            />
            At least 8 characters long
          </li>
          <li className="flex items-center gap-2">
            <Icon 
              icon={/[A-Z]/.test(newPassword || '') ? 'mdi:check' : 'mdi:close'} 
              className={`w-3 h-3 ${/[A-Z]/.test(newPassword || '') ? 'text-green-400' : 'text-red-400'}`} 
            />
            Contains uppercase letter
          </li>
          <li className="flex items-center gap-2">
            <Icon 
              icon={/[a-z]/.test(newPassword || '') ? 'mdi:check' : 'mdi:close'} 
              className={`w-3 h-3 ${/[a-z]/.test(newPassword || '') ? 'text-green-400' : 'text-red-400'}`} 
            />
            Contains lowercase letter
          </li>
          <li className="flex items-center gap-2">
            <Icon 
              icon={/\d/.test(newPassword || '') ? 'mdi:check' : 'mdi:close'} 
              className={`w-3 h-3 ${/\d/.test(newPassword || '') ? 'text-green-400' : 'text-red-400'}`} 
            />
            Contains number
          </li>
          <li className="flex items-center gap-2">
            <Icon 
              icon={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword || '') ? 'mdi:check' : 'mdi:close'} 
              className={`w-3 h-3 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword || '') ? 'text-green-400' : 'text-red-400'}`} 
            />
            Contains special character
          </li>
        </ul>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
            Updating Password...
          </>
        ) : (
          <>
            <Icon icon="mdi:lock-reset" className="w-5 h-5" />
            Update Password
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-white/50 text-xs flex items-center justify-center gap-1">
          <Icon icon="mdi:shield-check" className="w-3 h-3" />
          Your password will be securely encrypted and stored
        </p>
      </div>
    </form>
  )
}