'use client'

import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'masking'
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

export default function LoadingAnimation({ 
  size = 'md', 
  variant = 'spinner', 
  text,
  fullScreen = false 
}: LoadingAnimationProps) {
  const renderSpinner = () => (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-accent/30 border-t-accent rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  )

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-accent rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  )

  const renderPulse = () => (
    <motion.div
      className={`${sizeClasses[size]} bg-accent rounded-full`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  )

  const renderSkeleton = () => (
    <div className="space-y-3 w-full max-w-sm">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="h-4 bg-white/10 rounded overflow-hidden"
          style={{ width: `${100 - i * 10}%` }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </motion.div>
      ))}
    </div>
  )

  const renderMasking = () => (
    <div className="relative">
      <motion.div
        className="w-32 h-32 relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        {/* Masking overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/30 to-transparent"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon 
            icon="mdi:chart-line" 
            className="w-12 h-12 text-accent"
          />
        </div>
      </motion.div>
    </div>
  )

  const renderAnimation = () => {
    switch (variant) {
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      case 'skeleton':
        return renderSkeleton()
      case 'masking':
        return renderMasking()
      default:
        return renderSpinner()
    }
  }

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center space-y-4"
    >
      {renderAnimation()}
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/70 text-sm font-medium"
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  )

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        {content}
      </motion.div>
    )
  }

  return content
}

// Quick loading states for common use cases
export const ButtonLoading = () => (
  <LoadingAnimation size="sm" variant="spinner" />
)

export const PageLoading = () => (
  <LoadingAnimation 
    size="lg" 
    variant="masking" 
    text="Loading..." 
    fullScreen 
  />
)

export const CardLoading = () => (
  <LoadingAnimation variant="skeleton" />
)