'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { CheckCircle, Loader, AlertCircle } from 'lucide-react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [isProcessing, setIsProcessing] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Get current user and wait for auth to be ready
  useEffect(() => {
    const auth = getAuth()
    console.log('[Success] Auth state listener starting...')
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('[Success] Auth state changed. User:', currentUser?.email || 'none')
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Fetch order details - only after auth is ready
  useEffect(() => {
    let isMounted = true

    async function fetchOrder() {
      try {
        // Wait for auth to be ready
        if (authLoading) {
          console.log('[Success] Waiting for auth to load...')
          return
        }

        if (!user) {
          console.log('[Success] No user authenticated')
          setError('Please sign in to view your order')
          setIsProcessing(false)
          return
        }

        console.log('[Success] Fetching orders for user:', user.uid)

        // Get auth token
        const idToken = await user.getIdToken(true) // Force refresh
        console.log('[Success] Got ID token:', idToken.substring(0, 20) + '...')

        // First attempt: immediate fetch
        try {
          const res = await fetch(`/api/orders/user/${user.uid}`, {
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            }
          })
          
          if (res.ok) {
            const data = await res.json()
            console.log('[Success] Got orders on first try:', data.count)
            if (data.orders && data.orders.length > 0) {
              if (isMounted) {
                setOrder(data.orders[0])
                setIsProcessing(false)
                return
              }
            }
          } else {
            console.log('[Success] First fetch returned status:', res.status)
          }
        } catch (err) {
          console.log('[Success] First fetch error:', err)
        }

        // Wait for webhook to process (increased to 5 seconds)
        console.log('[Success] Waiting 5 seconds for webhook...')
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Refresh token and retry
        const newToken = await user.getIdToken(true)
        console.log('[Success] Retrying with refreshed token')

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await fetch(`/api/orders/user/${user.uid}`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              }
            })
            
            if (res.ok) {
              const data = await res.json()
              console.log(`[Success] Got orders on attempt ${attempt}:`, data.count)
              if (data.orders && data.orders.length > 0) {
                if (isMounted) {
                  setOrder(data.orders[0])
                  setIsProcessing(false)
                  return
                }
              }
            } else {
              console.log(`[Success] Attempt ${attempt} returned status:`, res.status)
            }
          } catch (err) {
            console.log(`[Success] Attempt ${attempt} error:`, err)
          }
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }

        if (isMounted) {
          console.log('[Success] All fetch attempts failed, showing fallback')
          setIsProcessing(false)
        }
      } catch (error) {
        if (isMounted) {
          console.error('[Success] Fetch error:', error)
          setError('Failed to load order details')
          setIsProcessing(false)
        }
      }
    }

    // Only fetch when auth is fully loaded and we have a user
    if (!authLoading && user) {
      console.log('[Success] Auth ready, fetching orders')
      fetchOrder()
    } else if (!authLoading && !user) {
      console.log('[Success] Auth ready but no user')
      setIsProcessing(false)
    }
  }, [user, authLoading])

  if (isProcessing) {
    return (
      <Card className="p-8 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Loader size={64} className="text-primary animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-dark mb-3">Processing Payment...</h1>
        <p className="text-gray">Please wait while we confirm your order</p>
      </Card>
    )
  }

  return (
    <Card className="p-8 text-center max-w-md">
      {error || !order ? (
        <>
          <div className="flex justify-center mb-6">
            <AlertCircle size={64} className="text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-dark mb-3">Payment Received ✓</h1>
          <p className="text-gray mb-6">
            Your payment was successful! Your order is being processed.
          </p>
          <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray mb-2">
              <strong>Note:</strong> Your order details are being set up. Please check your dashboard or email for order confirmation.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => router.push('/dashboard/customer')}
            >
              View Dashboard
            </Button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
            >
              Back to Home
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-center mb-6">
            <CheckCircle size={64} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-dark mb-3">Thank you for choosing Washlee! 🎉</h1>
          <p className="text-gray mb-6">Your order has been confirmed and payment received</p>

          <div className="bg-light rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray mb-1">Order Number</p>
            <p className="font-mono text-dark font-semibold text-sm break-all">{order.orderId}</p>
          </div>

          <div className="bg-light rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray mb-1">Payment ID</p>
            <p className="font-mono text-dark font-semibold text-sm break-all">{order.paymentId || order.sessionId || 'Processing...'}</p>
          </div>

          <div className="space-y-3 mb-6 text-left text-sm text-gray">
            <div className="flex gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>Payment confirmed with Stripe</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>Your Washlee service will arrive soon</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>You'll receive updates via email</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => router.push(`/tracking?orderId=${order.orderId}`)}
            >
              Track Order
            </Button>
            <Button
              className="w-full"
              onClick={() => router.push('/dashboard/customer')}
              variant="outline"
            >
              View Dashboard
            </Button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
            >
              Back to Home
            </button>
          </div>

          <p className="text-xs text-gray mt-6">Session ID: {sessionId}</p>
        </>
      )}
    </Card>
  )
}

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
