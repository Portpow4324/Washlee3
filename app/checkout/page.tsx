'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Lock, Check, AlertCircle, ChevronRight, ArrowRight, ArrowLeft, Shield, CreditCard } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface OrderDetails {
  id: string
  customer_id: string
  price: number | string
  service_type?: string
  weight?: number
  delivery_speed?: string
  protection_plan?: string
  [key: string]: unknown
}

function CardPaymentForm({
  orderId,
  orderTotal,
  onSuccess,
}: {
  orderId: string
  orderTotal: number
  onSuccess: () => void
}) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setError('Payment system not ready. Please reload and try again.')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session expired. Please sign in again.')
        setIsProcessing(false)
        return
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_payment_intent',
          orderId,
          amount: Math.round(orderTotal * 100),
          customerId: user?.id,
        }),
      })

      const paymentData = await response.json()

      if (!response.ok) {
        throw new Error(paymentData.error || 'Failed to create payment intent')
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: { email: user?.email },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        const updateResponse = await fetch('/api/orders', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment processing failed'
      console.error('Payment error:', err)
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="card" className="label-field">Card details</label>
      <div className="border border-line rounded-xl bg-white px-4 py-3.5 mb-5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
        <CardElement
          id="card"
          options={{
            style: {
              base: {
                fontSize: '16px',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#14201E',
                '::placeholder': { color: '#9BA8A6' },
              },
              invalid: { color: '#dc2626' },
            },
          }}
        />
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>Processing…</>
        ) : (
          <>
            <Lock size={16} />
            Pay ${orderTotal.toFixed(2)}
          </>
        )}
      </button>
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
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)

  const orderId = searchParams.get('orderId')

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
          router.push('/auth/login?redirect=' + encodeURIComponent(`/checkout?orderId=${orderId}`))
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

        setOrderDetails(data as OrderDetails)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load order'
        console.error('Fetch error:', err)
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, user, router])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/checkout?orderId=${orderId ?? ''}`))
    }
  }, [user, authLoading, router, orderId])

  if (authLoading || isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center text-gray">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Loading checkout…</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!user || !orderId || !orderDetails) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-soft-mint flex items-center justify-center px-4 py-12">
          <div className="surface-card max-w-md w-full p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-dark mb-2">{error || 'Unable to start checkout'}</h1>
            <p className="text-gray text-sm mb-6">Head back to booking to start a new order.</p>
            <Link href="/booking" className="btn-primary inline-flex">
              Back to booking
              <ArrowRight size={16} />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const orderTotal = typeof orderDetails.price === 'string' ? parseFloat(orderDetails.price) : Number(orderDetails.price || 0)
  const stepIndex = currentStep === 'method' ? 0 : currentStep === 'payment' ? 1 : 2

  return (
    <>
      <Header />
      <main className="min-h-screen bg-soft-mint py-10">
        <div className="container-page">
          <Link href="/booking" className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-6 hover:text-primary transition">
            <ArrowLeft size={16} />
            Back to booking
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-1">Checkout</h1>
            <p className="text-gray text-sm">Secure payment powered by Stripe.</p>
          </div>

          {/* Step indicator */}
          <div className="surface-card p-4 mb-6">
            <ol className="flex items-center justify-between gap-2">
              {[
                { id: 'method', label: 'Payment method' },
                { id: 'payment', label: 'Pay' },
                { id: 'confirmation', label: 'Done' },
              ].map((step, i) => {
                const reached = i <= stepIndex
                return (
                  <li key={step.id} className="flex-1 flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                        reached ? 'bg-primary text-white' : 'bg-line text-gray'
                      }`}
                    >
                      {i < stepIndex ? <Check size={16} /> : i + 1}
                    </div>
                    <span className={`text-sm font-semibold ${reached ? 'text-dark' : 'text-gray-soft'} hidden sm:inline`}>
                      {step.label}
                    </span>
                    {i < 2 && <div className={`flex-1 h-px ${i < stepIndex ? 'bg-primary' : 'bg-line'}`} />}
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {currentStep === 'method' && (
                <div className="surface-card p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-dark mb-5">Choose payment method</h2>

                  <button
                    type="button"
                    onClick={() => setCurrentStep('payment')}
                    className="w-full text-left p-5 rounded-2xl border-2 border-primary bg-mint hover:bg-mint/80 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                        <CreditCard size={18} className="text-primary-deep" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-dark">Credit or debit card</p>
                        <p className="text-xs text-gray">Visa, Mastercard, AmEx</p>
                      </div>
                      <ChevronRight size={18} className="text-primary-deep" />
                    </div>
                  </button>

                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="btn-outline text-sm"
                    >
                      <ArrowLeft size={14} />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep('payment')}
                      className="btn-primary text-sm"
                    >
                      Continue
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'payment' && (
                <div className="surface-card p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-dark mb-5">Enter payment details</h2>

                  <Elements stripe={stripePromise}>
                    <CardPaymentForm
                      orderId={orderId}
                      orderTotal={orderTotal}
                      onSuccess={() => setCurrentStep('confirmation')}
                    />
                  </Elements>

                  <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray border-t border-line pt-5">
                    <span className="inline-flex items-center gap-1.5"><Lock size={14} className="text-primary-deep" /> SSL encrypted</span>
                    <span className="inline-flex items-center gap-1.5"><Shield size={14} className="text-primary-deep" /> PCI DSS Level 1</span>
                    <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-primary-deep" /> Stripe verified</span>
                  </div>

                  <div className="mt-5">
                    <button type="button" onClick={() => setCurrentStep('method')} className="btn-outline text-sm">
                      <ArrowLeft size={14} />
                      Back
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'confirmation' && (
                <div className="surface-card p-8 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-mint mb-4">
                    <Check className="text-primary-deep" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-dark mb-1">Payment received</h2>
                  <p className="text-gray text-sm mb-6">
                    Order ID: <span className="font-mono font-semibold text-dark">{orderId}</span>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/tracking?orderId=${orderId}`)}
                      className="btn-primary flex-1"
                    >
                      Track this order
                      <ArrowRight size={16} />
                    </button>
                    <Link href="/dashboard/orders" className="btn-outline flex-1">
                      My orders
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Order summary */}
            <aside className="lg:col-span-1">
              <div className="surface-card p-6 lg:sticky lg:top-24">
                <h3 className="font-bold text-dark mb-4">Order summary</h3>
                <dl className="space-y-2.5 text-sm pb-4 mb-4 border-b border-line">
                  {orderDetails.service_type && (
                    <div className="flex justify-between">
                      <dt className="text-gray">Service</dt>
                      <dd className="font-semibold text-dark">{String(orderDetails.service_type)}</dd>
                    </div>
                  )}
                  {orderDetails.weight !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-gray">Weight</dt>
                      <dd className="font-semibold text-dark">{orderDetails.weight}kg</dd>
                    </div>
                  )}
                  {orderDetails.delivery_speed && (
                    <div className="flex justify-between">
                      <dt className="text-gray">Delivery</dt>
                      <dd className="font-semibold text-dark capitalize">{orderDetails.delivery_speed}</dd>
                    </div>
                  )}
                  {orderDetails.protection_plan && (
                    <div className="flex justify-between">
                      <dt className="text-gray">Protection</dt>
                      <dd className="font-semibold text-dark capitalize">{orderDetails.protection_plan}</dd>
                    </div>
                  )}
                </dl>

                <div className="flex items-baseline justify-between mb-4">
                  <span className="font-bold text-dark">Total</span>
                  <span className="text-3xl font-bold text-primary">${orderTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray text-right mb-4">GST included</p>

                <div className="rounded-xl bg-mint/40 border border-primary/15 p-3 text-xs text-gray flex items-start gap-2">
                  <Lock size={14} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  Secured by Stripe — your card details never touch our servers.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function CheckoutWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutWrapper />
    </Elements>
  )
}
