'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import {
  Package,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowRight,
} from 'lucide-react'

interface OrderData {
  id: string
  user_id: string
  status: string
  total_price: number
  pickup_address?: unknown
  delivery_address?: unknown
  items?: unknown
  created_at: string
  notes?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  pickup_spot?: string
  pickup_instructions?: string
  detergent?: string
  delicate_cycle?: boolean
  returns_on_hangers?: boolean
  hang_dry?: boolean
  additional_requests?: string
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-blue-100 text-blue-800',
  washing: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-amber-100 text-amber-800',
  'pending-pickup': 'bg-amber-100 text-amber-800',
  pending_payment: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-700',
}

function formatStatus(status: string): string {
  const cleaned = status.replace(/[_-]/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function statusIcon(status: string) {
  if (status === 'completed') return CheckCircle
  if (status === 'confirmed' || status === 'pending-pickup' || status === 'pending_payment') return AlertCircle
  return Clock
}

function readAddress(addr: unknown): string {
  if (!addr) return 'Address not provided'
  if (typeof addr === 'string') return addr
  if (typeof addr === 'object' && addr) {
    const a = addr as { address?: string }
    return a.address || 'Address not provided'
  }
  return 'Address not provided'
}

function getOrderDetails(order: OrderData) {
  if (!order.items) {
    return {
      weight: 0,
      bagCount: 0,
      service_type: 'standard',
      delivery_speed: 'standard',
      protection_plan: 'none',
    }
  }
  try {
    const items = (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) as {
      weight?: number
      bagCount?: number
      service_type?: string
      delivery_speed?: string
      deliverySpeed?: string
      protection_plan?: string
    }
    return {
      weight: items.weight || 0,
      bagCount: items.bagCount || 0,
      service_type: items.service_type || 'standard',
      delivery_speed: items.delivery_speed || items.deliverySpeed || 'standard',
      protection_plan: items.protection_plan || 'none',
    }
  } catch {
    return {
      weight: 0,
      bagCount: 0,
      service_type: 'standard',
      delivery_speed: 'standard',
      protection_plan: 'none',
    }
  }
}

export default function EmployeeOrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [allOrders, setAllOrders] = useState<OrderData[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return

    setHasCheckedAuth(true)

    if (!user) {
      router.push('/auth/employee-signin')
    }
  }, [user, loading, router, hasCheckedAuth])

  useEffect(() => {
    if (!user?.id) return

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true)

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('pro_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching orders:', error)
          setOrdersLoading(false)
          return
        }

        if (data && data.length > 0) {
          const { data: sessionData } = await supabase.auth.getSession()
          const authHeaders = sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : undefined

          const ordersWithCustomers = await Promise.all(
            data.map(async (order: OrderData) => {
              if (!order.user_id) {
                return { ...order, customer_name: 'Unknown', customer_email: '', customer_phone: '' }
              }
              try {
                const response = await fetch(`/api/customers/profile?userId=${order.user_id}`, {
                  headers: authHeaders,
                })
                const customerData = await response.json()

                if (response.ok && customerData.name && customerData.name !== 'Unknown') {
                  return {
                    ...order,
                    customer_name: customerData.name,
                    customer_email: customerData.email || '',
                    customer_phone: customerData.phone || '',
                  }
                }
                return { ...order, customer_name: 'Unknown', customer_email: '', customer_phone: '' }
              } catch (err) {
                console.error('[Employee Orders] Error fetching customer:', err)
                return { ...order, customer_name: 'Unknown', customer_email: '', customer_phone: '' }
              }
            })
          )
          setAllOrders(ordersWithCustomers)
        } else {
          setAllOrders([])
        }

        setOrdersLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setAllOrders([])
        setOrdersLoading(false)
      }
    }

    fetchOrders()
    const refreshInterval = setInterval(fetchOrders, 10000)
    return () => clearInterval(refreshInterval)
  }, [user?.id])

  const filteredOrders = allOrders.filter((order) => {
    const matchesSearch =
      (order.customer_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const selectedOrderData = allOrders.find((o) => o.id === selectedOrder)

  const handleMarkPickupComplete = async () => {
    if (!selectedOrderData) return
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'in-progress' })
        .eq('id', selectedOrderData.id)
      if (!error) {
        setAllOrders((prev) =>
          prev.map((o) => (o.id === selectedOrderData.id ? { ...o, status: 'in-progress' } : o))
        )
      }
    } catch (error) {
      console.error('Error marking pickup complete:', error)
    }
  }

  const handleDeliverOrder = async () => {
    if (!selectedOrderData) return
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', selectedOrderData.id)
      if (!error) {
        setAllOrders((prev) =>
          prev.map((o) => (o.id === selectedOrderData.id ? { ...o, status: 'completed' } : o))
        )
      }
    } catch (error) {
      console.error('Error delivering order:', error)
    }
  }

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-soft-mint flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading orders…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const completedCount = allOrders.filter((o) => o.status === 'completed').length

  return (
    <div className="min-h-screen bg-soft-mint flex flex-col">
      <main className="flex-1 container-page py-10 space-y-6">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark inline-flex items-center gap-2">
            <Package size={28} className="text-primary-deep" />
            Your orders
          </h1>
          <p className="text-gray text-sm mt-1">
            {filteredOrders.length} showing · {completedCount} completed
          </p>
        </header>

        <div className="surface-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={16} />
              <input
                type="text"
                placeholder="Search by customer name or order ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
              />
            </div>
            <div className="flex items-center gap-2 sm:w-auto">
              <Filter size={16} className="text-gray-soft flex-shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field min-h-[48px]"
              >
                <option value="all">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders list */}
          <div className="lg:col-span-2 space-y-3">
            {ordersLoading ? (
              <div className="surface-card p-12 text-center text-gray">
                <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent mx-auto mb-3" />
                <p className="text-sm">Loading orders…</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="surface-card p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-3">
                  <Package size={20} className="text-primary-deep" />
                </div>
                <h2 className="text-lg font-bold text-dark mb-1">No orders yet</h2>
                <p className="text-sm text-gray">Accepted jobs will show here.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const Icon = statusIcon(order.status)
                const badge = STATUS_BADGE[order.status] ?? 'bg-line text-dark'
                const details = getOrderDetails(order)
                const isSelected = selectedOrder === order.id
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrder(order.id)}
                    className={`surface-card p-5 w-full text-left transition ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${badge}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-soft uppercase tracking-wider mb-0.5">
                          {order.id.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-dark">{order.customer_name}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
                            {formatStatus(order.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray">
                          {details.weight ? `${details.weight}kg · ` : ''}
                          {details.service_type}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary-deep">${order.total_price.toFixed(2)}</p>
                        <p className="text-xs text-gray-soft mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-AU', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Detail panel */}
          {selectedOrderData ? (
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
              <div className="surface-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-mono text-sm font-semibold text-dark">{selectedOrderData.id.slice(0, 8)}</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      STATUS_BADGE[selectedOrderData.status] ?? 'bg-line text-dark'
                    }`}
                  >
                    {formatStatus(selectedOrderData.status)}
                  </span>
                </div>

                <section className="border-t border-line pt-4 mb-4">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-gray-soft mb-2">Customer</p>
                  <p className="font-semibold text-dark">{selectedOrderData.customer_name}</p>
                  {selectedOrderData.customer_email && (
                    <a
                      href={`mailto:${selectedOrderData.customer_email}`}
                      className="text-sm text-gray flex items-center gap-2 mt-1.5 hover:text-primary-deep"
                    >
                      <Mail size={14} /> {selectedOrderData.customer_email}
                    </a>
                  )}
                  {selectedOrderData.customer_phone && (
                    <a
                      href={`tel:${selectedOrderData.customer_phone}`}
                      className="text-sm text-gray flex items-center gap-2 mt-1 hover:text-primary-deep"
                    >
                      <Phone size={14} /> {selectedOrderData.customer_phone}
                    </a>
                  )}
                </section>

                {Boolean(selectedOrderData.pickup_address) && (
                  <section className="border-t border-line pt-4 mb-4">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-soft mb-2">Pickup</p>
                    <p className="text-sm text-dark flex items-start gap-2">
                      <MapPin size={14} className="text-primary-deep mt-0.5 flex-shrink-0" />
                      <span>{readAddress(selectedOrderData.pickup_address)}</span>
                    </p>
                    {selectedOrderData.pickup_spot && (
                      <p className="text-xs text-gray mt-2">
                        <span className="font-semibold">Spot:</span>{' '}
                        {selectedOrderData.pickup_spot.replace('-', ' ')}
                      </p>
                    )}
                    {selectedOrderData.pickup_instructions && (
                      <p className="text-xs text-gray mt-2 border-l-2 border-primary pl-3 italic">
                        {selectedOrderData.pickup_instructions}
                      </p>
                    )}
                  </section>
                )}

                {Boolean(selectedOrderData.delivery_address) && (
                  <section className="border-t border-line pt-4 mb-4">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-soft mb-2">Delivery</p>
                    <p className="text-sm text-dark flex items-start gap-2">
                      <MapPin size={14} className="text-primary-deep mt-0.5 flex-shrink-0" />
                      <span>{readAddress(selectedOrderData.delivery_address)}</span>
                    </p>
                  </section>
                )}

                <section className="border-t border-line pt-4 mb-4">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-gray-soft mb-2">Order details</p>
                  <dl className="text-sm space-y-1.5">
                    {(() => {
                      const d = getOrderDetails(selectedOrderData)
                      return (
                        <>
                          <div className="flex justify-between">
                            <dt className="text-gray">Weight</dt>
                            <dd className="font-semibold text-dark">{d.weight ? `${d.weight}kg` : '—'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray">Service</dt>
                            <dd className="font-semibold text-dark capitalize">{d.service_type}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray">Delivery</dt>
                            <dd className="font-semibold text-dark capitalize">{d.delivery_speed}</dd>
                          </div>
                        </>
                      )
                    })()}
                  </dl>
                </section>

                {(selectedOrderData.detergent ||
                  selectedOrderData.hang_dry ||
                  selectedOrderData.delicate_cycle ||
                  selectedOrderData.returns_on_hangers ||
                  selectedOrderData.additional_requests) && (
                  <section className="border-t border-line pt-4 mb-4">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-gray-soft mb-2">
                      Care preferences
                    </p>
                    <ul className="text-sm space-y-1.5 text-dark">
                      {selectedOrderData.detergent && (
                        <li>
                          <span className="text-gray">Detergent: </span>
                          <span className="capitalize font-semibold">
                            {selectedOrderData.detergent.replace('-', ' ')}
                          </span>
                        </li>
                      )}
                      {selectedOrderData.hang_dry && <li>• Hang dry requested</li>}
                      {selectedOrderData.delicate_cycle && <li>• Delicate cycle</li>}
                      {selectedOrderData.returns_on_hangers && <li>• Return on hangers</li>}
                    </ul>
                    {selectedOrderData.additional_requests && (
                      <p className="text-xs text-gray mt-2 border-l-2 border-primary pl-3 italic">
                        {selectedOrderData.additional_requests}
                      </p>
                    )}
                  </section>
                )}

                <section className="rounded-2xl bg-mint/60 border border-primary/15 p-4 mb-4">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-primary-deep mb-1">
                    Order total
                  </p>
                  <p className="text-3xl font-bold text-dark">
                    ${selectedOrderData.total_price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray mt-1">
                    Your commission for this job appears in <span className="font-semibold">earnings</span> once it&rsquo;s finalised.
                  </p>
                </section>

                {selectedOrderData.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={handleMarkPickupComplete}
                    className="btn-primary w-full"
                  >
                    Mark pickup complete
                    <ArrowRight size={16} />
                  </button>
                )}
                {(selectedOrderData.status === 'in-progress' ||
                  selectedOrderData.status === 'in_progress') && (
                  <button
                    type="button"
                    onClick={handleDeliverOrder}
                    className="btn-primary w-full"
                  >
                    Mark delivered
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </aside>
          ) : (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="surface-card p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-3">
                  <Eye size={20} className="text-primary-deep" />
                </div>
                <p className="text-sm text-gray">Select an order to see customer info, pickup notes, and care preferences.</p>
              </div>
            </aside>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
