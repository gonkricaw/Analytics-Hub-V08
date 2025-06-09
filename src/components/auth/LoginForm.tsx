'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Icon } from '@iconify/react'
import { loginSchema } from '@/lib/validation'
import { LoginCredentials } from '@/types'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          remember: data.rememberMe || false
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'INVALID_CREDENTIALS') {
          setError('email', { message: 'Invalid email or password' })
          setError('password', { message: 'Invalid email or password' })
        } else if (result.error === 'ACCOUNT_SUSPENDED') {
          toast.error('Your account has been suspended. Please contact support.')
        } else if (result.error === 'IP_BLACKLISTED') {
          toast.error('Too many failed login attempts. Your IP has been temporarily blocked.')
        } else if (result.error === 'RATE_LIMITED') {
          toast.error('Too many login attempts. Please wait before trying again.')
        } else {
          toast.error(result.message || 'Login failed. Please try again.')
        }
        return
      }

      // Check if user needs to update password (temporary password)
      if (result.requiresPasswordUpdate) {
        toast.success('Login successful! Please update your temporary password.')
        router.push('/update-password')
        return
      }

      // Check if user needs to accept terms
      if (result.requiresTermsAcceptance) {
        toast.success('Login successful! Please review and accept the terms and conditions.')
        router.push('/dashboard?showTerms=true')
        return
      }

      // Successful login
      toast.success('Login successful! Welcome back.')
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
            placeholder="Enter your password"
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
        {errors.password && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <Icon icon="mdi:alert-circle" className="h-4 w-4" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            {...register('rememberMe')}
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 text-accent focus:ring-accent border-white/20 rounded bg-secondary/30"
            disabled={isLoading}
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-white/80">
            Remember me
          </label>
        </div>
        <button
          type="button"
          className="text-sm text-white hover:text-orange-500 transition-colors"
          onClick={() => router.push('/forgot-password')}
          disabled={isLoading}
        >
          Forgot password?
        </button>
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
            Signing in...
          </>
        ) : (
          <>
            <Icon icon="mdi:login" className="h-5 w-5" />
            Sign In
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-white/50">
          <Icon icon="mdi:shield-check" className="inline h-3 w-3 mr-1" />
          Your connection is secure and encrypted
        </p>
      </div>
    </form>
  )
}