'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Head from 'next/head'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LiveTracking from '@/components/LiveTracking'
import Spinner from '@/components/Spinner'
import { MapPin, Navigation } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface Order {
  id: string
  status: string
  customer_name: string
  pro_name?: string
  pro_phone?: string
  pro_rating?: number
  pickup_address?: string
  delivery_address?: string
  weight?: number
  scheduled_pickup_date?: string
  pro_lat?: number
  pro_lng?: number
}

function TrackingPageContent() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [proLocation, setProLocation] = useState<any>(null)
  const [customerLocation, setCustomerLocation] = useState<any>(null)

  // Fetch order data
  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        console.log('[Tracking] Fetching order:', orderId)

        // First try with full columns
        let { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            user_id,
            pro_id,
            delivery_address,
            pickup_address,
            scheduled_pickup_date
          `)
          .eq('id', orderId)
          .single()

        // Fallback if columns don't exist
        if (fetchError && fetchError.message?.includes('column')) {
          console.warn('[Tracking] Some columns missing, trying basic select:', fetchError.message)
          const basicResult = await supabase
            .from('orders')
            .select(`
              id,
              status,
              user_id,
              pro_id
            `)
            .eq('id', orderId)
            .single()

          data = basicResult.data
          fetchError = basicResult.error
        }

        if (fetchError) {
          console.error('[Tracking] Error fetching order:', fetchError)
          setError('Order not found - ' + (fetchError?.message || 'Unknown error'))
          setLoading(false)
          return
        }

        // For now, skip fetching customer/pro names due to schema complexity
        // In production, this would fetch from users/employees tables

        const transformedOrder: Order = {
          id: data.id,
          status: data.status,
          customer_name: 'Customer',
          pro_name: data.pro_id ? 'Assigned Pro' : undefined,
          pro_phone: undefined,
          pro_rating: undefined,
          pickup_address: data.pickup_address || undefined,
          delivery_address: data.delivery_address || undefined,
          weight: data.weight || undefined,
          scheduled_pickup_date: data.scheduled_pickup_date || undefined
        }

        setOrder(transformedOrder)
        console.log('[Tracking] Loaded order:', transformedOrder)

        // Set up pro location (mock for now - would be real-time in production)
        if (transformedOrder.pro_name) {
          setProLocation({
            lat: -33.8688 + Math.random() * 0.1,
            lng: 151.2093 + Math.random() * 0.1,
            status: transformedOrder.status,
            name: transformedOrder.pro_name,
            phone: transformedOrder.pro_phone || '+61 2 XXXX XXXX',
            rating: transformedOrder.pro_rating || 4.8,
            vehicle: 'Blue Toyota Camry',
            eta: '8 mins'
          })
        }

        // Set customer location (delivery address)
        setCustomerLocation({
          lat: -33.8688,
          lng: 151.2093
        })

        setLoading(false)
      } catch (err) {
        console.error('[Tracking] Error:', err)
        setError('Failed to load order')
        setLoading(false)
      }
    }

    fetchOrder()

    // Set up real-time subscription for order updates
    const subscription = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload: any) => {
          console.log('[Tracking] Real-time update:', payload)
          if (payload.new) {
            setOrder((prev: any) =>
              prev
                ? { ...prev, status: payload.new.status }
                : null
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId])

  if (loading) {
    return (
      <>
        {googleMapsApiKey && (
          <Head>
            <script
              src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`}
              async
              defer
            ></script>
          </Head>
        )}
        <div className="min-h-screen bg-light flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-gray font-semibold">Loading tracking information...</p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        {googleMapsApiKey && (
          <Head>
            <script
              src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`}
              async
              defer
            ></script>
          </Head>
        )}
        <div className="min-h-screen bg-light flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full text-center border border-red-200">
              <p className="text-red-600 font-semibold mb-4">⚠️ {error}</p>
              <p className="text-gray text-sm">
                Please check the order ID and try again, or contact support@washlee.com
              </p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    )
  }

  return (
    <>
      {googleMapsApiKey && (
        <Head>
          <script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`}
            async
            defer
          ></script>
        </Head>
      )}
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-dark mb-2">Track Your Order</h1>
            <p className="text-gray">Order #{order?.id?.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main tracking map */}
            <div className="lg:col-span-2">
              <LiveTracking
                orderId={orderId || ''}
                proLocation={proLocation}
                customerLocation={customerLocation}
                orderStatus={order?.status}
              />
            </div>

            {/* Order Details Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg p-6 border border-gray/10">
                <h3 className="font-bold text-dark mb-4">Order Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray uppercase mb-1">Status</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      {order?.status?.replace(/-/g, ' ')}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray uppercase mb-1">Weight</p>
                    <p className="font-semibold text-dark">{order?.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray uppercase mb-1">Scheduled Pickup</p>
                    <p className="font-semibold text-dark">
                      {order?.scheduled_pickup_date
                        ? new Date(order.scheduled_pickup_date).toLocaleDateString('en-AU', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div className="bg-white rounded-lg p-6 border border-gray/10">
                <h3 className="font-bold text-dark mb-4">Addresses</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray uppercase mb-1 flex items-center gap-1"><MapPin size={14} /> Pickup</p>
                    <p className="text-sm text-dark">{order?.pickup_address || 'Not provided'}</p>
                  </div>
                  <div className="border-t border-gray/10 pt-4">
                    <p className="text-xs text-gray uppercase mb-1 flex items-center gap-1"><Navigation size={14} /> Delivery</p>
                    <p className="text-sm text-dark">{order?.delivery_address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="bg-mint rounded-lg p-6">
                <h3 className="font-bold text-dark mb-2">Need Help?</h3>
                <p className="text-sm text-gray mb-4">Contact us anytime for support</p>
                <a href="mailto:support@washlee.com" className="text-primary font-semibold hover:underline">
                  support@washlee.com
                </a>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default function TrackingDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-light">
        <Spinner />
      </div>
    }>
      <TrackingPageContent />
    </Suspense>
  )
}
