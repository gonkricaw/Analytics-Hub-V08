'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import Link from 'next/link'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle system for reset password page
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      hue: number
    }> = []

    // Create particles with color variation
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.2,
        hue: Math.random() * 60 + 15 // Orange to yellow range
      })
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#0E0E44')
      gradient.addColorStop(0.5, '#1a1a5e')
      gradient.addColorStop(1, '#0E0E44')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Draw particle with HSL color
        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.fillStyle = `hsl(${particle.hue}, 100%, 60%)`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  if (!token) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Canvas Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        />

        {/* Content Overlay */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Error Card */}
            <div className="card backdrop-blur-md bg-white/5 border border-red-500/20">
              <div className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:alert-circle" className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Invalid Reset Link
                </h2>
                <p className="text-white/70 text-sm">
                  The password reset link is missing or invalid. Please request a new password reset.
                </p>
                <Link 
                  href="/forgot-password" 
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Icon icon="mdi:email-send" className="h-4 w-4" />
                  Request New Reset
                </Link>
              </div>
            </div>

            {/* Back to Login */}
            <div className="text-center mt-6">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors text-sm"
              >
                <Icon icon="mdi:arrow-left" className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full border border-accent/30 mb-4">
              <Icon 
                icon="mdi:lock-reset" 
                className="w-8 h-8 text-accent"
              />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Set New Password
            </h1>
            <p className="text-white/70 text-sm">
              Enter your new password below
            </p>
          </div>

          {/* Reset Password Form Card */}
          <div className="card backdrop-blur-md bg-white/5 border border-white/10">
            <div className="p-6">
              <ResetPasswordForm token={token} />
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors text-sm"
            >
              <Icon icon="mdi:arrow-left" className="h-4 w-4" />
              Back to Login
            </Link>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-white/50 text-xs">
              <Icon icon="mdi:shield-check" className="inline h-3 w-3 mr-1" />
              Your new password will be securely encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-dark via-dark to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:loading" className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}