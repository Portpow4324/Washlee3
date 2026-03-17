'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { MapPin, Clock, DollarSign, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'

interface Order {
  id: string
  customerName?: string
  totalAmount: number
  status: string
  createdAt?: any
  pickupLocation?: string
  deliveryLocation?: string
  details?: string
  items?: any[]
}

export default function ProOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (!user) return

    const fetchOrders = async () => {
      try {
        setLoading(true)
        
        // Fetch orders from user's collection
        const ordersRef = collection(db, 'users', user.uid, 'orders')
        const ordersSnapshot = await getDocs(ordersRef)
        const fetchedOrders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[]
        
        setOrders(fetchedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0)
          const dateB = b.createdAt?.toDate?.() || new Date(0)
          return dateB.getTime() - dateA.getTime()
        }))
      } catch (error) {
        console.error('Error fetching orders:', error)
        // Use demo data
        setOrders([
          {
            id: 'ORD-2024-001',
            customerName: 'Sarah Mitchell',
            totalAmount: 45.00,
            status: 'completed',
            pickupLocation: 'Downtown Ave, Apt 204',
            deliveryLocation: '123 Main St',
            details: '2 shirts, 3 pants, 1 jacket',
            items: [
              { name: 'Shirts', qty: 2, price: 10 },
              { name: 'Pants', qty: 3, price: 15 },
              { name: 'Jacket', qty: 1, price: 20 }
            ]
          },
          {
            id: 'ORD-2024-002',
            customerName: 'John Davis',
            totalAmount: 52.50,
            status: 'in-progress',
            pickupLocation: 'West Side Plaza, Suite 100',
            deliveryLocation: '456 Oak St',
            details: '5 shirts, 2 pants, bedding',
            items: [
              { name: 'Shirts', qty: 5, price: 25 },
              { name: 'Pants', qty: 2, price: 15 },
              { name: 'Bedding', qty: 1, price: 12.50 }
            ]
          },
          {
            id: 'ORD-2024-003',
            customerName: 'Emily Rodriguez',
            totalAmount: 38.00,
            status: 'pending',
            pickupLocation: 'Midtown Shopping Center',
            deliveryLocation: '789 Pine St',
            details: '3 shirts, 2 pants, 1 sweater',
            items: [
              { name: 'Shirts', qty: 3, price: 15 },
              { name: 'Pants', qty: 2, price: 15 },
              { name: 'Sweater', qty: 1, price: 8 }
            ]
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'users', user!.uid, 'orders', orderId)
      await updateDoc(orderRef, { status: newStatus })
      
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ))
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus)

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in-progress': return 'bg-blue-100 text-blue-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-dark">Orders</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">Customer Orders</h1>
        <p className="text-gray">Manage and track all customer orders</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'in-progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === status
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-dark hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            {filteredOrders.length > 0 && ` (${filteredOrders.length})`}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray mb-4" />
            <p className="text-gray font-semibold">No orders found</p>
            <p className="text-sm text-gray mt-1">Check back soon for new orders to complete</p>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition">
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="w-full p-6 text-left hover:bg-light/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <p className="font-bold text-dark text-lg">{order.customerName || 'Customer'}</p>
                        <p className="text-sm text-gray font-mono">{order.id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        <div>
                          <p className="text-xs text-gray">Pickup</p>
                          <p className="text-sm font-semibold text-dark">{order.pickupLocation || 'TBA'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary" />
                        <div>
                          <p className="text-xs text-gray">Amount</p>
                          <p className="text-sm font-bold text-primary">${order.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-primary" />
                        <div>
                          <p className="text-xs text-gray">Status</p>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronDown 
                    size={24} 
                    className={`text-primary transition ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-200 p-6 bg-light/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-bold text-dark mb-3">Order Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray">Pickup Location:</span> <span className="font-semibold">{order.pickupLocation}</span></p>
                        <p><span className="text-gray">Delivery Location:</span> <span className="font-semibold">{order.deliveryLocation}</span></p>
                        <p><span className="text-gray">Items:</span> <span className="font-semibold">{order.details}</span></p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-dark mb-3">Pricing</h4>
                      <div className="space-y-2 text-sm">
                        <p className="flex justify-between">
                          <span className="text-gray">Subtotal:</span>
                          <span className="font-semibold">${(order.totalAmount * 0.85).toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray">Service Fee:</span>
                          <span className="font-semibold">${(order.totalAmount * 0.15).toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                          <span className="font-bold">Your Earnings:</span>
                          <span className="font-bold text-primary">${(order.totalAmount * 0.85).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  <div>
                    <h4 className="font-bold text-dark mb-3">Update Status</h4>
                    <div className="flex gap-2 flex-wrap">
                      {['pending', 'in-progress', 'completed'].map((status) => (
                        <Button
                          key={status}
                          variant={order.status === status ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, status)}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
