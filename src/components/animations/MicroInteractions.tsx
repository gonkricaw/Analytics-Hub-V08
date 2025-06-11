'use client'

import { motion, useAnimation, useInView } from 'framer-motion'
import { ReactNode, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function AnimatedButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button'
}: AnimatedButtonProps) {
  const baseClasses = 'relative overflow-hidden font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20'
  
  const variantClasses = {
    primary: 'bg-accent hover:bg-accent/90 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-secondary hover:bg-secondary/90 text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-white border border-white/20 hover:border-accent/50'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '100%', opacity: [0, 1, 0] }}
        transition={{ duration: 0.6 }}
      />
      
      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <motion.div
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : null}
        {children}
      </span>
    </motion.button>
  )
}

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  delay?: number
}

export function AnimatedCard({ children, className = '', hover = true, delay = 0 }: AnimatedCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      whileHover={hover ? { 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : {}}
      className={`card ${className}`}
    >
      {children}
    </motion.div>
  )
}

interface FloatingIconProps {
  icon: string
  size?: number
  color?: string
  delay?: number
}

export function FloatingIcon({ icon, size = 24, color = 'text-accent', delay = 0 }: FloatingIconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -10, 0]
      }}
      transition={{
        opacity: { duration: 0.3, delay },
        scale: { duration: 0.3, delay },
        y: { 
          duration: 2, 
          repeat: Infinity, 
          ease: 'easeInOut',
          delay: delay + 0.5
        }
      }}
      className={color}
    >
      <Icon icon={icon} width={size} height={size} />
    </motion.div>
  )
}

interface PulseEffectProps {
  children: ReactNode
  color?: string
  intensity?: number
}

export function PulseEffect({ children, color = 'accent', intensity = 0.2 }: PulseEffectProps) {
  return (
    <motion.div
      className="relative"
      whileHover="hover"
    >
      <motion.div
        className={`absolute inset-0 bg-${color} rounded-lg opacity-0`}
        variants={{
          hover: {
            opacity: intensity,
            scale: 1.05,
            transition: { duration: 0.2 }
          }
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

interface CounterAnimationProps {
  from: number
  to: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
}

export function CounterAnimation({ 
  from, 
  to, 
  duration = 2, 
  suffix = '', 
  prefix = '',
  className = ''
}: CounterAnimationProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start({
        count: to,
        transition: { duration, ease: 'easeOut' }
      })
    }
  }, [isInView, controls, to, duration])

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ count: from }}
      animate={controls}
    >
      {({ count }: { count: number }) => (
        `${prefix}${Math.round(count)}${suffix}`
      )}
    </motion.span>
  )
}

interface SuccessAnimationProps {
  show: boolean
  onComplete?: () => void
}

export function SuccessAnimation({ show, onComplete }: SuccessAnimationProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={show ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 200, 
        damping: 15,
        onComplete 
      }}
      className="flex items-center justify-center"
    >
      <motion.div
        className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
        animate={show ? {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Icon icon="mdi:check" className="w-8 h-8 text-white" />
      </motion.div>
    </motion.div>
  )
}

interface ErrorAnimationProps {
  show: boolean
  onComplete?: () => void
}

export function ErrorAnimation({ show, onComplete }: ErrorAnimationProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={show ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 200, 
        damping: 15,
        onComplete 
      }}
      className="flex items-center justify-center"
    >
      <motion.div
        className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center"
        animate={show ? {
          x: [0, -5, 5, -5, 5, 0],
        } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Icon icon="mdi:close" className="w-8 h-8 text-white" />
      </motion.div>
    </motion.div>
  )
}