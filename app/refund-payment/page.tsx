'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Toast from '@/components/Toast'
import Link from 'next/link'
import { CheckCircle, AlertCircle, CreditCard, DollarSign } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface RefundDetails {
  orderid: string
  amount: number
  currency: string
  description: string
  timestamp: string
  orderId?: string
  customerEmail?: string
  customerName?: string
}

// Stripe Payment Form Component
function StripePaymentForm({ 
  refundDetails, 
  onSuccess 
}: { 
  refundDetails: RefundDetails
  onSuccess: () => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setError('')

    try {
      // Create payment intent on backend
      const response = await fetch('/api/payments/stripe/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: refundDetails.amount,
          orderId: refundDetails.orderid,
          customerEmail: refundDetails.customerEmail || 'customer@washlee.com',
          customerName: refundDetails.customerName || 'Customer',
        }),
      })

      if (!response.ok) throw new Error('Failed to create payment intent')
      const { clientSecret } = await response.json()

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: refundDetails.customerEmail,
          },
        },
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.')
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 border border-gray-300 rounded-lg">
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
                color: '#dc2626',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!stripe || isProcessing}
        type="submit"
      >
        {isProcessing ? 'Processing...' : `Pay $${refundDetails.amount.toFixed(2)} with Stripe`}
      </Button>
    </form>
  )
}

// PayPal Payment Component
function PayPalPaymentForm({
  refundDetails,
  onSuccess,
}: {
  refundDetails: RefundDetails
  onSuccess: () => void
}) {
  const [error, setError] = useState('')

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 border-2 border-gray-300 rounded-lg text-center">
        <p className="text-sm text-[#6b7b78] mb-4">
          Click the button below to pay with PayPal
        </p>

        <button
          onClick={async () => {
            try {
              setError('')
              // Create PayPal order
              const response = await fetch('/api/payments/paypal/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: refundDetails.amount,
                  orderId: refundDetails.orderid,
                  customerEmail: refundDetails.customerEmail,
                  customerName: refundDetails.customerName,
                }),
              })

              const { approvalLink } = await response.json()
              if (approvalLink) {
                window.location.href = approvalLink
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to process PayPal payment')
            }
          }}
          className="w-full bg-[#FFC439] hover:bg-[#FFD666] text-black font-bold py-3 rounded-lg transition"
        >
          Pay with PayPal
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}

function RefundPaymentPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [refundDetails, setRefundDetails] = useState<RefundDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8')
        const details = JSON.parse(decoded) as RefundDetails
        setRefundDetails(details)
        setError('')
      } catch (err) {
        console.error('Invalid refund token:', err)
        setError('Invalid or expired refund link. Please request a new refund.')
      }
    } else {
      setError('No refund token provided.')
    }
    setIsLoading(false)
  }, [token])

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!refundDetails || error) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <div className="text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <h1 className="text-3xl font-bold text-[#1f2d2b] mb-2">Refund Link Invalid</h1>
                <p className="text-[#6b7b78] mb-6">
                  {error || 'The refund link has expired or is invalid.'}
                </p>
                <Link href="/dashboard/customer">
                  <Button>Back to Orders</Button>
                </Link>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (isSuccess) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <div className="text-center">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <h1 className="text-3xl font-bold text-[#1f2d2b] mb-2">Refund Processed Successfully!</h1>
                <p className="text-[#6b7b78] mb-4">
                  Your refund has been processed and will appear in your original payment method within 3-5 business days.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-700 mb-2">
                    <span className="font-semibold">Amount:</span> ${refundDetails.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-700 mb-2">
                    <span className="font-semibold">Method:</span> {selectedMethod === 'stripe' ? 'Stripe' : 'PayPal'}
                  </p>
                  <p className="text-sm text-green-700">
                    <span className="font-semibold">Status:</span> Completed
                  </p>
                </div>
                <p className="text-xs text-[#6b7b78] mb-6">
                  You will receive a confirmation email shortly.
                </p>
                <Link href="/dashboard/customer">
                  <Button>Back to Orders</Button>
                </Link>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#1f2d2b] mb-2">Complete Your Refund</h1>
              <p className="text-[#6b7b78]">Choose your preferred payment method to receive your refund</p>
            </div>

            {/* Refund Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-[#6b7b78] mb-1">
                    <span className="font-semibold">Order ID:</span> {refundDetails.orderid.slice(0, 8)}
                  </p>
                  <p className="text-sm text-[#6b7b78] mb-1">
                    <span className="font-semibold">Requested:</span> {new Date(refundDetails.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6b7b78] mb-1">REFUND AMOUNT</p>
                  <p className="text-3xl font-bold text-[#48C9B0]">
                    ${refundDetails.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-blue-700 bg-white bg-opacity-50 rounded p-3">
                ℹ️ This refund will be sent to your original payment method within 3-5 business days after processing.
              </p>
            </div>

            {/* Payment Method Selection */}
            {!selectedMethod && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[#1f2d2b] mb-4">Select Payment Method</h2>
                <div className="space-y-3">
                  {/* Stripe Option */}
                  <button
                    onClick={() => setSelectedMethod('stripe')}
                    className="w-full p-4 border-2 border-gray-200 hover:border-[#48C9B0] rounded-lg transition text-left bg-white hover:bg-[#E8FFFB]"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={24} className="text-[#6b7b78]" />
                      <div className="flex-1">
                        <p className="font-semibold text-[#1f2d2b]">💳 Pay with Stripe</p>
                        <p className="text-xs text-[#6b7b78]">Credit Card, Debit Card</p>
                      </div>
                      <span className="text-2xl">→</span>
                    </div>
                  </button>

                  {/* PayPal Option */}
                  <button
                    onClick={() => setSelectedMethod('paypal')}
                    className="w-full p-4 border-2 border-gray-200 hover:border-[#48C9B0] rounded-lg transition text-left bg-white hover:bg-[#E8FFFB]"
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign size={24} className="text-[#6b7b78]" />
                      <div className="flex-1">
                        <p className="font-semibold text-[#1f2d2b]">🅿️ Pay with PayPal</p>
                        <p className="text-xs text-[#6b7b78]">PayPal Balance, Bank, Card</p>
                      </div>
                      <span className="text-2xl">→</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Stripe Payment Form */}
            {selectedMethod === 'stripe' && (
              <>
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="text-[#48C9B0] hover:text-[#3da89f] mb-4 text-sm flex items-center gap-2"
                >
                  ← Back to Payment Methods
                </button>
                <h2 className="text-lg font-semibold text-[#1f2d2b] mb-4">Complete Payment with Stripe</h2>
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    refundDetails={refundDetails}
                    onSuccess={() => {
                      setIsSuccess(true)
                      setToast({
                        message: 'Refund processed successfully!',
                        type: 'success',
                      })
                    }}
                  />
                </Elements>
              </>
            )}

            {/* PayPal Payment Form */}
            {selectedMethod === 'paypal' && (
              <>
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="text-[#48C9B0] hover:text-[#3da89f] mb-4 text-sm flex items-center gap-2"
                >
                  ← Back to Payment Methods
                </button>
                <h2 className="text-lg font-semibold text-[#1f2d2b] mb-4">Complete Payment with PayPal</h2>
                <PayPalPaymentForm
                  refundDetails={refundDetails}
                  onSuccess={() => {
                    setIsSuccess(true)
                    setToast({
                      message: 'Refund processed successfully!',
                      type: 'success',
                    })
                  }}
                />
              </>
            )}

            {/* Info Section */}
            {!selectedMethod && (
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-[#1f2d2b] mb-3">How it works</h3>
                <ul className="space-y-2 text-sm text-[#6b7b78]">
                  <li className="flex gap-2">
                    <span className="text-[#48C9B0] font-bold">1.</span>
                    <span>Select your preferred payment method</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#48C9B0] font-bold">2.</span>
                    <span>Complete the payment process securely</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#48C9B0] font-bold">3.</span>
                    <span>Refund returned to your original payment method</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#48C9B0] font-bold">4.</span>
                    <span>Funds appear in 3-5 business days</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Cancel Link */}
            {!selectedMethod && (
              <div className="text-center mt-6">
                <p className="text-xs text-[#6b7b78] mb-2">
                  Not ready to complete your refund?
                </p>
                <Link href="/dashboard/customer" className="text-[#48C9B0] hover:text-[#3da089] text-sm font-semibold">
                  Return to Orders
                </Link>
              </div>
            )}
          </Card>

          {/* Security Info */}
          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-xs text-[#6b7b78] text-center">
              🔒 All transactions are encrypted and processed securely by Stripe or PayPal.
            </p>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Footer />
    </>
  )
}

function RefundPaymentContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <RefundPaymentPageContent />
    </Suspense>
  )
}

export default RefundPaymentContent
