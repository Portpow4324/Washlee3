'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Button from '@/components/Button'
import Link from 'next/link'
import { Package, MapPin, Calendar, DollarSign, Eye, ChevronRight } from 'lucide-react'

interface Order {
  id: string
  service_type: string
  status: string
  weight: string
  price: number
  created_at: string
  pickup_address?: string
  delivery_address?: string
  delivery_speed?: string
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading || !user) return

    const loadOrders = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        // Add timeout to prevent infinite loading
        const queryTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Orders query timeout')), 10000)
        )

        const ordersPromise = supabase
          .from('orders')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        const { data, error: queryError } = await Promise.race([
          ordersPromise,
          queryTimeout as any
        ]) as any

        if (queryError) {
          console.error('[Orders] Query error:', queryError.message)
          // Show empty state instead of error
          setOrders([])
        } else {
          setOrders(data || [])
        }
      } catch (err: any) {
        console.error('[Orders] Error loading orders:', err.message)
        // On timeout or error, just show empty orders
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1f2d2b] mb-4">Sign In Required</h1>
            <p className="text-[#6b7b78] mb-6">Please sign in to view your orders</p>
            <Link href="/auth/login" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
              Sign In →
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1f2d2b] mb-2">My Orders</h1>
            <p className="text-[#6b7b78]">Track and manage your laundry orders</p>
          </div>

          {error && (
            <Card className="p-6 mb-8 bg-red-50 border border-red-200">
              <p className="text-red-700">{error}</p>
            </Card>
          )}

          {orders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package size={48} className="mx-auto mb-4 text-[#6b7b78]" />
              <h2 className="text-xl font-semibold text-[#1f2d2b] mb-2">No Orders Yet</h2>
              <p className="text-[#6b7b78] mb-6">Get started by booking your first laundry pickup</p>
              <Link href="/booking">
                <Button size="lg">Book Now</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link key={order.id} href={`/tracking?orderId=${order.id}`}>
                  <Card className="p-6 hover:shadow-lg transition cursor-pointer">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      {/* Order ID & Status */}
                      <div>
                        <p className="text-xs text-[#6b7b78] uppercase tracking-wide mb-1">Order ID</p>
                        <p className="font-semibold text-[#1f2d2b] font-mono text-sm">{order.id.slice(0, 8)}</p>
                        <div className="mt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status.replace(/_/g, ' ').charAt(0).toUpperCase() + order.status.replace(/_/g, ' ').slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Service & Weight */}
                      <div>
                        <p className="text-xs text-[#6b7b78] uppercase tracking-wide mb-1">Service</p>
                        <p className="font-semibold text-[#1f2d2b] capitalize">{order.service_type}</p>
                        <p className="text-sm text-[#6b7b78]">{order.weight} kg</p>
                      </div>

                      {/* Date */}
                      <div>
                        <p className="text-xs text-[#6b7b78] uppercase tracking-wide mb-1">Ordered</p>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-[#48C9B0]" />
                          <p className="font-semibold text-[#1f2d2b]">
                            {new Date(order.created_at).toLocaleDateString('en-AU', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Speed */}
                      <div>
                        <p className="text-xs text-[#6b7b78] uppercase tracking-wide mb-1">Delivery</p>
                        <p className="font-semibold text-[#1f2d2b] capitalize">
                          {order.delivery_speed || 'Standard'}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="text-right">
                        <p className="text-xs text-[#6b7b78] uppercase tracking-wide mb-1">Total</p>
                        <p className="text-2xl font-bold text-[#48C9B0] mb-3">
                          ${order.price.toFixed(2)}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[#48C9B0] group-hover:translate-x-1 transition">
                          View <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Help Section */}
          <Card className="mt-12 p-6 bg-[#E8FFFB]">
            <h3 className="font-semibold text-[#1f2d2b] mb-3">Need Help?</h3>
            <p className="text-sm text-[#6b7b78] mb-4">
              Can't find your order or have questions about a delivery?
            </p>
            <Link href="/support">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
