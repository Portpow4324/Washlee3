'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Plus, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

interface Order {
  id: string
  status: 'in_washing' | 'in_delivery' | 'delivered' | 'cancelled'
  pickupTime: string
  estimatedDelivery: string
  weight: string
  cost: number
  date: string
}

export default function Dashboard() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [thisMonthOrders, setThisMonthOrders] = useState(0)
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Fetch orders from Firebase when user is loaded
  useEffect(() => {
    if (!user || loading) return

    setOrdersLoading(true)
    const ordersRef = collection(db, 'orders')
    const q = query(ordersRef, where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = []
        let total = 0
        let thisMonth = 0
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()

        snapshot.forEach((doc) => {
          const data = doc.data()
          orders.push({
            id: doc.id,
            status: data.status,
            pickupTime: data.pickupTime,
            estimatedDelivery: data.estimatedDelivery,
            weight: data.weight,
            cost: data.cost,
            date: data.date,
          })

          total += data.cost || 0

          // Count this month's orders
          if (data.date) {
            const orderDate = new Date(data.date)
            if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
              thisMonth += 1
            }
          }
        })

        // Sort by date, most recent first
        orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Get only active orders (not delivered or cancelled)
        const active = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')

        setActiveOrders(active)
        setTotalOrders(orders.length)
        setTotalSpent(total)
        setThisMonthOrders(thisMonth)
        setOrdersLoading(false)
      },
      (error) => {
        console.error('Error fetching orders:', error)
        setOrdersLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, loading])

  const stats = [
    { label: 'Total Orders', value: totalOrders.toString(), icon: CheckCircle, color: 'text-primary' },
    { label: 'This Month', value: thisMonthOrders.toString(), icon: TrendingUp, color: 'text-accent' },
    { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, icon: TrendingUp, color: 'text-green-500' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_washing':
        return 'bg-blue-100 text-blue-700'
      case 'in_delivery':
        return 'bg-yellow-100 text-yellow-700'
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_washing':
        return 'In Washing'
      case 'in_delivery':
        return 'In Delivery'
      case 'delivered':
        return 'Delivered'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-dark mb-2">Dashboard</h1>
        <p className="text-gray">Welcome back, {userData?.name}! Here's your laundry summary.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} hoverable>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray text-sm font-semibold mb-1">{stat.label}</p>
                  <p className="text-4xl font-bold text-dark">{stat.value}</p>
                </div>
                <Icon size={32} className={`${stat.color} opacity-30`} />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Active Orders */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-dark">Active Orders</h2>
          <Link href="/booking">
            <Button className="flex items-center gap-2">
              <Plus size={20} />
              New Order
            </Button>
          </Link>
        </div>

        {activeOrders.length > 0 ? (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <Card key={order.id} hoverable>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <p className="font-bold text-dark text-lg">{order.id}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray text-xs mb-1">Picked Up</p>
                        <p className="font-semibold text-dark">{order.pickupTime}</p>
                      </div>
                      <div>
                        <p className="text-gray text-xs mb-1">Est. Delivery</p>
                        <p className="font-semibold text-dark">{order.estimatedDelivery}</p>
                      </div>
                      <div>
                        <p className="text-gray text-xs mb-1">Weight</p>
                        <p className="font-semibold text-dark">{order.weight}</p>
                      </div>
                      <div>
                        <p className="text-gray text-xs mb-1">Cost</p>
                        <p className="font-semibold text-dark">{order.cost}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/tracking/${order.id}`}>
                      <Button variant="outline" size="sm">
                        Track
                      </Button>
                    </Link>
                    <button className="px-4 py-2 text-primary font-semibold hover:bg-mint rounded-lg transition">
                      View
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <Clock size={48} className="mx-auto text-gray opacity-30 mb-4" />
              <p className="text-gray font-semibold mb-4">No active orders</p>
              <Link href="/booking">
                <Button>Schedule Your First Pickup</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/addresses">
            <Card hoverable className="cursor-pointer h-full">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📍</div>
                <p className="font-bold text-dark mb-2">Manage Addresses</p>
                <p className="text-gray text-sm">Add or update delivery addresses</p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/payments">
            <Card hoverable className="cursor-pointer h-full">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💳</div>
                <p className="font-bold text-dark mb-2">Payment Methods</p>
                <p className="text-gray text-sm">Manage your saved cards</p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/subscriptions">
            <Card hoverable className="cursor-pointer h-full">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔄</div>
                <p className="font-bold text-dark mb-2">Subscriptions</p>
                <p className="text-gray text-sm">Manage your subscription plan</p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/orders">
            <Card hoverable className="cursor-pointer h-full">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📦</div>
                <p className="font-bold text-dark mb-2">Order History</p>
                <p className="text-gray text-sm">View all past orders</p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/security">
            <Card hoverable className="cursor-pointer h-full">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔐</div>
                <p className="font-bold text-dark mb-2">Security</p>
                <p className="text-gray text-sm">Change password & settings</p>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/support">
            <Card hoverable className="cursor-pointer h-full">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💬</div>
                <p className="font-bold text-dark mb-2">Get Support</p>
                <p className="text-gray text-sm">Contact our support team</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
