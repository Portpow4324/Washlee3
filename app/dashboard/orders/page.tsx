'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Button from '@/components/Button'
import CancellationModal from '@/components/CancellationModal'
import RemoveOrderWarningModal from '@/components/RemoveOrderWarningModal'
import Toast from '@/components/Toast'
import Link from 'next/link'
import { Package, MapPin, Calendar, DollarSign, Eye, ChevronRight, X } from 'lucide-react'

interface Order {
  id: string
  status: string
  total_price: number
  created_at: string
  delivery_address?: any
  scheduled_pickup_date?: string
  items?: any
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

  const getOrderWeight = (order: Order) => {
    if (!order.items) return 0
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    return items.weight || 0
  }

  const handleOpenCancellationModal = (orderId: string) => {
    setCancellingOrderId(orderId)
    setShowCancellationModal(true)
  }

  const handleCloseCancellationModal = () => {
    setCancellingOrderId(null)
    setShowCancellationModal(false)
  }

  const handleRemoveOrder = async (orderId: string) => {
    if (!user) {
      setToast({
        message: 'You must be logged in to remove orders',
        type: 'error',
      })
      return
    }

    try {
      setIsRemoving(true)
      console.log('[Remove Order] Calling API for order:', orderId)
      const response = await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove order')
      }

      console.log('[Remove Order] API success, removing from UI:', orderId)
      // Remove order from list
      setOrders(orders.filter((o) => o.id !== orderId))
      setShowRemoveModal(false)
      setRemovingOrderId(null)
      setToast({
        message: 'Order removed from your dashboard',
        type: 'success',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove order'
      console.error('[Remove Order] Error:', errorMessage)
      setToast({
        message: errorMessage,
        type: 'error',
      })
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

  const handleSubmitCancellation = async (reason: string, notes: string) => {
    if (!cancellingOrderId || !user) return

    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cancellingOrderId,
          userId: user.id,
          reason,
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order')
      }

      // Remove order from list
      setOrders(orders.filter((o) => o.id !== cancellingOrderId))
      handleCloseCancellationModal()
      setToast({
        message: 'Order cancelled successfully! Check your email for details.',
        type: 'success',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order'
      setToast({
        message: errorMessage,
        type: 'error',
      })
      throw err
    }
  }

  const handleCancelAll = async () => {
    if (!user || orders.length === 0) return

    try {
      setIsCancellingAll(true)
      const cancelledOrderIds: string[] = []
      const failedOrderIds: string[] = []

      // Cancel all orders that are not already completed or cancelled
      for (const order of orders) {
        if (order.status !== 'completed' && order.status !== 'cancelled') {
          try {
            const response = await fetch('/api/orders/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
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
          } catch (err) {
            failedOrderIds.push(order.id)
          }
        }
      }

      // Remove cancelled orders from list
      setOrders(orders.filter((o) => !cancelledOrderIds.includes(o.id)))
      setShowCancelAllConfirm(false)

      if (failedOrderIds.length === 0) {
        setToast({
          message: `Successfully cancelled ${cancelledOrderIds.length} order(s)!`,
          type: 'success',
        })
      } else {
        setToast({
          message: `Cancelled ${cancelledOrderIds.length} order(s). Failed to cancel ${failedOrderIds.length} order(s).`,
          type: 'error',
        })
      }
    } catch (err) {
      setToast({
        message: 'Error cancelling orders',
        type: 'error',
      })
    } finally {
      setIsCancellingAll(false)
    }
  }

  const handleClearCancelledOrders = () => {
    setOrders(orders.filter((o) => o.status !== 'cancelled'))
    setIsClearingCancelled(false)
    setToast({
      message: 'Cancelled orders cleared from view',
      type: 'success',
    })
  }

  const handleInitiateRefund = async (orderId: string) => {
    if (!user) return

    try {
      const response = await fetch('/api/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          userId: user.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setToast({
          message: 'Refund request initiated. Check your email for payment details.',
          type: 'success',
        })
        setShowInitiateRefund(null)
      } else {
        setToast({
          message: 'Failed to initiate refund',
          type: 'error',
        })
      }
    } catch (err) {
      setToast({
        message: 'Error initiating refund',
        type: 'error',
      })
    }
  }

  useEffect(() => {
    if (authLoading || !user) return

    const loadOrders = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        // Add timeout to prevent infinite loading
        const queryTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Orders query timeout')), 10000)
        )

        const ordersPromise = supabase
          .from('orders')
          .select('id, status, created_at, total_price, delivery_address, scheduled_pickup_date, items')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        const { data, error: queryError } = await Promise.race([
          ordersPromise,
          queryTimeout as any
        ]) as any

        if (queryError) {
          console.error('[Orders] Query error:', queryError.message)
          // Show empty state instead of error
          setOrders([])
        } else {
          setOrders(data || [])
        }
      } catch (err: any) {
        console.error('[Orders] Error loading orders:', err.message)
        // On timeout or error, just show empty orders
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1f2d2b] mb-4">Sign In Required</h1>
            <p className="text-[#6b7b78] mb-6">Please sign in to view your orders</p>
            <Link href="/auth/login" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
              Sign In →
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#1f2d2b] mb-2">My Orders</h1>
              <p className="text-[#6b7b78]">Track and manage your laundry orders</p>
            </div>
            <div className="flex gap-2">
              {orders.length > 1 && orders.some(o => o.status === 'cancelled') && (
                <button
                  onClick={() => setIsClearingCancelled(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
                >
                  Clear Cancelled
                </button>
              )}
              {orders.length > 1 && orders.some(o => o.status !== 'completed' && o.status !== 'cancelled') && (
                <button
                  onClick={() => setShowCancelAllConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCancellingAll}
                >
                  {isCancellingAll ? 'Cancelling...' : 'Cancel All'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <Card className="p-6 mb-8 bg-red-50 border border-red-200">
              <p className="text-red-700">{error}</p>
            </Card>
          )}

          {orders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package size={48} className="mx-auto mb-4 text-[#6b7b78]" />
              <h2 className="text-xl font-semibold text-[#1f2d2b] mb-2">No Orders Yet</h2>
              <p className="text-[#6b7b78] mb-6">Get started by booking your first laundry pickup</p>
              <Link href="/booking">
                <Button size="lg">Book Now</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="group relative">
                  <Link href={`/tracking?orderId=${order.id}`}>
                    <Card className="p-6 hover:shadow-lg transition cursor-pointer">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        {/* Order ID & Status */}
                        <div>
                          <p className="text-xs text-[#6b7b78] uppercase tracking-wide mb-1">Order ID</p>
                          <p className="font-semibold text-[#1f2d2b] font-mono text-sm">{order.id.slice(0, 8)}</p>
                          <div className="mt-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status.replace(/_/g, ' ').charAt(0).toUpperCase() + order.status.replace(/_/g, ' ').slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Weight & Details */}
                        <div>
                          <p className="text-xs text-[#6b7b78] uppercase tracking-wide mb-1">Details</p>
                          <p className="font-semibold text-[#1f2d2b]">{getOrderWeight(order)}kg • N/A</p>
                        </div>

                      {/* Date */}
                      <div>
                        <p className="text-xs text-[#6b7b78] uppercase tracking-wide mb-1">Ordered</p>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-[#48C9B0]" />
                          <p className="font-semibold text-[#1f2d2b]">
                            {new Date(order.created_at).toLocaleDateString('en-AU', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="text-right">
                        <p className="text-xs text-[#6b7b78] uppercase tracking-wide mb-1">Total</p>
                        <p className="text-2xl font-bold text-[#48C9B0] mb-3">
                          ${(order.total_price || 0).toFixed(2)}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[#48C9B0] group-hover:translate-x-1 transition">
                          View <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>

                {/* Cancelled Order Alert */}
                {order.status === 'cancelled' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Order Cancelled</p>
                    <p className="text-xs text-red-600 mb-3">
                      This order will be automatically removed from your dashboard in 24 hours. Check your email for cancellation details.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowInitiateRefund(order.id)
                        }}
                        className="flex-1 px-3 py-2 text-xs font-semibold bg-[#48C9B0] hover:bg-[#3da089] text-white rounded transition"
                      >
                        Request Refund
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          openRemoveModal(order.id)
                        }}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 rounded transition"
                      >
                        Remove from List
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel Button - Only show for non-completed orders */}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleOpenCancellationModal(order.id)
                      }}
                      disabled={cancellingOrderId === order.id}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={16} />
                      {cancellingOrderId === order.id ? 'Opening...' : 'Cancel Order'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          {/* Help Section */}
          <Card className="mt-12 p-6 bg-[#E8FFFB]">
            <h3 className="font-semibold text-[#1f2d2b] mb-3">Need Help?</h3>
            <p className="text-sm text-[#6b7b78] mb-4">
              Can't find your order or have questions about a delivery?
            </p>
            <Link href="/support">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </Card>
        </div>
      </main>

      {/* Cancellation Modal */}
      <CancellationModal
        orderId={cancellingOrderId || ''}
        isOpen={showCancellationModal}
        isLoading={false}
        onClose={handleCloseCancellationModal}
        onSubmit={handleSubmitCancellation}
      />

      {/* Cancel All Confirmation Modal */}
      {showCancelAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#1f2d2b] mb-2">Cancel All Orders?</h2>
              <p className="text-[#6b7b78] mb-6">
                This will cancel all active orders. Completed and already cancelled orders will not be affected.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">
                    {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length}
                  </span>
                  {' '}order(s) will be cancelled
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelAllConfirm(false)}
                  disabled={isCancellingAll}
                  className="flex-1 px-4 py-2 border border-gray-300 text-[#1f2d2b] rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Keep Orders
                </button>
                <button
                  onClick={handleCancelAll}
                  disabled={isCancellingAll}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancellingAll ? 'Cancelling...' : 'Yes, Cancel All'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Clear Cancelled Orders Confirmation Modal */}
      {isClearingCancelled && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#1f2d2b] mb-2">Clear Cancelled Orders?</h2>
              <p className="text-[#6b7b78] mb-6">
                This will remove all cancelled orders from your dashboard view. This action cannot be undone.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">
                    {orders.filter(o => o.status === 'cancelled').length}
                  </span>
                  {' '}cancelled order(s) will be removed
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsClearingCancelled(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-[#1f2d2b] rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Keep Them
                </button>
                <button
                  onClick={handleClearCancelledOrders}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
                >
                  Clear All
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Initiate Refund Confirmation Modal */}
      {showInitiateRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#1f2d2b] mb-2">Request Refund</h2>
              <p className="text-[#6b7b78] mb-6">
                You will receive a secure payment link via email to process your refund through Stripe or PayPal. The refund will be sent back to your original payment method within 3-5 business days.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 font-semibold">Refund Process:</p>
                <ul className="text-xs text-blue-600 mt-2 space-y-1">
                  <li>✓ You'll receive a secure payment link</li>
                  <li>✓ Choose your preferred payment method</li>
                  <li>✓ Refund issued to original payment method</li>
                  <li>✓ 3-5 business days to appear in your account</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInitiateRefund(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-[#1f2d2b] rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleInitiateRefund(showInitiateRefund)}
                  className="flex-1 px-4 py-2 bg-[#48C9B0] hover:bg-[#3da089] text-white rounded-lg font-semibold transition"
                >
                  Request Refund
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <RemoveOrderWarningModal
        isOpen={showRemoveModal}
        orderAmount={removingOrderId ? (orders.find(o => o.id === removingOrderId)?.total_price || 0) : 0}
        onConfirm={() => {
          if (removingOrderId) {
            handleRemoveOrder(removingOrderId)
          }
        }}
        onCancel={closeRemoveModal}
        isLoading={isRemoving}
      />

      <Footer />
    </>
  )
}
