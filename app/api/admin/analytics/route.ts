import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

        const { data: allOrders = [] } = await supabase.from('orders').select('*')
        const { data: allUsers = [] } = await supabase.from('users').select('*')
        const { data: inquiries = [] } = await supabase.from('inquiries').select('*').eq('status', 'pending')

        const ordersArray = allOrders || []
        const recentOrders = ordersArray.filter((order: any) => new Date(order.created_at) >= startDate)
        const totalRevenue = ordersArray.reduce((sum, o: any) => sum + (o.total_price || 0), 0)
        const activeUsers = new Set(ordersArray.map((o: any) => o.user_id)).size
        const newSignups = (allUsers || []).filter((u: any) => new Date(u.created_at) >= startDate).length

        return NextResponse.json({
          success: true,
          analytics: {
            totalRevenue,
            totalOrders: ordersArray.length,
            activeUsers,
            newSignups,
            pendingApplications: inquiries?.length || 0,
            refundRate: 0,
            averageOrderValue: ordersArray.length > 0 ? totalRevenue / ordersArray.length : 0,
            topProEarnings: 0,
            dateRange,
            generatedAt: new Date().toISOString()
          }
        })
      }

      case 'get_user_analytics': {
        const { data: users = [] } = await supabase.from('users').select('*')
        const customers = (users || []).filter((u: any) => u.user_type === 'customer')
        const pros = (users || []).filter((u: any) => u.user_type === 'pro')
        const admins = (users || []).filter((u: any) => u.is_admin)

        return NextResponse.json({
          success: true,
          totalUsers: users?.length || 0,
          customers: customers.length,
          pros: pros.length,
          adminUsers: admins.length
        })
      }

      case 'get_order_analytics': {
        const { data: orders = [] } = await supabase.from('orders').select('*')

        const ordersArray = orders || []
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
          totalOrders: orders?.length || 0,
          statuses,
          totalRevenue: revenue,
          cancellationRate
        })
      }

      case 'get_payment_analytics': {
        const { data: payments = [] } = await supabase.from('payments').select('*')

        const paymentsArray = payments || []
        const succeeded = paymentsArray.filter((p: any) => p.status === 'succeeded').length
        const failed = paymentsArray.filter((p: any) => p.status === 'failed').length
        const pending = paymentsArray.filter((p: any) => p.status === 'processing').length
        const totalProcessed = paymentsArray.reduce((sum, p: any) => sum + (p.amount || 0), 0)

        return NextResponse.json({
          success: true,
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
