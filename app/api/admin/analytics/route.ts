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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, adminId, dateRange = '30days' } = body

    switch (action) {
      case 'get_dashboard_summary': {
        const now = new Date()
        const startDate = new Date()

        if (dateRange === '7days') startDate.setDate(now.getDate() - 7)
        else if (dateRange === '30days') startDate.setDate(now.getDate() - 30)
        else if (dateRange === '90days') startDate.setDate(now.getDate() - 90)

        const [ordersResult, usersResult, inquiriesResult] = await Promise.all([
          runAdminAnalyticsQuery<Record<string, any>>('orders', (signal) =>
            getSupabaseClient().from('orders').select('created_at,total_price,user_id,status').abortSignal(signal)
          ),
          runAdminAnalyticsQuery<Record<string, any>>('users', (signal) =>
            getSupabaseClient().from('users').select('created_at,user_type,is_admin').abortSignal(signal)
          ),
          runAdminAnalyticsQuery<Record<string, any>>('inquiries', (signal) =>
            getSupabaseClient().from('inquiries').select('id,status').eq('status', 'pending').abortSignal(signal)
          ),
        ])

        const queryErrors = collectQueryErrors(ordersResult, usersResult, inquiriesResult)
        const ordersArray = ordersResult.data
        const recentOrders = ordersArray.filter((order: any) => new Date(order.created_at) >= startDate)
        const totalRevenue = ordersArray.reduce((sum, o: any) => sum + (o.total_price || 0), 0)
        const activeUsers = new Set(ordersArray.map((o: any) => o.user_id)).size
        const newSignups = usersResult.data.filter((u: any) => new Date(u.created_at) >= startDate).length

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

      case 'get_user_analytics': {
        const usersResult = await runAdminAnalyticsQuery<Record<string, any>>('users', (signal) =>
          getSupabaseClient().from('users').select('user_type,is_admin').abortSignal(signal)
        )
        const users = usersResult.data
        const customers = users.filter((u: any) => u.user_type === 'customer')
        const pros = users.filter((u: any) => u.user_type === 'pro')
        const admins = users.filter((u: any) => u.is_admin)

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
        const ordersResult = await runAdminAnalyticsQuery<Record<string, any>>('orders', (signal) =>
          getSupabaseClient().from('orders').select('status,total_price').abortSignal(signal)
        )

        const ordersArray = ordersResult.data
        const statuses = {
          pending: ordersArray.filter((o: any) => o.status === 'pending').length,
          confirmed: ordersArray.filter((o: any) => o.status === 'confirmed').length,
          'in-transit': ordersArray.filter((o: any) => o.status === 'in-transit').length,
          delivered: ordersArray.filter((o: any) => o.status === 'delivered').length,
          cancelled: ordersArray.filter((o: any) => o.status === 'cancelled').length
        }

        const revenue = ordersArray.reduce((sum, o: any) => sum + (o.total_price || 0), 0)
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
        const paymentsResult = await runAdminAnalyticsQuery<Record<string, any>>('payments', (signal) =>
          getSupabaseClient().from('payments').select('status,amount').abortSignal(signal)
        )

        const paymentsArray = paymentsResult.data
        const succeeded = paymentsArray.filter((p: any) => p.status === 'succeeded').length
        const failed = paymentsArray.filter((p: any) => p.status === 'failed').length
        const pending = paymentsArray.filter((p: any) => p.status === 'processing').length
        const totalProcessed = paymentsArray.reduce((sum, p: any) => sum + (p.amount || 0), 0)

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
