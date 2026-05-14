'use client'

import { useEffect, useState } from 'react'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  activeOrders: number
  newUsersThisMonth: number
  averageOrderValue: number
  activeUsers: number
  completedOrders: number
  refundRate: number
}

interface RecentOrder {
  id: string
  customer_name: string
  status: string
  price: number
  created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  'in-transit': 'bg-blue-100 text-blue-800',
  in_transit: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-blue-100 text-blue-800',
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-amber-100 text-amber-800',
  pending_payment: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-700',
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatStatus(status: string) {
  const cleaned = status.replace(/[_-]/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export default function AdminDashboardPage() {
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    newUsersThisMonth: 0,
    averageOrderValue: 0,
    activeUsers: 0,
    completedOrders: 0,
    refundRate: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string>('')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAdminAccess) return

    const loadStats = async () => {
      try {
        setStatsLoading(true)
        setLoadError(null)

        const [metricsResponse, ordersResponse] = await Promise.all([
          fetch('/api/admin/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_dashboard_summary',
              adminId: 'password-admin',
            }),
          }),
          fetch('/api/admin/orders', { cache: 'no-store' }),
        ])

        const metricsResult = await metricsResponse.json()
        const ordersResult = await ordersResponse.json()
        const metrics = metricsResult.analytics || {}
        const recentOrdersData: Array<{
          id: string
          status: string
          total_price?: number
          created_at: string
          users?: { name?: string } | { name?: string }[] | null
        }> = ordersResult.orders || []
        const activeOrders = recentOrdersData.filter(
          (order) => !['delivered', 'cancelled', 'completed'].includes(order.status)
        ).length
        const completedOrders = recentOrdersData.filter(
          (order) => order.status === 'delivered' || order.status === 'completed'
        ).length

        const transformed: RecentOrder[] = recentOrdersData
          .map((order) => {
            const usersField = order.users
            const customer = Array.isArray(usersField)
              ? usersField[0]?.name || 'Customer'
              : usersField?.name || 'Customer'
            return {
              id: order.id,
              customer_name: customer,
              status: order.status,
              price: order.total_price || 0,
              created_at: order.created_at,
            }
          })
          .slice(0, 10)

        setStats({
          totalUsers: metrics.activeUsers || metrics.newSignups || 0,
          totalOrders: metrics.totalOrders || 0,
          totalRevenue: metrics.totalRevenue || 0,
          activeOrders,
          newUsersThisMonth: metrics.newSignups || 0,
          averageOrderValue: metrics.averageOrderValue || 0,
          activeUsers: metrics.activeUsers || 0,
          completedOrders,
          refundRate: metrics.refundRate || 0,
        })

        setRecentOrders(transformed)
        setLastSync(new Date().toLocaleTimeString('en-AU'))
        setStatsLoading(false)
      } catch (error) {
        console.error('[AdminDashboard] Error:', error)
        setLoadError('Could not load dashboard data. Try a manual sync.')
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [hasAdminAccess])

  const handleSync = async () => {
    try {
      setSyncing(true)
      setLoadError(null)

      const response = await fetch('/api/admin/sync-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin',
        },
        body: JSON.stringify({ force: true }),
      })

      const result = await response.json()

      if (result.success) {
        setStats({
          totalUsers: result.metrics.totalUsers,
          totalOrders: result.metrics.totalOrders,
          totalRevenue: result.metrics.totalRevenue,
          activeOrders: result.metrics.activeOrders,
          newUsersThisMonth: result.metrics.newUsersThisMonth,
          averageOrderValue: result.metrics.averageOrderValue,
          activeUsers: result.metrics.activeUsers,
          completedOrders: result.metrics.completedOrders,
          refundRate: result.metrics.refundRate,
        })
        setLastSync(new Date().toLocaleTimeString('en-AU'))
      } else {
        setLoadError(result.error || 'Sync did not complete.')
      }
    } catch (error) {
      console.error('[AdminDashboard] Sync error:', error)
      setLoadError(error instanceof Error ? error.message : 'Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  const statCards = [
    { label: 'Active users (30d)', value: stats.activeUsers.toLocaleString(), icon: Users },
    { label: 'Total orders', value: stats.totalOrders.toLocaleString(), icon: Package },
    { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign },
    { label: 'Active orders', value: stats.activeOrders.toLocaleString(), icon: Activity },
    { label: 'Completed', value: stats.completedOrders.toLocaleString(), icon: TrendingUp },
    { label: 'Avg order value', value: formatCurrency(stats.averageOrderValue), icon: BarChart3 },
  ]

  if (checkingAdminAccess) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <Spinner />
        </main>
        <Footer />
      </>
    )
  }

  if (!hasAdminAccess) return null

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-12">
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-2 hover:text-primary"
              >
                <ArrowLeft size={14} />
                Control center
              </Link>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-950">Operational dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time platform metrics &amp; recent orders.{' '}
                {lastSync && <span className="text-gray-500">Last sync: {lastSync}</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 transition disabled:opacity-60"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync data'}
            </button>
          </div>

          {loadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{loadError}</span>
            </div>
          )}

          {/* Stats */}
          {statsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {statCards.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div
                      key={stat.label}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                          {stat.label}
                        </p>
                        <Icon size={14} className="text-primary-deep" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-950">{stat.value}</p>
                    </div>
                  )
                })}
              </div>

              {/* Recent + actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <section className="lg:col-span-2 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-950">Recent orders</h2>
                    <Link
                      href="/admin/orders"
                      className="text-sm font-semibold text-primary-deep hover:underline"
                    >
                      Manage all
                    </Link>
                  </div>

                  {recentOrders.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {recentOrders.map((order) => {
                        const badge = STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-700'
                        return (
                          <li key={order.id}>
                            <Link
                              href={`/tracking/${order.id}`}
                              className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-gray-50 transition"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-950 truncate">
                                  {order.customer_name}
                                </p>
                                <p className="text-xs text-gray-500 font-mono truncate">
                                  {order.id.slice(0, 8)}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-gray-950">
                                  ${order.price.toFixed(2)}
                                </p>
                                <span
                                  className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}
                                >
                                  {formatStatus(order.status)}
                                </span>
                              </div>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                      <Package size={20} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No orders yet.</p>
                    </div>
                  )}
                </section>

                <aside className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-950 mb-3">Quick actions</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Manage orders', href: '/admin/orders' },
                      { label: 'Manage users', href: '/admin/users' },
                      { label: 'Pro applications', href: '/admin/pro-applications' },
                      { label: 'View analytics', href: '/admin/analytics' },
                      { label: 'Pro payouts', href: '/admin/payouts' },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:border-primary hover:bg-mint hover:text-primary-deep transition"
                      >
                        {link.label}
                        <ArrowRight size={14} className="text-gray-400" />
                      </Link>
                    ))}
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2">
                      Service health
                    </p>
                    <p className="text-xs text-gray-600">
                      Detailed service status (database, auth, storage, alerts) is on the{' '}
                      <Link href="/admin/monitoring" className="text-primary-deep font-semibold hover:underline">
                        Monitoring
                      </Link>{' '}
                      tab. We don&rsquo;t fake green checks here.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
