'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { 
  Package, TrendingUp, DollarSign, Zap, Settings, MapPin, ChevronRight, Lock
} from 'lucide-react'

const CheckCircle = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>

interface Order {
  id: string
  status: string
  created_at: string
  total_price: number
  weight: number
  delivery_address: string
  scheduled_pickup_date?: string
  pro_id?: string
  employees?: { name: string; rating: number } | null
}

export default function CustomerDashboard() {
  const { user, userData, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'in-transit':
      case 'in_washing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-700'
      case 'pending-payment':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Load orders
  useEffect(() => {
    if (loading || !user) {
      return
    }

    const loadOrders = async () => {
      try {
        setOrdersLoading(true)
        console.log('[Dashboard] Fetching orders for customer:', user.id)

        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            created_at,
            total_price,
            weight,
            delivery_address,
            scheduled_pickup_date,
            pro_id,
            employees(name, rating)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (fetchError) {
          console.error('[Dashboard] Error fetching orders:', fetchError)
          setError('Failed to load orders')
          setOrdersLoading(false)
          return
        }

        // Transform data to match Order interface
        const transformedOrders = (data || []).map((order: any) => ({
          ...order,
          employees: Array.isArray(order.employees) && order.employees.length > 0 
            ? order.employees[0] 
            : null
        }))

        setOrders(transformedOrders as Order[])
        console.log('[Dashboard] Loaded orders:', transformedOrders)
        setOrdersLoading(false)
      } catch (err) {
        console.error('[Dashboard] Error:', err)
        setError('Error loading orders')
        setOrdersLoading(false)
      }
    }

    loadOrders()

    const subscription = supabase
      .channel(`customer:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => {
          console.log('[Dashboard] Real-time update received')
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, loading])

  const activeOrders = orders.filter(o => 
    ['pending-payment', 'confirmed', 'in-transit', 'in_washing'].includes(o.status)
  ).length
  const completedOrders = orders.filter(o => o.status === 'completed').length
  const totalSpent = orders.reduce((sum, order) => sum + (order.total_price || 0), 0)
  
  const stats = [
    { label: 'Active Orders', value: activeOrders.toString(), icon: Package },
    { label: 'Completed', value: completedOrders.toString(), icon: CheckCircle },
    { label: 'Total Spent', value: '$' + totalSpent.toFixed(2), icon: DollarSign },
    { label: 'Savings', value: '$' + (totalSpent * 0.1).toFixed(2), icon: TrendingUp },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-gray font-semibold">Loading your dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <div className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-bold text-dark mb-2">Welcome back, {userData?.name || 'Customer'}</h1>
            <p className="text-xl text-gray">Here's your account overview</p>
          </div>
          <Link
            href="/dashboard/settings"
            className="p-3 bg-primary hover:bg-accent text-white rounded-full transition shadow-lg hover:shadow-xl"
            title="Account Settings"
          >
            <Settings size={24} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg p-6 border border-gray/10 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray text-sm font-semibold mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-dark">{stat.value}</p>
                  </div>
                  <div className="p-3 bg-mint rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-dark">Recent Orders</h2>
                <Link href="/dashboard/orders" className="text-primary hover:text-accent font-semibold flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                  </div>
                ) : orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      href={`/dashboard/orders/${order.id}`}
                      className="flex items-center justify-between p-4 bg-light rounded-lg border border-gray/10 hover:border-primary/30 hover:bg-mint/20 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-dark flex items-center gap-2">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                          {order.employees && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {order.employees.name}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray mt-1">
                          {new Date(order.created_at).toLocaleDateString('en-AU')} • {order.weight}kg
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-dark">${(order.total_price || 0).toFixed(2)}</p>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full inline-block mt-1 ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/-/g, ' ').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray font-semibold mb-4">No orders yet</p>
                    <Link href="/booking" className="inline-block px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition">
                      Schedule First Pickup
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray/10 p-6">
              <h3 className="font-bold text-dark mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/dashboard/orders" className="block w-full p-3 bg-primary text-white rounded-lg font-semibold text-center hover:bg-primary/90 transition">
                  All Orders
                </Link>
                <Link href="/dashboard/addresses" className="block w-full p-3 bg-mint text-dark rounded-lg font-semibold text-center hover:bg-accent/20 transition flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> Addresses
                </Link>
                <Link href="/dashboard/security" className="block w-full p-3 bg-light border-2 border-primary text-dark rounded-lg font-semibold text-center hover:bg-mint transition flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" /> Security
                </Link>
                <Link href="/booking" className="block w-full p-3 border-2 border-primary text-primary rounded-lg font-semibold text-center hover:bg-mint transition">
                  New Order
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20 p-6">
              <h3 className="font-bold text-dark mb-3">Account</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray">Email:</span> <span className="text-dark font-semibold truncate">{user.email}</span></p>
                <p><span className="text-gray">Since:</span> <span className="text-dark font-semibold">{new Date(user.created_at || '').toLocaleDateString('en-AU')}</span></p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray/10 p-6">
              <h3 className="font-bold text-dark mb-2">Need Help?</h3>
              <p className="text-gray text-sm mb-4">Contact us anytime</p>
              <Link href="/faq" className="text-primary hover:text-accent font-semibold text-sm">
                Visit FAQ →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
