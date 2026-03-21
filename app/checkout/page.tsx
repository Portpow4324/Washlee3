'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Lock, Check, AlertCircle, ChevronRight, X } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import Spinner from '@/components/Spinner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function CardPaymentForm({ orderId, orderTotal, onSuccess }: { orderId: string; orderTotal: number; onSuccess: () => void }) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setError('Payment system not loaded')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session expired. Please login again.')
        setIsProcessing(false)
        return
      }

      // Create payment intent on backend
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_payment_intent',
          orderId,
          amount: Math.round(orderTotal * 100), // Stripe expects cents
          customerId: user?.id,
        }),
      })

      const paymentData = await response.json()

      if (!response.ok) {
        throw new Error(paymentData.error || 'Failed to create payment intent')
      }

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user?.email,
            },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        // Payment succeeded - update order status
        const updateResponse = await fetch('/api/orders', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            orderId,
            status: 'confirmed',
            paymentStatus: 'paid',
          }),
        })

        if (updateResponse.ok) {
          onSuccess()
          router.push(`/tracking?orderId=${orderId}`)
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">Card Details</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1f2d2b',
                '::placeholder': {
                  color: '#6b7b78',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
          }}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full flex items-center justify-center gap-2"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Spinner />
            Processing...
          </>
        ) : (
          <>
            <Lock size={20} />
            Pay ${orderTotal.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState<'method' | 'payment' | 'confirmation'>('method')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [paymentComplete, setPaymentComplete] = useState(false)

  const orderId = searchParams.get('orderId')

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !user) {
        setError('Missing order information')
        setIsLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login?from=checkout')
          return
        }

        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('customer_id', user.id)
          .single()

        if (fetchError) throw fetchError
        if (!data) throw new Error('Order not found')

        setOrderDetails(data)
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError(err.message || 'Failed to load order')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, user, router])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?from=checkout')
    }
  }, [user, authLoading, router])

  if (authLoading || isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!user || !orderId || !orderDetails) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7fefe] to-white">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1f2d2b] mb-4">Error</h1>
            <p className="text-[#6b7b78] mb-6">{error || 'Unable to process checkout'}</p>
            <Link href="/booking" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
              Back to Booking →
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Step Indicator */}
          <div className="mb-12 flex justify-center gap-8">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 ${
                  currentStep === 'method' || currentStep === 'payment' || currentStep === 'confirmation'
                    ? 'bg-[#48C9B0] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep === 'confirmation' ? <Check size={24} /> : '1'}
              </div>
              <span className="text-sm text-[#6b7b78]">Payment Method</span>
            </div>
            <div className="w-12 h-1 bg-gray-200 self-center" />
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 ${
                  currentStep === 'payment' || currentStep === 'confirmation'
                    ? 'bg-[#48C9B0] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep === 'confirmation' ? <Check size={24} /> : '2'}
              </div>
              <span className="text-sm text-[#6b7b78]">Payment</span>
            </div>
            <div className="w-12 h-1 bg-gray-200 self-center" />
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 ${
                  currentStep === 'confirmation' ? 'bg-[#48C9B0] text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep === 'confirmation' ? <Check size={24} /> : '3'}
              </div>
              <span className="text-sm text-[#6b7b78]">Confirmation</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {currentStep === 'method' && (
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-[#1f2d2b] mb-6">Select Payment Method</h2>
                  <div className="space-y-4 mb-8">
                    <button
                      onClick={() => setCurrentStep('payment')}
                      className="w-full p-6 border-2 border-[#48C9B0] bg-[#E8FFFB] rounded-lg text-left hover:bg-[#48C9B0] hover:text-white transition group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#48C9B0] group-hover:bg-white flex items-center justify-center">
                          <Check className="group-hover:text-[#48C9B0]" size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Credit or Debit Card</p>
                          <p className="text-sm opacity-75">Visa, Mastercard, American Express</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => router.back()}
                      className="px-6 py-2 border-2 border-gray-200 text-[#1f2d2b] rounded-lg font-semibold hover:bg-gray-50 transition">Back</button>
                    <button onClick={() => setCurrentStep('payment')}
                      className="px-6 py-2 bg-[#48C9B0] text-white rounded-lg font-semibold hover:bg-[#3aad9a] transition flex items-center gap-2">
                      Continue <ChevronRight size={20} />
                    </button>
                  </div>
                </Card>
              )}

              {currentStep === 'payment' && (
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-[#1f2d2b] mb-6">Enter Payment Details</h2>
                  <Elements stripe={stripePromise}>
                    <CardPaymentForm
                      orderId={orderId}
                      orderTotal={orderDetails.price}
                      onSuccess={() => setPaymentComplete(true)}
                    />
                  </Elements>

                  <div className="mt-6 flex justify-between">
                    <button onClick={() => setCurrentStep('method')}
                      className="px-6 py-2 border-2 border-gray-200 text-[#1f2d2b] rounded-lg font-semibold hover:bg-gray-50 transition">Back</button>
                  </div>

                  {/* Security Badges */}
                  <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4 justify-center text-xs text-[#6b7b78]">
                    <div className="flex items-center gap-1">
                      <Lock size={16} />
                      PCI DSS Level 1
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock size={16} />
                      SSL Encrypted
                    </div>
                    <div className="flex items-center gap-1">
                      <Check size={16} className="text-[#48C9B0]" />
                      Stripe Verified
                    </div>
                  </div>
                </Card>
              )}

              {currentStep === 'confirmation' && (
                <Card className="p-8 text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check className="text-green-600" size={32} />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h2>
                  <p className="text-[#6b7b78] mb-6">Your order has been confirmed and is being processed.</p>
                  <p className="text-sm text-[#6b7b78] mb-8">Order ID: <strong>{orderId}</strong></p>

                  <Button onClick={() => router.push(`/tracking?orderId=${orderId}`)} size="lg" className="w-full mb-4">
                    Track Your Order
                  </Button>

                  <Link href="/dashboard/orders" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
                    View All Orders →
                  </Link>
                </Card>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-4">
                <h3 className="font-bold text-[#1f2d2b] mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b7b78]">Service:</span>
                    <span className="font-semibold text-[#1f2d2b]">{orderDetails.service_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b7b78]">Weight:</span>
                    <span className="font-semibold text-[#1f2d2b]">{orderDetails.weight} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b7b78]">Delivery:</span>
                    <span className="font-semibold text-[#1f2d2b] capitalize">
                      {orderDetails.delivery_speed || 'Standard'}
                    </span>
                  </div>
                  {orderDetails.protection_plan && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6b7b78]">Protection:</span>
                      <span className="font-semibold text-[#1f2d2b] capitalize">
                        {orderDetails.protection_plan}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1f2d2b]">Total:</span>
                    <span className="text-2xl font-bold text-[#48C9B0]">
                      ${orderDetails.price ? parseFloat(orderDetails.price).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7b78] mt-1 text-right">inc. GST</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                  Your payment is secured by Stripe, the world's leading payment processor.
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function CheckoutWrapper() {
  return (
    <Suspense fallback={<div><Header /><div className="min-h-screen flex items-center justify-center"><Spinner /></div><Footer /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutWrapper />
    </Elements>
  )
}
