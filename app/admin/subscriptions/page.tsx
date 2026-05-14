'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Search, Info } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface SubscriptionRecord {
  id: string
  user_id: string
  plan_name: string
  status: string
  user_email?: string
  raw: Record<string, unknown>
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-800',
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

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

      const transformed: SubscriptionRecord[] = (result.data || []).map((item: Record<string, unknown> & {
        id: string
        users?: { email?: string } | null
      }) => ({
        id: item.id,
        user_id: (item.id as string) || '',
        plan_name:
          (item.subscription_plan as string | undefined) ||
          (item.plan_name as string | undefined) ||
          '—',
        status:
          (item.subscription_status as string | undefined) ||
          (item.subscription_active ? 'active' : 'inactive'),
        user_email: item.users?.email,
        raw: item,
      }))

      setSubscriptions(transformed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load subscriptions.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = subscriptions
    .filter((s) => {
      const matchesSearch =
        s.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.user_email || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => a.plan_name.localeCompare(b.plan_name))

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-3 hover:text-primary"
            >
              <ArrowLeft size={14} />
              Control center
            </Link>
            <h1 className="text-3xl font-bold text-gray-950">Subscriptions (legacy)</h1>
            <p className="text-sm text-gray-600 mt-1">
              Read-only view of any subscription records still in the database. Washlee no longer sells paid subscriptions — see the customer-facing pages.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Notice */}
          <div className="rounded-lg border border-primary/15 bg-mint/40 p-4 flex gap-2 text-sm text-dark">
            <Info size={16} className="flex-shrink-0 mt-0.5 text-primary-deep" />
            <span>
              Washlee is pay-per-order ($7.50/kg standard, $12.50/kg express, $75 minimum AUD). Wash Club rewards are free to join. This view exists only for support/legacy reference — no fake billing amounts are shown here.
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex gap-3 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by plan or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
              <p className="text-sm text-gray-500 mt-3">Loading…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-3">
                <Info size={20} className="text-primary-deep" />
              </div>
              <p className="font-bold text-gray-950 mb-1">No subscription records</p>
              <p className="text-sm text-gray-500">
                That&rsquo;s expected — Washlee is pay-per-order today.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Customer email
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Plan (legacy)
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((subscription) => {
                    const badge = STATUS_BADGE[subscription.status] ?? 'bg-gray-100 text-gray-700'
                    return (
                      <tr key={subscription.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 text-sm text-gray-950">
                          {subscription.user_email || '—'}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-950">
                          {subscription.plan_name}
                        </td>
                        <td className="px-5 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${badge}`}
                          >
                            {subscription.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                Records loaded
              </p>
              <p className="text-2xl font-bold text-gray-950 mt-1">{subscriptions.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                Active legacy
              </p>
              <p className="text-2xl font-bold text-gray-950 mt-1">
                {subscriptions.filter((s) => s.status === 'active').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                Cancelled
              </p>
              <p className="text-2xl font-bold text-gray-950 mt-1">
                {
                  subscriptions.filter((s) => ['cancelled', 'inactive'].includes(s.status)).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
