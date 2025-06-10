'use client'

import { useEffect } from 'react'
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring'

interface PerformanceMonitorProps {
  enabled?: boolean
  reportToAnalytics?: boolean
}

export default function PerformanceMonitor({ 
  enabled = true, 
  reportToAnalytics = process.env.NODE_ENV === 'production' 
}: PerformanceMonitorProps) {
  // Initialize performance monitoring
  usePerformanceMonitoring({
    enabled,
    reportToAnalytics,
    logToConsole: process.env.NODE_ENV === 'development'
  })

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Monitor page load performance
    const handleLoad = () => {
      // Wait a bit for all resources to load
      setTimeout(() => {
        if ('performance' in window) {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          
          if (navigation) {
            const metrics = {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              domInteractive: navigation.domInteractive - navigation.navigationStart,
              firstPaint: 0,
              firstContentfulPaint: 0,
            }

            // Get paint timings
            const paintEntries = performance.getEntriesByType('paint')
            paintEntries.forEach((entry) => {
              if (entry.name === 'first-paint') {
                metrics.firstPaint = entry.startTime
              } else if (entry.name === 'first-contentful-paint') {
                metrics.firstContentfulPaint = entry.startTime
              }
            })

            if (process.env.NODE_ENV === 'development') {
              console.log('[Performance] Page Load Metrics:', metrics)
            }

            if (reportToAnalytics) {
              // Send page load metrics to analytics
              fetch('/api/analytics/performance', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  metric_name: 'page-load',
                  value: metrics.loadComplete,
                  rating: metrics.loadComplete < 2000 ? 'good' : metrics.loadComplete < 4000 ? 'needs-improvement' : 'poor',
                  timestamp: Date.now(),
                  url: window.location.pathname,
                  user_agent: navigator.userAgent,
                  details: metrics,
                }),
              }).catch(error => {
                console.warn('Failed to send page load metrics:', error)
              })
            }
          }
        }
      }, 1000)
    }

    // Monitor route changes (for SPA navigation)
    const handleRouteChange = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Performance] Route changed to:', window.location.pathname)
      }
      
      // Mark route change for performance measurement
      performance.mark('route-change-start')
      
      // Measure route change completion after a short delay
      setTimeout(() => {
        performance.mark('route-change-end')
        performance.measure('route-change', 'route-change-start', 'route-change-end')
        
        const measure = performance.getEntriesByName('route-change', 'measure')[0]
        if (measure && process.env.NODE_ENV === 'development') {
          console.log('[Performance] Route change duration:', measure.duration, 'ms')
        }
      }, 100)
    }

    // Monitor resource loading
    const handleResourceLoad = () => {
      if ('PerformanceObserver' in window) {
        try {
          const resourceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              const resource = entry as PerformanceResourceTiming
              
              // Log slow resources
              if (resource.duration > 1000) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[Performance] Slow resource:', {
                    name: resource.name,
                    duration: resource.duration,
                    size: resource.transferSize,
                    type: resource.initiatorType
                  })
                }
              }
              
              // Track large resources
              if (resource.transferSize > 1024 * 1024) { // > 1MB
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[Performance] Large resource:', {
                    name: resource.name,
                    size: `${(resource.transferSize / 1024 / 1024).toFixed(2)} MB`,
                    type: resource.initiatorType
                  })
                }
              }
            })
          })
          
          resourceObserver.observe({ entryTypes: ['resource'] })
          
          return () => resourceObserver.disconnect()
        } catch (error) {
          console.warn('Resource observer not supported:', error)
        }
      }
    }

    // Set up event listeners
    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
    }
    
    // Monitor route changes (for Next.js router)
    window.addEventListener('popstate', handleRouteChange)
    
    // Set up resource monitoring
    const resourceCleanup = handleResourceLoad()

    return () => {
      window.removeEventListener('load', handleLoad)
      window.removeEventListener('popstate', handleRouteChange)
      if (resourceCleanup) resourceCleanup()
    }
  }, [enabled, reportToAnalytics])

  // This component doesn't render anything
  return null
}