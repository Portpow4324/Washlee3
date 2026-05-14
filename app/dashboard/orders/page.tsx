'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import CancellationModal from '@/components/CancellationModal'
import RemoveOrderWarningModal from '@/components/RemoveOrderWarningModal'
import Toast from '@/components/Toast'
import Link from 'next/link'
import {
  Package,
  Calendar,
  ChevronRight,
  X,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Trash2,
} from 'lucide-react'

interface Order {
  id: string
  status: string
  total_price: number
  created_at: string
  delivery_address?: unknown
  scheduled_pickup_date?: string
  items?: unknown
}

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-mint text-primary-deep',
  pending_payment: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-blue-100 text-blue-800',
  washing: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
}

function getOrderWeight(order: Order): number {
  if (!order.items) return 0
  try {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    return (items as { weight?: number })?.weight ?? 0
  } catch {
    return 0
  }
}

function formatStatus(status: string): string {
  const cleaned = status.replace(/_/g, ' ')
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [isCancellingAll, setIsCancellingAll] = useState(false)
  const [showCancelAllConfirm, setShowCancelAllConfirm] = useState(false)
  const [isClearingCancelled, setIsClearingCancelled] = useState(false)
  const [showInitiateRefund, setShowInitiateRefund] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [removingOrderId, setRemovingOrderId] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return

    const loadOrders = async () => {
      try {
        setIsLoading(true)
        setError('')

        const queryTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Orders query timeout')), 10000)
        )

        const ordersPromise = supabase
          .from('orders')
          .select('id, status, created_at, total_price, delivery_address, scheduled_pickup_date, items')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        const result = (await Promise.race([ordersPromise, queryTimeout])) as Awaited<typeof ordersPromise>

        if (result.error) {
          console.error('[Orders] Query error:', result.error.message)
          setOrders([])
        } else {
          setOrders((result.data ?? []) as Order[])
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load orders'
        console.error('[Orders] Error loading orders:', message)
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [user, authLoading])

  const handleOpenCancellationModal = (orderId: string) => {
    setCancellingOrderId(orderId)
    setShowCancellationModal(true)
  }

  const handleCloseCancellationModal = () => {
    setCancellingOrderId(null)
    setShowCancellationModal(false)
  }

  const handleSubmitCancellation = async (reason: string, notes: string) => {
    if (!cancellingOrderId || !user) return

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          orderId: cancellingOrderId,
          userId: user.id,
          reason,
          notes,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to cancel order')

      setOrders((prev) => prev.filter((o) => o.id !== cancellingOrderId))
      handleCloseCancellationModal()
      setToast({
        message: 'Order cancelled. Check your email for details.',
        type: 'success',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order'
      setToast({ message, type: 'error' })
      throw err
    }
  }

  const handleCancelAll = async () => {
    if (!user || orders.length === 0) return

    try {
      setIsCancellingAll(true)
      const cancelledOrderIds: string[] = []
      const failedOrderIds: string[] = []
      const { data: sessionData } = await supabase.auth.getSession()
      const authHeaders: Record<string, string> = sessionData.session?.access_token
        ? { Authorization: `Bearer ${sessionData.session.access_token}` }
        : {}

      for (const order of orders) {
        if (order.status !== 'completed' && order.status !== 'cancelled') {
          try {
            const response = await fetch('/api/orders/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders },
              body: JSON.stringify({
                orderId: order.id,
                userId: user.id,
                reason: 'Bulk cancellation',
                notes: 'Cancelled via Cancel All button',
              }),
            })
            if (response.ok) {
              cancelledOrderIds.push(order.id)
            } else {
              failedOrderIds.push(order.id)
            }
          } catch {
            failedOrderIds.push(order.id)
          }
        }
      }

      setOrders((prev) => prev.filter((o) => !cancelledOrderIds.includes(o.id)))
      setShowCancelAllConfirm(false)

      if (failedOrderIds.length === 0) {
        setToast({ message: `Cancelled ${cancelledOrderIds.length} order(s).`, type: 'success' })
      } else {
        setToast({
          message: `Cancelled ${cancelledOrderIds.length}. Failed: ${failedOrderIds.length}.`,
          type: 'error',
        })
      }
    } catch {
      setToast({ message: 'Error cancelling orders', type: 'error' })
    } finally {
      setIsCancellingAll(false)
    }
  }

  const handleClearCancelledOrders = () => {
    setOrders((prev) => prev.filter((o) => o.status !== 'cancelled'))
    setIsClearingCancelled(false)
    setToast({ message: 'Cancelled orders cleared from view.', type: 'success' })
  }

  const handleInitiateRefund = async (orderId: string) => {
    if (!user) return

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const response = await fetch('/api/orders/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ orderId, userId: user.id }),
      })

      if (response.ok) {
        setToast({
          message: 'Refund request initiated. Check your email for payment details.',
          type: 'success',
        })
        setShowInitiateRefund(null)
      } else {
        setToast({ message: 'Failed to initiate refund.', type: 'error' })
      }
    } catch {
      setToast({ message: 'Error initiating refund.', type: 'error' })
    }
  }

  const handleRemoveOrder = async (orderId: string) => {
    if (!user) {
      setToast({ message: 'You must be signed in to remove orders.', type: 'error' })
      return
    }

    try {
      setIsRemoving(true)
      const response = await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userId: user.id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to remove order')

      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      setShowRemoveModal(false)
      setRemovingOrderId(null)
      setToast({ message: 'Order removed from your dashboard.', type: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove order'
      setToast({ message, type: 'error' })
    } finally {
      setIsRemoving(false)
    }
  }

  const openRemoveModal = (orderId: string) => {
    setRemovingOrderId(orderId)
    setShowRemoveModal(true)
  }

  const closeRemoveModal = () => {
    setShowRemoveModal(false)
    setRemovingOrderId(null)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading your orders…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="surface-card max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-dark mb-2">Sign in required</h1>
          <p className="text-gray mb-5">Please sign in to view your orders.</p>
          <Link href="/auth/login" className="btn-primary inline-flex">
            Sign in
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  const cancellableCount = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  ).length
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-1">My orders</h1>
          <p className="text-gray text-sm sm:text-base">Track, cancel, and manage your laundry orders.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cancelledCount > 0 && (
            <button
              type="button"
              onClick={() => setIsClearingCancelled(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition"
            >
              <Trash2 size={14} />
              Clear cancelled
            </button>
          )}
          {cancellableCount > 1 && (
            <button
              type="button"
              onClick={() => setShowCancelAllConfirm(true)}
              disabled={isCancellingAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <X size={14} />
              {isCancellingAll ? 'Cancelling…' : 'Cancel all'}
            </button>
          )}
          <Link href="/booking" className="btn-primary text-sm">
            New order
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {error && (
        <div className="surface-card p-4 mb-6 bg-red-50 border-red-200 flex gap-2">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="surface-card p-10 sm:p-14 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-mint mb-4">
            <Package size={22} className="text-primary-deep" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-1">No orders yet</h2>
          <p className="text-gray mb-6 max-w-sm mx-auto">
            Book your first pickup — Standard from $7.50/kg with free pickup &amp; delivery.
          </p>
          <Link href="/booking" className="btn-primary inline-flex">
            Book a pickup
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const weight = getOrderWeight(order)
            const badgeClass = STATUS_BADGE[order.status] ?? 'bg-line text-dark'
            return (
              <div key={order.id} className="surface-card p-5 sm:p-6">
                <Link href={`/tracking?orderId=${order.id}`} className="block group">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:items-center">
                    <div className="sm:col-span-3">
                      <p className="text-[11px] text-gray-soft uppercase tracking-wider mb-1">Order</p>
                      <p className="font-mono text-sm font-semibold text-dark">{order.id.slice(0, 8)}</p>
                      <span
                        className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </div>

                    <div className="sm:col-span-3">
                      <p className="text-[11px] text-gray-soft uppercase tracking-wider mb-1">Details</p>
                      <p className="text-sm font-semibold text-dark">{weight ? `${weight}kg` : '—'}</p>
                      {order.scheduled_pickup_date && (
                        <p className="text-xs text-gray mt-0.5">
                          Pickup{' '}
                          {new Date(order.scheduled_pickup_date).toLocaleDateString('en-AU', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <p className="text-[11px] text-gray-soft uppercase tracking-wider mb-1">Ordered</p>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-dark">
                        <Calendar size={14} className="text-primary-deep" />
                        {new Date(order.created_at).toLocaleDateString('en-AU', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-3 sm:text-right">
                      <p className="text-[11px] text-gray-soft uppercase tracking-wider mb-1">Total</p>
                      <p className="text-2xl font-bold text-primary-deep">
                        ${(order.total_price || 0).toFixed(2)}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-deep mt-1 group-hover:translate-x-0.5 transition">
                        View order <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>

                {order.status === 'cancelled' && (
                  <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4">
                    <p className="text-sm font-semibold text-red-800 mb-1">Order cancelled</p>
                    <p className="text-xs text-red-700 mb-3">
                      We&rsquo;ll auto-remove this from your dashboard in 24 hours. Check your email for details.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInitiateRefund(order.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full bg-primary text-white hover:bg-primary-deep transition"
                      >
                        <RotateCcw size={12} />
                        Request refund
                      </button>
                      <button
                        type="button"
                        onClick={() => openRemoveModal(order.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full border border-line text-dark hover:bg-light transition"
                      >
                        <Trash2 size={12} />
                        Remove from list
                      </button>
                    </div>
                  </div>
                )}

                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenCancellationModal(order.id)}
                      disabled={cancellingOrderId === order.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 rounded-full transition disabled:opacity-50"
                    >
                      <X size={14} />
                      {cancellingOrderId === order.id ? 'Opening…' : 'Cancel order'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Help card */}
      <div className="surface-card mt-8 p-6 bg-mint/40">
        <h3 className="font-semibold text-dark mb-1">Need a hand?</h3>
        <p className="text-sm text-gray mb-4">Can&rsquo;t find an order, or have a question about a delivery?</p>
        <Link href="/dashboard/support" className="btn-outline text-sm">
          Open support
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Cancellation modal */}
      <CancellationModal
        orderId={cancellingOrderId || ''}
        isOpen={showCancellationModal}
        isLoading={false}
        onClose={handleCloseCancellationModal}
        onSubmit={handleSubmitCancellation}
      />

      {showCancelAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-dark mb-2">Cancel all open orders?</h2>
            <p className="text-sm text-gray mb-5">
              Completed and already-cancelled orders aren&rsquo;t affected.
            </p>
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-5">
              <p className="text-sm text-red-800">
                <span className="font-semibold">{cancellableCount}</span> order(s) will be cancelled.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelAllConfirm(false)}
                disabled={isCancellingAll}
                className="btn-outline flex-1 disabled:opacity-50"
              >
                Keep orders
              </button>
              <button
                type="button"
                onClick={handleCancelAll}
                disabled={isCancellingAll}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-red-600 hover:bg-red-700 transition min-h-[48px] disabled:opacity-50"
              >
                {isCancellingAll ? 'Cancelling…' : 'Cancel all'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isClearingCancelled && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-dark mb-2">Clear cancelled orders?</h2>
            <p className="text-sm text-gray mb-5">
              This only hides them from your dashboard view. Records stay in your account.
            </p>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-5">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{cancelledCount}</span> cancelled order(s) will be hidden.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsClearingCancelled(false)}
                className="btn-outline flex-1"
              >
                Keep them
              </button>
              <button
                type="button"
                onClick={handleClearCancelledOrders}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-amber-600 hover:bg-amber-700 transition min-h-[48px]"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {showInitiateRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-dark mb-2">Request a refund</h2>
            <p className="text-sm text-gray mb-5">
              We&rsquo;ll email you a secure payment link. Refunds go back to your original payment method within 3–5 business days.
            </p>
            <ul className="rounded-xl bg-mint/50 border border-primary/15 p-4 mb-5 space-y-1.5 text-sm text-dark">
              <li>• Secure payment link by email</li>
              <li>• Choose your preferred method</li>
              <li>• Refund issued to original payment</li>
              <li>• 3–5 business days to appear</li>
            </ul>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowInitiateRefund(null)}
                className="btn-outline flex-1"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => handleInitiateRefund(showInitiateRefund)}
                className="btn-primary flex-1"
              >
                Request refund
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <RemoveOrderWarningModal
        isOpen={showRemoveModal}
        orderAmount={
          removingOrderId ? orders.find((o) => o.id === removingOrderId)?.total_price || 0 : 0
        }
        onConfirm={() => {
          if (removingOrderId) handleRemoveOrder(removingOrderId)
        }}
        onCancel={closeRemoveModal}
        isLoading={isRemoving}
      />
    </div>
  )
}
