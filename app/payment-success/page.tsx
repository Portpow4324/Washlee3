'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { CheckCircle, Home, Truck, Clock, DollarSign, Mail } from 'lucide-react'
import Spinner from '@/components/Spinner'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface OrderDetails {
  id: string
  subtotal: number
  estimatedWeight: number
  deliverySpeed: string
  deliveryAddress: string
  pickupTime: string
  customerEmail: string
  status: string
  createdAt: any
}

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const sessionId = searchParams.get('session_id')

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('No order ID provided')
        setLoading(false)
        return
      }

      try {
        // Get order from Firestore
        const orderRef = doc(db, 'orders', orderId)
        const orderSnap = await getDoc(orderRef)

        if (orderSnap.exists()) {
          setOrderDetails({
            id: orderId,
            ...orderSnap.data(),
          } as OrderDetails)
        } else {
          setError('Order not found')
        }
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-light flex items-center justify-center py-12 px-4">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg">
            <Spinner />
            <p className="mt-4 text-dark font-semibold">Loading your order details...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-mint to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={48} />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-dark mb-2">Payment Successful!</h1>
            <p className="text-gray text-lg">Thank you for choosing Washlee</p>
          </div>

          {/* Order Confirmation Card */}
          <Card className="p-8 mb-8">
            <div className="border-b border-gray pb-6 mb-6">
              <p className="text-sm text-gray mb-1">Order Number</p>
              <p className="text-3xl font-bold text-primary font-mono">{orderId}</p>
              {sessionId && (
                <p className="text-xs text-gray mt-2 font-mono">
                  Payment ID: {sessionId.substring(0, 20)}...
                </p>
              )}
            </div>

            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            ) : orderDetails ? (
              <>
                {/* Order Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock className="text-primary flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray">Pickup Time</p>
                      <p className="font-semibold text-dark">{orderDetails.pickupTime}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Truck className="text-primary flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray">Delivery</p>
                      <p className="font-semibold text-dark capitalize">
                        {orderDetails.deliverySpeed === 'same-day' ? 'Same-Day Delivery' : 'Standard Delivery (24 hours)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="text-primary flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray">Confirmation Email</p>
                      <p className="font-semibold text-dark">{orderDetails.customerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-light rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray">{orderDetails.estimatedWeight} kg @ $3.00/kg</span>
                      <span className="font-semibold text-dark">
                        ${(orderDetails.estimatedWeight * 3.0).toFixed(2)}
                      </span>
                    </div>
                    {orderDetails.deliverySpeed === 'same-day' && (
                      <div className="flex justify-between">
                        <span className="text-gray">Same-Day Delivery</span>
                        <span className="font-semibold text-dark">$5.00</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray pt-2 mt-2">
                      <span className="font-semibold text-dark">Total Paid</span>
                      <span className="text-xl font-bold text-primary">
                        ${orderDetails.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-mint rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray mb-1">Delivery Address</p>
                  <p className="font-semibold text-dark">{orderDetails.deliveryAddress}</p>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark mb-2">What Happens Next?</h3>
                  <ol className="space-y-2 text-sm text-gray list-decimal list-inside">
                    <li>Our Pro will arrive at your scheduled pickup time</li>
                    <li>Your laundry will be professionally cleaned</li>
                    <li>Fresh laundry will be delivered to your address</li>
                    <li>You'll receive real-time updates on your order status</li>
                  </ol>
                </div>
              </>
            ) : null}
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/tracking?orderId=${orderId}`)}
              className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-[#3aad9a] font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Truck size={20} />
              Track Your Order
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 px-4 border-2 border-primary text-primary rounded-lg hover:bg-light font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Back to Home
            </button>
          </div>

          {/* Receipt Note */}
          <div className="mt-8 text-center text-sm text-gray">
            <p>A confirmation email with receipt has been sent to <strong>{orderDetails?.customerEmail}</strong></p>
            <p className="mt-2">Questions? <a href="/faq" className="text-primary hover:underline font-semibold">Visit our FAQ</a> or <a href="/contact" className="text-primary hover:underline font-semibold">contact us</a></p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessPageContent />
    </Suspense>
  )
}
