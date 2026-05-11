'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DollarSign, Users, TrendingUp, ShoppingCart, ArrowUp, ChevronLeft } from 'lucide-react'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  completedOrders: number
  totalUsers: number
  averageOrderValue: number
  revenueGrowth: number
}

interface RevenueChartData {
  date: string
  revenue: number
}

interface OrderStatusItem {
  status: string
  count: number
}

interface ProStats {
  proId: string
  proName: string
  ordersCompleted: number
  totalEarnings: number
}

export default function AnalyticsDashboard() {
  const router = useRouter()
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalUsers: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
  })
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([])
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusItem[]>([])
  const [topPros, setTopPros] = useState<ProStats[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  const COLORS = ['#48C9B0', '#7FE3D3', '#E8FFFB', '#1f2d2b', '#6b7b78']

  const getDaysInRange = () => {
    return dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const days = getDaysInRange()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_price, created_at, pro_id, employees(name)')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const totalRevenue = (orders || []).reduce((sum: number, order: any) => sum + (order.total_price || 0), 0)
      const totalOrdersCount = orders?.length || 0
      const completedOrdersCount = (orders || []).filter((o: any) => o.status === 'delivered').length
      const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0

      const dailyRevenue: Record<string, number> = {}
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        dailyRevenue[dateStr] = 0
      }

      ;(orders || []).forEach((order: any) => {
        const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (orderDate in dailyRevenue) {
          dailyRevenue[orderDate] += order.total_price || 0
        }
      })

      const revenueChartData = Object.entries(dailyRevenue).map(([date, revenue]: [string, number]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
      }))

      const statusCount: Record<string, number> = {
        pending: 0,
        confirmed: 0,
        'in-transit': 0,
        delivered: 0,
        cancelled: 0,
      }
      ;(orders || []).forEach((order: any) => {
        const status = order.status || 'pending'
        if (status in statusCount) {
          statusCount[status]++
        }
      })

      const orderStatusChartData = Object.entries(statusCount).map(([status, count]: [string, number]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }))

      const proOrderCount: Record<string, { name: string; orders: number; revenue: number }> = {}
      ;(orders || []).forEach((order: any) => {
        if (order.pro_id) {
          const proId = order.pro_id
          const proName = order.employees?.name || 'Unknown'
          if (!proOrderCount[proId]) {
            proOrderCount[proId] = {
              name: proName,
              orders: 0,
              revenue: 0,
            }
          }
          proOrderCount[proId].orders++
          proOrderCount[proId].revenue += order.total_price || 0
        }
      })

      const topProsData = Object.entries(proOrderCount)
        .map(([proId, data]) => ({
          proId,
          proName: data.name,
          ordersCompleted: data.orders,
          totalEarnings: data.revenue,
        }))
        .sort((a, b) => b.ordersCompleted - a.ordersCompleted)
        .slice(0, 5)

      const midDate = new Date()
      midDate.setDate(midDate.getDate() - Math.floor(days / 2))
      const firstHalf = (orders || [])
        .filter((o: any) => new Date(o.created_at) < midDate)
        .reduce((sum: number, o: any) => sum + (o.total_price || 0), 0)
      const secondHalf = (orders || [])
        .filter((o: any) => new Date(o.created_at) >= midDate)
        .reduce((sum: number, o: any) => sum + (o.total_price || 0), 0)
      const revenueGrowth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0

      setAnalytics({
        totalRevenue,
        totalOrders: totalOrdersCount,
        completedOrders: completedOrdersCount,
        totalUsers: totalUsers || 0,
        averageOrderValue,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      })
      setRevenueData(revenueChartData)
      setOrderStatusData(orderStatusChartData)
      setTopPros(topProsData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasAdminAccess) return
    fetchAnalytics()
  }, [hasAdminAccess, dateRange])

  const completionRate = analytics.totalOrders > 0 
    ? (analytics.completedOrders / analytics.totalOrders * 100).toFixed(1) 
    : '0'

  if (checkingAdminAccess || loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray mb-6 hover:text-dark"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <h1 className="text-4xl font-bold text-dark mb-8">Analytics</h1>

        <div className="flex gap-2 mb-8">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold ${
                dateRange === range ? 'bg-primary text-white' : 'bg-white border border-gray'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card hoverable>
            <p className="text-gray text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-dark">${analytics.totalRevenue.toFixed(2)}</p>
          </Card>
          <Card hoverable>
            <p className="text-gray text-sm">Total Orders</p>
            <p className="text-3xl font-bold text-dark">{analytics.totalOrders}</p>
          </Card>
          <Card hoverable>
            <p className="text-gray text-sm">Completion</p>
            <p className="text-3xl font-bold text-dark">{completionRate}%</p>
          </Card>
          <Card hoverable>
            <p className="text-gray text-sm">Total Users</p>
            <p className="text-3xl font-bold text-dark">{analytics.totalUsers}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="font-bold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#48C9B0" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="font-bold mb-4">Order Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={orderStatusData} dataKey="count" outerRadius={80}>
                  {COLORS.map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <h3 className="font-bold mb-4">Top Pros</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Pro</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topPros.map((pro) => (
                <tr key={pro.proId} className="border-b">
                  <td className="py-2">{pro.proName}</td>
                  <td className="text-right">{pro.ordersCompleted}</td>
                  <td className="text-right">${pro.totalEarnings.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
