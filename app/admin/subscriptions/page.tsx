'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, Search, Filter, MoreVertical } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  id: string
  user_id: string
  plan_name: string
  status: string
  current_period_start: string
  current_period_end: string
  amount: number
  user_email?: string
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/collections?name=subscriptions', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to load subscriptions')
        return
      }

      const transformed: Subscription[] = (result.data || []).map((item: any) => ({
        id: item.id,
        user_id: item.id,
        plan_name: item.subscription_plan || 'Basic',
        status: item.subscription_status || (item.subscription_active ? 'active' : 'inactive'),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 9.99, // Default, could be fetched from pricing
        user_email: item.users?.email
      }))

      setSubscriptions(transformed)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = subscriptions
    .filter(s => {
      const matchesSearch =
        s.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.current_period_end).getTime() - new Date(a.current_period_end).getTime()
      } else {
        return b.amount - a.amount
      }
    })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

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
              <h1 className="text-3xl font-bold text-dark">Active Subscriptions</h1>
              <p className="text-gray text-sm">Manage customer subscriptions and plans</p>
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
              placeholder="Search by plan name or email..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            className="px-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray">
            <p>No subscriptions found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-light border-b border-gray/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Period End</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="border-b border-gray/10 hover:bg-light transition"
                  >
                    <td className="px-6 py-4 text-sm text-dark">{subscription.user_email}</td>
                    <td className="px-6 py-4 text-sm text-dark font-medium">{subscription.plan_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscription.status)}`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark font-semibold">
                      ${subscription.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Total Active</p>
            <p className="text-3xl font-bold text-dark">
              {subscriptions.filter(s => s.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-dark">
              ${subscriptions.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray text-sm font-semibold mb-2">Active Rate</p>
            <p className="text-3xl font-bold text-dark">
              {subscriptions.length > 0
                ? Math.round((subscriptions.filter(s => s.status === 'active').length / subscriptions.length) * 100)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
