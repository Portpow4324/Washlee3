'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LiveTracking from '@/components/LiveTracking'
import Link from 'next/link'
import { MapPin, Navigation, AlertCircle, Phone, ArrowRight, ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface Order {
  id: string
  status: string
  customer_name: string
  pro_name?: string
  pro_phone?: string
  pro_rating?: number
  pro_service_area?: string
  pickup_address?: string
  delivery_address?: string
  weight?: number
  scheduled_pickup_date?: string
  pro_lat?: number
  pro_lng?: number
}

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-mint text-primary-deep',
  pending_payment: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-blue-100 text-blue-800',
  washing: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
}

function formatStatus(status?: string): string {
  if (!status) return ''
  const cleaned = status.replace(/[_-]/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function TrackingPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id') || searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [proLocation, setProLocation] = useState<{
    lat: number
    lng: number
    status: string
    name: string
    phone: string
    rating?: number
    vehicle: string
    eta: string
  } | null>(null)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)

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

        if (fetchError && fetchError.message?.includes('column')) {
          const basicResult = await supabase
            .from('orders')
            .select(`id, status, user_id, pro_id`)
            .eq('id', orderId)
            .single()
          data = basicResult.data
          fetchError = basicResult.error
        }

        if (fetchError || !data) {
          console.error('[Tracking] Error fetching order:', fetchError)
          setError('Order not found' + (fetchError?.message ? ` — ${fetchError.message}` : ''))
          setLoading(false)
          return
        }

        let customerName = 'Customer'
        if (data.user_id) {
          try {
            const { data: customerData, error: customerError } = await supabase
              .from('users')
              .select('name, phone')
              .eq('id', data.user_id)
              .maybeSingle()
            if (customerData && !customerError) {
              customerName = customerData.name || 'Customer'
            }
          } catch (err) {
            console.warn('[Tracking] Error fetching customer name:', err)
          }
        }

        let proName: string | undefined
        let proPhone: string | undefined
        let proServiceArea: string | undefined
        if (data.pro_id) {
          try {
            const { data: proData, error: proError } = await supabase
              .from('users')
              .select('name, phone')
              .eq('id', data.pro_id)
              .maybeSingle()
            if (proData && !proError) {
              proName = proData.name || 'Pro'
              proPhone = proData.phone
            }
          } catch (err) {
            console.warn('[Tracking] Could not fetch pro name:', err)
          }

          try {
            const { data: proInquiry, error: inquiryError } = await supabase
              .from('pro_inquiries')
              .select('service_area')
              .eq('user_id', data.pro_id)
              .maybeSingle()
            if (proInquiry && !inquiryError && proInquiry.service_area) {
              proServiceArea = proInquiry.service_area
            }
          } catch (err) {
            console.warn('[Tracking] Could not fetch pro service area:', err)
          }
        }

        const transformedOrder: Order = {
          id: data.id,
          status: data.status,
          customer_name: customerName,
          pro_name: proName,
          pro_phone: proPhone,
          pro_service_area: proServiceArea,
          pickup_address: data.pickup_address || undefined,
          delivery_address: data.delivery_address || undefined,
          weight: (data as { weight?: number }).weight ?? undefined,
          scheduled_pickup_date: data.scheduled_pickup_date || undefined,
        }

        setOrder(transformedOrder)

        // Do not seed fake map coordinates or fake Pro ratings. Live tracking
        // should appear only when a real location stream is available.
        setProLocation(null)
        setCustomerLocation(null)
        setLoading(false)
      } catch (err) {
        console.error('[Tracking] Error:', err)
        setError('Failed to load order')
        setLoading(false)
      }
    }

    fetchOrder()

    const subscription = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload: { new?: { status?: string } }) => {
          if (payload.new) {
            setOrder((prev) => (prev ? { ...prev, status: payload.new!.status ?? prev.status } : prev))
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
      <div className="min-h-screen bg-soft-mint flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Loading tracking…</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-soft-mint flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="surface-card p-8 max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-dark mb-2">{error}</h1>
            <p className="text-gray text-sm mb-5">
              Check the order ID, or open your dashboard for the full list.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/orders" className="btn-primary flex-1">
                <ArrowLeft size={16} />
                My orders
              </Link>
              <Link href="/contact" className="btn-outline flex-1">
                Contact support
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const statusBadgeClass = STATUS_BADGE[order?.status || ''] ?? 'bg-line text-dark'

  return (
    <div className="min-h-screen bg-soft-mint flex flex-col">
      <Header />
      <main className="flex-1 container-page py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-4 hover:text-primary"
          >
            <ArrowLeft size={16} />
            All orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-1">Track your order</h1>
              <p className="text-gray text-sm">Order #{order?.id?.slice(0, 8).toUpperCase()}</p>
            </div>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${statusBadgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${order?.status === 'cancelled' ? 'bg-red-500' : 'bg-primary-deep animate-pulse'}`} />
              {formatStatus(order?.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map / cancelled state */}
          <div className="lg:col-span-2">
            {order?.status === 'cancelled' ? (
              <div className="surface-card p-8 sm:p-12 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                  <AlertCircle size={22} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-dark mb-1">Order cancelled</h2>
                <p className="text-gray text-sm mb-6">
                  This order is no longer active. We&rsquo;ll auto-remove it from your dashboard in 24 hours.
                </p>
                <div className="rounded-2xl bg-mint/40 border border-primary/15 p-5 text-left max-w-sm mx-auto">
                  <p className="font-semibold text-dark mb-2 text-sm">What happens next</p>
                  <ul className="text-sm text-gray space-y-1.5">
                    <li>• Cancellation confirmation sent to your email</li>
                    <li>• Refund processed within 24 hours</li>
                    <li>• Order hidden from dashboard in 24 hours</li>
                    <li>
                      • Questions? Email{' '}
                      <a href="mailto:support@washlee.com.au" className="text-primary-deep font-semibold hover:underline">
                        support@washlee.com.au
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="surface-card p-2 sm:p-3 overflow-hidden">
                <LiveTracking
                  orderId={orderId || ''}
                  proLocation={proLocation ?? undefined}
                  customerLocation={customerLocation ?? undefined}
                  orderStatus={order?.status}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="surface-card p-6">
              <h3 className="font-bold text-dark mb-4">Order details</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-gray-soft mb-0.5">Weight</dt>
                  <dd className="font-semibold text-dark">{order?.weight ? `${order.weight}kg` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-gray-soft mb-0.5">Scheduled pickup</dt>
                  <dd className="font-semibold text-dark">
                    {order?.scheduled_pickup_date
                      ? new Date(order.scheduled_pickup_date).toLocaleDateString('en-AU', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Not scheduled'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="surface-card p-6">
              <h3 className="font-bold text-dark mb-4">Addresses</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-soft mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Pickup
                  </p>
                  <p className="text-dark">{order?.pickup_address || 'Not provided'}</p>
                </div>
                <div className="border-t border-line pt-4">
                  <p className="text-[11px] uppercase tracking-wider text-gray-soft mb-1 flex items-center gap-1">
                    <Navigation size={12} /> Delivery
                  </p>
                  <p className="text-dark">{order?.delivery_address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {order?.pro_name && (
              <div className="surface-card p-6">
                <h3 className="font-bold text-dark mb-4">Your Washlee Pro</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-soft mb-0.5">Name</p>
                    <p className="font-semibold text-dark">{order.pro_name}</p>
                  </div>
                  {order.pro_phone && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-gray-soft mb-0.5">Contact</p>
                      <a
                        href={`tel:${order.pro_phone}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-primary-deep hover:underline"
                      >
                        <Phone size={14} /> {order.pro_phone}
                      </a>
                    </div>
                  )}
                  {order.pro_service_area && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-gray-soft mb-0.5">Service area</p>
                      <p className="font-semibold text-dark">{order.pro_service_area}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="surface-card p-6 bg-mint/40">
              <h3 className="font-bold text-dark mb-1">Need help?</h3>
              <p className="text-sm text-gray mb-4">Reach out anytime — support replies within one business day.</p>
              <a
                href="mailto:support@washlee.com.au"
                className="inline-flex items-center gap-2 font-semibold text-primary-deep hover:underline text-sm"
              >
                <Mail size={14} />
                support@washlee.com.au
              </a>
              <Link href="/dashboard/support" className="btn-outline w-full mt-4 text-sm">
                Open in-app support
                <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-soft-mint">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <TrackingPageContent />
    </Suspense>
  )
}
