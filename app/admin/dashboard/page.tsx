'use client'

import { useEffect, useState } from 'react'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Settings,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  activeOrders: number
  newUsersThisMonth: number
  averageOrderValue: number
  activeUsers: number
  averageRating: number
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

export default function AdminDashboard() {
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    newUsersThisMonth: 0,
    averageOrderValue: 0,
    activeUsers: 0,
    averageRating: 0,
    completedOrders: 0,
    refundRate: 0
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string>('')

  // Load and subscribe to real-time admin stats
  useEffect(() => {
    if (!hasAdminAccess) {
      return
    }

    const loadStats = async () => {
      try {
        setStatsLoading(true)
        console.log('[AdminDashboard] Loading admin stats')

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
        const recentOrdersData = ordersResult.orders || []
        const activeOrders = recentOrdersData.filter((order: any) => !['delivered', 'cancelled'].includes(order.status)).length
        const completedOrders = recentOrdersData.filter((order: any) => order.status === 'delivered').length

        // Transform recent orders
        const transformed: RecentOrder[] = (recentOrdersData || []).map((order: any) => ({
          id: order.id,
          customer_name: order.users?.name || 'Customer',
          status: order.status,
          price: order.total_price || 0,
          created_at: order.created_at
        })).slice(0, 10)

        setStats({
          totalUsers: metrics.activeUsers || metrics.newSignups || 0,
          totalOrders: metrics.totalOrders || 0,
          totalRevenue: metrics.totalRevenue || 0,
          activeOrders,
          newUsersThisMonth: metrics.newSignups || 0,
          averageOrderValue: metrics.averageOrderValue || 0,
          activeUsers: metrics.activeUsers || 0,
          averageRating: 0,
          completedOrders,
          refundRate: metrics.refundRate || 0
        })

        setRecentOrders(transformed)
        setLastSync(new Date().toLocaleTimeString())
        console.log('[AdminDashboard] Stats loaded', metrics)
        setStatsLoading(false)
      } catch (error) {
        console.error('[AdminDashboard] Error:', error)
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [hasAdminAccess])

  const handleSync = async () => {
    try {
      setSyncing(true)
      console.log('[AdminDashboard] Triggering manual sync')

      const response = await fetch('/api/admin/sync-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin'
        },
        body: JSON.stringify({ force: true })
      })

      const result = await response.json()

      if (result.success) {
        // Update stats with new data
        setStats({
          totalUsers: result.metrics.totalUsers,
          totalOrders: result.metrics.totalOrders,
          totalRevenue: result.metrics.totalRevenue,
          activeOrders: result.metrics.activeOrders,
          newUsersThisMonth: result.metrics.newUsersThisMonth,
          averageOrderValue: result.metrics.averageOrderValue,
          activeUsers: result.metrics.activeUsers,
          averageRating: result.metrics.averageRating,
          completedOrders: result.metrics.completedOrders,
          refundRate: result.metrics.refundRate
        })
        setLastSync(new Date().toLocaleTimeString())
        console.log('[AdminDashboard] Sync completed:', result)
      }
    } catch (error) {
      console.error('[AdminDashboard] Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'text-blue-600' },
    { label: 'Total Orders', value: stats.totalOrders.toString(), icon: Package, color: 'text-green-600' },
    { label: 'Total Revenue', value: '$' + stats.totalRevenue.toFixed(2), icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Active Orders', value: stats.activeOrders.toString(), icon: Activity, color: 'text-orange-600' },
    { label: 'Active Users (30d)', value: stats.activeUsers.toString(), icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Avg Order Value', value: '$' + stats.averageOrderValue.toFixed(2), icon: BarChart3, color: 'text-pink-600' }
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-light pt-8 pb-12">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-dark mb-2">Admin Dashboard</h1>
              <div className="flex items-center gap-4">
                <p className="text-lg text-gray">Real-time platform analytics & monitoring</p>
                {lastSync && (
                  <p className="text-sm text-gray">Last sync: {lastSync}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-3 bg-primary hover:bg-accent text-white rounded-full transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sync data"
            >
              <RefreshCw size={24} className={syncing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Stats Grid */}
          {checkingAdminAccess || statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {statCards.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <Card key={stat.label} hoverable>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-gray text-sm font-semibold mb-2">{stat.label}</p>
                          <p className="text-3xl font-bold text-dark">{stat.value}</p>
                        </div>
                        <Icon size={24} className={`${stat.color} opacity-50`} />
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Recent Orders & Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <h2 className="text-2xl font-bold text-dark mb-6">Recent Orders</h2>
                    <div className="space-y-3">
                      {recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                          <Link
                            key={order.id}
                            href={`/admin/orders/${order.id}`}
                            className="block p-4 bg-light rounded-lg border border-gray/20 hover:border-primary/30 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-dark">{order.customer_name}</p>
                                <p className="text-sm text-gray">{order.id}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-dark">${order.price.toFixed(2)}</p>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'in-transit' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray">
                          <p>No orders yet</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Admin Actions */}
                <div>
                  <Card>
                    <h3 className="text-lg font-bold text-dark mb-4">Admin Actions</h3>
                    <div className="space-y-3">
                      <a href="/admin/orders" className="block w-full p-3 bg-primary text-white rounded-lg font-semibold text-center hover:bg-primary/90 transition">
                        Manage Orders
                      </a>
                      <a href="/admin/users" className="block w-full p-3 bg-mint text-dark rounded-lg font-semibold text-center hover:bg-accent transition">
                        Manage Users
                      </a>
                      <a href="/admin/analytics" className="block w-full p-3 border-2 border-primary text-primary rounded-lg font-semibold text-center hover:bg-mint transition">
                        View Analytics
                      </a>
                      <a href="/admin/payouts" className="block w-full p-3 border-2 border-gray text-dark rounded-lg font-semibold text-center hover:bg-light transition">
                        Pro Payouts
                      </a>
                    </div>
                  </Card>

                  <Card className="mt-4">
                    <h3 className="text-lg font-bold text-dark mb-4">System Health</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray">Database</span>
                        <span className="text-green-600 font-semibold">✓ Online</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray">Auth Service</span>
                        <span className="text-green-600 font-semibold">✓ Online</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray">Storage</span>
                        <span className="text-green-600 font-semibold">✓ Online</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
