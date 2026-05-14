'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import {
  Package,
  TrendingUp,
  DollarSign,
  Settings,
  MapPin,
  ChevronRight,
  Lock,
  Sparkles,
  Gift,
  ArrowRight,
  Apple,
  Play,
  Smartphone,
  Bell,
  CheckCircle,
} from 'lucide-react'
import PhoneMockup from '@/components/marketing/PhoneMockup'
import { RewardsAppScreen } from '@/components/marketing/AppScreens'

interface Order {
  id: string
  status: string
  created_at: string
  total_price?: number
  delivery_address?: string
  scheduled_pickup_date?: string
  pro_id?: string
  employees?: { name: string } | null
}

const statusTone = (status: string) => {
  switch (status) {
    case 'completed':
    case 'delivered':
      return 'bg-mint text-primary-deep'
    case 'in-transit':
    case 'in_washing':
    case 'confirmed':
      return 'bg-blue-50 text-blue-700'
    case 'pending-payment':
      return 'bg-yellow-50 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const friendlyStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ').replace(/_/g, ' ')

export default function CustomerDashboard() {
  const { user, userData, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState('')

  // Load orders — preserved exactly from previous version
  useEffect(() => {
    if (loading || !user) {
      return
    }

    const loadOrders = async () => {
      try {
        setOrdersLoading(true)
        console.log('[Dashboard] Fetching orders for customer:', user.id)

        let { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            created_at,
            total_price,
            delivery_address,
            scheduled_pickup_date,
            pro_id
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (fetchError && (fetchError.message?.includes('column') || fetchError.message?.includes('does not exist'))) {
          console.warn('[Dashboard] Some columns missing, fetching basic columns:', fetchError.message)
          const { data: basicData, error: basicError } = await supabase
            .from('orders')
            .select(`
              id,
              status,
              created_at
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

          if (basicError) {
            console.error('[Dashboard] Error fetching basic orders:', basicError)
            setError('Failed to load orders')
            setOrdersLoading(false)
            return
          }
          data = basicData
        } else if (fetchError) {
          console.error('[Dashboard] Error fetching orders:', fetchError)
          setError('Failed to load orders')
          setOrdersLoading(false)
          return
        }

        let ordersWithProInfo = (data || [])
        if (data && data.length > 0 && (data[0] as any).pro_id) {
          const proIds = [...new Set(data.filter((o: any) => o.pro_id).map((o: any) => o.pro_id))]

          if (proIds.length > 0) {
            const { data: proData } = await supabase
              .from('users')
              .select('id, first_name, last_name')
              .in('id', proIds)

            const proMap = proData?.reduce((acc: any, pro: any) => {
              acc[pro.id] = pro
              return acc
            }, {}) || {}

            ordersWithProInfo = (data || []).map((order: any) => ({
              ...order,
              employees: order.pro_id && proMap[order.pro_id]
                ? { name: `${proMap[order.pro_id].first_name} ${proMap[order.pro_id].last_name}` }
                : null,
            }))
          }
        }

        setOrders(ordersWithProInfo as Order[])
        console.log('[Dashboard] Loaded orders:', ordersWithProInfo)
        setOrdersLoading(false)
      } catch (err) {
        console.error('[Dashboard] Error:', err)
        setError('Error loading orders')
        setOrdersLoading(false)
      }
    }

    loadOrders()

    const subscription = supabase
      .channel(`customer:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => {
          console.log('[Dashboard] Real-time update received')
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, loading])

  const activeOrders = orders.filter(o =>
    ['pending-payment', 'confirmed', 'in-transit', 'in_washing'].includes(o.status)
  ).length
  const completedOrders = orders.filter(o => o.status === 'completed').length
  const totalSpent = orders.reduce((sum, order) => sum + (order.total_price || 0), 0)

  const stats = [
    { label: 'Active orders', value: activeOrders.toString(), icon: Package, accent: 'bg-mint text-primary-deep' },
    { label: 'Completed', value: completedOrders.toString(), icon: CheckCircle, accent: 'bg-blue-50 text-blue-700' },
    { label: 'Total spent', value: '$' + totalSpent.toFixed(2), icon: DollarSign, accent: 'bg-amber-50 text-amber-700' },
    { label: 'Wash Club points', value: Math.floor(totalSpent).toString(), icon: TrendingUp, accent: 'bg-primary/10 text-primary-deep' },
  ]

  const inProgressOrder = orders.find(o => ['pending-payment', 'confirmed', 'in-transit', 'in_washing'].includes(o.status))
  const lastCompleted = orders.find(o => o.status === 'completed' || o.status === 'delivered')
  const firstName = userData?.first_name || userData?.name?.split(' ')[0] || 'there'

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-gray font-semibold">Loading your dashboard…</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <main className="flex-1">
        {/* Greeting hero */}
        <section className="relative overflow-hidden bg-soft-hero">
          <div aria-hidden className="pointer-events-none absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl animate-blob" />
          <div aria-hidden className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-14 sm:pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="animate-slide-up">
                <span className="pill mb-3">
                  <Sparkles size={14} /> Your Washlee
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark tracking-tight text-balance">
                  G&rsquo;day, {firstName}.
                </h1>
                <p className="mt-2 text-gray text-base sm:text-lg max-w-xl">
                  {inProgressOrder
                    ? "You've got an order in motion. Track it below or book your next one."
                    : "Ready when you are — book a pickup in under a minute."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/booking" className="btn-primary shadow-glow">
                  Book a pickup
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-line text-dark hover:border-primary hover:text-primary transition shadow-sm"
                  title="Account settings"
                >
                  <Settings size={20} />
                </Link>
              </div>
            </div>

            {/* Stats — visual cards */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="surface-card card-hover p-4 sm:p-5 animate-slide-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-soft mb-1">{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-dark">{stat.value}</p>
                      </div>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Active-order banner */}
        {inProgressOrder && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2">
            <Link
              href={`/dashboard/orders/${inProgressOrder.id}`}
              className="surface-card card-hover block p-5 sm:p-6 bg-gradient-to-r from-mint via-white to-mint/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                    <span className="absolute inset-0 rounded-2xl bg-primary/40 animate-ping" />
                    <Package size={20} className="relative" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-deep">In progress</p>
                    <p className="text-base sm:text-lg font-bold text-dark">
                      Order #{inProgressOrder.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray mt-0.5">
                      {friendlyStatus(inProgressOrder.status)}
                      {inProgressOrder.employees && ` · with ${inProgressOrder.employees.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary-deep font-semibold text-sm">
                  Track this order
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          </section>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Recent orders */}
            <div className="lg:col-span-2">
              <div className="surface-card p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-dark">Recent orders</h2>
                    <p className="text-xs text-gray mt-0.5">Latest five — view all to see your full history.</p>
                  </div>
                  <Link
                    href="/dashboard/orders"
                    className="inline-flex items-center gap-1 text-primary-deep hover:text-primary font-semibold text-sm"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner />
                    </div>
                  ) : error ? (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">
                      {error}
                    </div>
                  ) : orders.length > 0 ? (
                    orders.slice(0, 5).map((order) => (
                      <Link
                        key={order.id}
                        href={`/dashboard/orders/${order.id}`}
                        className="group flex items-center justify-between gap-3 p-4 rounded-xl border border-line bg-white hover:border-primary/40 hover:bg-mint/30 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-primary-deep flex-shrink-0">
                            <Package size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-dark text-sm truncate">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                              {order.employees && (
                                <span className="ml-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary-deep">
                                  {order.employees.name}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray mt-0.5 truncate">
                              {new Date(order.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {order.delivery_address && ` · ${order.delivery_address}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-dark text-sm">${(order.total_price || 0).toFixed(2)}</p>
                          <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusTone(order.status)}`}>
                            {friendlyStatus(order.status)}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-mint flex items-center justify-center mb-4">
                        <Package className="w-7 h-7 text-primary-deep" />
                      </div>
                      <p className="font-bold text-dark mb-1">No orders yet</p>
                      <p className="text-sm text-gray mb-5 max-w-sm mx-auto">Book your first Washlee pickup — most customers do it in under a minute.</p>
                      <Link href="/booking" className="btn-primary shadow-glow">
                        Schedule first pickup
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Book again — visual conversion card */}
              {lastCompleted && (
                <div className="mt-6 surface-card overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3">
                    <div className="sm:col-span-2 p-6 sm:p-7">
                      <span className="pill mb-3">
                        <Sparkles size={14} /> One-tap rebook
                      </span>
                      <h3 className="text-xl font-bold text-dark mb-1">Run that order back?</h3>
                      <p className="text-sm text-gray leading-relaxed mb-4 max-w-md">
                        Your last completed order was{' '}
                        <span className="font-semibold text-dark">#{lastCompleted.id.slice(0, 8).toUpperCase()}</span>{' '}
                        — book a fresh pickup with the same details in a couple of taps.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link href="/booking" className="btn-primary">
                          Book the same again
                          <ArrowRight size={16} />
                        </Link>
                        <Link href={`/dashboard/orders/${lastCompleted.id}`} className="btn-outline">
                          See last receipt
                        </Link>
                      </div>
                    </div>
                    <div className="hidden sm:block bg-photo-fallback-warm relative">
                      {/* TODO: drop /public/marketing/folded-laundry.jpg for hero context */}
                      <div className="absolute inset-0 bg-gradient-to-br from-mint/30 via-transparent to-primary/20" />
                      <div className="absolute inset-0 flex items-end justify-end p-4">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-primary-deep shadow">
                          Last order: ${(lastCompleted.total_price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Wash Club ribbon */}
              <div className="relative surface-card overflow-hidden bg-gradient-to-br from-dark to-dark-soft text-white p-6">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/30 blur-3xl" />
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    <Gift size={12} /> Wash Club
                  </span>
                  <p className="mt-3 text-2xl font-bold leading-tight">
                    {Math.floor(totalSpent)} <span className="text-sm font-medium opacity-70">points</span>
                  </p>
                  <p className="mt-1 text-xs opacity-80">Earn 1 point on every $1 spent. Free forever, no membership fee.</p>
                  <Link
                    href="/dashboard/washclub"
                    className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-dark hover:bg-mint transition"
                  >
                    Open Wash Club <ChevronRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Quick actions */}
              <div className="surface-card p-6">
                <h3 className="font-bold text-dark mb-3">Quick actions</h3>
                <div className="space-y-2">
                  <Link href="/booking" className="flex items-center gap-3 p-3 rounded-xl bg-mint hover:bg-mint/70 transition">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                      <Sparkles size={16} />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-dark text-sm">New booking</p>
                      <p className="text-[11px] text-gray">Pickup in ~ 60s</p>
                    </div>
                    <ChevronRight size={16} className="text-gray" />
                  </Link>
                  <Link href="/dashboard/orders" className="flex items-center gap-3 p-3 rounded-xl border border-line hover:border-primary/40 transition">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Package size={16} />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-dark text-sm">All orders</p>
                      <p className="text-[11px] text-gray">View receipts &amp; track</p>
                    </div>
                    <ChevronRight size={16} className="text-gray" />
                  </Link>
                  <Link href="/dashboard/addresses" className="flex items-center gap-3 p-3 rounded-xl border border-line hover:border-primary/40 transition">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <MapPin size={16} />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-dark text-sm">Addresses</p>
                      <p className="text-[11px] text-gray">Saved pickup locations</p>
                    </div>
                    <ChevronRight size={16} className="text-gray" />
                  </Link>
                  <Link href="/dashboard/security" className="flex items-center gap-3 p-3 rounded-xl border border-line hover:border-primary/40 transition">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-primary-deep">
                      <Lock size={16} />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-dark text-sm">Security</p>
                      <p className="text-[11px] text-gray">Password &amp; sessions</p>
                    </div>
                    <ChevronRight size={16} className="text-gray" />
                  </Link>
                </div>
              </div>

              {/* App nudge */}
              <div className="surface-card overflow-hidden bg-soft-hero">
                <div className="flex items-stretch gap-4 p-5">
                  <div className="flex-shrink-0 w-[88px]">
                    <PhoneMockup className="w-[88px]" tone="dark" label="Wash Club rewards preview">
                      <RewardsAppScreen />
                    </PhoneMockup>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-primary-deep">
                      <Smartphone size={10} /> Get the app
                    </span>
                    <p className="mt-2 text-sm font-bold text-dark leading-tight">Track on the go, get push when your Pro arrives.</p>
                    <div className="mt-3 flex flex-col gap-1.5">
                      <a href="https://apps.apple.com/app/washlee" className="inline-flex items-center gap-1.5 rounded-full bg-dark px-2.5 py-1 text-[11px] font-bold text-white hover:bg-dark-soft transition">
                        <Apple size={12} /> App Store
                      </a>
                      <a href="https://play.google.com/store/apps/details?id=com.washlee" className="inline-flex items-center gap-1.5 rounded-full bg-dark px-2.5 py-1 text-[11px] font-bold text-white hover:bg-dark-soft transition">
                        <Play size={12} /> Google Play
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account snippet */}
              <div className="surface-card p-6">
                <h3 className="font-bold text-dark mb-3 flex items-center gap-2">
                  <Bell size={16} className="text-primary" /> Account
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center justify-between gap-2">
                    <span className="text-gray text-xs">Email</span>
                    <span className="text-dark font-semibold truncate">{user.email}</span>
                  </p>
                  <p className="flex items-center justify-between gap-2">
                    <span className="text-gray text-xs">Member since</span>
                    <span className="text-dark font-semibold">{new Date(user.created_at || '').toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</span>
                  </p>
                </div>
                <Link href="/faq" className="mt-4 inline-flex items-center gap-1 text-primary-deep hover:text-primary font-semibold text-sm">
                  Need help? Visit FAQ <ArrowRight size={14} />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
