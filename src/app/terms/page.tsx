'use client'

import { useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import TermsAcceptanceForm from '@/components/auth/TermsAcceptanceForm'

export default function TermsPage() {
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

    // Legal-themed particle system
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      type: 'document' | 'check' | 'scale'
      rotation: number
      rotationSpeed: number
    }> = []

    // Create themed particles
    for (let i = 0; i < 20; i++) {
      const types = ['document', 'check', 'scale'] as const
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.2 + 0.1,
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01
      })
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#0E0E44')
      gradient.addColorStop(0.3, '#1a1a5e')
      gradient.addColorStop(0.7, '#2a2a7e')
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
          document: '#FF7A00',
          check: '#00FF7A',
          scale: '#7A7AFF'
        }
        ctx.fillStyle = colors[particle.type]
        
        // Draw simple shapes representing legal icons
        if (particle.type === 'document') {
          ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size * 1.2)
        } else if (particle.type === 'check') {
          ctx.beginPath()
          ctx.arc(0, 0, particle.size/2, 0, Math.PI * 2)
          ctx.fill()
        } else { // scale
          ctx.beginPath()
          ctx.moveTo(-particle.size/2, 0)
          ctx.lineTo(particle.size/2, 0)
          ctx.moveTo(-particle.size/3, -particle.size/3)
          ctx.lineTo(-particle.size/3, particle.size/3)
          ctx.moveTo(particle.size/3, -particle.size/3)
          ctx.lineTo(particle.size/3, particle.size/3)
          ctx.stroke()
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
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full border border-accent/30 mb-4">
              <Icon 
                icon="mdi:file-document-check" 
                className="w-8 h-8 text-accent"
              />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Terms & Conditions
            </h1>
            <p className="text-white/70 text-sm">
              Please review and accept our terms to continue
            </p>
          </div>

          {/* Terms Content Card */}
          <div className="card backdrop-blur-md bg-white/5 border border-white/10 mb-6">
            <div className="p-6">
              <div className="max-h-96 overflow-y-auto custom-scrollbar pr-4">
                <div className="prose prose-invert max-w-none">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Icon icon="mdi:gavel" className="w-5 h-5 text-accent" />
                    Analytics Hub - Terms of Service
                  </h2>
                  
                  <div className="space-y-6 text-white/80 text-sm leading-relaxed">
                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">1. Acceptance of Terms</h3>
                      <p>
                        By accessing and using Analytics Hub ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">2. Access and Security</h3>
                      <p>
                        Analytics Hub operates on an invitation-only basis. Access is granted solely at our discretion. You are responsible for:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Maintaining the confidentiality of your account credentials</li>
                        <li>All activities that occur under your account</li>
                        <li>Notifying us immediately of any unauthorized use</li>
                        <li>Using strong, unique passwords and updating them regularly</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">3. Data Privacy and Protection</h3>
                      <p>
                        We are committed to protecting your privacy and data. Our practices include:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Encryption of all sensitive data in transit and at rest</li>
                        <li>Regular security audits and monitoring</li>
                        <li>Compliance with applicable data protection regulations</li>
                        <li>Limited data retention and secure deletion policies</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">4. Acceptable Use Policy</h3>
                      <p>
                        You agree not to use the Service to:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Violate any applicable laws or regulations</li>
                        <li>Infringe on intellectual property rights</li>
                        <li>Attempt to gain unauthorized access to systems or data</li>
                        <li>Distribute malware or engage in harmful activities</li>
                        <li>Share access credentials with unauthorized parties</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">5. Content and Analytics</h3>
                      <p>
                        The analytics and content provided through this platform are:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>For authorized users only and subject to role-based access controls</li>
                        <li>Confidential and proprietary information</li>
                        <li>Not to be shared, copied, or distributed without explicit permission</li>
                        <li>Subject to regular updates and modifications</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">6. Service Availability</h3>
                      <p>
                        While we strive for maximum uptime, we do not guarantee uninterrupted service. We reserve the right to:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Perform scheduled maintenance with advance notice</li>
                        <li>Suspend service for security or technical reasons</li>
                        <li>Modify or discontinue features with reasonable notice</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">7. Limitation of Liability</h3>
                      <p>
                        To the maximum extent permitted by law, Analytics Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">8. Termination</h3>
                      <p>
                        We may terminate or suspend your access immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">9. Changes to Terms</h3>
                      <p>
                        We reserve the right to modify these terms at any time. We will notify users of significant changes via email or platform notifications. Continued use constitutes acceptance of modified terms.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-medium text-white mb-2">10. Contact Information</h3>
                      <p>
                        For questions about these Terms of Service, please contact our support team through the platform's help system.
                      </p>
                    </section>
                  </div>

                  <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <p className="text-white/90 text-sm font-medium mb-2">
                      <Icon icon="mdi:calendar-clock" className="inline w-4 h-4 mr-1" />
                      Last Updated: {new Date().toLocaleDateString()}
                    </p>
                    <p className="text-white/70 text-xs">
                      These terms are effective immediately and supersede all previous versions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acceptance Form */}
          <div className="card backdrop-blur-md bg-white/5 border border-white/10">
            <div className="p-6">
              <TermsAcceptanceForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}