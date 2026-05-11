'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Footer from '@/components/Footer'
import { Package, Search, Filter, MapPin, Phone, Mail, DollarSign, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react'

interface OrderData {
  id: string
  user_id: string
  status: string
  total_price: number
  pickup_address?: any
  delivery_address?: any
  items?: any
  created_at: string
  notes?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
}

export default function EmployeeOrders() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [allOrders, setAllOrders] = useState<OrderData[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return
    
    setHasCheckedAuth(true)
    
    if (!user) {
      router.push('/auth/employee-signin')
    }
  }, [user, loading, router, hasCheckedAuth])

  // Fetch orders from database
  useEffect(() => {
    if (!user?.id) return

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true)
        
        // Fetch only orders assigned to this employee (pro_id = user.id)
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('pro_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching orders:', error)
          setOrdersLoading(false)
          return
        }

        // Fetch customer details for each order via API endpoint
        if (data && data.length > 0) {
          const { data: sessionData } = await supabase.auth.getSession()
          const authHeaders = sessionData.session?.access_token
            ? { Authorization: `Bearer ${sessionData.session.access_token}` }
            : undefined

          const ordersWithCustomers = await Promise.all(
            data.map(async (order: any) => {
              console.log('[Employee Orders] Processing order:', order.id, 'with user_id:', order.user_id)
              
              // If user_id is missing, log a warning
              if (!order.user_id) {
                console.warn('[Employee Orders] ⚠️ Order has NO user_id:', order.id)
                return {
                  ...order,
                  customer_name: 'Unknown (No user_id)',
                  customer_email: '',
                  customer_phone: '',
                }
              }
              
              try {
                // Fetch customer data via API endpoint (server-side, bypasses RLS)
                const response = await fetch(`/api/customers/profile?userId=${order.user_id}`, {
                  headers: authHeaders,
                })
                const customerData = await response.json()

                if (response.ok && customerData.name && customerData.name !== 'Unknown') {
                  console.log('[Employee Orders] ✅ Got customer data:', customerData.name, 'for user_id:', order.user_id)
                  return {
                    ...order,
                    customer_name: customerData.name,
                    customer_email: customerData.email || '',
                    customer_phone: customerData.phone || '',
                  }
                } else {
                  console.warn('[Employee Orders] ⚠️ No customer profile found for user_id:', order.user_id)
                  return {
                    ...order,
                    customer_name: 'Unknown',
                    customer_email: '',
                    customer_phone: '',
                  }
                }
              } catch (err) {
                console.error('[Employee Orders] Error fetching customer:', err)
                return {
                  ...order,
                  customer_name: 'Unknown',
                  customer_email: '',
                  customer_phone: '',
                }
              }
            })
          )
          setAllOrders(ordersWithCustomers)
        } else {
          setAllOrders([])
        }

        setOrdersLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setAllOrders([])
        setOrdersLoading(false)
      }
    }

    fetchOrders()
    
    // Auto-refresh orders every 10 seconds
    const refreshInterval = setInterval(fetchOrders, 10000)
    
    return () => clearInterval(refreshInterval)
  }, [user?.id])

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-dark font-semibold">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = 
      (order.customer_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'confirmed':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'in-progress':
        return Clock
      case 'confirmed':
        return AlertCircle
      default:
        return Package
    }
  }

  const selectedOrderData = allOrders.find(o => o.id === selectedOrder)
  
  // Extract order details from items JSON
  const getOrderDetails = (order: OrderData) => {
    if (!order.items) return { weight: 0, services: [] }
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    return {
      weight: items.weight || 0,
      bagCount: items.bagCount || 0,
      service_type: items.service_type || 'standard',
      delivery_speed: items.delivery_speed || 'standard',
      protection_plan: items.protection_plan || 'none',
      services: items.addOns ? Object.keys(items.addOns).filter(k => items.addOns[k]) : []
    }
  }

  const handleMarkPickupComplete = async () => {
    if (!selectedOrderData) return
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'in-progress' })
        .eq('id', selectedOrderData.id)

      if (!error) {
        setAllOrders(allOrders.map(o => o.id === selectedOrderData.id ? { ...o, status: 'in-progress' } : o))
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Error marking pickup complete:', error)
    }
  }

  const handleDeliverOrder = async () => {
    if (!selectedOrderData) return
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', selectedOrderData.id)

      if (!error) {
        setAllOrders(allOrders.map(o => o.id === selectedOrderData.id ? { ...o, status: 'completed' } : o))
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Error delivering order:', error)
    }
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
        <h1 className="text-4xl font-bold text-dark flex items-center gap-3">
          <Package size={36} className="text-primary" />
          Your Orders
        </h1>
        <p className="text-gray text-lg">{filteredOrders.length} orders • {allOrders.filter(o => o.status === 'completed').length} completed</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3.5 text-gray" size={20} />
          <input
            type="text"
            placeholder="Search by customer name or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 text-dark rounded-lg focus:outline-none focus:border-primary transition"
          >
            <option value="all">All Orders</option>
            <option value="pending-pickup">Pending Pickup</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-3">
          {ordersLoading ? (
            <Card className="bg-mint border-primary/20 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray text-lg">Loading orders...</p>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="bg-mint border-primary/20 text-center py-12">
              <Package size={48} className="text-gray mx-auto mb-4 opacity-50" />
              <p className="text-gray text-lg">No orders found</p>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              const details = getOrderDetails(order)
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order.id)}
                  className="cursor-pointer"
                >
                  <Card
                    className={`bg-white border-gray-200 hover:border-primary/50 cursor-pointer transition ${
                      selectedOrder === order.id ? 'border-primary/70 ring-2 ring-primary/30' : ''
                    }`}
                    hoverable
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${getStatusColor(order.status)}`}>
                          <StatusIcon size={20} />
                        </div>
                        <div className="space-y-2 flex-1">
                          <p className="text-gray text-xs">{order.id.slice(0, 8).toUpperCase()}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-dark text-lg">{order.customer_name}</p>
                            <span className={`px-2 py-1 rounded text-xs font-semibold capitalize border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-gray text-xs">{details.weight}kg • {details.service_type}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-primary text-lg">${order.total_price.toFixed(2)}</p>
                      <p className="text-gray text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  </Card>
                </div>
              )
            })
          )}
        </div>

        {/* Order Details Panel */}
        {selectedOrderData ? (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/40 sticky top-24">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-dark">{selectedOrderData.id.slice(0, 8)}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize border ${getStatusColor(selectedOrderData.status)}`}>
                    {selectedOrderData.status}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="font-bold text-dark uppercase text-xs tracking-wide">Customer</h4>
                  <p className="font-semibold text-dark">{selectedOrderData.customer_name}</p>
                  {selectedOrderData.customer_email && (
                    <p className="text-gray text-sm flex items-center gap-2">
                      <Mail size={16} />
                      {selectedOrderData.customer_email}
                    </p>
                  )}
                  {selectedOrderData.customer_phone && (
                    <p className="text-gray text-sm flex items-center gap-2">
                      <Phone size={16} />
                      {selectedOrderData.customer_phone}
                    </p>
                  )}
                </div>

                {/* Pickup Info */}
                {selectedOrderData.pickup_address && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-dark uppercase text-xs tracking-wide">Pickup</h4>
                    <p className="text-gray text-sm flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{typeof selectedOrderData.pickup_address === 'string' ? selectedOrderData.pickup_address : (selectedOrderData.pickup_address as any).address || 'Address not provided'}</span>
                    </p>
                    
                    {/* Pickup Spot */}
                    {(selectedOrderData as any).pickup_spot && (
                      <p className="text-gray text-sm flex items-center gap-2">
                        <span className="font-semibold">Spot:</span> {(selectedOrderData as any).pickup_spot?.replace('-', ' ')}
                      </p>
                    )}
                    
                    {/* Pickup Instructions */}
                    {(selectedOrderData as any).pickup_instructions && (
                      <p className="text-gray text-sm border-l-2 border-primary pl-2 italic">
                        <span className="font-semibold">Instructions:</span> {(selectedOrderData as any).pickup_instructions}
                      </p>
                    )}
                  </div>
                )}

                {/* Delivery Info */}
                {selectedOrderData.delivery_address && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-dark uppercase text-xs tracking-wide">Delivery</h4>
                    <p className="text-gray text-sm flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{typeof selectedOrderData.delivery_address === 'string' ? selectedOrderData.delivery_address : (selectedOrderData.delivery_address as any).address || 'Address not provided'}</span>
                    </p>
                  </div>
                )}

                {/* Order Details */}
                {getOrderDetails(selectedOrderData) && (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-dark uppercase text-xs tracking-wide">Order Details</h4>
                    <p className="text-gray text-sm flex items-center gap-2">
                      Weight: <span className="font-semibold text-dark">{getOrderDetails(selectedOrderData).weight} kg</span>
                    </p>
                    <p className="text-gray text-sm flex items-center gap-2">
                      Service: <span className="font-semibold text-dark capitalize">{getOrderDetails(selectedOrderData).service_type}</span>
                    </p>
                    {selectedOrderData.items && (() => {
                      try {
                        const items = typeof selectedOrderData.items === 'string' ? JSON.parse(selectedOrderData.items) : selectedOrderData.items
                        const deliverySpeed = items?.delivery_speed || items?.deliverySpeed || 'standard'
                        return (
                          <p className="text-gray text-sm flex items-center gap-2">
                            Delivery: <span className="font-semibold text-dark capitalize">{deliverySpeed === 'express' ? 'Express' : 'Standard'}</span>
                          </p>
                        )
                      } catch (err) {
                        console.warn('Could not parse delivery speed:', err)
                        return null
                      }
                    })()}
                  </div>
                )}

                {/* Laundry Preferences */}
                {((selectedOrderData as any).detergent || (selectedOrderData as any).delicate_cycle || (selectedOrderData as any).returns_on_hangers || (selectedOrderData as any).hang_dry || (selectedOrderData as any).additional_requests) && (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-dark uppercase text-xs tracking-wide">Laundry Preferences</h4>
                    
                    {(selectedOrderData as any).detergent && (
                      <p className="text-gray text-sm flex items-center gap-2">
                        Detergent: <span className="font-semibold text-dark capitalize">{(selectedOrderData as any).detergent?.replace('-', ' ')}</span>
                      </p>
                    )}
                    
                    {(selectedOrderData as any).hang_dry && (
                      <p className="text-gray text-sm flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                        Hang Dry Service Selected
                      </p>
                    )}
                    
                    {(selectedOrderData as any).delicate_cycle && (
                      <p className="text-gray text-sm flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                        Delicate Cycle Required
                      </p>
                    )}
                    
                    {(selectedOrderData as any).returns_on_hangers && (
                      <p className="text-gray text-sm flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                        Return Items on Hangers
                      </p>
                    )}
                    
                    {(selectedOrderData as any).additional_requests && (
                      <p className="text-gray text-sm border-l-2 border-primary pl-2 italic">
                        <span className="font-semibold">Special Requests:</span> {(selectedOrderData as any).additional_requests}
                      </p>
                    )}
                  </div>
                )}

                {/* Your Earnings */}
                <div className="space-y-2 pt-4 border-t border-gray-200 bg-mint rounded-lg p-4 -mx-4 -mb-4 px-4 py-4">
                  <p className="text-gray text-sm uppercase text-xs tracking-wide font-bold">Your Earnings</p>
                  <p className="text-primary text-3xl font-bold">${(selectedOrderData.total_price * 0.8).toFixed(2)}</p>
                </div>

                {/* Action Buttons */}
                {selectedOrderData.status === 'confirmed' && (
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <Button 
                      onClick={handleMarkPickupComplete}
                      className="w-full bg-gradient-to-r from-primary to-accent" 
                      size="lg"
                    >
                      Mark Pickup Complete
                    </Button>
                  </div>
                )}

                {selectedOrderData.status === 'in-progress' && (
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <Button 
                      onClick={handleDeliverOrder}
                      className="w-full bg-gradient-to-r from-primary to-accent" 
                      size="lg"
                    >
                      Deliver Order
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="bg-mint border-primary/20 flex items-center justify-center text-center py-12 sticky top-24">
            <div className="space-y-3">
              <Eye size={48} className="text-gray mx-auto opacity-50" />
              <p className="text-gray text-lg">Select an order to view details</p>
            </div>
          </Card>
        )}
      </div>
      </main>
      <Footer />
    </div>
  )
}
