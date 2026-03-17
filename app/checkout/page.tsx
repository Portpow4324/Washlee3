'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { CardPayment } from '@/components/CardPayment'
import { PaymentMethodsList } from '@/components/PaymentMethodsList'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import { AlertCircle, CheckCircle } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface OrderSummary {
  orderId: string
  description: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  tax: number
  total: number
}

type PaymentMethod = 'card' | 'saved'

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const orderId = searchParams.get('orderId') || 'ORD-001'

  const [step, setStep] = useState<'method' | 'payment' | 'confirmation'>('method')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [clientSecret, setClientSecret] = useState<string>('')
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [orderSummary] = useState<OrderSummary>({
    orderId,
    description: 'Laundry Pickup & Delivery Service',
    items: [
      { name: 'Standard Wash (5kg)', quantity: 1, price: 15.0 },
      { name: 'Delicates (+$2/kg)', quantity: 1, price: 10.0 }
    ],
    subtotal: 25.0,
    tax: 2.5,
    total: 27.5
  })

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?from=checkout')
    }
  }, [user, router])

  async function createPaymentIntent() {
    if (!user) {
      setError('Please log in to continue')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      console.log('Creating payment intent for user:', user.uid)

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_payment_intent',
          customerId: user.uid,
          amount: orderSummary.total,
          orderId,
          description: orderSummary.description
        })
      })

      console.log('Payment API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Payment API error:', errorData)
        throw new Error(errorData.error || 'Failed to create payment')
      }

      const data = await response.json()
      console.log('Payment intent created:', data.paymentIntentId)
      
      if (!data.clientSecret) {
        throw new Error('No client secret received from server')
      }

      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.paymentIntentId)
      setStep('payment')
      console.log('Payment step activated')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment setup failed'
      console.error('Payment creation error:', errorMessage, err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  function handlePaymentSuccess(newPaymentIntentId: string) {
    setPaymentIntentId(newPaymentIntentId)
    setStep('confirmation')
    // Auto-redirect to tracking after 3 seconds
    setTimeout(() => {
      router.push(`/tracking?orderId=${orderId}`)
    }, 3000)
  }

  function handlePaymentError(errorMessage: string) {
    setError(errorMessage)
  }

  if (!user) {
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          {step !== 'confirmation' && (
            <button
              onClick={() => {
                if (step === 'payment') {
                  setStep('method')
                  setClientSecret('')
                } else {
                  router.push('/booking')
                }
              }}
              className="mb-6 text-primary hover:text-[#3aad9a] font-semibold flex items-center gap-2"
            >
              ← Back to Order
            </button>
          )}

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-12">
            {(['method', 'payment', 'confirmation'] as const).map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step === s
                      ? 'bg-[#48C9B0] text-white'
                      : step === 'confirmation' || (step === 'payment' && s !== 'confirmation')
                      ? 'bg-[#48C9B0] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step === 'confirmation' || (step === 'payment' && s === 'method')
                        ? 'bg-[#48C9B0]'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-900">Payment Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Order Summary Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
              {orderSummary.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-700">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${orderSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>${orderSummary.tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-bold text-[#48C9B0] pt-4 border-t-2 border-gray-200">
              <span>Total</span>
              <span>${orderSummary.total.toFixed(2)}</span>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
              <p>
                <strong>Order ID:</strong> {orderId}
              </p>
            </div>

            {/* Payment Security Badges */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900 font-semibold mb-3">Your payment is secure and encrypted:</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-blue-800">
                  <span>🔒</span>
                  <span>PCI DSS Level 1</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-800">
                  <span>✓</span>
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-800">
                  <span>💳</span>
                  <span>Stripe Verified</span>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-3">We never store your card details. Stripe handles all payment processing securely.</p>
            </div>
          </div>

          {/* Payment Method Selection */}
          {step === 'method' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Select Payment Method</h3>

                <div className="space-y-3 mb-6">
                  {[
                    { value: 'saved', label: 'Saved Payment Method' },
                    { value: 'card', label: 'New Card' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === option.value
                          ? 'border-[#48C9B0] bg-[#E8FFFB]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.value}
                          checked={paymentMethod === option.value as PaymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-4 h-4"
                        />
                        <span className="font-semibold text-gray-900">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'saved' && <PaymentMethodsList customerId={user.uid} />}
              </div>

              <button
                onClick={createPaymentIntent}
                disabled={isLoading || orderSummary.total < 24}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                  isLoading || orderSummary.total < 24
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#48C9B0] hover:bg-[#3aad9a] active:scale-95'
                }`}
              >
                {orderSummary.total < 24 ? (
                  `Minimum purchase $24 (Current: $${orderSummary.total.toFixed(2)})`
                ) : isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner />
                    Preparing Payment...
                  </div>
                ) : (
                  'Continue to Payment'
                )}
              </button>
            </div>
          )}

          {/* Payment Processing */}
          {step === 'payment' && clientSecret && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Enter Card Details</h3>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#48C9B0'
                    }
                  }
                }}
              >
                <CardPayment
                  clientSecret={clientSecret}
                  orderId={orderId}
                  amount={Math.round(orderSummary.total * 100)}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>

              <button
                onClick={() => setStep('method')}
                className="w-full mt-4 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
              >
                Back to Payment Method
              </button>
            </div>
          )}

          {/* Success Confirmation */}
          {step === 'confirmation' && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your order has been confirmed and will be picked up shortly.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600">
                  <strong>Payment ID:</strong> {paymentIntentId}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Amount Paid:</strong> ${orderSummary.total.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Order ID:</strong> {orderId}
                </p>
              </div>

              <button
                onClick={() => router.push(`/tracking?orderId=${orderId}`)}
                className="w-full py-3 px-4 bg-[#48C9B0] text-white rounded-lg hover:bg-[#3aad9a] font-semibold transition-all mb-3"
              >
                Track Your Order
              </button>

              <button
                onClick={() => router.push('/dashboard/customer')}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageContent />
    </Suspense>
  )
}
