'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ChevronLeft, Search, Filter, MoreVertical } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  user_id: string
  status: string
  total_price: number
  created_at: string
  customer_name?: string
  user_email?: string
  delivery_address?: any
  tracking_code?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          status,
          total_price,
          created_at,
          delivery_address,
          tracking_code,
          users(name, email)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      const transformed: Order[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        status: item.status,
        total_price: item.total_price || 0,
        created_at: item.created_at,
        customer_name: item.users?.name || 'Unknown',
        user_email: item.users?.email,
        delivery_address: item.delivery_address,
        tracking_code: item.tracking_code
      }))

      setOrders(transformed)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'confirmed':
        return 'bg-blue-100 text-blue-700'
      case 'in-transit':
        return 'bg-purple-100 text-purple-700'
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const filtered = orders
    .filter(order => {
      const matchesSearch =
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return b.total_price - a.total_price
      }
    })

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <div className="bg-white border-b border-gray/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-light rounded-lg transition"
            >
              <ChevronLeft size={24} className="text-dark" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-dark">Orders Management</h1>
              <p className="text-gray text-sm">View and manage all customer orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray" />
            <input
              type="text"
              placeholder="Search by customer name, email, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'price')}
            className="px-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="date">Sort: Date (Newest)</option>
            <option value="price">Sort: Price (Highest)</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray">
            <p>No orders found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-light border-b border-gray/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray/10 hover:bg-light transition"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-dark">{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-dark font-semibold">{order.customer_name}</span>
                        <span className="text-xs text-gray">{order.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark font-semibold">
                      ${order.total_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="p-2 hover:bg-light rounded-lg transition">
                        <MoreVertical size={18} className="text-gray" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-dark">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Delivered</p>
            <p className="text-3xl font-bold text-green-600">
              {orders.filter(o => o.status === 'delivered').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-dark">
              ${orders.reduce((sum, o) => sum + o.total_price, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
