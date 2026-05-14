'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import {
  MapPin,
  Phone,
  Mail,
  Package,
  DollarSign,
  Calendar,
  Clock,
  Navigation,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import EmployeeOrderMap from '@/components/EmployeeOrderMap'

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface OrderData {
  id: string
  status: string
  totalPrice: number
  weight: number
  items: unknown
  pickupAddress: string
  deliveryAddress: string
  serviceAddress?: string
  scheduledPickupDate: string
  scheduledDeliveryDate?: string
  deliveryTimeSlot?: string
  pickupTimeStatus?: string
  createdAt?: string
  updatedAt?: string
  job?: {
    id: string
    status: string
    postedAt?: string
    acceptedAt?: string
    updatedAt?: string
  } | null
  customer?: {
    first_name?: string
    last_name?: string
    phone: string
    email: string
  }
  pro?: {
    first_name?: string
    last_name?: string
    phone: string
    email: string
  }
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  'in-transit': 'bg-blue-100 text-blue-800',
  in_washing: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-amber-100 text-amber-800',
  'pending-payment': 'bg-amber-100 text-amber-800',
  pending_payment: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-700',
}

function formatStatus(status: string): string {
  const cleaned = status.replace(/[_-]/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function parseItems(items: unknown): Record<string, unknown> {
  if (!items) return {}
  if (typeof items === 'string') {
    try {
      return JSON.parse(items) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return items as Record<string, unknown>
}

function formatDate(value?: string) {
  if (!value) return 'Not provided'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-AU', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(value?: string) {
  if (!value) return 'Not provided'
  return new Date(value).toLocaleString('en-AU', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function EmployeeOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [orderLoading, setOrderLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [actionPending, setActionPending] = useState(false)

  const orderId = params?.orderId as string

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return

    setHasCheckedAuth(true)

    if (!user) {
      router.push('/auth/employee-signin')
      return
    }
  }, [user, loading, router, hasCheckedAuth])

  useEffect(() => {
    if (!orderId) {
      setError('Order ID not provided')
      setOrderLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        setOrderLoading(true)
        const { data: sessionData } = await supabase.auth.getSession()
        const response = await fetch(`/api/orders/details?orderId=${orderId}`, {
          headers: sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : undefined,
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Failed to load order')
          setOrderLoading(false)
          return
        }

        const data = await response.json()
        setOrder(data)
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Failed to load order details')
      } finally {
        setOrderLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const handleAdvance = async (toStatus: 'in-progress' | 'completed') => {
    if (!order) return
    try {
      setActionPending(true)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: toStatus })
        .eq('id', order.id)

      if (updateError) {
        setError(`Couldn't update order: ${updateError.message}`)
        return
      }
      setOrder({ ...order, status: toStatus })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update order'
      setError(message)
    } finally {
      setActionPending(false)
    }
  }

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-soft-mint flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-soft-mint flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading order details…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-soft-mint">
        <div className="container-page py-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-6 hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="surface-card p-8 max-w-lg mx-auto text-center bg-red-50 border-red-200">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-dark mb-1">Couldn&rsquo;t load order</h1>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-soft-mint">
        <div className="container-page py-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-6 hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="surface-card p-8 max-w-lg mx-auto text-center">
            <p className="text-gray">Order not found.</p>
          </div>
        </div>
      </main>
    )
  }

  const itemsData = parseItems(order.items)
  const deliveryDate =
    order.scheduledDeliveryDate || (itemsData?.deliveryDate as string | undefined)
  const deliveryWindow =
    order.deliveryTimeSlot || (itemsData?.deliveryTimeSlot as string | undefined)
  const badge = STATUS_BADGE[order.status] ?? 'bg-line text-dark'
  const itemsList = Array.isArray(itemsData?.items)
    ? (itemsData.items as Array<{ name?: string; type?: string; quantity?: number; price?: number }>)
    : []

  const customerName = `${order.customer?.first_name || ''} ${
    order.customer?.last_name || ''
  }`.trim()

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
      <main className="min-h-screen bg-soft-mint pb-16">
        <div className="container-page py-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-6 hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-soft mb-1">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-dark">Order details</h1>
            </div>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${badge}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  order.status === 'cancelled' ? 'bg-red-500' : 'bg-primary-deep animate-pulse'
                }`}
              />
              {formatStatus(order.status)}
            </span>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-4">
              {/* Customer */}
              <div className="surface-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-dark">Customer</h2>
                  <Mail size={18} className="text-primary-deep" />
                </div>
                <p className="font-semibold text-dark mb-3">
                  {customerName || 'Not provided'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {order.customer?.phone && (
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="flex items-center gap-2 text-primary-deep hover:underline"
                    >
                      <Phone size={14} /> {order.customer.phone}
                    </a>
                  )}
                  {order.customer?.email && (
                    <a
                      href={`mailto:${order.customer.email}`}
                      className="flex items-center gap-2 text-primary-deep hover:underline break-all"
                    >
                      <Mail size={14} /> {order.customer.email}
                    </a>
                  )}
                </div>
              </div>

              {/* Pickup + Service */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="surface-card p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center">
                      <MapPin size={18} className="text-primary-deep" />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark">Pickup</h3>
                      <p className="text-xs text-gray">Customer&rsquo;s address</p>
                    </div>
                  </div>
                  <p className="text-sm text-dark leading-relaxed">
                    {order.pickupAddress || 'Not provided'}
                  </p>
                  {order.scheduledPickupDate && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold flex items-center gap-1.5 mb-1">
                        <Calendar size={12} /> Scheduled pickup
                      </p>
                      <p className="font-semibold text-dark text-sm">
                        {formatDate(order.scheduledPickupDate)}
                      </p>
                      <p className="text-xs text-gray mt-1">
                        Confirm exact time with the customer.
                      </p>
                    </div>
                  )}
                </div>

                <div className="surface-card p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center">
                      <Navigation size={18} className="text-primary-deep" />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark">Service location</h3>
                      <p className="text-xs text-gray">Where you process the laundry</p>
                    </div>
                  </div>
                  <p className="text-sm text-dark leading-relaxed">
                    {order.serviceAddress || 'Not provided'}
                  </p>
                  {(deliveryDate || deliveryWindow) && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold flex items-center gap-1.5 mb-1">
                        <Calendar size={12} /> Scheduled delivery
                      </p>
                      <p className="font-semibold text-dark text-sm">
                        {deliveryDate ? formatDate(deliveryDate) : 'Date not provided'}
                        {deliveryWindow ? `, ${deliveryWindow}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Laundry */}
              <div className="surface-card p-6">
                <h3 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
                  <Package size={18} className="text-primary-deep" />
                  Laundry details
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold">
                      Weight
                    </p>
                    <p className="text-2xl font-bold text-dark mt-1">
                      {order.weight ? `${order.weight} kg` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold">
                      Service type
                    </p>
                    <p className="font-semibold text-dark capitalize mt-1">
                      {(itemsData?.service_type as string) || 'Standard'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold">
                      Delivery speed
                    </p>
                    <p className="font-semibold text-dark capitalize mt-1">
                      {(itemsData?.delivery_speed as string) || 'Standard'}
                    </p>
                  </div>
                  {itemsData?.special_requests ? (
                    <div className="col-span-2">
                      <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold">
                        Special requests
                      </p>
                      <p className="text-sm text-dark mt-1">
                        {String(itemsData.special_requests)}
                      </p>
                    </div>
                  ) : null}
                </div>

                {itemsList.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-line">
                    <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold mb-3">
                      Items
                    </p>
                    <ul className="space-y-1.5">
                      {itemsList.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center bg-mint/40 px-3 py-2 rounded-lg text-sm"
                        >
                          <span className="text-dark">
                            {item.name || item.type || `Item ${idx + 1}`}
                            {item.quantity ? ` × ${item.quantity}` : ''}
                          </span>
                          {item.price != null && (
                            <span className="font-semibold text-primary-deep">
                              ${item.price}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Map */}
              {(order.pickupAddress || order.deliveryAddress) && (
                <div className="surface-card p-2 sm:p-3 overflow-hidden">
                  <EmployeeOrderMap
                    pickupAddress={order.pickupAddress || ''}
                    deliveryAddress={order.deliveryAddress}
                    mapId="employee-order-map"
                    height="400px"
                  />
                </div>
              )}
            </section>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="surface-card p-6 bg-gradient-to-br from-mint to-white">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white shadow-soft flex items-center justify-center">
                    <DollarSign size={20} className="text-primary-deep" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-primary-deep font-bold">
                      Order total
                    </p>
                    <p className="text-3xl font-bold text-dark">
                      ${order.totalPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray mt-1">
                      Your commission appears in earnings once finalised.
                    </p>
                  </div>
                </div>
              </div>

              <div className="surface-card p-6 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold">
                    Order ID
                  </p>
                  <p className="font-mono text-sm text-dark break-all mt-1">{order.id}</p>
                </div>
                <div className="border-t border-line pt-4">
                  <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold flex items-center gap-1.5">
                    <Clock size={12} /> Created
                  </p>
                  <p className="text-sm font-semibold text-dark mt-1">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                {order.updatedAt && (
                  <div className="border-t border-line pt-4">
                    <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold flex items-center gap-1.5">
                      <Clock size={12} /> Last updated
                    </p>
                    <p className="text-sm font-semibold text-dark mt-1">
                      {formatDateTime(order.updatedAt)}
                    </p>
                  </div>
                )}
                {order.job?.acceptedAt && (
                  <div className="border-t border-line pt-4">
                    <p className="text-[11px] uppercase tracking-wider text-gray-soft font-bold flex items-center gap-1.5">
                      <Clock size={12} /> Accepted
                    </p>
                    <p className="text-sm font-semibold text-dark mt-1">
                      {formatDateTime(order.job.acceptedAt)}
                    </p>
                  </div>
                )}
              </div>

              {(order.status === 'confirmed' ||
                order.status === 'in-progress' ||
                order.status === 'in_progress') && (
                <div className="space-y-2">
                  {order.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => handleAdvance('in-progress')}
                      disabled={actionPending}
                      className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionPending ? 'Updating…' : 'Mark pickup complete'}
                      {!actionPending && <ArrowRight size={16} />}
                    </button>
                  )}
                  {(order.status === 'in-progress' || order.status === 'in_progress') && (
                    <button
                      type="button"
                      onClick={() => handleAdvance('completed')}
                      disabled={actionPending}
                      className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionPending ? 'Updating…' : 'Mark delivered'}
                      {!actionPending && <ArrowRight size={16} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push('/employee/orders')}
                    className="btn-outline w-full"
                  >
                    Back to orders
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
