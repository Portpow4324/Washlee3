'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import EmployeeHeader from '@/components/EmployeeHeader'
import Footer from '@/components/Footer'
import { Package, Search, Filter, MapPin, Phone, Mail, DollarSign, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react'

export default function EmployeeOrders() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return
    
    setHasCheckedAuth(true)
    
    if (!user) {
      router.push('/auth/employee-signin')
    }
  }, [user, loading, router, hasCheckedAuth])

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

  // Mock orders data
  const allOrders = [
    {
      id: 'ORD-1001',
      customer: 'Sarah Mitchell',
      email: 'sarah@example.com',
      phone: '(555) 123-4567',
      status: 'in-progress',
      weight: '6 kg',
      pickup: '123 Main St, Apt 4B',
      delivery: '123 Main St, Apt 4B',
      pickupTime: 'Today 4:00 PM',
      deliveryTime: 'Tomorrow 10:00 AM',
      earnings: '$18.00',
      services: ['Standard Wash', 'Fold & Hang'],
      notes: 'Leave at door, has delicate items',
      pickupPhoto: null,
      deliveryPhoto: null,
      rating: 5,
      review: 'Excellent service!'
    },
    {
      id: 'ORD-1002',
      customer: 'John Davis',
      email: 'john.davis@example.com',
      phone: '(555) 234-5678',
      status: 'pending-pickup',
      weight: '8 kg',
      pickup: '456 Oak Ave, Suite 200',
      delivery: '456 Oak Ave, Suite 200',
      pickupTime: 'Today 6:00 PM',
      deliveryTime: 'Tomorrow 2:00 PM',
      earnings: '$24.00',
      services: ['Delicate Care', 'Hand Wash'],
      notes: 'Business clothes, call before arriving',
      pickupPhoto: null,
      deliveryPhoto: null,
      rating: null,
      review: null
    },
    {
      id: 'ORD-1003',
      customer: 'Emma Johnson',
      email: 'emma.j@example.com',
      phone: '(555) 345-6789',
      status: 'completed',
      weight: '5 kg',
      pickup: '789 Pine Rd',
      delivery: '789 Pine Rd',
      pickupTime: 'Yesterday 3:00 PM',
      deliveryTime: 'Today 11:00 AM',
      earnings: '$15.00',
      services: ['Standard Wash', 'Express Dry'],
      notes: 'Regular customer',
      pickupPhoto: 'completed',
      deliveryPhoto: 'completed',
      rating: 5,
      review: 'Fast and reliable!'
    },
    {
      id: 'ORD-1004',
      customer: 'Michael Chen',
      email: 'michael.chen@example.com',
      phone: '(555) 456-7890',
      status: 'completed',
      weight: '7 kg',
      pickup: '321 Elm St',
      delivery: '321 Elm St',
      pickupTime: '2 days ago',
      deliveryTime: '1 day ago',
      earnings: '$21.00',
      services: ['Standard Wash'],
      notes: 'No special instructions',
      pickupPhoto: 'completed',
      deliveryPhoto: 'completed',
      rating: 4,
      review: 'Good service'
    }
  ]

  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = 
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      case 'pending-pickup':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
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
      case 'pending-pickup':
        return AlertCircle
      default:
        return Package
    }
  }

  const selectedOrderData = allOrders.find(o => o.id === selectedOrder)

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <EmployeeHeader />
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
          {filteredOrders.length === 0 ? (
            <Card className="bg-mint border-primary/20 text-center py-12">
              <Package size={48} className="text-gray mx-auto mb-4 opacity-50" />
              <p className="text-gray text-lg">No orders found</p>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-dark">{order.id}</p>
                            <span className={`px-2 py-1 rounded text-xs font-semibold capitalize border ${getStatusColor(order.status)}`}>
                              {order.status.replace('-', ' ')}
                            </span>
                          </div>
                          <p className="text-gray text-sm font-semibold">{order.customer}</p>
                          <p className="text-gray text-xs">{order.weight} • {order.services.join(', ')}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-primary text-lg">{order.earnings}</p>
                      <p className="text-gray text-xs">{order.pickupTime.split(' ').slice(-2).join(' ')}</p>
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
                  <h3 className="text-xl font-bold text-dark">{selectedOrderData.id}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize border ${getStatusColor(selectedOrderData.status)}`}>
                    {selectedOrderData.status.replace('-', ' ')}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-dark text-sm uppercase tracking-wide">Customer</h4>
                  <div className="space-y-2">
                    <p className="text-dark font-bold">{selectedOrderData.customer}</p>
                    <div className="flex items-center gap-2 text-gray text-sm">
                      <Mail size={16} />
                      <a href={`mailto:${selectedOrderData.email}`} className="hover:text-primary transition">
                        {selectedOrderData.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-gray text-sm">
                      <Phone size={16} />
                      <a href={`tel:${selectedOrderData.phone}`} className="hover:text-primary transition">
                        {selectedOrderData.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Pickup Info */}
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-dark text-sm uppercase tracking-wide">Pickup</h4>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-primary mt-1 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-dark">{selectedOrderData.pickup}</p>
                      <p className="text-gray text-sm">{selectedOrderData.pickupTime}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-dark text-sm uppercase tracking-wide">Delivery</h4>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-accent mt-1 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-dark">{selectedOrderData.delivery}</p>
                      <p className="text-gray text-sm">{selectedOrderData.deliveryTime}</p>
                    </div>
                  </div>
                </div>

                {/* Services & Weight */}
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-dark text-sm uppercase tracking-wide">Order Details</h4>
                  <div className="space-y-1">
                    <p className="text-gray text-sm">Weight: <span className="text-dark font-semibold">{selectedOrderData.weight}</span></p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedOrderData.services.map((service) => (
                        <span key={service} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded font-semibold">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Earnings */}
                <div className="space-y-2 border-t border-gray-200 pt-4 bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                  <p className="text-green-400 text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
                    <DollarSign size={16} />
                    Your Earnings
                  </p>
                  <p className="text-2xl font-bold text-green-400">{selectedOrderData.earnings}</p>
                </div>

                {/* Notes */}
                {selectedOrderData.notes && (
                  <div className="space-y-2 border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-dark text-sm uppercase tracking-wide">Notes</h4>
                    <p className="text-gray text-sm italic">{selectedOrderData.notes}</p>
                  </div>
                )}

                {/* Rating */}
                {selectedOrderData.rating && (
                  <div className="space-y-2 border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-dark text-sm uppercase tracking-wide">Rating</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-lg ${i < selectedOrderData.rating! ? 'text-yellow-400' : 'text-gray'}`}>★</span>
                        ))}
                      </div>
                      <p className="text-dark font-semibold">{selectedOrderData.rating}/5</p>
                    </div>
                    {selectedOrderData.review && (
                      <p className="text-gray text-sm italic mt-2">"{selectedOrderData.review}"</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {selectedOrderData.status === 'pending-pickup' && (
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <Button className="w-full bg-gradient-to-r from-primary to-accent" size="lg">
                      Mark Pickup Complete
                    </Button>
                  </div>
                )}

                {selectedOrderData.status === 'in-progress' && (
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <Button className="w-full bg-gradient-to-r from-primary to-accent" size="lg">
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
