'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { DollarSign, ArrowLeft, X, AlertCircle } from 'lucide-react'

interface Payout {
  id: string
  uid: string
  email: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  bankDetails: {
    accountHolder: string
    accountNumber: string
    bsb: string
    bankName: string
    accountType: string
  }
  requestedAt: { toDate?: () => Date } | string | number | null
  notes?: string
  bankTransactionId?: string
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
}

function formatRequestedAt(value: Payout['requestedAt']): string {
  if (!value) return '—'
  try {
    if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      return value.toDate().toLocaleString('en-AU')
    }
    return new Date(value as string | number).toLocaleString('en-AU')
  } catch {
    return '—'
  }
}

export default function AdminPayoutsPage() {
  const router = useRouter()
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('pending')
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [bankTransactionId, setBankTransactionId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasAdminAccess) return
    fetchPayouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, hasAdminAccess])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/payouts?status=${filter}`)
      if (!response.ok) throw new Error('Failed to fetch payouts')
      const data = await response.json()
      setPayouts(data.payouts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load payouts.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (payout: Payout) => {
    if (!window.confirm(`Approve payout of $${payout.amount.toFixed(2)} to ${payout.email}?`)) return
    setProcessingId(payout.id)
    try {
      const response = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: payout.id,
          action: 'approve',
          notes: notes || 'Approved for processing',
        }),
      })
      if (response.ok) {
        fetchPayouts()
        setSelectedPayout(null)
        setNotes('')
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Could not approve payout.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve payout.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleComplete = async (payout: Payout) => {
    if (!bankTransactionId) {
      alert('Please enter the bank transaction ID before marking as complete.')
      return
    }
    if (!window.confirm(`Mark payout ${payout.id.slice(0, 8)} as completed? This is final.`)) return
    setProcessingId(payout.id)
    try {
      const response = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: payout.id,
          action: 'complete',
          bankTransactionId,
          notes: notes || 'Transferred successfully',
        }),
      })
      if (response.ok) {
        fetchPayouts()
        setSelectedPayout(null)
        setNotes('')
        setBankTransactionId('')
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Could not mark payout as complete.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete payout.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (payout: Payout) => {
    if (!notes) {
      alert('Please add a rejection reason in the notes field first.')
      return
    }
    if (!window.confirm(`Reject payout for ${payout.email}? The Pro will be notified.`)) return
    setProcessingId(payout.id)
    try {
      const response = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: payout.id,
          action: 'reject',
          notes,
        }),
      })
      if (response.ok) {
        fetchPayouts()
        setSelectedPayout(null)
        setNotes('')
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Could not reject payout.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reject payout.')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredPayouts = payouts.filter((p) => filter === 'all' || p.status === filter)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-12">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-3 hover:text-primary"
            >
              <ArrowLeft size={14} />
              Control center
            </Link>
            <h1 className="text-3xl font-bold text-gray-950 inline-flex items-center gap-2">
              <DollarSign size={26} className="text-primary-deep" />
              Pro payouts
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Review, approve, and reconcile commission payouts to Pros (independent contractors paid per completed order). All amounts in AUD.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-2 text-sm text-red-800">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div role="tablist" className="flex flex-wrap gap-2">
              {(['all', 'pending', 'processing', 'completed', 'rejected'] as const).map((status) => {
                const active = filter === status
                return (
                  <button
                    key={status}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      active
                        ? 'bg-primary text-white shadow-soft'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          {checkingAdminAccess || loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Spinner />
              <p className="text-sm text-gray-500 mt-3">Loading payouts…</p>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-3">
                <DollarSign size={20} className="text-primary-deep" />
              </div>
              <p className="font-bold text-gray-950 mb-1">No payouts in this state</p>
              <p className="text-sm text-gray-500">
                Try a different filter or wait for new requests to come through.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Pro
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Bank
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayouts.map((payout) => {
                    const badge = STATUS_BADGE[payout.status] ?? 'bg-gray-100 text-gray-700'
                    return (
                      <tr key={payout.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 text-sm">
                          <p className="font-semibold text-gray-950 truncate max-w-xs">{payout.email}</p>
                          <p className="text-xs text-gray-500 font-mono">{payout.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-gray-950">
                          ${payout.amount.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          <span className="font-mono">{payout.bankDetails.accountNumber}</span>
                          <p className="text-xs text-gray-500">{payout.bankDetails.bankName}</p>
                        </td>
                        <td className="px-5 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${badge}`}
                          >
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {formatRequestedAt(payout.requestedAt)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayout(payout)
                              setNotes(payout.notes || '')
                              setBankTransactionId(payout.bankTransactionId || '')
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-mint text-primary-deep hover:bg-primary hover:text-white transition"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Payout details</h2>
                <p className="text-xs text-gray-500 font-mono">{selectedPayout.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">Amount</p>
                  <p className="text-2xl font-bold text-primary-deep mt-1">
                    ${selectedPayout.amount.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">Status</p>
                  <span
                    className={`inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-sm font-semibold uppercase tracking-wider ${
                      STATUS_BADGE[selectedPayout.status]
                    }`}
                  >
                    {selectedPayout.status}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 space-y-1.5 text-sm">
                <h3 className="font-bold text-gray-950 mb-2">Bank details</h3>
                <p>
                  <span className="text-gray-500">Account holder:</span>{' '}
                  <span className="font-semibold text-gray-950">
                    {selectedPayout.bankDetails.accountHolder}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">BSB:</span>{' '}
                  <span className="font-mono font-semibold text-gray-950">
                    {selectedPayout.bankDetails.bsb}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Account number:</span>{' '}
                  <span className="font-mono font-semibold text-gray-950">
                    {selectedPayout.bankDetails.accountNumber}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Bank:</span>{' '}
                  <span className="font-semibold text-gray-950">
                    {selectedPayout.bankDetails.bankName}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Account type:</span>{' '}
                  <span className="font-semibold text-gray-950 capitalize">
                    {selectedPayout.bankDetails.accountType}
                  </span>
                </p>
              </div>

              {selectedPayout.status === 'pending' && (
                <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <h3 className="font-bold text-gray-950">Approve or reject</h3>
                  <textarea
                    placeholder="Notes (required for rejection)…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedPayout)}
                      disabled={processingId === selectedPayout.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold text-white bg-primary hover:bg-primary-deep transition disabled:opacity-60"
                    >
                      {processingId === selectedPayout.id ? 'Processing…' : 'Approve & queue'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedPayout)}
                      disabled={processingId === selectedPayout.id || !notes}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold text-red-700 border border-red-200 hover:bg-red-50 transition disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedPayout.status === 'processing' && (
                <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <h3 className="font-bold text-gray-950">Mark as complete</h3>
                  <input
                    type="text"
                    placeholder="Bank reference (e.g. TRF-12345)"
                    value={bankTransactionId}
                    onChange={(e) => setBankTransactionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <textarea
                    placeholder="Completion notes (optional)…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => handleComplete(selectedPayout)}
                    disabled={processingId === selectedPayout.id || !bankTransactionId}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold text-white bg-primary hover:bg-primary-deep transition disabled:opacity-60"
                  >
                    {processingId === selectedPayout.id ? 'Saving…' : 'Mark as complete'}
                  </button>
                </div>
              )}

              {selectedPayout.bankTransactionId && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                  <p className="text-emerald-900">
                    <span className="font-bold">Reference:</span>{' '}
                    <span className="font-mono">{selectedPayout.bankTransactionId}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
