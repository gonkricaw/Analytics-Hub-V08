'use client'

import { useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm'

export default function UpdatePasswordPage() {
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

    // Particle system with security theme
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      type: 'lock' | 'key' | 'shield'
      rotation: number
      rotationSpeed: number
    }> = []

    // Create themed particles
    for (let i = 0; i < 25; i++) {
      const types = ['lock', 'key', 'shield'] as const
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.3 + 0.1,
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
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
        particle.rotation += particle.rotationSpeed

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Draw particle based on type
        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        
        // Set color based on type
        const colors = {
          lock: '#FF7A00',
          key: '#FFD700',
          shield: '#00FF7A'
        }
        ctx.fillStyle = colors[particle.type]
        
        // Draw simple shapes representing security icons
        if (particle.type === 'lock') {
          ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size)
        } else if (particle.type === 'key') {
          ctx.beginPath()
          ctx.arc(0, 0, particle.size/2, 0, Math.PI * 2)
          ctx.fill()
        } else { // shield
          ctx.beginPath()
          ctx.moveTo(0, -particle.size/2)
          ctx.lineTo(particle.size/2, particle.size/2)
          ctx.lineTo(-particle.size/2, particle.size/2)
          ctx.closePath()
          ctx.fill()
        }
        
        ctx.restore()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

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
                icon="mdi:lock-alert" 
                className="w-8 h-8 text-accent"
              />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Update Password
            </h1>
            <p className="text-white/70 text-sm">
              Please update your temporary password
            </p>
          </div>

          {/* Security Notice */}
          <div className="mb-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-white/80 text-sm font-medium">
                    Security Requirement
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    You're using a temporary password. For security reasons, you must create a new password before accessing the system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Update Password Form Card */}
          <div className="card backdrop-blur-md bg-white/5 border border-white/10">
            <div className="p-6">
              <UpdatePasswordForm />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
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