# ACTIONABLE FIXES - Implementation Guide

This document provides **copy-paste ready code** for the most critical fixes.

---

## FIX #1: Add Input Validation with Zod

### Install Zod
```bash
npm install zod
```

### Create Validation Schemas
**File**: `lib/validationSchemas.ts`

```typescript
import { z } from 'zod'

// Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password too short'),
})

export const SignupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
  name: z.string().min(2, 'Name too short'),
})

// Order Schemas
export const BookingDataSchema = z.object({
  pickupTime: z.enum(['soon', 'scheduled']),
  scheduleDate: z.string().optional(),
  scheduleTime: z.string().optional(),
  deliverySpeed: z.enum(['same-day', 'next-day', 'standard']),
  estimatedWeight: z.number().min(1).max(500),
  serviceType: z.enum(['wash-fold', 'dry-clean', 'steam']),
})

export const CreateOrderSchema = z.object({
  uid: z.string().min(20, 'Invalid Firebase UID'),
  customerEmail: z.string().email('Invalid email'),
  customerName: z.string().min(2),
  customerPhone: z.string().optional(),
  orderTotal: z.number().min(24).max(10000),
  bookingData: BookingDataSchema,
})

// Checkout Schemas
export const CheckoutSchema = z.object({
  orderId: z.string().min(10),
  orderTotal: z.number().min(24),
  customerEmail: z.string().email(),
  uid: z.string().min(20),
  bookingData: BookingDataSchema,
})

// Payment Schemas
export const PaymentIntentSchema = z.object({
  customerId: z.string().min(10),
  amount: z.number().min(24),
  orderId: z.string().min(10),
  description: z.string().optional(),
})
```

### Update Order API Route

**File**: `app/api/orders/route.ts` (update POST handler)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { CreateOrderSchema } from '@/lib/validationSchemas'
import admin from 'firebase-admin'

// ... existing Firebase init code ...

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // ✅ NEW: Validate input
    const validation = CreateOrderSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.flatten()
        },
        { status: 400 }
      )
    }

    const { uid, customerEmail, customerName, orderTotal, bookingData } = validation.data
    
    // ✅ NEW: Sanitize email
    const sanitizedEmail = customerEmail.toLowerCase().trim()
    
    // ✅ NEW: Log sanitized data
    console.log('[ORDERS-API] Creating order:', {
      uid,
      customerEmail: sanitizedEmail,
      orderTotal,
      bookingData,
    })

    // ... rest of existing code ...
    
    const orderData = {
      uid,
      email: sanitizedEmail,
      customerName: customerName.trim(),
      customerPhone: body.customerPhone?.trim() || '',
      pickupTime: bookingData.pickupTime === 'soon' ? 'ASAP' : `${bookingData.scheduleDate} ${bookingData.scheduleTime}`,
      // ... rest of order data ...
    }

    // ... rest of existing code ...
  } catch (error: any) {
    console.error('[ORDERS-API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## FIX #2: Add Stripe Webhook Verification

**File**: `app/api/webhooks/stripe/route.ts` (create new)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/firebase'
import admin from 'firebase-admin'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
    privateKey: privateKey?.replace(/\\n/g, '\n'),
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.projectId,
    })
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('[WEBHOOK] Firebase init error:', error)
    }
  }
}

const db = admin.firestore()

/**
 * Handle Stripe webhooks
 * Verify signature before processing
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  
  if (!signature) {
    console.error('[WEBHOOK] Missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  try {
    const body = await request.text()
    
    // ✅ CRITICAL: Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      )
    } catch (error: any) {
      console.error('[WEBHOOK] Signature verification failed:', error.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('[WEBHOOK] ✓ Verified event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeSucceeded(charge)
        break
      }

      case 'charge.failed': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeFailed(charge)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
        break
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[WEBHOOK] Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful charge
 */
async function handleChargeSucceeded(charge: Stripe.Charge) {
  try {
    const orderId = charge.metadata.orderId
    const uid = charge.metadata.firebaseUid

    if (!orderId || !uid) {
      console.error('[WEBHOOK] Missing orderId or uid in metadata')
      return
    }

    console.log('[WEBHOOK] Updating order to paid:', orderId)

    // Update order status in Firestore
    const orderRef = db.collection('orders').doc(orderId)
    await orderRef.update({
      status: 'paid',
      paymentId: charge.id,
      paidAt: new Date().toISOString(),
      amount: charge.amount / 100,
    })

    console.log('[WEBHOOK] ✓ Order payment confirmed:', orderId)
  } catch (error: any) {
    console.error('[WEBHOOK] Error handling charge.succeeded:', error)
  }
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(charge: Stripe.Charge) {
  try {
    const orderId = charge.metadata.orderId

    if (!orderId) {
      console.error('[WEBHOOK] Missing orderId in metadata')
      return
    }

    console.log('[WEBHOOK] Order payment failed:', orderId)

    // Update order status
    await db.collection('orders').doc(orderId).update({
      status: 'payment_failed',
      failureReason: charge.failure_message,
      failureCode: charge.failure_code,
      failedAt: new Date().toISOString(),
    })

    // TODO: Send email notification to user
    console.log('[WEBHOOK] ✓ Order payment failure recorded:', orderId)
  } catch (error: any) {
    console.error('[WEBHOOK] Error handling charge.failed:', error)
  }
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    const orderId = charge.metadata.orderId

    if (!orderId) {
      console.error('[WEBHOOK] Missing orderId in metadata')
      return
    }

    console.log('[WEBHOOK] Order refunded:', orderId)

    // Update order status
    await db.collection('orders').doc(orderId).update({
      status: 'refunded',
      refundAmount: charge.amount_refunded / 100,
      refundedAt: new Date().toISOString(),
    })

    // TODO: Send email notification to user
    console.log('[WEBHOOK] ✓ Order refund recorded:', orderId)
  } catch (error: any) {
    console.error('[WEBHOOK] Error handling charge.refunded:', error)
  }
}
```

---

## FIX #3: Create Standardized API Response Helper

**File**: `lib/apiUtils.ts` (create new)

```typescript
import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  code?: string
}

/**
 * Return successful API response
 */
export function successResponse<T>(
  data: T,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Return error API response
 */
export function errorResponse(
  error: string,
  status = 400,
  code?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Handle validation errors from Zod
 */
export function validationError(details: any) {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  )
}

/**
 * Handle not found errors
 */
export function notFoundError(message = 'Not found') {
  return errorResponse(message, 404, 'NOT_FOUND')
}

/**
 * Handle unauthorized errors
 */
export function unauthorizedError(message = 'Unauthorized') {
  return errorResponse(message, 401, 'UNAUTHORIZED')
}

/**
 * Handle rate limit errors
 */
export function rateLimitError() {
  return errorResponse(
    'Too many requests. Please try again later.',
    429,
    'RATE_LIMITED'
  )
}

/**
 * Handle server errors
 */
export function serverError(error: any) {
  console.error('[API] Server error:', error)
  return errorResponse(
    'Internal server error',
    500,
    'SERVER_ERROR'
  )
}
```

### Usage in API Routes

```typescript
import { successResponse, validationError } from '@/lib/apiUtils'
import { CreateOrderSchema } from '@/lib/validationSchemas'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const validation = CreateOrderSchema.safeParse(body)
  if (!validation.success) {
    return validationError(validation.error.flatten())
  }

  // ... process order ...
  
  return successResponse({ orderId: 'ORD-123', status: 'pending' }, 201)
}
```

---

## FIX #4: Add Error Boundary Component

**File**: `components/ErrorBoundary.tsx` (create new)

```typescript
'use client'

import React, { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import Button from './Button'

interface Props {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Error info:', errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-center mb-4">
                <AlertCircle size={48} className="text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Something Went Wrong
              </h2>

              <p className="text-gray-600 text-center mb-4 text-sm">
                We encountered an unexpected error. Please try again.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-700 text-xs font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={this.resetError}
                  className="flex-1"
                >
                  Try Again
                </Button>

                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-xs text-gray">
                  <summary className="cursor-pointer font-semibold">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40 text-gray-700">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Usage in Layout

```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <CookieBanner />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

---

## FIX #5: Add API Rate Limiting Middleware

**File**: `lib/middleware/rateLimit.ts` (create new)

```typescript
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number }
}

// In-memory store (for development)
// In production, use Redis
const store: RateLimitStore = {}

export function rateLimit(
  maxRequests: number,
  windowSeconds: number
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      // Get client IP
      const ip =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown'

      const key = `${ip}:${request.nextUrl.pathname}`
      const now = Date.now()

      // Initialize or reset
      if (!store[key] || now > store[key].resetTime) {
        store[key] = {
          count: 0,
          resetTime: now + windowSeconds * 1000,
        }
      }

      // Check limit
      if (store[key].count >= maxRequests) {
        const resetIn = Math.ceil((store[key].resetTime - now) / 1000)
        return NextResponse.json(
          {
            error: 'Rate limited',
            retryAfter: resetIn,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(resetIn),
            },
          }
        )
      }

      // Increment counter
      store[key].count++

      // Call handler
      return handler(request)
    }
  }
}

export function withRateLimit(
  maxRequests: number,
  windowSeconds: number,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const key = `${ip}:${request.nextUrl.pathname}`
    const now = Date.now()

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 0,
        resetTime: now + windowSeconds * 1000,
      }
    }

    if (store[key].count >= maxRequests) {
      const resetIn = Math.ceil((store[key].resetTime - now) / 1000)
      return NextResponse.json(
        { error: 'Rate limited' },
        {
          status: 429,
          headers: { 'Retry-After': String(resetIn) },
        }
      )
    }

    store[key].count++
    return handler(request)
  }
}
```

### Usage in API Routes

```typescript
import { withRateLimit } from '@/lib/middleware/rateLimit'

export const POST = withRateLimit(
  10, // max 10 requests
  60, // per 60 seconds
  async (request: NextRequest) => {
    // Your handler logic
    return NextResponse.json({ success: true })
  }
)
```

---

## FIX #6: Update Dashboard Layout (Remove Dead Code)

**File**: `app/dashboard/layout.tsx`

```typescript
'use client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
```

That's it! Remove all the auth checks and sidebar logic from the layout.

---

## FIX #7: Add Token Expiry Check to AuthContext

**File**: `lib/AuthContext.tsx` (update useEffect)

Add this to the `onAuthStateChanged` callback in AuthContext:

```typescript
if (firebaseUser) {
  // ... existing code ...

  // ✅ NEW: Check token expiry
  const idTokenResult = await firebaseUser.getIdTokenResult(true)
  const expiresAt = new Date(idTokenResult.expirationTime)
  const now = new Date()
  
  // Warn if token expiring soon (within 5 minutes)
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.warn('[Auth] Token expiring soon, will auto-refresh')
    // Trigger a refresh before expiry
    setTimeout(() => {
      firebaseUser.getIdTokenResult(true)
    }, (expiresAt.getTime() - now.getTime() - 60000)) // 1 min before expiry
  }
}
```

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `lib/validationSchemas.ts` | NEW | Input validation |
| `lib/apiUtils.ts` | NEW | Standardized responses |
| `app/api/webhooks/stripe/route.ts` | NEW | Secure webhooks |
| `app/api/orders/route.ts` | UPDATE | Add validation |
| `app/api/checkout/route.ts` | UPDATE | Add validation |
| `components/ErrorBoundary.tsx` | NEW | Error handling |
| `app/layout.tsx` | UPDATE | Wrap with ErrorBoundary |
| `app/dashboard/layout.tsx` | UPDATE | Simplify (remove auth checks) |
| `lib/AuthContext.tsx` | UPDATE | Add token expiry check |
| `lib/middleware/rateLimit.ts` | NEW | Rate limiting |

**Total Implementation Time**: ~4-6 hours

