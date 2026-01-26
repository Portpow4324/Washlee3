'use client'

import Card from '@/components/Card'
import Button from '@/components/Button'
import Link from 'next/link'
import { Truck, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

interface Order {
  id: string
  date: string
  status: 'in_washing' | 'in_delivery' | 'delivered' | 'cancelled'
  weight: string
  cost: number
  items: string[]
}

export default function Orders() {
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Fetch orders from Firebase
  useEffect(() => {
    if (!user || loading) return

    setOrdersLoading(true)
    const ordersRef = collection(db, 'orders')
    const q = query(ordersRef, where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: Order[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          fetchedOrders.push({
            id: doc.id,
            date: data.date || new Date().toLocaleDateString(),
            status: data.status,
            weight: data.weight || 'N/A',
            cost: data.cost || 0,
            items: data.items || [],
          })
        })

        // Sort by date, most recent first
        fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setOrders(fetchedOrders)
        setOrdersLoading(false)
      },
      (error) => {
        console.error('Error fetching orders:', error)
        setOrdersLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, loading])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_washing':
        return { color: 'bg-blue-100 text-blue-700', label: 'In Washing', icon: Truck }
      case 'delivered':
        return { color: 'bg-green-100 text-green-700', label: 'Delivered', icon: CheckCircle }
      case 'cancelled':
        return { color: 'bg-red-100 text-red-700', label: 'Cancelled', icon: XCircle }
      default:
        return { color: 'bg-gray-100 text-gray-700', label: 'Pending', icon: Truck }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">Order History</h1>
        <p className="text-gray">View and manage all your laundry orders</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const badge = getStatusBadge(order.status)
          const BadgeIcon = badge.icon
          return (
            <Card key={order.id} hoverable>
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <p className="font-bold text-lg text-dark">{order.id}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${badge.color}`}>
                      <BadgeIcon size={14} />
                      {badge.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray font-semibold mb-1">DATE</p>
                      <p className="font-semibold text-dark">{order.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray font-semibold mb-1">WEIGHT</p>
                      <p className="font-semibold text-dark">{order.weight}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray font-semibold mb-1">ITEMS</p>
                      <p className="font-semibold text-dark text-sm">{order.items.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray font-semibold mb-1">COST</p>
                      <p className="font-bold text-primary text-lg">${order.cost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-col">
                  <Link href={`/tracking/${order.id}`}>
                    <Button size="sm" variant="outline">
                      Track
                    </Button>
                  </Link>
                  <button className="px-4 py-2 text-primary font-semibold hover:bg-mint rounded-lg transition text-sm">
                    Reorder
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <button className="px-4 py-2 border border-gray rounded-lg text-dark font-semibold hover:bg-light transition">
          Previous
        </button>
        <button className="px-4 py-2 bg-primary text-white rounded-lg font-semibold">1</button>
        <button className="px-4 py-2 border border-gray rounded-lg text-dark font-semibold hover:bg-light transition">
          2
        </button>
        <button className="px-4 py-2 border border-gray rounded-lg text-dark font-semibold hover:bg-light transition">
          Next
        </button>
      </div>
    </div>
  )
}
