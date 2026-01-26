'use client'

import { useState, useEffect } from 'react'
import { MapPin, Clock, Briefcase, TrendingUp, Filter, Map } from 'lucide-react'

interface AvailableOrder {
  id: string
  customerId: string
  weight: number
  pickupAddress: string
  deliveryAddress: string
  pickupTime: any
  estimatedDelivery: any
  services: string[]
  price: number
  customerRating: number
  distance: number
  estimatedEarnings: number
}

export default function AvailableOrdersPage() {
  const [orders, setOrders] = useState<AvailableOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'nearby' | 'highestPay'>('all')
  const [accepting, setAccepting] = useState<string | null>(null)

  // Fetch available orders
  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        const res = await fetch('/api/pro/orders', { method: 'PUT' })
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        } else {
          setError('Failed to load available orders')
        }
      } catch (err) {
        setError('Error loading orders')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  async function handleAcceptOrder(orderId: string) {
    setAccepting(orderId)
    try {
      const res = await fetch('/api/pro/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'accept' }),
      })

      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to accept order')
      }
    } catch (err: any) {
      setError(err.message || 'Error accepting order')
    } finally {
      setAccepting(null)
    }
  }

  function handleDeclineOrder(orderId: string) {
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }

  const filteredOrders = orders
    .sort((a, b) => {
      if (filter === 'nearby') return a.distance - b.distance
      if (filter === 'highestPay') return b.estimatedEarnings - a.estimatedEarnings
      return 0
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block px-6 py-3 bg-[#48C9B0] text-white rounded-lg">
            Loading available orders...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Orders</h1>
          <p className="text-gray-600">{filteredOrders.length} orders available in your area</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-[#48C9B0] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            All Orders
          </button>
          <button
            onClick={() => setFilter('nearby')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'nearby'
                ? 'bg-[#48C9B0] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Map size={18} />
            Nearest
          </button>
          <button
            onClick={() => setFilter('highestPay')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'highestPay'
                ? 'bg-[#48C9B0] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <TrendingUp size={18} />
            Highest Pay
          </button>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Briefcase size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No orders available right now</p>
            <p className="text-sm text-gray-500">Check back in a few minutes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                {/* Customer Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {'★'.repeat(Math.round(order.customerRating))}
                    {'☆'.repeat(5 - Math.round(order.customerRating))}
                    <span className="text-sm text-gray-600 ml-2">{order.customerRating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                    ${order.estimatedEarnings.toFixed(2)} earnings
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  {/* Pickup */}
                  <div className="flex gap-3">
                    <MapPin size={18} className="text-[#48C9B0] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Pickup</p>
                      <p className="font-semibold text-gray-900 text-sm">{order.pickupAddress}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {order.distance.toFixed(1)} km away
                      </p>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="flex gap-3">
                    <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Delivery</p>
                      <p className="font-semibold text-gray-900 text-sm">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex gap-3">
                    <Clock size={18} className="text-[#48C9B0] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Pickup Time</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {order.pickupTime instanceof Date
                          ? order.pickupTime.toLocaleString()
                          : new Date(order.pickupTime?.toMillis?.() || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Services & Weight */}
                  <div className="flex gap-3">
                    <Briefcase size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Services</p>
                      <div className="flex flex-wrap gap-1">
                        {order.services.slice(0, 3).map(service => (
                          <span key={service} className="text-xs bg-[#E8FFFB] text-[#48C9B0] px-2 py-1 rounded">
                            {service}
                          </span>
                        ))}
                        {order.services.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            +{order.services.length - 3} more
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{order.weight} kg</p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4 pb-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Total Price</p>
                  <p className="text-2xl font-bold text-gray-900">${order.price.toFixed(2)}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptOrder(order.id)}
                    disabled={accepting === order.id}
                    className="flex-1 px-4 py-2 bg-[#48C9B0] text-white font-semibold rounded-lg hover:bg-[#3ab09c] disabled:bg-gray-400 transition-colors"
                  >
                    {accepting === order.id ? 'Accepting...' : 'Accept Order'}
                  </button>
                  <button
                    onClick={() => handleDeclineOrder(order.id)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
