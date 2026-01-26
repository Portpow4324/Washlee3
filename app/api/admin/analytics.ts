import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, adminId, dateRange = '30days' } = body

    switch (action) {
      case 'get_dashboard_summary': {
        // Get dashboard summary stats
        const now = new Date()
        const startDate = new Date()

        // Set date range
        if (dateRange === '7days') startDate.setDate(now.getDate() - 7)
        else if (dateRange === '30days') startDate.setDate(now.getDate() - 30)
        else if (dateRange === '90days') startDate.setDate(now.getDate() - 90)

        // Get orders
        const ordersRef = collection(db, 'orders')
        const ordersSnapshot = await getDocs(ordersRef)
        const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        // Get recent orders within date range
        const recentOrders = allOrders.filter((order: any) => {
          const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
          return orderDate >= startDate
        })

        // Calculate metrics
        const totalRevenue = allOrders.reduce((sum: number, order: any) => {
          return sum + (order.pricing?.total || 0)
        }, 0)

        const totalOrders = allOrders.length
        const activeUsersSet = new Set()

        allOrders.forEach((order: any) => {
          if (order.customerId) activeUsersSet.add(order.customerId)
        })

        // Get users
        const usersRef = collection(db, 'users')
        const usersSnapshot = await getDocs(usersRef)
        const allUsers = usersSnapshot.docs.map(doc => doc.data())

        const newSignups = allUsers.filter((user: any) => {
          const created = user.createdAt?.toDate?.() || new Date(user.createdAt)
          return created >= startDate
        }).length

        // Get pro applications
        const prosRef = collection(db, 'users')
        const prosQuery = query(prosRef, where('userType', '==', 'pro'))
        const prosSnapshot = await getDocs(prosQuery)
        const pendingApplications = prosSnapshot.docs.filter((doc: any) => {
          const data = doc.data()
          return data.verificationStatus !== 'approved'
        }).length

        // Calculate averages
        const averageOrderValue = recentOrders.length > 0
          ? recentOrders.reduce((sum: number, order: any) => sum + (order.pricing?.total || 0), 0) / recentOrders.length
          : 0

        const refundedOrders = allOrders.filter((order: any) => order.status === 'refunded').length
        const refundRate = totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0

        // Find top pro
        const proEarnings = allOrders
          .filter((order: any) => order.proId)
          .reduce((acc: any, order: any) => {
            const proId = order.proId
            acc[proId] = (acc[proId] || 0) + (order.pricing?.total || 0)
            return acc
          }, {})

        const topProEarnings = Object.values(proEarnings).length > 0
          ? Math.max(...Object.values(proEarnings) as number[])
          : 0

        const analytics = {
          totalRevenue,
          totalOrders,
          activeUsers: activeUsersSet.size,
          newSignups,
          pendingApplications,
          refundRate,
          averageOrderValue,
          topProEarnings,
          dateRange,
          generatedAt: new Date().toISOString()
        }

        return NextResponse.json({ success: true, analytics })
      }

      case 'get_user_analytics': {
        // Get detailed user analytics
        const usersRef = collection(db, 'users')
        const usersSnapshot = await getDocs(usersRef)
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        const customers = users.filter((u: any) => u.userType === 'customer')
        const pros = users.filter((u: any) => u.userType === 'pro')

        return NextResponse.json({
          success: true,
          totalUsers: users.length,
          customers: customers.length,
          pros: pros.length,
          adminUsers: users.filter((u: any) => u.isAdmin).length
        })
      }

      case 'get_order_analytics': {
        // Get detailed order analytics
        const ordersRef = collection(db, 'orders')
        const ordersSnapshot = await getDocs(ordersRef)
        const orders = ordersSnapshot.docs.map(doc => doc.data())

        const statuses = {
          pending: orders.filter((o: any) => o.status === 'pending').length,
          accepted: orders.filter((o: any) => o.status === 'accepted').length,
          completed: orders.filter((o: any) => o.status === 'completed').length,
          cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
          refunded: orders.filter((o: any) => o.status === 'refunded').length
        }

        const revenue = orders.reduce((sum: number, order: any) => {
          return sum + (order.pricing?.total || 0)
        }, 0)

        const cancellationRate = (statuses.cancelled / orders.length) * 100

        return NextResponse.json({
          success: true,
          totalOrders: orders.length,
          statuses,
          totalRevenue: revenue,
          cancellationRate
        })
      }

      case 'get_payment_analytics': {
        // Get payment analytics
        const paymentsRef = collection(db, 'payments')
        const paymentsSnapshot = await getDocs(paymentsRef)
        const payments = paymentsSnapshot.docs.map(doc => doc.data())

        const succeeded = payments.filter((p: any) => p.status === 'succeeded').length
        const failed = payments.filter((p: any) => p.status === 'payment_failed').length
        const pending = payments.filter((p: any) => p.status === 'processing').length

        const totalProcessed = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

        return NextResponse.json({
          success: true,
          totalPayments: payments.length,
          succeeded,
          failed,
          pending,
          totalProcessed,
          successRate: payments.length > 0 ? (succeeded / payments.length) * 100 : 0
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
