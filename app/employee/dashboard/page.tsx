'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  DollarSign,
  Package,
  Briefcase,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

interface Order {
  id: string
  customer: string
  status: string
  weight: string
  pickup: string
  earnings: string
  address: string
  orderId?: string
}

interface Stats {
  todayEarnings: number
  activeOrders: number
  availableJobs: number
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-blue-100 text-blue-800',
  washing: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
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
  if (status === 'pending-pickup' || status === 'pending_payment') return AlertCircle
  return Clock
}

export default function EmployeeDashboardPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [stats, setStats] = useState<Stats>({
    todayEarnings: 0,
    activeOrders: 0,
    availableJobs: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return

    setHasCheckedAuth(true)

    if (!user) {
      router.push('/auth/employee-signin')
      return
    }

    const employeeMode = localStorage.getItem('employeeMode')
    if (!employeeMode) {
      localStorage.setItem('employeeMode', 'true')
      sessionStorage.setItem('employeeMode', 'true')
    }

    const fetchData = async () => {
      try {
        setDataLoading(true)

        const { data: earningsData } = await supabase
          .from('pro_earnings')
          .select('earnings_amount, created_at')
          .eq('pro_id', user.id)

        const today = new Date().toDateString()
        const todayEarnings = (earningsData || [])
          .filter((e: { created_at: string }) => new Date(e.created_at).toDateString() === today)
          .reduce((sum: number, e: { earnings_amount?: number }) => sum + (e.earnings_amount || 0), 0)

        const { data: jobsData } = await supabase
          .from('pro_jobs')
          .select('id, status')
          .is('pro_id', null)
          .eq('status', 'available')

        const availableJobs = (jobsData || []).length

        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            created_at,
            total_price,
            items,
            pickup_address,
            user_id,
            users:user_id (name)
          `)
          .eq('pro_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        const activeOrders = (ordersData || []).filter(
          (o: { status: string }) => o.status !== 'completed'
        ).length

        const transformedOrders: Order[] = (ordersData || []).slice(0, 5).map((order: {
          id: string
          status: string
          created_at: string
          total_price?: number
          items?: unknown
          pickup_address?: string
          users?: { name?: string } | { name?: string }[] | null
        }) => {
          let weight: string | number = '0'
          try {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
            weight = (items as { weight?: string | number })?.weight ?? '0'
          } catch {
            weight = '0'
          }

          const usersField = order.users
          const customer = Array.isArray(usersField)
            ? usersField[0]?.name || 'Unknown'
            : usersField?.name || 'Unknown'

          return {
            id: order.id,
            customer,
            status: order.status,
            weight: `${weight} kg`,
            pickup: new Date(order.created_at).toLocaleDateString('en-AU', {
              month: 'short',
              day: 'numeric',
            }),
            earnings: `$${(order.total_price || 0).toFixed(2)}`,
            address: order.pickup_address || '—',
            orderId: order.id,
          }
        })

        setRecentOrders(transformedOrders)
        setStats({ todayEarnings, activeOrders, availableJobs })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
    const refreshInterval = setInterval(fetchData, 10000)
    return () => clearInterval(refreshInterval)
  }, [user, loading, router, hasCheckedAuth])

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-soft-mint flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const firstName = userData?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  const statTiles = [
    {
      label: 'Today’s earnings',
      value: `$${stats.todayEarnings.toFixed(2)}`,
      icon: DollarSign,
      hint: stats.todayEarnings === 0 ? 'No completed jobs yet today' : 'Commission from completed jobs',
    },
    {
      label: 'Active orders',
      value: stats.activeOrders.toString(),
      icon: Package,
      hint: stats.activeOrders === 0 ? 'Nothing in progress' : 'In your queue right now',
    },
    {
      label: 'Available jobs',
      value: stats.availableJobs.toString(),
      icon: Briefcase,
      hint: stats.availableJobs === 0 ? 'No jobs in your area right now' : 'Open jobs near you',
    },
  ]

  return (
    <div className="min-h-screen bg-soft-mint flex flex-col">
      <main className="flex-1 container-page py-10 space-y-8">
        <header className="space-y-1">
          <span className="pill">
            <Sparkles size={14} /> Pro dashboard
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark mt-3">
            Welcome back, {firstName}.
          </h1>
          <p className="text-gray text-sm sm:text-base">
            Independent contractor — paid commission per completed order.
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statTiles.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="surface-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs uppercase tracking-wider font-bold text-gray-soft">
                    {stat.label}
                  </p>
                  <div className="w-9 h-9 rounded-xl bg-mint flex items-center justify-center">
                    <Icon size={16} className="text-primary-deep" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-dark">{stat.value}</p>
                <p className="text-xs text-gray mt-1">{stat.hint}</p>
              </div>
            )
          })}
        </div>

        {/* Recent + quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark inline-flex items-center gap-2">
                <Package size={20} className="text-primary-deep" />
                Recent orders
              </h2>
              <Link href="/employee/orders" className="text-sm font-semibold text-primary-deep hover:underline">
                View all
              </Link>
            </div>

            {dataLoading ? (
              <div className="surface-card p-10 text-center text-gray">
                <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent mx-auto mb-3" />
                <p className="text-sm">Loading orders…</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="surface-card p-10 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-3">
                  <Package size={20} className="text-primary-deep" />
                </div>
                <h3 className="font-bold text-dark mb-1">No orders yet</h3>
                <p className="text-sm text-gray mb-5">Accept your first job to see it here.</p>
                <Link href="/employee/jobs" className="btn-primary inline-flex">
                  Browse jobs
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentOrders.map((order) => {
                  const Icon = statusIcon(order.status)
                  const badge = STATUS_BADGE[order.status] ?? 'bg-line text-dark'
                  return (
                    <li key={order.id} className="surface-card p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${badge}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-mono text-sm font-semibold text-dark">{order.id.slice(0, 8)}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
                              {formatStatus(order.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray">
                            {order.customer} · {order.weight}
                          </p>
                          {order.address && order.address !== '—' && (
                            <p className="text-xs text-gray-soft mt-0.5 truncate">{order.address}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-primary-deep">{order.earnings}</p>
                          <p className="text-xs text-gray-soft mt-0.5">{order.pickup}</p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <aside className="space-y-4">
            <h2 className="text-xl font-bold text-dark">Quick actions</h2>
            <div className="space-y-3">
              <Link
                href="/employee/jobs"
                className="surface-card p-5 flex items-center gap-4 hover:border-primary transition group"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center flex-shrink-0">
                  <Briefcase size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-dark">Find jobs</p>
                  <p className="text-xs text-gray">
                    {stats.availableJobs > 0
                      ? `${stats.availableJobs} open in your area`
                      : 'Open the feed'}
                  </p>
                </div>
                <ArrowRight size={16} className="text-gray-soft group-hover:text-primary-deep transition" />
              </Link>

              <Link
                href="/employee/earnings"
                className="surface-card p-5 flex items-center gap-4 hover:border-primary transition group"
              >
                <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center flex-shrink-0">
                  <DollarSign size={18} className="text-primary-deep" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-dark">View earnings</p>
                  <p className="text-xs text-gray">Weekly &amp; payout history</p>
                </div>
                <ArrowRight size={16} className="text-gray-soft group-hover:text-primary-deep transition" />
              </Link>

              <Link
                href="/employee/settings"
                className="surface-card p-5 flex items-center gap-4 hover:border-primary transition group"
              >
                <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} className="text-primary-deep" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-dark">Update profile</p>
                  <p className="text-xs text-gray">Availability &amp; documents</p>
                </div>
                <ArrowRight size={16} className="text-gray-soft group-hover:text-primary-deep transition" />
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
