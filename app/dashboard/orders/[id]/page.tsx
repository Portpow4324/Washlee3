'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, getStatusEmoji, daysUntilDelivery, canBeReviewed } from '@/lib/orderUtils'
import { MapPin, Clock, DollarSign, User, Phone, Mail, MessageSquare, Star, Trash2, CheckCircle } from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchOrder()
  }, [user, orderId, router])

  async function fetchOrder() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error('Failed to load order')
      const data = await response.json()
      setOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading order')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCancel() {
    if (!order) return

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: cancelReason || 'Customer requested'
        })
      })

      if (!response.ok) throw new Error('Failed to cancel order')
      
      await fetchOrder()
      setShowCancelDialog(false)
      setCancelReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cancelling order')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleSubmitReview() {
    if (!order) return

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_feedback',
          rating,
          review
        })
      })

      if (!response.ok) throw new Error('Failed to submit review')
      
      await fetchOrder()
      setShowReview(false)
      setRating(5)
      setReview('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting review')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold">{error || 'Order not found'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 bg-[#48C9B0] text-white rounded-lg hover:bg-[#3aad9a]"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const daysLeft = daysUntilDelivery(order.estimatedDelivery)
  const canReview = canBeReviewed(order.status)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{orderId}</h1>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                  {getStatusEmoji(order.status)} {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to Orders
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timeline */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Timeline</h2>
                <div className="space-y-4">
                  {['pending', 'accepted', 'collecting', 'washing', 'delivering', 'completed'].map((status, index) => {
                    const isActive = ['pending', 'accepted', 'collecting', 'washing', 'delivering', 'completed'].indexOf(order.status) >= index
                    const isCompleted = ['pending', 'accepted', 'collecting', 'washing', 'delivering', 'completed'].indexOf(order.status) > index
                    return (
                      <div key={status} className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isCompleted ? 'bg-[#48C9B0] text-white' : isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                            {ORDER_STATUS_LABELS[status as Order['status']]}
                          </p>
                          {isActive && !isCompleted && <p className="text-sm text-gray-600 mt-1">Currently happening</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Items</h2>
                <div className="space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-semibold text-gray-900">{item.type}</p>
                        {item.instructions && <p className="text-sm text-gray-600 mt-1">{item.instructions}</p>}
                      </div>
                      <span className="text-gray-600">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {order.specialInstructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Special Instructions</p>
                  <p className="text-gray-700">{order.specialInstructions}</p>
                </div>
              )}

              {/* Review Section */}
              {canReview && !order.feedback?.rating && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Leave a Review</h3>
                  {!showReview ? (
                    <button
                      onClick={() => setShowReview(true)}
                      className="w-full py-3 px-4 border border-[#48C9B0] text-[#48C9B0] rounded-lg hover:bg-[#E8FFFB] font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Star size={18} />
                      Rate & Review
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(r => (
                            <button
                              key={r}
                              onClick={() => setRating(r)}
                              className={`w-10 h-10 rounded-lg transition-all ${
                                r <= rating ? 'bg-yellow-300' : 'bg-gray-200'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Review (Optional)</label>
                        <textarea
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                          placeholder="Share your experience..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#48C9B0]"
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSubmitReview}
                          disabled={isUpdating}
                          className="flex-1 py-2 px-4 bg-[#48C9B0] text-white rounded-lg hover:bg-[#3aad9a] disabled:bg-gray-400 font-semibold"
                        >
                          {isUpdating ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          onClick={() => {
                            setShowReview(false)
                            setRating(5)
                            setReview('')
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {order.feedback?.rating && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="text-green-600" size={20} />
                    <p className="font-semibold text-green-900">Your Review</p>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  {order.feedback.review && <p className="text-gray-700">{order.feedback.review}</p>}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={18} />
                  Pricing
                </h3>
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${order.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  {order.pricing.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${order.pricing.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (10%)</span>
                    <span>${order.pricing.tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-[#48C9B0]">
                  <span>Total</span>
                  <span>${order.pricing.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Pickup & Delivery */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={18} />
                  Timeline
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Pickup Date</p>
                    <p className="font-semibold text-gray-900">
                      {order.pickupDate instanceof Date
                        ? order.pickupDate.toLocaleDateString()
                        : new Date((order.pickupDate as any).toMillis?.() || 0).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Delivery</p>
                    <p className="font-semibold text-gray-900">
                      {order.estimatedDelivery instanceof Date
                        ? order.estimatedDelivery.toLocaleDateString()
                        : new Date((order.estimatedDelivery as any).toMillis?.() || 0).toLocaleDateString()}
                    </p>
                    {daysLeft > 0 && <p className="text-xs text-gray-500 mt-1">{daysLeft} day{daysLeft !== 1 ? 's' : ''} away</p>}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={18} />
                  Delivery Address
                </h3>
                <p className="text-gray-700">
                  {order.address.street}
                  <br />
                  {order.address.city}, {order.address.state} {order.address.postcode}
                </p>
              </div>

              {/* Contact */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User size={18} className="text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{order.contact.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{order.contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{order.contact.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Info */}
              {order.assignedPro && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Assigned Pro</h3>
                  <div className="space-y-3">
                    <p className="font-semibold text-gray-900">{order.assignedPro.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold text-gray-900">{order.assignedPro.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{order.assignedPro.phone}</p>
                    <button className="w-full mt-4 py-2 px-4 border border-[#48C9B0] text-[#48C9B0] rounded-lg hover:bg-[#E8FFFB] font-semibold flex items-center justify-center gap-2">
                      <MessageSquare size={16} />
                      Message Pro
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {['pending', 'accepted'].includes(order.status) && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isUpdating}
                  className="w-full py-3 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Cancel Dialog */}
          {showCancelDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Cancel Order?</h3>
                <p className="text-gray-600 mb-4">Please let us know why you're cancelling this order (optional)</p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Tell us why..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#48C9B0] mb-4"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold"
                  >
                    {isUpdating ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                  <button
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                  >
                    Keep Order
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
