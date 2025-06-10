'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedButton, ErrorAnimation } from '@/components/animations/MicroInteractions'
import { LoadingAnimation } from '@/components/animations/LoadingAnimation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('') // Clear error when user starts typing
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password')
        } else if (result.error === 'ACCOUNT_SUSPENDED') {
          setError('Your account has been suspended. Please contact support.')
        } else if (result.error === 'IP_BLACKLISTED') {
          setError('Too many failed login attempts. Your IP has been temporarily blocked.')
        } else if (result.error === 'RATE_LIMITED') {
          setError('Too many login attempts. Please wait before trying again.')
        } else {
          setError('Login failed. Please try again.')
        }
        return
      }

      // Successful login
      toast({
        title: "Login successful!",
        description: "Welcome back to Analytics Hub.",
      })
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <ErrorAnimation>
            <Alert className="border-red-500/50 bg-red-500/10">
              <Icon icon="mdi:alert-circle" className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          </ErrorAnimation>
        )}
      </AnimatePresence>

      {/* Email Field */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Label htmlFor="email" className="text-white font-medium">
          Email Address
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="mdi:email" className="h-5 w-5 text-white/60" />
          </div>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="input-field pl-10 w-full"
            placeholder="Enter your email address"
            disabled={isLoading}
            required
          />
        </div>
      </motion.div>

      {/* Password Field */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Label htmlFor="password" className="text-white font-medium">
          Password
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="mdi:lock" className="h-5 w-5 text-white/60" />
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="input-field pl-10 pr-10 w-full"
            placeholder="Enter your password"
            disabled={isLoading}
            required
          />
          <motion.button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon 
              icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} 
              className="h-5 w-5 text-white/60 hover:text-white transition-colors" 
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Forgot Password */}
      <motion.div
        className="text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.button
          type="button"
          className="text-sm text-white/80 hover:text-accent transition-colors"
          onClick={() => router.push('/forgot-password')}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Forgot password?
        </motion.button>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <AnimatedButton
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary"
          variant="primary"
        >
          {isLoading ? (
            <>
              <LoadingAnimation variant="spinner" size="sm" />
              Signing in...
            </>
          ) : (
            <>
              <Icon icon="mdi:login" className="h-5 w-5" />
              Sign In
            </>
          )}
        </AnimatedButton>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <p className="text-xs text-white/50 flex items-center justify-center gap-1">
          <Icon icon="mdi:shield-check" className="h-3 w-3" />
          Your connection is secure and encrypted
        </p>
      </motion.div>
    </motion.form>
  )
}