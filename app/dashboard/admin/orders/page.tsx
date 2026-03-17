'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import { Search, Filter, Eye, Repeat2, Trash2 } from 'lucide-react'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending_payment', label: 'Pending Payment' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'washing', label: 'Washing' },
    { value: 'ready', label: 'Ready' },
    { value: 'completed', label: 'Completed' },
  ]

  useEffect(() => {
    fetchAllOrders()
    const interval = setInterval(fetchAllOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAllOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/orders')

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReassign = async (orderId: string, uid: string) => {
    if (!window.confirm('Reassign this order to an available pro?')) return

    try {
      const response = await fetch('/api/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, orderId }),
      })

      if (response.ok) {
        fetchAllOrders()
        alert('Order reassigned successfully')
      } else {
        alert('Failed to reassign order')
      }
    } catch (error) {
      console.error('Error reassigning:', error)
      alert('Error reassigning order')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId?.includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-orange-100 text-orange-800',
      washing: 'bg-indigo-100 text-indigo-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_payment: 'Pending Payment',
      confirmed: 'Confirmed',
      assigned: 'Assigned',
      picked_up: 'Picked Up',
      washing: 'Washing',
      ready: 'Ready',
      completed: 'Completed',
    }
    return labels[status] || status
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Admin Orders</h1>
          <p className="text-gray">Manage all orders across the system</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray/10 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray" />
              <input
                type="text"
                placeholder="Search by Order ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:border-primary"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray/10 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-light border-b border-gray/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Weight</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.orderId} className="border-b border-gray/10 hover:bg-light transition">
                      <td className="px-6 py-4 text-sm font-mono text-primary">
                        {order.orderId.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-dark">{order.customerName}</div>
                        <div className="text-xs text-gray">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-dark">
                        {order.weight}kg
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-dark">
                        ${order.totalPrice}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray">
                        {order.createdAt?.seconds 
                          ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowDetails(true)
                            }}
                            className="p-2 hover:bg-light rounded transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray" />
                          </button>
                          {order.status !== 'completed' && (
                            <button
                              onClick={() => handleReassign(order.orderId, order.uid)}
                              className="p-2 hover:bg-light rounded transition"
                              title="Reassign to Pro"
                            >
                              <Repeat2 className="w-4 h-4 text-gray" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-lg border border-gray/10 p-4">
            <p className="text-sm text-gray mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-dark">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray/10 p-4">
            <p className="text-sm text-gray mb-1">Completed</p>
            <p className="text-2xl font-bold text-primary">{orders.filter(o => o.status === 'completed').length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray/10 p-4">
            <p className="text-sm text-gray mb-1">In Progress</p>
            <p className="text-2xl font-bold text-primary">
              {orders.filter(o => ['picked_up', 'washing', 'ready'].includes(o.status)).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray/10 p-4">
            <p className="text-sm text-gray mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-primary">
              ${orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray/10 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-dark">Order Details</h2>
              <button onClick={() => setShowDetails(false)} className="text-gray hover:text-dark">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray mb-1">Order ID</p>
                  <p className="font-mono text-sm text-dark">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray mb-1">Customer</p>
                  <p className="text-sm text-dark">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray mb-1">Email</p>
                  <p className="text-sm text-dark">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray mb-1">Weight</p>
                  <p className="text-sm text-dark">{selectedOrder.weight}kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray mb-1">Total</p>
                  <p className="text-sm font-bold text-primary">${selectedOrder.totalPrice}</p>
                </div>
              </div>
              <div className="border-t border-gray/10 pt-4">
                <p className="text-xs text-gray mb-2">Delivery Address</p>
                <p className="text-sm text-dark">
                  {selectedOrder.deliveryAddressLine1}<br />
                  {selectedOrder.deliveryCity}, {selectedOrder.deliveryState} {selectedOrder.deliveryPostcode}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
