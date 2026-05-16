'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ArrowLeft } from 'lucide-react'

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

interface AnalyticsApiResponse {
  success?: boolean
  degraded?: boolean
  queryErrors?: string[]
  analytics?: AnalyticsData
  revenueData?: RevenueChartData[]
  orderStatusData?: OrderStatusItem[]
  topPros?: ProStats[]
  error?: string
}

export default function AnalyticsDashboard() {
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
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const COLORS = ['#2EAB95', '#48C9B0', '#7FE3D3', '#E8FFFB', '#9BA8A6']

  const getDaysInRange = () => {
    return dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setAnalyticsError(null)

      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_analytics_dashboard',
          adminId: 'password-admin',
          dateRange: `${getDaysInRange()}days`,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as AnalyticsApiResponse
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analytics could not be loaded.')
      }

      setAnalytics(data.analytics || {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        totalUsers: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
      })
      setRevenueData(data.revenueData || [])
      setOrderStatusData(data.orderStatusData || [])
      setTopPros(data.topPros || [])

      if (data.degraded && data.queryErrors?.length) {
        setAnalyticsError(data.queryErrors[0])
      }
    } catch (error) {
      setAnalyticsError(error instanceof Error ? error.message : 'Analytics could not be loaded.')
      setRevenueData([])
      setOrderStatusData([])
      setTopPros([])
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
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3 text-gray-600">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Loading analytics…</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-3 hover:text-primary"
        >
          <ArrowLeft size={14} />
          Control center
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 mb-2">Analytics</h1>
        <p className="text-sm text-gray-600 mb-8">
          Live revenue, order, and Pro performance from Supabase. AUD totals.
        </p>

        {analyticsError && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Analytics loaded with limited data: {analyticsError}
          </div>
        )}

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
                <Line type="monotone" dataKey="revenue" stroke="#2EAB95" strokeWidth={2} />
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
          <h3 className="font-bold mb-4 text-gray-950">Top Pros</h3>
          {topPros.length === 0 ? (
            <p className="text-sm text-gray-500">No completed Pro orders in this range.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-700">
                  <th className="text-left py-2 font-semibold">Pro</th>
                  <th className="text-right font-semibold">Orders</th>
                  <th className="text-right font-semibold">Revenue (AUD)</th>
                </tr>
              </thead>
              <tbody>
                {topPros.map((pro) => (
                  <tr key={pro.proId} className="border-b border-gray-100">
                    <td className="py-2 text-gray-950">{pro.proName}</td>
                    <td className="text-right text-gray-700">{pro.ordersCompleted}</td>
                    <td className="text-right font-semibold text-gray-950">${pro.totalEarnings.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  )
}
