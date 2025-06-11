'use client'

import { useEffect } from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

interface UsePerformanceMonitoringOptions {
  enabled?: boolean
  reportToAnalytics?: boolean
  logToConsole?: boolean
}

export function usePerformanceMonitoring({
  enabled = true,
  reportToAnalytics = false,
  logToConsole = process.env.NODE_ENV === 'development'
}: UsePerformanceMonitoringOptions = {}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const handleMetric = (metric: PerformanceMetric) => {
      if (logToConsole) {
        console.log(`[Performance] ${metric.name}:`, {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id
        })
      }

      if (reportToAnalytics) {
        // Send to analytics service
        fetch('/api/analytics/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metric_name: metric.name,
            value: metric.value,
            rating: metric.rating,
            timestamp: Date.now(),
            url: window.location.pathname,
            user_agent: navigator.userAgent,
          }),
        }).catch(error => {
          console.warn('Failed to send performance metric:', error)
        })
      }
    }

    // Core Web Vitals
    onCLS(handleMetric)
    onINP(handleMetric)
    onFCP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)

    // Custom performance observers
    if ('PerformanceObserver' in window) {
      // Long tasks observer
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              if (logToConsole) {
                console.warn(`[Performance] Long task detected:`, {
                  duration: entry.duration,
                  startTime: entry.startTime,
                  name: entry.name
                })
              }
            }
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('Long task observer not supported:', error)
      }

      // Layout shift observer
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.value > 0.1) {
              if (logToConsole) {
                console.warn(`[Performance] Layout shift detected:`, {
                  value: entry.value,
                  sources: entry.sources?.map((source: any) => ({
                    node: source.node,
                    currentRect: source.currentRect,
                    previousRect: source.previousRect
                  }))
                })
              }
            }
          })
        })
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Layout shift observer not supported:', error)
      }
    }

    // Memory usage monitoring (if available)
    if ('memory' in performance) {
      const checkMemoryUsage = () => {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / 1024 / 1024
        const totalMB = memory.totalJSHeapSize / 1024 / 1024
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024

        if (usedMB > limitMB * 0.8) {
          if (logToConsole) {
            console.warn(`[Performance] High memory usage:`, {
              used: `${usedMB.toFixed(2)} MB`,
              total: `${totalMB.toFixed(2)} MB`,
              limit: `${limitMB.toFixed(2)} MB`,
              percentage: `${((usedMB / limitMB) * 100).toFixed(2)}%`
            })
          }
        }
      }

      // Check memory usage every 30 seconds
      const memoryInterval = setInterval(checkMemoryUsage, 30000)
      return () => clearInterval(memoryInterval)
    }
  }, [enabled, reportToAnalytics, logToConsole])
}

// Hook for measuring custom performance metrics
export function useCustomMetric(name: string, value: number, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Mark the performance metric
    performance.mark(`${name}-start`)
    
    return () => {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const measure = performance.getEntriesByName(name, 'measure')[0]
      if (measure && process.env.NODE_ENV === 'development') {
        console.log(`[Custom Metric] ${name}:`, {
          duration: measure.duration,
          value: value
        })
      }
    }
  }, [name, value, enabled])
}