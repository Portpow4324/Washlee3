'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { authenticatedFetch } from '@/lib/firebaseAuthClient'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { Package, ChevronRight, MapPin, DollarSign, Clock } from 'lucide-react'
import Button from '@/components/Button'

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

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')

  // Load orders for customers
  useEffect(() => {
    if (!user) {
      return
    }

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true)
        console.log('[OrdersPage] Fetching orders for user:', user.uid)
        
        const response = await authenticatedFetch(`/api/orders/user/${user.uid}`, {
          method: 'GET',
        })
        
        console.log('[OrdersPage] Orders API response status:', response.status)
        
        if (!response.ok) {
          console.warn('[OrdersPage] API returned non-OK status:', response.status)
          setOrdersError('Failed to load orders')
          setOrders([])
          setOrdersLoading(false)
          return
        }
        
        const data = await response.json()
        console.log('[OrdersPage] Raw API data:', data)
        
        const fetchedOrders: Order[] = (data.orders || []).map((order: FirebaseOrder) => {
          console.log('[OrdersPage] Processing order:', order)
          
          // Handle Firestore timestamp
          let dateStr = 'N/A'
          if (order.createdAt) {
            try {
              if (order.createdAt.seconds) {
                dateStr = new Date(order.createdAt.seconds * 1000).toLocaleDateString()
              } else if (order.createdAt._seconds) {
                dateStr = new Date(order.createdAt._seconds * 1000).toLocaleDateString()
              } else if (typeof order.createdAt === 'number') {
                dateStr = new Date(order.createdAt).toLocaleDateString()
              } else if (typeof order.createdAt === 'string') {
                dateStr = new Date(order.createdAt).toLocaleDateString()
              }
            } catch (e) {
              console.error('[OrdersPage] Error parsing date:', e)
              dateStr = 'N/A'
            }
          }
          
          return {
            id: order.id || order.orderId || '',
            status: order.status || 'pending',
            date: dateStr,
            total: order.subtotal || 0,
            weight: (order.estimatedWeight || 0) + ' kg'
          }
        })
        
        console.log('[OrdersPage] Fetched orders:', fetchedOrders)
        setOrders(fetchedOrders)
      } catch (error) {
        console.warn('[OrdersPage] Error fetching orders:', error)
        setOrdersError('Failed to load orders')
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  return (
    <main className="min-h-screen bg-light pt-8 pb-12">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">My Orders</h1>
          <p className="text-lg text-gray">View all your laundry orders and track their status</p>
        </div>

        {/* Orders List */}
        <Card>
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : ordersError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                <p>{ordersError}</p>
              </div>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="p-4 bg-light rounded-lg border border-gray/20 hover:border-primary/30 transition">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-dark text-lg">Order #{order.id.slice(-8)}</p>
                      <p className="text-sm text-gray">{order.date}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'in_transit' || order.status === 'in_washing' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-y border-gray/20">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="text-sm text-dark font-medium">{order.weight}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-sm text-dark font-semibold">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    View Details <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray font-semibold mb-4">No orders yet</p>
                <p className="text-gray text-sm mb-6">You haven't placed any orders. Start by scheduling your first laundry pickup!</p>
                <div className="flex justify-center">
                  <Button href="/booking" variant="primary">Schedule Your First Pickup</Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}
