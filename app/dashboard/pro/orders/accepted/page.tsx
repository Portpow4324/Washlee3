'use client'

import { useState, useEffect } from 'react'
import { MapPin, Clock, CheckCircle, AlertCircle, Phone, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface ProJob {
  id: string
  orderId: string
  customerId: string
  proId: string
  status: 'accepted' | 'in-progress' | 'completed'
  orderDetails: {
    weight: number
    items: string[]
    specialInstructions: string
    services: string[]
  }
  pickupLocation: {
    address: string
    instructions: string
  }
  deliveryLocation: {
    address: string
    instructions: string
  }
  pickupTime: any
  estimatedDeliveryTime: any
  earnings: number
  acceptedAt?: any
  actualPickupTime?: any
  actualDeliveryTime?: any
}

export default function AcceptedOrdersPage() {
  const [jobs, setJobs] = useState<ProJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all')
  const [selectedJob, setSelectedJob] = useState<ProJob | null>(null)

  // Fetch accepted orders
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true)
        const res = await fetch('/api/pro/orders?status=accepted')
        if (res.ok) {
          const data = await res.json()
          setJobs(data)
        } else {
          setError('Failed to load orders')
        }
      } catch (err) {
        setError('Error loading orders')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  async function handleStartPickup(jobId: string) {
    try {
      const res = await fetch('/api/pro/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          status: 'in-progress',
        }),
      })

      if (res.ok) {
        setJobs(prev =>
          prev.map(j => (j.id === jobId ? { ...j, status: 'in-progress' } : j))
        )
      }
    } catch (err) {
      console.error('Error updating job:', err)
    }
  }

  async function handleCompleteJob(jobId: string) {
    try {
      const res = await fetch('/api/pro/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          status: 'completed',
        }),
      })

      if (res.ok) {
        setJobs(prev =>
          prev.map(j => (j.id === jobId ? { ...j, status: 'completed' } : j))
        )
      }
    } catch (err) {
      console.error('Error updating job:', err)
    }
  }

  const filteredJobs = jobs.filter(j => {
    if (filter === 'all') return true
    if (filter === 'pending') return j.status === 'accepted'
    return j.status === filter
  })

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'accepted').length,
    inProgress: jobs.filter(j => j.status === 'in-progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    earnings: jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + j.earnings, 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block px-6 py-3 bg-[#48C9B0] text-white rounded-lg">
            Loading orders...
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your accepted orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">Earnings</p>
            <p className="text-2xl font-bold text-[#48C9B0]">${stats.earnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4 overflow-x-auto">
          {['all', 'pending', 'in-progress', 'completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                filter === tab
                  ? 'text-[#48C9B0] border-b-2 border-[#48C9B0]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'in-progress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders in this category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Order #{job.orderId.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Status:{' '}
                      <span className={`font-semibold ${
                        job.status === 'accepted' ? 'text-yellow-600' :
                        job.status === 'in-progress' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {job.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#48C9B0]">${job.earnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">{job.orderDetails.weight} kg</p>
                  </div>
                </div>

                {/* Locations */}
                <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                  {/* Pickup */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">PICKUP</p>
                    <div className="flex gap-2">
                      <MapPin size={18} className="text-[#48C9B0] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{job.pickupLocation.address}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {job.pickupTime instanceof Date
                            ? job.pickupTime.toLocaleString()
                            : new Date(job.pickupTime?.toMillis?.() || 0).toLocaleString()}
                        </p>
                        {job.pickupLocation.instructions && (
                          <p className="text-xs text-gray-600 mt-2 italic">{job.pickupLocation.instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">DELIVERY</p>
                    <div className="flex gap-2">
                      <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{job.deliveryLocation.address}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {job.estimatedDeliveryTime instanceof Date
                            ? job.estimatedDeliveryTime.toLocaleString()
                            : new Date(job.estimatedDeliveryTime?.toMillis?.() || 0).toLocaleString()}
                        </p>
                        {job.deliveryLocation.instructions && (
                          <p className="text-xs text-gray-600 mt-2 italic">{job.deliveryLocation.instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">SERVICES</p>
                  <div className="flex flex-wrap gap-2">
                    {job.orderDetails.services.map(service => (
                      <span
                        key={service}
                        className="px-3 py-1 bg-[#E8FFFB] text-[#48C9B0] text-xs rounded-full font-semibold"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  {job.status === 'accepted' && (
                    <button
                      onClick={() => handleStartPickup(job.id)}
                      className="flex-1 px-4 py-2 bg-[#48C9B0] text-white font-semibold rounded-lg hover:bg-[#3ab09c] transition-colors"
                    >
                      Start Pickup
                    </button>
                  )}
                  {job.status === 'in-progress' && (
                    <button
                      onClick={() => handleCompleteJob(job.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                  {job.status === 'completed' && (
                    <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 font-semibold rounded-lg cursor-default flex items-center justify-center gap-2">
                      <CheckCircle size={18} />
                      Completed
                    </button>
                  )}
                  <Link
                    href={`/tracking?orderId=${job.orderId}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Track
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
