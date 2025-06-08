'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'

function RegisterContent() {
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

    // Particle system
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      color: string
    }> = []

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? '#3b82f6' : '#8b5cf6'
      })
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)')
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)')
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0.1)')
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

        // Draw particle
        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Draw connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.save()
            ctx.globalAlpha = (100 - distance) / 100 * 0.2
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
            ctx.restore()
          }
        })
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
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full border border-red-500/30 mb-4">
                <Icon 
                  icon="mdi:alert-circle" 
                  className="w-8 h-8 text-red-400"
                />
              </div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Invalid Invitation
              </h1>
              <p className="text-white/70">
                No invitation token provided or the link is invalid.
              </p>
            </div>

            {/* Error Card */}
            <div className="card text-center space-y-6">
              <div className="space-y-4">
                <Icon icon="mdi:email-off" className="h-16 w-16 text-red-400 mx-auto" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Registration Not Available
                  </h2>
                  <p className="text-white/70">
                    You need a valid invitation link to register for an account.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link 
                  href="/login"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Icon icon="mdi:arrow-left" className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-white/50 text-sm flex items-center justify-center gap-1">
                <Icon icon="mdi:shield-check" className="h-4 w-4" />
                Secure registration process
              </p>
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
                icon="mdi:account-plus" 
                className="w-8 h-8 text-accent"
              />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Create Account
            </h1>
            <p className="text-white/70">
              Complete your registration to access Analytics Hub
            </p>
          </div>

          {/* Registration Form Card */}
          <div className="card">
            <RegisterForm token={token} />
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-white/70">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-accent hover:text-accent/80 transition-colors font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-white/50 text-sm flex items-center justify-center gap-1">
              <Icon icon="mdi:shield-check" className="h-4 w-4" />
              Your data is protected with enterprise-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}