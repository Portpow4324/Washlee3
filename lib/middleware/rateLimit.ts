import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per time window
 * Uses in-memory store (development) or Redis (production)
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store (development/testing)
// For production, use Redis: npm install redis
const inMemoryStore = new Map<string, RateLimitRecord>()

// Cleanup old entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of inMemoryStore.entries()) {
      if (now > value.resetTime) {
        inMemoryStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

/**
 * Create rate limit key
 */
function createLimitKey(
  ip: string,
  endpoint: string,
  userId?: string
): string {
  // Per-user limits are stricter than per-IP limits
  if (userId) {
    return `user:${userId}:${endpoint}`
  }
  return `ip:${ip}:${endpoint}`
}

/**
 * Check rate limit status
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = inMemoryStore.get(key)

  // Initialize or reset
  if (!record || now > record.resetTime) {
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: windowSeconds,
    }
  }

  // Check limit
  if (record.count >= maxRequests) {
    const resetIn = Math.ceil((record.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetIn,
    }
  }

  // Increment and allow
  record.count++
  const resetIn = Math.ceil((record.resetTime - now) / 1000)
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetIn,
  }
}

/**
 * Middleware: Apply rate limiting to request
 * Usage: const { allowed, resetIn } = withRateLimit(request, 10, 60)
 */
export function withRateLimit(
  request: NextRequest,
  maxRequests: number = 10,
  windowSeconds: number = 60,
  options?: {
    byUser?: boolean
    userId?: string
  }
): { allowed: boolean; resetIn?: number; response?: NextResponse } {
  const ip = getClientIp(request)
  const endpoint = request.nextUrl.pathname
  const userId = options?.userId
  const key = createLimitKey(ip, endpoint, userId)

  const { allowed, resetIn } = checkRateLimit(key, maxRequests, windowSeconds)

  if (!allowed) {
    const response = NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: resetIn,
        timestamp: new Date().toISOString(),
      },
      { status: 429 }
    )

    response.headers.set('Retry-After', String(resetIn))
    response.headers.set('X-RateLimit-Remaining', '0')
    response.headers.set('X-RateLimit-Reset', String(Date.now() + resetIn * 1000))

    return { allowed: false, resetIn, response }
  }

  return { allowed: true }
}

/**
 * Rate limit specific endpoints with different thresholds
 */
export const rateLimits = {
  // Strict limits for sensitive operations
  checkout: { max: 5, window: 60 }, // 5 per minute
  payment: { max: 10, window: 60 }, // 10 per minute
  orders: { max: 20, window: 60 }, // 20 per minute
  
  // Moderate limits for general operations
  orders_list: { max: 50, window: 60 }, // 50 per minute
  addresses: { max: 30, window: 60 }, // 30 per minute
  
  // Loose limits for read operations
  search: { max: 100, window: 60 }, // 100 per minute
  tracking: { max: 100, window: 60 }, // 100 per minute
  
  // Auth specific
  login: { max: 5, window: 300 }, // 5 per 5 minutes
  signup: { max: 3, window: 3600 }, // 3 per hour
  password_reset: { max: 3, window: 3600 }, // 3 per hour
}

/**
 * Export types for use in API routes
 */
export type RateLimitConfig = {
  max: number
  window: number
}
