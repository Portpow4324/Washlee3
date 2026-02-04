import { NextRequest, NextResponse } from 'next/server'

/**
 * NextJS Middleware for route protection
 */
export function proxy(request: NextRequest) {
  // Get the pathname from the request
  const pathname = request.nextUrl.pathname

  // Protected routes - require authentication
  const protectedRoutes = [
    '/privacy-policy',
    '/terms-of-service',
    '/cookie-policy',
    '/dashboard/customer',
    '/dashboard/pro',
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Check for auth token in cookies
    const authToken = request.cookies.get('authToken')?.value
    
    // If no auth token, redirect to login
    if (!authToken) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/privacy-policy/:path*',
    '/terms-of-service/:path*',
    '/cookie-policy/:path*',
    '/dashboard/:path*',
  ],
}
