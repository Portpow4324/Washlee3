import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/security/adminSession'

type RateLimitConfig = {
  limit: number
  windowMs: number
}

type RateLimitBucket = {
  count: number
  resetAt: number
}

const rateLimitBuckets = new Map<string, RateLimitBucket>()
const PROTECTED_DASHBOARD_ROUTES = ['/dashboard/customer', '/dashboard/pro']
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const TRUSTED_APP_ORIGINS = new Set([
  'https://washlee3-llqy.onrender.com',
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.APP_URL,
  process.env.FRONTEND_URL,
].filter(Boolean) as string[])

function securityHeaders(request: NextRequest) {
  const headers = new Headers()
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)')
  headers.set('Content-Security-Policy', "frame-ancestors 'none'; base-uri 'self'; object-src 'none'")

  if (request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return headers
}

function applySecurityHeaders(response: NextResponse, request: NextRequest) {
  securityHeaders(request).forEach((value, key) => {
    response.headers.set(key, value)
  })
  return response
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || request.headers.get('x-real-ip') || 'local'
}

function getRateLimitConfig(pathname: string, method: string): RateLimitConfig | null {
  if (!pathname.startsWith('/api/')) return null

  if (pathname.startsWith('/api/admin/session')) {
    return { limit: 5, windowMs: 5 * 60 * 1000 }
  }

  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/employee-login') ||
    pathname.includes('password-reset') ||
    pathname.includes('send-phone-code') ||
    pathname.includes('verify-phone-code') ||
    pathname.includes('resend')
  ) {
    return { limit: 8, windowMs: 10 * 60 * 1000 }
  }

  if (pathname.startsWith('/api/auth/signup')) {
    return { limit: 5, windowMs: 60 * 60 * 1000 }
  }

  if (pathname.startsWith('/api/analytics/track')) {
    return { limit: 120, windowMs: 60 * 1000 }
  }

  if (requiresAdminSession(pathname, method)) {
    return { limit: 90, windowMs: 60 * 1000 }
  }

  if (
    UNSAFE_METHODS.has(method) &&
    (pathname.includes('checkout') ||
      pathname.includes('payment') ||
      pathname.includes('orders') ||
      pathname.includes('contact') ||
      pathname.includes('inquiries'))
  ) {
    return { limit: 30, windowMs: 60 * 1000 }
  }

  return { limit: 180, windowMs: 60 * 1000 }
}

function rateLimit(request: NextRequest) {
  const { pathname } = request.nextUrl
  const config = getRateLimitConfig(pathname, request.method)
  if (!config) return null

  const now = Date.now()
  const key = `${getClientIp(request)}:${request.method}:${pathname}`
  const existing = rateLimitBuckets.get(key)
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + config.windowMs }

  bucket.count += 1
  rateLimitBuckets.set(key, bucket)

  if (rateLimitBuckets.size > 5000) {
    for (const [bucketKey, value] of rateLimitBuckets.entries()) {
      if (value.resetAt <= now) rateLimitBuckets.delete(bucketKey)
    }
  }

  const remaining = Math.max(0, config.limit - bucket.count)
  const headers = new Headers({
    'Retry-After': Math.ceil((bucket.resetAt - now) / 1000).toString(),
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(bucket.resetAt / 1000).toString(),
  })

  if (bucket.count > config.limit) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait and try again.' },
      { status: 429, headers }
    )
  }

  return headers
}

function isSameOriginUnsafeRequest(request: NextRequest) {
  if (!UNSAFE_METHODS.has(request.method)) return true

  const { pathname, origin: appOrigin } = request.nextUrl
  if (pathname.startsWith('/api/webhooks/') || pathname.includes('/webhook')) return true

  const origin = request.headers.get('origin')
  if (!origin) return true

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')
  const externalOrigin =
    forwardedHost || host
      ? `${forwardedProto || request.nextUrl.protocol.replace(':', '')}://${forwardedHost || host}`
      : appOrigin

  return origin === appOrigin || origin === externalOrigin || TRUSTED_APP_ORIGINS.has(origin)
}

function isAdminPage(pathname: string) {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/admin-login' ||
    pathname === '/admin-setup'
  )
}

function isAdminLoginPage(pathname: string) {
  return pathname === '/admin/login' || pathname === '/admin-login'
}

function isAdminOnlyApi(pathname: string) {
  return (
    pathname.startsWith('/api/admin/') ||
    pathname === '/api/analytics/summary' ||
    pathname === '/api/analytics/monitor' ||
    pathname === '/api/employee-codes' ||
    pathname.startsWith('/api/inquiries/list') ||
    pathname.startsWith('/api/inquiries/approve') ||
    pathname.startsWith('/api/inquiries/reject') ||
    pathname.startsWith('/api/marketing/') ||
    pathname.startsWith('/api/orders/admin/') ||
    pathname.startsWith('/api/reviews/moderation') ||
    pathname.startsWith('/api/pro/application-decision') ||
    pathname.startsWith('/api/payouts') ||
    pathname.startsWith('/api/refunds')
  )
}

function requiresAdminSession(pathname: string, method: string) {
  return isAdminOnlyApi(pathname) || (pathname === '/api/orders' && method === 'GET')
}

function isDebugOrTestPath(pathname: string) {
  return (
    pathname.startsWith('/api/test') ||
    pathname.startsWith('/api/debug') ||
    pathname.includes('/debug-') ||
    pathname.includes('test-email') ||
    pathname === '/email-debug' ||
    pathname === '/test-remember-me'
  )
}

async function hasAdminSession(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const rateLimitResult = rateLimit(request)
  if (rateLimitResult instanceof NextResponse) {
    return applySecurityHeaders(rateLimitResult, request)
  }

  if (!isSameOriginUnsafeRequest(request)) {
    return applySecurityHeaders(
      NextResponse.json({ success: false, error: 'Invalid request origin' }, { status: 403 }),
      request
    )
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_TEST_ENDPOINTS !== 'true' &&
    isDebugOrTestPath(pathname)
  ) {
    return applySecurityHeaders(NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }), request)
  }

  if (requiresAdminSession(pathname, request.method) && pathname !== '/api/admin/session') {
    if (!(await hasAdminSession(request))) {
      return applySecurityHeaders(
        NextResponse.json({ success: false, error: 'Admin session required' }, { status: 401 }),
        request
      )
    }
  }

  if (isAdminPage(pathname) && !isAdminLoginPage(pathname)) {
    if (!(await hasAdminSession(request))) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return applySecurityHeaders(NextResponse.redirect(loginUrl), request)
    }
  }

  if (PROTECTED_DASHBOARD_ROUTES.some((route) => pathname.startsWith(route))) {
    const authToken = request.cookies.get('authToken')?.value
    if (!authToken) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/auth/login', request.url)), request)
    }
  }

  const response = NextResponse.next()
  if (rateLimitResult instanceof Headers) {
    rateLimitResult.forEach((value, key) => response.headers.set(key, value))
  }

  return applySecurityHeaders(response, request)
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/admin-login',
    '/admin-setup',
    '/dashboard/:path*',
    '/email-debug',
    '/test-remember-me',
  ],
}
