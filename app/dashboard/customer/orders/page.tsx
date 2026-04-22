'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import RemoveOrderWarningModal from '@/components/RemoveOrderWarningModal'
import {
  Clock, MapPin, Phone, Mail, Edit2, X, Check, AlertCircle, Trash2,
  Package, DollarSign, FileText, Droplet, Wind
} from 'lucide-react'

interface Order {
  id: string
  status: string
  total_price: number
  pickup_address?: string
  delivery_address?: string
  pickup_spot?: string
  pickup_instructions?: string
  delivery_instructions?: string
  detergent?: string
  delicate_cycle?: boolean
  returns_on_hangers?: boolean
  hang_dry?: boolean
  additional_requests?: string
  items?: string
  notes?: string
  created_at: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
}

export default function CustomerOrders() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState('')
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Fetch orders
  const fetchOrders = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setOrders(data || [])
      console.log('[Orders] Fetched orders:', data?.length)
    } catch (err) {
      console.error('[Orders] Error fetching orders:', err)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user?.id])

  const selectedOrderData = selectedOrder ? orders.find(o => o.id === selectedOrder) : null

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValue(currentValue)
  }

  const handleSaveField = async (field: string, value: string) => {
    if (!selectedOrderData) return

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ [field]: value })
        .eq('id', selectedOrderData.id)

      if (updateError) throw updateError

      // Update local state
      setOrders(orders.map(o => 
        o.id === selectedOrderData.id 
          ? { ...o, [field]: value }
          : o
      ))
      setEditingField(null)
    } catch (err) {
      console.error('Error updating order:', err)
      setError('Failed to update order')
    }
  }

  const handleRemoveOrder = async () => {
    if (!deletingOrderId) {
      console.error('[Delete] No deletingOrderId set')
      return
    }

    console.log('[Delete] Starting deletion for order:', deletingOrderId)
    console.log('[Delete] Current user ID:', user?.id)
    setDeleteLoading(true)
    setDeleteError('')

    try {
      console.log('[Delete] Sending API request...')
      const response = await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: deletingOrderId,
          userId: user?.id
        }),
      })

      console.log('[Delete] API response status:', response.status)

      if (!response.ok) {
        const data = await response.json()
        console.error('[Delete] API error:', data)
        throw new Error(data.error || 'Failed to delete order')
      }

      const responseData = await response.json()
      console.log('[Delete] Success response:', responseData)

      // Refetch orders from database
      console.log('[Delete] Refetching orders...')
      await fetchOrders()
      
      // Close modal and reset
      setShowRemoveModal(false)
      setDeletingOrderId(null)
      if (selectedOrder === deletingOrderId) {
        setSelectedOrder(null)
      }

      // Show success message for 3 seconds
      setSuccessMessage('✅ Order removed from your list')
      setTimeout(() => setSuccessMessage(''), 3000)

      console.log('[Delete] Order successfully removed:', deletingOrderId)
    } catch (err) {
      console.error('[Delete] Error:', err)
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete order')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openRemoveModal = (orderId: string) => {
    console.log('[Remove] Opening modal for order:', orderId)
    setDeletingOrderId(orderId)
    setShowRemoveModal(true)
    console.log('[Remove] Modal state set - showRemoveModal:', true)
  }

  const closeRemoveModal = () => {
    console.log('[Remove] Closing modal')
    setShowRemoveModal(false)
    setDeletingOrderId(null)
    setDeleteError('')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      'in-progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  if (authLoading || loading) {
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

  if (!user) return null

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg flex items-center gap-3">
              <Check size={24} className="text-green-600" />
              <p className="text-green-800 font-semibold">{successMessage}</p>
            </div>
          )}

          <h1 className="text-4xl font-bold text-dark mb-2">My Orders</h1>
          <p className="text-gray mb-8">View and manage your laundry orders</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Orders List */}
            <div className="lg:col-span-1">
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <Card className="bg-mint border-primary/20 text-center py-12">
                    <Package size={48} className="text-gray mx-auto mb-4 opacity-50" />
                    <p className="text-gray">No orders found</p>
                  </Card>
                ) : (
                  orders.map(order => (
                    <Card
                      key={order.id}
                      className={`cursor-pointer border-2 transition ${
                        selectedOrder === order.id
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-gray-200 hover:border-primary/30'
                      }`}
                      hoverable
                    >
                      <div onClick={() => setSelectedOrder(order.id)} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray font-mono">{order.id.slice(0, 8)}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="font-semibold text-dark">${order.total_price.toFixed(2)}</p>
                        <p className="text-xs text-gray">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openRemoveModal(order.id)
                          }}
                          className="w-full mt-2 flex items-center justify-center gap-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 transition"
                        >
                          <Trash2 size={14} />
                          Remove from List
                        </button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Order Details & Edit */}
            <div className="lg:col-span-2">
              {selectedOrderData ? (
                <div className="space-y-4">
                  <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/40">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <h3 className="text-2xl font-bold text-dark">Order #{selectedOrderData.id.slice(0, 8)}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedOrderData.status)}`}>
                          {selectedOrderData.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                        <DollarSign size={24} className="text-primary" />
                        <div>
                          <p className="text-gray text-sm">Total Price</p>
                          <p className="text-3xl font-bold text-primary">${selectedOrderData.total_price.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Pickup Location */}
                      {selectedOrderData.pickup_address && (
                        <div className="space-y-2 pt-4 border-t border-gray-200">
                          <h4 className="font-bold text-dark uppercase text-xs tracking-wide">Pickup Location</h4>
                          <p className="text-gray text-sm flex items-start gap-2">
                            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                            {selectedOrderData.pickup_address}
                          </p>
                          
                          {selectedOrderData.pickup_spot && (
                            <div className="bg-blue-50 rounded p-3 border border-blue-200">
                              <p className="text-sm text-blue-900">
                                <span className="font-semibold">Spot:</span> {selectedOrderData.pickup_spot.replace('-', ' ')}
                              </p>
                            </div>
                          )}

                          {/* Editable Pickup Instructions */}
                          <div className="space-y-2">
                            {editingField === 'pickup_instructions' ? (
                              <div className="bg-white rounded p-3 border-2 border-primary space-y-2">
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  rows={3}
                                  placeholder="Add pickup instructions..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleSaveField('pickup_instructions', editValue)}
                                    size="sm"
                                    className="flex-1"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    onClick={() => setEditingField(null)}
                                    size="sm"
                                    className="flex-1 bg-gray-300 hover:bg-gray-400"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded p-3 border border-gray-200 flex items-start justify-between group">
                                <div className="flex-1">
                                  {selectedOrderData.pickup_instructions ? (
                                    <p className="text-sm text-gray italic">"{selectedOrderData.pickup_instructions}"</p>
                                  ) : (
                                    <p className="text-sm text-gray-400">No pickup instructions</p>
                                  )}
                                </div>
                                {selectedOrderData.status === 'confirmed' && (
                                  <button
                                    onClick={() => handleEditField('pickup_instructions', selectedOrderData.pickup_instructions || '')}
                                    className="opacity-0 group-hover:opacity-100 transition ml-2"
                                  >
                                    <Edit2 size={16} className="text-primary" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Delivery Location */}
                      {selectedOrderData.delivery_address && (
                        <div className="space-y-2 pt-4 border-t border-gray-200">
                          <h4 className="font-bold text-dark uppercase text-xs tracking-wide">Delivery Location</h4>
                          <p className="text-gray text-sm flex items-start gap-2">
                            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                            {selectedOrderData.delivery_address}
                          </p>

                          {/* Editable Delivery Instructions */}
                          <div className="space-y-2">
                            {editingField === 'delivery_instructions' ? (
                              <div className="bg-white rounded p-3 border-2 border-primary space-y-2">
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  rows={3}
                                  placeholder="Add delivery instructions..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleSaveField('delivery_instructions', editValue)}
                                    size="sm"
                                    className="flex-1"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    onClick={() => setEditingField(null)}
                                    size="sm"
                                    className="flex-1 bg-gray-300 hover:bg-gray-400"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded p-3 border border-gray-200 flex items-start justify-between group">
                                <div className="flex-1">
                                  {selectedOrderData.delivery_instructions ? (
                                    <p className="text-sm text-gray italic">"{selectedOrderData.delivery_instructions}"</p>
                                  ) : (
                                    <p className="text-sm text-gray-400">No delivery instructions</p>
                                  )}
                                </div>
                                {selectedOrderData.status === 'confirmed' && (
                                  <button
                                    onClick={() => handleEditField('delivery_instructions', selectedOrderData.delivery_instructions || '')}
                                    className="opacity-0 group-hover:opacity-100 transition ml-2"
                                  >
                                    <Edit2 size={16} className="text-primary" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Laundry Preferences */}
                      {(selectedOrderData.detergent || selectedOrderData.delicate_cycle || selectedOrderData.returns_on_hangers || selectedOrderData.hang_dry) && (
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                          <h4 className="font-bold text-dark uppercase text-xs tracking-wide">Laundry Preferences</h4>
                          
                          {selectedOrderData.detergent && (
                            <div className="flex items-center gap-2">
                              <Droplet size={16} className="text-primary" />
                              <span className="text-gray text-sm">
                                <span className="font-semibold">Detergent:</span> {selectedOrderData.detergent.replace('-', ' ')}
                              </span>
                            </div>
                          )}
                          
                          {selectedOrderData.hang_dry && (
                            <div className="flex items-center gap-2">
                              <Wind size={16} className="text-primary" />
                              <span className="text-gray text-sm">Hang Dry Service</span>
                            </div>
                          )}
                          
                          {selectedOrderData.delicate_cycle && (
                            <div className="flex items-center gap-2">
                              <Check size={16} className="text-primary" />
                              <span className="text-gray text-sm">Delicate Cycle</span>
                            </div>
                          )}
                          
                          {selectedOrderData.returns_on_hangers && (
                            <div className="flex items-center gap-2">
                              <Check size={16} className="text-primary" />
                              <span className="text-gray text-sm">Return on Hangers</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Additional Requests */}
                      {selectedOrderData.additional_requests && (
                        <div className="space-y-2 pt-4 border-t border-gray-200 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-start gap-2">
                            <FileText size={16} className="text-yellow-700 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-yellow-900 uppercase">Special Requests</p>
                              <p className="text-sm text-yellow-900">{selectedOrderData.additional_requests}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Created Date */}
                      <div className="pt-4 border-t border-gray-200 flex items-center gap-2 text-gray text-sm">
                        <Clock size={16} />
                        <span>Placed on {new Date(selectedOrderData.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="bg-mint border-primary/20 flex items-center justify-center text-center py-24">
                  <div className="space-y-3">
                    <Package size={48} className="text-gray mx-auto opacity-50" />
                    <p className="text-gray text-lg">Select an order to view details</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <RemoveOrderWarningModal
        isOpen={showRemoveModal}
        orderAmount={deletingOrderId ? (orders.find(o => o.id === deletingOrderId)?.total_price || 0) : 0}
        onConfirm={handleRemoveOrder}
        onCancel={closeRemoveModal}
        isLoading={deleteLoading}
        error={deleteError}
      />
      <Footer />
    </>
  )
}
