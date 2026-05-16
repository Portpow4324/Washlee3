import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time issues
let supabase: SupabaseClient | null = null
const ADMIN_ANALYTICS_QUERY_TIMEOUT_MS = 3_500

function getSupabaseClient() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url || !key) {
      throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    }
    
    supabase = createClient(url, key)
  }
  return supabase
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return String(error)
}

async function runAdminAnalyticsQuery<T>(
  label: string,
  query: (signal: AbortSignal) => PromiseLike<{ data: T[] | null; error: { message?: string } | null }>
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ADMIN_ANALYTICS_QUERY_TIMEOUT_MS)

  try {
    const result = await query(controller.signal)
    if (result.error) {
      return { data: [] as T[], error: `${label}: ${result.error.message || 'query failed'}` }
    }
    return { data: Array.isArray(result.data) ? result.data : [], error: null }
  } catch (error) {
    return { data: [] as T[], error: `${label}: ${errorMessage(error)}` }
  } finally {
    clearTimeout(timeout)
  }
}

function collectQueryErrors(...results: Array<{ error: string | null }>) {
  return results.map((result) => result.error).filter(Boolean)
}

type AdminAnalyticsOrder = {
  id?: string
  status?: string | null
  total_price?: number | null
  created_at?: string | null
  pro_id?: string | null
}

type AdminAnalyticsUser = {
  id?: string
}

type AdminAnalyticsEmployee = {
  id?: string
  name?: string | null
}

type DashboardOrder = {
  created_at?: string | null
  total_price?: number | null
  user_id?: string | null
  status?: string | null
}

type DashboardUser = {
  created_at?: string | null
  user_type?: string | null
  is_admin?: boolean | null
}

type InquiryRow = {
  id?: string
  status?: string | null
}

type UserAnalyticsRow = {
  user_type?: string | null
  is_admin?: boolean | null
}

type OrderAnalyticsRow = {
  status?: string | null
  total_price?: number | null
}

type PaymentAnalyticsRow = {
  status?: string | null
  amount?: number | null
}

function getRangeStart(dateRange: string) {
  const now = new Date()
  const startDate = new Date()

  if (dateRange === '7days') startDate.setDate(now.getDate() - 7)
  else if (dateRange === '90days') startDate.setDate(now.getDate() - 90)
  else startDate.setDate(now.getDate() - 30)

  return startDate
}

function createDailyRevenue(orders: AdminAnalyticsOrder[], days: number) {
  const dailyRevenue: Record<string, number> = {}

  for (let i = Math.min(days, 30) - 1; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dailyRevenue[dateStr] = 0
  }

  orders.forEach((order) => {
    if (!order.created_at) return

    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (orderDate in dailyRevenue) {
      dailyRevenue[orderDate] += order.total_price || 0
    }
  })

  return Object.entries(dailyRevenue).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }))
}

function createStatusData(orders: AdminAnalyticsOrder[]) {
  const statusCount: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    'in-transit': 0,
    delivered: 0,
    cancelled: 0,
  }

  orders.forEach((order) => {
    const normalizedStatus = (order.status || 'pending').replace('_', '-')
    if (normalizedStatus in statusCount) {
      statusCount[normalizedStatus] += 1
    }
  })

  return Object.entries(statusCount).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: string; dateRange?: string }
    const { action, dateRange = '30days' } = body

    switch (action) {
      case 'get_dashboard_summary': {
        const now = new Date()
        const startDate = new Date()

        if (dateRange === '7days') startDate.setDate(now.getDate() - 7)
        else if (dateRange === '30days') startDate.setDate(now.getDate() - 30)
        else if (dateRange === '90days') startDate.setDate(now.getDate() - 90)

        const [ordersResult, usersResult, inquiriesResult] = await Promise.all([
          runAdminAnalyticsQuery<DashboardOrder>('orders', (signal) =>
            getSupabaseClient().from('orders').select('created_at,total_price,user_id,status').abortSignal(signal)
          ),
          runAdminAnalyticsQuery<DashboardUser>('users', (signal) =>
            getSupabaseClient().from('users').select('created_at,user_type,is_admin').abortSignal(signal)
          ),
          runAdminAnalyticsQuery<InquiryRow>('inquiries', (signal) =>
            getSupabaseClient().from('inquiries').select('id,status').eq('status', 'pending').abortSignal(signal)
          ),
        ])

        const queryErrors = collectQueryErrors(ordersResult, usersResult, inquiriesResult)
        const ordersArray = ordersResult.data
        const totalRevenue = ordersArray.reduce((sum, order) => sum + (order.total_price || 0), 0)
        const activeUsers = new Set(ordersArray.map((order) => order.user_id).filter(Boolean)).size
        const newSignups = usersResult.data.filter((user) => user.created_at && new Date(user.created_at) >= startDate).length

        return NextResponse.json({
          success: true,
          degraded: queryErrors.length > 0,
          queryErrors,
          analytics: {
            totalRevenue,
            totalOrders: ordersArray.length,
            activeUsers,
            newSignups,
            pendingApplications: inquiriesResult.data.length,
            refundRate: 0,
            averageOrderValue: ordersArray.length > 0 ? totalRevenue / ordersArray.length : 0,
            topProEarnings: 0,
            dateRange,
            generatedAt: new Date().toISOString()
          }
        })
      }

      case 'get_analytics_dashboard': {
        const startDate = getRangeStart(dateRange)
        const days = dateRange === '7days' ? 7 : dateRange === '90days' ? 90 : 30

        const [ordersResult, usersResult] = await Promise.all([
          runAdminAnalyticsQuery<AdminAnalyticsOrder>('orders', (signal) =>
            getSupabaseClient()
              .from('orders')
              .select('id,status,total_price,created_at,pro_id')
              .gte('created_at', startDate.toISOString())
              .order('created_at', { ascending: false })
              .abortSignal(signal)
          ),
          runAdminAnalyticsQuery<AdminAnalyticsUser>('users', (signal) =>
            getSupabaseClient().from('users').select('id').abortSignal(signal)
          ),
        ])

        const proIds = Array.from(new Set(ordersResult.data.map((order) => order.pro_id).filter(Boolean))) as string[]
        const employeesResult = proIds.length > 0
          ? await runAdminAnalyticsQuery<AdminAnalyticsEmployee>('employees', (signal) =>
              getSupabaseClient().from('employees').select('id,name').in('id', proIds).abortSignal(signal)
            )
          : { data: [] as AdminAnalyticsEmployee[], error: null }

        const employeeNames = new Map(
          employeesResult.data
            .filter((employee) => employee.id)
            .map((employee) => [employee.id as string, employee.name || 'Unknown Pro'])
        )
        const orders = ordersResult.data
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0)
        const totalOrders = orders.length
        const completedOrders = orders.filter((order) => ['delivered', 'completed'].includes(order.status || '')).length
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        const proOrderCount: Record<string, { name: string; orders: number; revenue: number }> = {}
        orders.forEach((order) => {
          if (!order.pro_id) return

          if (!proOrderCount[order.pro_id]) {
            proOrderCount[order.pro_id] = {
              name: employeeNames.get(order.pro_id) || `Pro ${order.pro_id.slice(0, 8)}`,
              orders: 0,
              revenue: 0,
            }
          }

          proOrderCount[order.pro_id].orders += 1
          proOrderCount[order.pro_id].revenue += order.total_price || 0
        })

        const topPros = Object.entries(proOrderCount)
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
        const firstHalf = orders
          .filter((order) => order.created_at && new Date(order.created_at) < midDate)
          .reduce((sum, order) => sum + (order.total_price || 0), 0)
        const secondHalf = orders
          .filter((order) => order.created_at && new Date(order.created_at) >= midDate)
          .reduce((sum, order) => sum + (order.total_price || 0), 0)
        const revenueGrowth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0
        const queryErrors = collectQueryErrors(ordersResult, usersResult, employeesResult)

        return NextResponse.json({
          success: true,
          degraded: queryErrors.length > 0,
          queryErrors,
          analytics: {
            totalRevenue,
            totalOrders,
            completedOrders,
            totalUsers: usersResult.data.length,
            averageOrderValue,
            revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          },
          revenueData: createDailyRevenue(orders, days),
          orderStatusData: createStatusData(orders),
          topPros,
        })
      }

      case 'get_user_analytics': {
        const usersResult = await runAdminAnalyticsQuery<UserAnalyticsRow>('users', (signal) =>
          getSupabaseClient().from('users').select('user_type,is_admin').abortSignal(signal)
        )
        const users = usersResult.data
        const customers = users.filter((user) => user.user_type === 'customer')
        const pros = users.filter((user) => user.user_type === 'pro')
        const admins = users.filter((user) => user.is_admin)

        return NextResponse.json({
          success: true,
          degraded: Boolean(usersResult.error),
          queryErrors: usersResult.error ? [usersResult.error] : [],
          totalUsers: users.length,
          customers: customers.length,
          pros: pros.length,
          adminUsers: admins.length
        })
      }

      case 'get_order_analytics': {
        const ordersResult = await runAdminAnalyticsQuery<OrderAnalyticsRow>('orders', (signal) =>
          getSupabaseClient().from('orders').select('status,total_price').abortSignal(signal)
        )

        const ordersArray = ordersResult.data
        const statuses = {
          pending: ordersArray.filter((order) => order.status === 'pending').length,
          confirmed: ordersArray.filter((order) => order.status === 'confirmed').length,
          'in-transit': ordersArray.filter((order) => order.status === 'in-transit').length,
          delivered: ordersArray.filter((order) => order.status === 'delivered').length,
          cancelled: ordersArray.filter((order) => order.status === 'cancelled').length
        }

        const revenue = ordersArray.reduce((sum, order) => sum + (order.total_price || 0), 0)
        const cancellationRate = ordersArray.length > 0 ? (statuses.cancelled / ordersArray.length) * 100 : 0

        return NextResponse.json({
          success: true,
          degraded: Boolean(ordersResult.error),
          queryErrors: ordersResult.error ? [ordersResult.error] : [],
          totalOrders: ordersArray.length,
          statuses,
          totalRevenue: revenue,
          cancellationRate
        })
      }

      case 'get_payment_analytics': {
        const paymentsResult = await runAdminAnalyticsQuery<PaymentAnalyticsRow>('payments', (signal) =>
          getSupabaseClient().from('payments').select('status,amount').abortSignal(signal)
        )

        const paymentsArray = paymentsResult.data
        const succeeded = paymentsArray.filter((payment) => payment.status === 'succeeded').length
        const failed = paymentsArray.filter((payment) => payment.status === 'failed').length
        const pending = paymentsArray.filter((payment) => payment.status === 'processing').length
        const totalProcessed = paymentsArray.reduce((sum, payment) => sum + (payment.amount || 0), 0)

        return NextResponse.json({
          success: true,
          degraded: Boolean(paymentsResult.error),
          queryErrors: paymentsResult.error ? [paymentsResult.error] : [],
          totalPayments: paymentsArray.length,
          succeeded,
          failed,
          pending,
          totalProcessed,
          successRate: paymentsArray.length > 0 ? (succeeded / paymentsArray.length) * 100 : 0
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
