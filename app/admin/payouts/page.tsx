'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { DollarSign, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react'

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
  requestedAt: any
  notes?: string
  bankTransactionId?: string
}

export default function AdminPayoutManagement() {
  const router = useRouter()
  const { hasAdminAccess, checkingAdminAccess } = useRequireAdminAccess()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('pending')
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [bankTransactionId, setBankTransactionId] = useState('')

  useEffect(() => {
    if (!hasAdminAccess) return
    fetchPayouts()
  }, [filter, hasAdminAccess])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/payouts?status=${filter}`)
      if (!response.ok) throw new Error('Failed to fetch payouts')
      const data = await response.json()
      setPayouts(data.payouts || [])
    } catch (error) {
      console.error('Error fetching payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (payout: Payout) => {
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
      }
    } catch (error) {
      console.error('Error approving payout:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleComplete = async (payout: Payout) => {
    if (!bankTransactionId) {
      alert('Please enter bank transaction ID')
      return
    }
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
      }
    } catch (error) {
      console.error('Error completing payout:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (payout: Payout) => {
    if (!notes) {
      alert('Please provide a reason for rejection')
      return
    }
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
      }
    } catch (error) {
      console.error('Error rejecting payout:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredPayouts = payouts.filter(p => !filter || p.status === filter)

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8 font-semibold"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <DollarSign size={36} className="text-primary" />
            Payout Management
          </h1>
          <p className="text-gray">Process and manage employee payouts</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(['all', 'pending', 'processing', 'completed', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === status
                  ? 'bg-primary text-dark'
                  : 'bg-gray-800 text-gray hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Payouts Grid */}
        {checkingAdminAccess || loading ? (
          <Card className="p-12 text-center">
            <p className="text-gray">Loading payouts...</p>
          </Card>
        ) : filteredPayouts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray">No payouts found for this status</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPayouts.map(payout => (
              <div
                key={payout.id}
                onClick={() => setSelectedPayout(payout)}
                className="cursor-pointer transition"
              >
                <Card className="p-6 hover:bg-gray-800/50 border-l-4 border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">${payout.amount.toFixed(2)}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(payout.status)}`}>
                          {payout.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray text-sm mb-1">
                        <strong>Account:</strong> {payout.bankDetails.accountNumber} ({payout.bankDetails.bankName})
                      </p>
                    <p className="text-gray text-sm">
                      <strong>Requested:</strong> {new Date(payout.requestedAt?.toDate?.() || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray text-sm">{payout.email}</p>
                  </div>
                </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedPayout && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 flex items-center justify-between mb-6 bg-dark py-4 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Payout Details</h2>
                <button
                  onClick={() => setSelectedPayout(null)}
                  className="text-gray hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Amount & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark/50 p-4 rounded-lg">
                    <p className="text-gray text-sm mb-1">Amount</p>
                    <p className="text-2xl font-bold text-primary">${selectedPayout.amount.toFixed(2)}</p>
                  </div>
                  <div className="bg-dark/50 p-4 rounded-lg">
                    <p className="text-gray text-sm mb-1">Status</p>
                    <p className={`text-lg font-bold ${getStatusColor(selectedPayout.status)}`}>
                      {selectedPayout.status.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-dark/50 p-4 rounded-lg space-y-2">
                  <h3 className="font-bold text-white mb-3">Bank Details</h3>
                  <p className="text-gray"><strong>Account Holder:</strong> {selectedPayout.bankDetails.accountHolder}</p>
                  <p className="text-gray"><strong>BSB:</strong> {selectedPayout.bankDetails.bsb}</p>
                  <p className="text-gray"><strong>Account Number:</strong> {selectedPayout.bankDetails.accountNumber}</p>
                  <p className="text-gray"><strong>Bank:</strong> {selectedPayout.bankDetails.bankName}</p>
                  <p className="text-gray"><strong>Account Type:</strong> {selectedPayout.bankDetails.accountType}</p>
                </div>

                {/* Admin Actions */}
                {selectedPayout.status === 'pending' && (
                  <div className="space-y-3 border-t border-gray-700 pt-4">
                    <h3 className="font-bold text-white">Approve or Reject?</h3>
                    <textarea
                      placeholder="Add notes..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-dark border-2 border-gray rounded-lg text-white placeholder-gray"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(selectedPayout)}
                        disabled={processingId === selectedPayout.id}
                        className="flex-1"
                      >
                        {processingId === selectedPayout.id ? 'Processing...' : 'Approve & Queue'}
                      </Button>
                      <Button
                        onClick={() => handleReject(selectedPayout)}
                        disabled={processingId === selectedPayout.id || !notes}
                        variant="outline"
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {selectedPayout.status === 'processing' && (
                  <div className="space-y-3 border-t border-gray-700 pt-4">
                    <h3 className="font-bold text-white">Mark as Complete</h3>
                    <input
                      type="text"
                      placeholder="Bank Transaction ID (e.g., TRF-12345)"
                      value={bankTransactionId}
                      onChange={e => setBankTransactionId(e.target.value)}
                      className="w-full px-4 py-2 bg-dark border-2 border-gray rounded-lg text-white placeholder-gray"
                    />
                    <textarea
                      placeholder="Add completion notes..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-dark border-2 border-gray rounded-lg text-white placeholder-gray"
                      rows={2}
                    />
                    <Button
                      onClick={() => handleComplete(selectedPayout)}
                      disabled={processingId === selectedPayout.id || !bankTransactionId}
                      className="w-full"
                    >
                      {processingId === selectedPayout.id ? 'Completing...' : 'Mark as Complete'}
                    </Button>
                  </div>
                )}

                {selectedPayout.bankTransactionId && (
                  <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                    <p className="text-green-400 text-sm">
                      <strong>Reference:</strong> {selectedPayout.bankTransactionId}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
