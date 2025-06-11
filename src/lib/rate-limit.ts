import { NextRequest } from 'next/server'

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval?: number // Max unique tokens per interval
  maxAttempts?: number // Max attempts per token per interval
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory store for rate limiting (in production, use Redis)
const tokenCache = new Map<string, { count: number; reset: number }>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of tokenCache.entries()) {
    if (now > value.reset) {
      tokenCache.delete(key)
    }
  }
}, 60000) // Clean up every minute

export function rateLimit(options: RateLimitOptions) {
  const {
    interval,
    uniqueTokenPerInterval = 500,
    maxAttempts = 10
  } = options

  return {
    check: (request: NextRequest, token?: string): RateLimitResult => {
      const identifier = token || getClientIP(request)
      const key = `${identifier}:${interval}`
      const now = Date.now()
      const reset = now + interval

      const tokenData = tokenCache.get(key)

      if (!tokenData || now > tokenData.reset) {
        // First request or window expired
        tokenCache.set(key, { count: 1, reset })
        return {
          success: true,
          limit: maxAttempts,
          remaining: maxAttempts - 1,
          reset
        }
      }

      if (tokenData.count >= maxAttempts) {
        // Rate limit exceeded
        return {
          success: false,
          limit: maxAttempts,
          remaining: 0,
          reset: tokenData.reset
        }
      }

      // Increment count
      tokenData.count++
      tokenCache.set(key, tokenData)

      return {
        success: true,
        limit: maxAttempts,
        remaining: maxAttempts - tokenData.count,
        reset: tokenData.reset
      }
    }
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to a default IP if none found
  return '127.0.0.1'
}

// Export a default rate limiter for common use cases
export const defaultRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxAttempts: 60 // 60 requests per minute
})

// Export specific rate limiters for different use cases
export const authRateLimit = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5 // 5 attempts per 15 minutes
})

export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxAttempts: 100 // 100 requests per minute
})