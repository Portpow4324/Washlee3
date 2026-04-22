/**
 * Rate Limiting & IP Whitelist Utility
 * Prevents signup spam while allowing whitelisted IPs for testing
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface RateLimitConfig {
  maxAttemptsPerIP: number          // Max signup attempts per IP
  maxAttemptsPerEmail: number       // Max signup attempts per email
  windowDurationMinutes: number     // Time window for rate limiting
  skipRateLimitForWhitelistedIPs: boolean
}

const defaultConfig: RateLimitConfig = {
  maxAttemptsPerIP: 5,              // 5 attempts per IP
  maxAttemptsPerEmail: 3,           // 3 attempts per email
  windowDurationMinutes: 60,        // Per hour
  skipRateLimitForWhitelistedIPs: true
}

/**
 * Extract client IP from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  return ip
}

/**
 * Check if IP is whitelisted from rate limiting
 */
export async function isIPWhitelisted(ipAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('rate_limit_whitelist')
      .select('id')
      .eq('ip_address', ipAddress)
      .eq('is_active', true)
      .single()

    if (error) return false
    return !!data
  } catch (error) {
    console.error('[RATE_LIMIT] Error checking whitelist:', error)
    return false
  }
}

/**
 * Check rate limit for signup attempts
 */
export async function checkSignupRateLimit(
  ipAddress: string,
  email: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; reason?: string; attemptsRemaining?: number }> {
  
  // Check if IP is whitelisted
  if (config.skipRateLimitForWhitelistedIPs) {
    const isWhitelisted = await isIPWhitelisted(ipAddress)
    if (isWhitelisted) {
      console.log(`[RATE_LIMIT] ✓ IP ${ipAddress} is whitelisted - no rate limit applied`)
      return { allowed: true }
    }
  }

  const cutoffTime = new Date(Date.now() - config.windowDurationMinutes * 60 * 1000)

  try {
    // Check IP-based rate limit
    const { data: ipAttempts, error: ipError } = await supabase
      .from('signup_attempts')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', cutoffTime.toISOString())

    if (!ipError && ipAttempts && ipAttempts.length >= config.maxAttemptsPerIP) {
      console.warn(`[RATE_LIMIT] ⚠️ IP ${ipAddress} exceeded rate limit (${ipAttempts.length}/${config.maxAttemptsPerIP})`)
      return {
        allowed: false,
        reason: `Too many signup attempts from this IP. Please try again in ${config.windowDurationMinutes} minutes.`,
        attemptsRemaining: 0
      }
    }

    // Check email-based rate limit
    const { data: emailAttempts, error: emailError } = await supabase
      .from('signup_attempts')
      .select('id')
      .eq('email', email.toLowerCase())
      .gte('created_at', cutoffTime.toISOString())

    if (!emailError && emailAttempts && emailAttempts.length >= config.maxAttemptsPerEmail) {
      console.warn(`[RATE_LIMIT] ⚠️ Email ${email} exceeded rate limit (${emailAttempts.length}/${config.maxAttemptsPerEmail})`)
      return {
        allowed: false,
        reason: `Too many signup attempts for this email. Please try again in ${config.windowDurationMinutes} minutes.`,
        attemptsRemaining: 0
      }
    }

    const ipAttemptsRemaining = config.maxAttemptsPerIP - (ipAttempts?.length || 0)
    return { allowed: true, attemptsRemaining: ipAttemptsRemaining }

  } catch (error) {
    console.error('[RATE_LIMIT] Error checking rate limit:', error)
    // On error, allow the request to proceed (fail open)
    return { allowed: true }
  }
}

/**
 * Log signup attempt (for rate limiting tracking)
 */
export async function logSignupAttempt(
  ipAddress: string,
  email: string,
  success: boolean
): Promise<void> {
  try {
    await supabase
      .from('signup_attempts')
      .insert({
        ip_address: ipAddress,
        email: email.toLowerCase(),
        success,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('[RATE_LIMIT] Error logging signup attempt:', error)
    // Don't fail the signup if logging fails
  }
}

/**
 * Format rate limit error response
 */
export function getRateLimitErrorResponse(reason: string) {
  return {
    error: reason,
    code: 'RATE_LIMITED',
    retryAfter: 3600 // 1 hour in seconds
  }
}
