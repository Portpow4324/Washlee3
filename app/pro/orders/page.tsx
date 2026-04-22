'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { MapPin, Calendar, DollarSign } from 'lucide-react'

interface Order {
  id: string
  status: string
  customer_name: string
  total_price: number
  created_at: string
  scheduled_pickup_date?: string
  delivery_address?: string
  weight?: number
}

export default function ProOrdersPage() {
  const { user, userData, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading || !user) return

    if (userData?.user_type !== 'pro') {
      setOrdersLoading(false)
      return
    }

    const loadOrders = async () => {
      try {
        setOrdersLoading(true)
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('pro_id', user.id)
          .order('created_at', { ascending: false })

        if (ordersError) {
          setError('Failed to load orders')
          setOrdersLoading(false)
          return
        }

        // Parse items JSON and extract weight
        const ordersWithWeight = (ordersData || []).map((order: any) => ({
          ...order,
          weight: order.items ? (JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items))?.weight || 0) : 0
        }))

        setOrders(ordersWithWeight)
        setOrdersLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('Error loading orders')
        setOrdersLoading(false)
      }
    }

    loadOrders()
  }, [user, userData, loading])

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#1f2d2b] mb-8">My Orders</h1>

          {ordersLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#48C9B0] mx-auto mb-4"></div>
              <p className="text-[#6b7b78]">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-[#1f2d2b]">Order #{order.id.slice(0, 8)}</h3>
                      <p className="text-[#6b7b78] text-sm">{order.customer_name}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                      {order.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {order.scheduled_pickup_date && (
                      <p className="flex items-center gap-2 text-[#6b7b78]">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.scheduled_pickup_date).toLocaleDateString('en-AU')}
                      </p>
                    )}
                    {order.weight && (
                      <p className="text-[#6b7b78]">{order.weight}kg</p>
                    )}
                    {order.delivery_address && (
                      <p className="flex items-center gap-2 text-[#6b7b78] col-span-2">
                        <MapPin className="w-4 h-4" />
                        {order.delivery_address}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[#1f2d2b] font-semibold">${order.total_price?.toFixed(2) || '0.00'}</span>
                    <p className="text-xs text-[#6b7b78]">{new Date(order.created_at).toLocaleDateString('en-AU')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-[#6b7b78] mb-6">No orders yet</p>
              <Link href="/pro/jobs" className="text-[#48C9B0] hover:text-[#7FE3D3] font-semibold">
                → Check available jobs
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
