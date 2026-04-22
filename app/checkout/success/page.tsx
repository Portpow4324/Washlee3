'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import { CheckCircle, Clock, MapPin, Package, ChevronRight } from 'lucide-react'

interface OrderData {
  id?: string
  totalPrice?: number | string
  subtotal?: number | string
  weight?: number
  service?: string
  serviceType?: string
  protectionPlan?: string
  deliveryAddressLine1?: string
  deliveryAddressLine2?: string
  deliveryCity?: string
  deliveryState?: string
  deliveryPostcode?: string
  pickupAddress?: string
  pickupTime?: string
  deliverySpeed?: string
  [key: string]: any
}

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true)
        const sessionId = searchParams.get('session_id')
        const savedOrderId = sessionStorage.getItem('lastOrderId')

        if (!savedOrderId) {
          setError('Order ID not found')
          setLoading(false)
          return
        }

        setOrderId(savedOrderId)

        // Fetch order details from Supabase
        console.log('[CheckoutSuccess] Fetching order from Supabase:', savedOrderId)
        const response = await fetch(`/api/orders/details?orderId=${savedOrderId}`)
        
        if (!response.ok) {
          console.error('[CheckoutSuccess] Failed to fetch order:', response.status)
          throw new Error('Failed to load order details')
        }

        const responseData = await response.json()
        console.log('[CheckoutSuccess] Order fetched from API:', responseData)

        // Parse items JSON if it's a string
        let items = responseData.items || {}
        if (typeof items === 'string') {
          items = JSON.parse(items)
        }

        // Extract pricing information
        const weight = items.weight || responseData.weight || 0
        const deliverySpeed = items.delivery_speed || items.deliverySpeed || 'standard'
        const protectionPlan = items.protection_plan || items.protectionPlan || 'basic'
        const totalPrice = responseData.totalPrice || responseData.total_price || 0

        // Calculate protection plan cost based on actual pricing logic
        let protectionPlanCost = 0
        if (protectionPlan === 'premium') {
          protectionPlanCost = 3.50
        } else if (protectionPlan === 'premium-plus' || protectionPlan === 'premium_plus') {
          protectionPlanCost = 8.50
        }

        // Calculate base rate from delivery speed
        const baseRate = deliverySpeed === 'express' ? 12.5 : 7.5
        const laundryBase = weight * baseRate

        // Build order display object
        const orderDisplay: OrderData = {
          id: savedOrderId,
          weight,
          deliverySpeed,
          protectionPlan: protectionPlan === 'premium_plus' ? 'Premium Plus' : 
                         protectionPlan === 'premium' ? 'Premium' : 
                         protectionPlan === 'premium-plus' ? 'Premium Plus' : 'Basic',
          totalPrice: totalPrice.toFixed(2),
          subtotal: laundryBase.toFixed(2),
          protectionPlanCost: protectionPlanCost.toFixed(2),
          deliveryAddressLine1: responseData.pickupAddress || items.pickup_address || '',
          deliveryCity: items.delivery_city || '',
          deliveryState: items.delivery_state || '',
          deliveryPostcode: items.delivery_postcode || '',
          pickupAddress: items.pickup_address || responseData.pickupAddress || '',
          status: responseData.status || 'confirmed',
        }

        console.log('[CheckoutSuccess] Order display object:', orderDisplay)
        setOrder(orderDisplay)
      } catch (err: any) {
        console.error('[CheckoutSuccess] Error loading order:', err)
        setError(err.message || 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    loadOrderData()

    // Clear session storage
    sessionStorage.removeItem('lastOrderId')
    sessionStorage.removeItem('lastOrder')
    sessionStorage.removeItem('lastOrderTotal')
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !orderId) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
          <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Order</h1>
            <p className="text-gray mb-6">{error || 'Could not load order details'}</p>
            <Button variant="primary" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const estimatedPickupDate = new Date()
  estimatedPickupDate.setDate(estimatedPickupDate.getDate() + 1)
  const formattedPickupDate = estimatedPickupDate.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-mint rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-dark mb-2">Payment Successful!</h1>
          <p className="text-gray text-lg">Your laundry order has been confirmed</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Order Confirmation Card */}
          <div className="bg-white rounded-lg border border-gray/10 p-6">
            <h2 className="text-sm font-semibold text-gray mb-4 uppercase">Order Number</h2>
            <p className="text-3xl font-bold text-primary mb-2">{orderId?.slice(0, 8).toUpperCase() || 'N/A'}</p>
            <p className="text-xs text-gray">{new Date().toLocaleDateString()}</p>
          </div>

          {/* Estimated Pickup */}
          <div className="bg-white rounded-lg border border-gray/10 p-6">
            <h2 className="text-sm font-semibold text-gray mb-4 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Estimated Pickup
            </h2>
            <p className="text-lg font-semibold text-dark mb-1">{formattedPickupDate}</p>
            <p className="text-xs text-gray">8:00 AM - 6:00 PM</p>
          </div>

          {/* Order Total */}
          <div className="bg-mint rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray mb-4 uppercase">Total Amount</h2>
            <p className="text-3xl font-bold text-primary">${order?.totalPrice || '0.00'}</p>
            <p className="text-xs text-gray">(inc. GST)</p>
          </div>
        </div>

        {/* Order Summary */}
        {order && (
          <div className="bg-white rounded-lg border border-gray/10 p-8 mb-8">
            <h2 className="text-xl font-bold text-dark mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 border-b border-gray/10 pb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray">Weight</p>
                  <p className="font-semibold text-dark">{order.weight}kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray">Delivery Speed</p>
                  <p className="font-semibold text-dark capitalize">{order.deliverySpeed === 'express' ? 'Express' : 'Standard'}</p>
                </div>
                {order.protectionPlan && order.protectionPlan !== 'Basic' && (
                  <div>
                    <p className="text-sm text-gray">Protection Plan</p>
                    <p className="font-semibold text-dark">{order.protectionPlan}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray">
                  {order.weight}kg @ ${order.deliverySpeed === 'express' ? '12.50' : '7.50'}/kg
                </span>
                <span className="font-semibold text-dark">${order.subtotal}</span>
              </div>
              {order.protectionPlan && order.protectionPlan !== 'Basic' && (
                <div className="flex justify-between">
                  <span className="text-gray">{order.protectionPlan} Protection</span>
                  <span className="font-semibold text-dark">${order.protectionPlanCost || '0.00'}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray/10 pt-3">
                <span className="font-bold text-dark">Total</span>
                <span className="text-lg font-bold text-primary">${order.totalPrice}</span>
              </div>
            </div>

            {/* Delivery Address */}
            {order.pickupAddress && (
              <div className="bg-mint rounded-lg p-4">
                <p className="text-sm text-gray mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Pickup Address
                </p>
                <p className="font-semibold text-dark">
                  {order.pickupAddress}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white rounded-lg border border-gray/10 p-8 mb-8">
          <h2 className="text-xl font-bold text-dark mb-6">What Happens Next?</h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-mint text-primary font-bold text-sm">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-dark">Pro Assignment</h3>
                <p className="text-sm text-gray">
                  We're matching your order with a verified Washlee Pro in your area.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-mint text-primary font-bold text-sm">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-dark">Pickup Confirmation</h3>
                <p className="text-sm text-gray">
                  Your pro will contact you to confirm the pickup time. You can also check your order status in the app.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-mint text-primary font-bold text-sm">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-dark">Washing & Delivery</h3>
                <p className="text-sm text-gray">
                  Your laundry will be professionally washed and delivered back to you within 3-5 business days.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-mint text-primary font-bold text-sm">
                  4
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-dark">Rate Your Experience</h3>
                <p className="text-sm text-gray">
                  After delivery, you can rate your pro and help other customers choose the best service.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push(`/tracking/${orderId}`)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            Track Order
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Support Info */}
        <div className="bg-light border border-gray/10 rounded-lg p-6 text-center">
          <p className="text-gray mb-2">Need help with your order?</p>
          <a href="/faq" className="text-primary font-semibold hover:underline">
            Visit our FAQ
          </a>
          <p className="text-sm text-gray mt-2">
            Or contact us at <span className="font-semibold">support@washlee.com</span>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
