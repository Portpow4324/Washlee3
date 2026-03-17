'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { authenticatedFetch } from '@/lib/firebaseAuthClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { Package, TrendingUp, Star, Calendar, DollarSign, Zap, Settings } from 'lucide-react'

interface Order {
  id: string
  status: string
  date: string
  total: number
  weight: string
}

interface FirebaseOrder {
  id?: string
  orderId?: string
  status: string
  createdAt: any
  estimatedWeight?: number
  subtotal?: number
}

export default function Dashboard() {
  const { user, userData, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Load orders for customers (layout already checked auth)
  useEffect(() => {
    if (loading || !user) {
      return
    }

    // Load orders for customers
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true)
        console.log('[Dashboard] Fetching orders for user:', user.uid)
        
        const response = await authenticatedFetch(`/api/orders/user/${user.uid}`, {
          method: 'GET',
        })
        
        console.log('[Dashboard] Orders API response status:', response.status)
        
        if (!response.ok) {
          console.warn('[Dashboard] API returned non-OK status:', response.status)
          setOrders([])
          setOrdersLoading(false)
          return
        }
        
        const data = await response.json()
        console.log('[Dashboard] Raw API data:', data)
        console.log('[Dashboard] Orders array:', data.orders)
        
        const fetchedOrders: Order[] = (data.orders || []).slice(0, 5).map((order: FirebaseOrder) => {
          console.log('[Dashboard] Processing order:', order)
          console.log('[Dashboard] Order createdAt:', order.createdAt, 'type:', typeof order.createdAt)
          
          // Handle Firestore timestamp
          let dateStr = 'N/A'
          if (order.createdAt) {
            try {
              if (order.createdAt.seconds) {
                // Firestore timestamp object
                dateStr = new Date(order.createdAt.seconds * 1000).toLocaleDateString()
              } else if (order.createdAt._seconds) {
                // Alternative Firestore timestamp format
                dateStr = new Date(order.createdAt._seconds * 1000).toLocaleDateString()
              } else if (typeof order.createdAt === 'number') {
                // Unix timestamp
                dateStr = new Date(order.createdAt).toLocaleDateString()
              } else if (order.createdAt.toDate) {
                // Firestore timestamp with toDate method
                dateStr = new Date(order.createdAt.toDate()).toLocaleDateString()
              } else if (typeof order.createdAt === 'string') {
                // ISO string
                dateStr = new Date(order.createdAt).toLocaleDateString()
              } else {
                dateStr = new Date(order.createdAt).toLocaleDateString()
              }
            } catch (e) {
              console.error('[Dashboard] Error parsing date:', e, 'createdAt value:', order.createdAt)
              dateStr = 'N/A'
            }
          }
          
          const processedOrder: Order = {
            id: order.id || order.orderId || '',
            status: order.status || 'pending',
            date: dateStr,
            total: order.subtotal || 0,
            weight: (order.estimatedWeight || 0) + ' kg'
          }
          console.log('[Dashboard] Processed order:', processedOrder)
          return processedOrder
        })
        
        console.log('[Dashboard] Fetched orders:', fetchedOrders)
        setOrders(fetchedOrders)
      } catch (error) {
        console.warn('Error fetching orders, showing empty state:', error)
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [user, loading])

  // Calculate stats from real orders
  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  
  const stats = [
    { label: 'Total Orders', value: totalOrders.toString(), icon: Package },
    { label: 'This Month', value: '$' + totalSpent.toFixed(2), icon: DollarSign },
    { label: 'Rating', value: '—', icon: Star },
    { label: 'Active Plan', value: userData?.userType === 'pro' ? 'Pro' : 'Standard', icon: Zap }
  ]

  return (
    <>
      <main className="min-h-screen bg-light pt-8 pb-12">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section with Settings Icon */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-dark mb-2">Welcome back, {userData?.name || 'Customer'}</h1>
              <p className="text-lg text-gray">Here's your account overview</p>
            </div>
            <Link
              href="/dashboard/settings"
              className="p-3 bg-primary hover:bg-accent text-white rounded-full transition shadow-lg hover:shadow-xl"
              title="Account Settings"
            >
              <Settings size={24} />
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} hoverable>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray text-sm font-semibold mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-dark">{stat.value}</p>
                    </div>
                    <Icon size={24} className="text-primary opacity-50" />
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <h2 className="text-2xl font-bold text-dark mb-6">Recent Orders</h2>
                <div className="space-y-4">
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner />
                    </div>
                  ) : orders.length > 0 ? (
                    orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-light rounded-lg border border-gray/20 hover:border-primary/30 transition">
                        <div className="flex-1">
                          <p className="font-semibold text-dark">{order.id}</p>
                          <p className="text-sm text-gray">{order.date} • {order.weight}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-dark">${order.total.toFixed(2)}</p>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'in_transit' || order.status === 'in_washing' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray font-semibold mb-4">No orders on your account yet</p>
                      <a href="/booking" className="inline-block px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition">
                        Schedule Your First Pickup
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <h3 className="text-lg font-bold text-dark mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a href="/dashboard/orders" className="block w-full p-3 bg-primary text-white rounded-lg font-semibold text-center hover:bg-primary/90 transition">
                    View All Orders
                  </a>
                  <a href="/dashboard/addresses" className="block w-full p-3 bg-mint text-dark rounded-lg font-semibold text-center hover:bg-accent transition">
                    Manage Addresses
                  </a>
                  <a href="/dashboard/subscriptions" className="block w-full p-3 border-2 border-primary text-primary rounded-lg font-semibold text-center hover:bg-mint transition">
                    Subscriptions
                  </a>
                  <a href="/dashboard/support" className="block w-full p-3 border-2 border-gray text-dark rounded-lg font-semibold text-center hover:bg-light transition">
                    Get Support
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
