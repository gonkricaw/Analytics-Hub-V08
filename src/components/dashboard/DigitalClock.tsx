'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@iconify/react'

interface DigitalClockProps {
  className?: string
}

export default function DigitalClock({ className = '' }: DigitalClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return (
      <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Icon icon="mdi:clock-outline" className="h-5 w-5" />
            Digital Clock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-mono text-white mb-1">--:--:--</div>
            <div className="text-sm text-white/70">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  return (
    <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Icon icon="mdi:clock-outline" className="h-5 w-5" />
          Digital Clock
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-mono text-white mb-2 font-bold">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-white/70 mb-1">
            {formatDate(currentTime)}
          </div>
          <div className="text-xs text-white/50">
            {getTimeZone()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}