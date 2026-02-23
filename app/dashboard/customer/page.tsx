'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Truck, MapPin, Clock, DollarSign, LogOut, Gift, FileText, Settings, AlertCircle, Edit2, Check, X, Bell, Eye, EyeOff, Home, CreditCard, Award, ChevronRight, Search, Filter, TrendingUp, Heart, Zap, TrendingDown, Star, Shield } from 'lucide-react'
import Spinner from '@/components/Spinner'
import { signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'

interface Order {
  id: string
  status: string
  pickupTime: string
  estimatedWeight: number
  subtotal: number
  deliverySpeed: string
  deliveryAddress: string
  createdAt: any
  addOns?: string[]
}

export default function CustomerDashboard() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  
  // Determine initial tab from URL
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      if (path.includes('/addresses')) return 'addresses'
      if (path.includes('/payments')) return 'payments'
      if (path.includes('/account')) return 'account'
      if (path.includes('/settings')) return 'settings'
      if (path.includes('/orders')) return 'orders'
    }
    return 'dashboard'
  }
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSpeed, setFilterSpeed] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const itemsPerPage = 6
  
  // Profile editing state
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState(userData?.name || '')
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameSaveError, setNameSaveError] = useState('')
  const [notificationCount, setNotificationCount] = useState(3)
  const [showNotifications, setShowNotifications] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // Initialize tab from URL on mount
  useEffect(() => {
    setActiveTab(getInitialTab())
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Update editing name when userData changes
  useEffect(() => {
    if (userData?.name) {
      setEditingName(userData.name)
    }
  }, [userData?.name])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return
      
      try {
        setOrdersLoading(true)
        setOrdersError('')
        
        // Get auth token from user
        const token = await user.getIdToken(true)
        console.log('[Dashboard] Fetching orders with auth token')
        
        // Call API endpoint to fetch user's orders
        const response = await fetch(`/api/orders/user/${user.uid}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        console.log('[Dashboard] Orders API response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch orders')
        }
        
        const data = await response.json()
        console.log('[Dashboard] Got orders:', data.count)
        
        const fetchedOrders: Order[] = data.orders.map((order: any) => ({
          id: order.id || order.orderId,
          status: order.status,
          pickupTime: order.pickupTime || 'ASAP',
          estimatedWeight: order.estimatedWeight || 0,
          subtotal: order.amount || 0,
          deliverySpeed: order.deliverySpeed || 'standard',
          deliveryAddress: order.deliveryAddress?.line1 || order.deliveryAddress || 'Not provided',
          createdAt: order.createdAt,
          addOns: order.bookingData?.addOns || [],
        } as Order))
        
        setOrders(fetchedOrders)
        setOrdersError('')
      } catch (err: any) {
        console.error('[Dashboard] Error fetching orders:', err)
        setOrdersError(err.message || 'Failed to load orders')
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleSaveName = async () => {
    if (!user || !editingName.trim()) {
      setNameSaveError('Name cannot be empty')
      return
    }

    setIsSavingName(true)
    setNameSaveError('')

    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, {
        name: editingName.trim(),
      })
      setIsEditingName(false)
    } catch (error: any) {
      console.error('Error saving name:', error)
      setNameSaveError(error.message || 'Failed to save name. Please try again.')
    } finally {
      setIsSavingName(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Enhanced Filter and Search Logic
  let filteredOrders = orders
    .filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus
      const matchesSpeed = filterSpeed === 'all' || order.deliverySpeed === filterSpeed
      return matchesSearch && matchesStatus && matchesSpeed
    })

  // Apply sorting
  if (sortBy === 'recent') {
    filteredOrders = filteredOrders.sort((a, b) => b.createdAt - a.createdAt)
  } else if (sortBy === 'oldest') {
    filteredOrders = filteredOrders.sort((a, b) => a.createdAt - b.createdAt)
  } else if (sortBy === 'highest') {
    filteredOrders = filteredOrders.sort((a, b) => (b.subtotal || 0) - (a.subtotal || 0))
  } else if (sortBy === 'lowest') {
    filteredOrders = filteredOrders.sort((a, b) => (a.subtotal || 0) - (b.subtotal || 0))
  }

  const activeOrdersCount = orders.filter(o => o.status !== 'delivered').length
  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length
  const totalSpent = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0)
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0

  const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
    confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
    picked_up: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
    in_washing: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
    ready_for_delivery: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  }
  
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    picked_up: 'Picked Up',
    in_washing: 'In Washing',
    ready_for_delivery: 'Ready for Delivery',
    delivered: 'Delivered',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Premium Animated Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#48C9B0] to-[#3aad9a] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-gradient-to-br from-[#48C9B0] to-[#3aad9a] p-2.5 rounded-lg">
                  <Truck size={24} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#48C9B0] to-[#3aad9a] bg-clip-text text-transparent">Washlee Pro</h1>
                <p className="text-xs text-gray-500">Premium Experience</p>
              </div>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 hover:text-[#48C9B0] rounded-lg transition duration-200"
                >
                  <Bell size={20} />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-lg hover:from-red-100 hover:to-pink-100 transition duration-200 font-medium text-sm hover:shadow-md"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dynamic Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1f2d2b] via-[#48C9B0] to-[#3aad9a] bg-clip-text text-transparent mb-2">
                Welcome back, {userData?.firstName || 'there'}! 👋
              </h1>
              <p className="text-gray-600 text-lg">Here's your laundry management hub</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last login: Today</p>
              <p className="text-sm text-[#48C9B0] font-semibold">Premium Member ⭐</p>
            </div>
          </div>
        </div>

        {/* Premium Stat Cards with Animations */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Orders Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg p-6 border border-emerald-200 hover:shadow-2xl transition transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-emerald-700 font-bold text-xs uppercase tracking-widest">Active Orders</p>
                <div className="bg-emerald-200 p-2 rounded-lg">
                  <Truck className="text-emerald-600" size={24} />
                </div>
              </div>
              <p className="text-5xl font-bold text-emerald-900 mb-2">{activeOrdersCount}</p>
              <p className="text-sm text-emerald-700 flex items-center gap-1">
                <TrendingUp size={14} /> In progress
              </p>
            </div>
          </div>

          {/* Completed Orders Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-2xl transition transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-blue-700 font-bold text-xs uppercase tracking-widest">Completed</p>
                <div className="bg-blue-200 p-2 rounded-lg">
                  <Check className="text-blue-600" size={24} />
                </div>
              </div>
              <p className="text-5xl font-bold text-blue-900 mb-2">{completedOrdersCount}</p>
              <p className="text-sm text-blue-700 flex items-center gap-1">
                <Star size={14} /> All time
              </p>
            </div>
          </div>

          {/* Total Spent Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 border border-purple-200 hover:shadow-2xl transition transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-purple-700 font-bold text-xs uppercase tracking-widest">Total Spent</p>
                <div className="bg-purple-200 p-2 rounded-lg">
                  <DollarSign className="text-purple-600" size={24} />
                </div>
              </div>
              <p className="text-4xl font-bold text-purple-900 mb-2">${totalSpent.toFixed(2)}</p>
              <p className="text-sm text-purple-700 flex items-center gap-1">
                <Zap size={14} /> Lifetime value
              </p>
            </div>
          </div>

          {/* Average Order Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-200 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-lg p-6 border border-amber-200 hover:shadow-2xl transition transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-amber-700 font-bold text-xs uppercase tracking-widest">Avg Order</p>
                <div className="bg-amber-200 p-2 rounded-lg">
                  <Award className="text-amber-600" size={24} />
                </div>
              </div>
              <p className="text-4xl font-bold text-amber-900 mb-2">${avgOrderValue.toFixed(2)}</p>
              <p className="text-sm text-amber-700 flex items-center gap-1">
                <TrendingDown size={14} /> Per order
              </p>
            </div>
          </div>
        </div>

        {/* Premium Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200 backdrop-blur">
          <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'orders', label: 'Orders', icon: Truck, badge: activeOrdersCount },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'account', label: 'Account', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative px-6 py-4 font-semibold transition flex items-center gap-2 whitespace-nowrap border-b-4 group ${
                  activeTab === id
                    ? 'text-[#48C9B0] border-[#48C9B0] bg-gradient-to-b from-mint/50 to-transparent'
                    : 'text-gray-600 border-transparent hover:text-[#48C9B0] hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
                {badge && badge > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8 min-h-[600px]">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-[#1f2d2b] mb-6 flex items-center gap-2">
                    <Home size={28} className="text-[#48C9B0]" />
                    Dashboard Overview
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* This Month Stats */}
                    <div className="bg-gradient-to-br from-teal-50 via-mint to-emerald-50 rounded-xl p-6 border-2 border-teal-200 hover:shadow-lg transition">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-teal-700 font-bold text-sm uppercase tracking-widest">📊 This Month</p>
                        <TrendingUp className="text-teal-600" size={24} />
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg backdrop-blur">
                          <span className="text-teal-900 font-semibold">Orders:</span>
                          <span className="font-bold text-teal-900 text-lg">{orders.filter(o => {
                            const date = o.createdAt?.toDate ? new Date(o.createdAt.toDate()) : new Date(o.createdAt)
                            const now = new Date()
                            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                          }).length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg backdrop-blur">
                          <span className="text-teal-900 font-semibold">Amount Spent:</span>
                          <span className="font-bold text-teal-900 text-lg">${orders.filter(o => {
                            const date = o.createdAt?.toDate ? new Date(o.createdAt.toDate()) : new Date(o.createdAt)
                            const now = new Date()
                            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                          }).reduce((sum, o) => sum + (o.subtotal || 0), 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200 hover:shadow-lg transition">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-orange-700 font-bold text-sm uppercase tracking-widest">⚡ Quick Actions</p>
                        <Zap className="text-orange-600" size={24} />
                      </div>
                      <div className="space-y-3">
                        <button onClick={() => setActiveTab('orders')} className="w-full p-3 bg-white/60 hover:bg-white text-orange-900 rounded-lg font-semibold transition backdrop-blur flex items-center justify-between">
                          View Active Orders <ChevronRight size={18} />
                        </button>
                        <button onClick={() => router.push('/booking')} className="w-full p-3 bg-white/60 hover:bg-white text-orange-900 rounded-lg font-semibold transition backdrop-blur flex items-center justify-between">
                          Place New Order <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                {orders.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-[#1f2d2b] flex items-center gap-2">
                        <Truck size={24} className="text-[#48C9B0]" />
                        Recent Orders
                      </h3>
                      <button onClick={() => setActiveTab('orders')} className="text-[#48C9B0] hover:text-[#3aad9a] font-semibold flex items-center gap-2 transition">
                        View All <ChevronRight size={18} />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {orders.slice(0, 4).map((order) => {
                        const createdDate = order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()
                        
                        return (
                          <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-xl hover:border-[#48C9B0]/50 transition transform hover:-translate-y-0.5">
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-bold text-[#1f2d2b] truncate">{order.id.slice(0, 12)}</p>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]?.badge || 'bg-gray-100 text-gray-700'}`}>
                                {statusLabels[order.status] || order.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">{createdDate} • {order.estimatedWeight}kg</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin size={14} />
                                <span className="truncate">{order.deliveryAddress?.slice(0, 25)}</span>
                              </div>
                              <p className="font-bold text-[#48C9B0]">${order.subtotal?.toFixed(2)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <h2 className="text-3xl font-bold text-[#1f2d2b] flex items-center gap-2">
                    <Truck size={28} className="text-[#48C9B0]" />
                    All Orders
                  </h2>
                  <Button onClick={() => router.push('/booking')} className="flex items-center gap-2 shadow-lg">
                    <span>+</span> New Order
                  </Button>
                </div>

                {/* Advanced Search & Filter */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                      <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by order ID or address..."
                        className="pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] focus:border-transparent text-sm w-full transition"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] focus:border-transparent text-sm font-medium transition"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="picked_up">Picked Up</option>
                      <option value="in_washing">In Washing</option>
                      <option value="ready_for_delivery">Ready</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] focus:border-transparent text-sm font-medium transition"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Price</option>
                      <option value="lowest">Lowest Price</option>
                    </select>
                  </div>
                </div>

                {ordersError && (
                  <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex gap-3 shadow-sm">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <p className="font-semibold">{ordersError}</p>
                  </div>
                )}

                {ordersLoading ? (
                  <div className="text-center py-20">
                    <div className="inline-block">
                      <Spinner />
                    </div>
                    <p className="mt-6 text-gray font-semibold text-lg">Fetching your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-3 border-dashed border-blue-200 rounded-2xl p-16 text-center hover:shadow-lg transition">
                    <Truck size={56} className="text-blue-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-[#1f2d2b] mb-2">No Orders Yet</h3>
                    <p className="text-gray-600 mb-8 text-lg">Start your laundry journey with your first order</p>
                    <Button onClick={() => router.push('/booking')} className="text-lg py-3">
                      Place Your First Order
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-4 mb-6">
                      {filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => {
                        const createdDate = order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()
                        const isExpanded = expandedOrder === order.id
                        
                        return (
                          <div key={order.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#48C9B0]/50 hover:shadow-xl transition">
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition"
                            >
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                  <p className="font-bold text-[#1f2d2b] text-lg">{order.id}</p>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]?.badge || 'bg-gray-100 text-gray-700'}`}>
                                    {statusLabels[order.status] || order.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{createdDate} • {order.estimatedWeight}kg • ${order.subtotal?.toFixed(2)}</p>
                              </div>
                              <ChevronRight className={`transition transform ${isExpanded ? 'rotate-90' : ''}`} size={20} />
                            </button>

                            {isExpanded && (
                              <div className="bg-gradient-to-r from-gray-50 to-white border-t-2 border-gray-200 px-6 py-4 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1 uppercase font-bold tracking-widest">Weight</p>
                                    <p className="font-bold text-[#1f2d2b] text-lg">{order.estimatedWeight} kg</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1 uppercase font-bold tracking-widest">Pickup</p>
                                    <p className="font-bold text-[#1f2d2b] text-sm">{order.pickupTime}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1 uppercase font-bold tracking-widest">Delivery</p>
                                    <p className="font-bold text-[#1f2d2b] text-sm capitalize">{order.deliverySpeed}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1 uppercase font-bold tracking-widest">Total</p>
                                    <p className="font-bold text-[#48C9B0] text-lg">${order.subtotal?.toFixed(2)}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-gray-200">
                                  <MapPin size={16} className="text-[#48C9B0] mt-0.5 flex-shrink-0" />
                                  <p className="text-gray-700 font-semibold">{order.deliveryAddress}</p>
                                </div>
                                {order.addOns && order.addOns.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-600 uppercase font-bold tracking-widest mb-2">Add-ons</p>
                                    <div className="flex flex-wrap gap-2">
                                      {order.addOns.map((addon, idx) => (
                                        <span key={idx} className="bg-mint text-[#48C9B0] px-3 py-1 rounded-full text-xs font-semibold">
                                          {addon}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="flex gap-3 pt-2">
                                  <Button size="sm" onClick={() => router.push(`/tracking/${order.id}`)} className="flex-1">
                                    Track Order
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => router.push(`/booking?orderId=${order.id}`)} className="flex-1">
                                    Reorder
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Pagination */}
                    {filteredOrders.length > itemsPerPage && (
                      <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#48C9B0] transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-gray-700"
                        >
                          ← Previous
                        </button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: Math.ceil(filteredOrders.length / itemsPerPage) }).map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-10 h-10 rounded-lg font-bold transition ${
                                currentPage === i + 1
                                  ? 'bg-[#48C9B0] text-white shadow-lg'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredOrders.length / itemsPerPage), prev + 1))}
                          disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                          className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#48C9B0] transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-gray-700"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-[#1f2d2b] flex items-center gap-2">
                    <MapPin size={28} className="text-[#48C9B0]" />
                    Delivery Addresses
                  </h2>
                  <Button size="sm" className="shadow-lg">+ Add New</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#48C9B0] to-[#3aad9a] rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                    <div className="relative bg-gradient-to-br from-mint to-white rounded-xl p-6 border-2 border-[#48C9B0] shadow-lg group-hover:shadow-2xl transition">
                      <div className="flex items-start justify-between mb-4">
                        <span className="bg-gradient-to-r from-[#48C9B0] to-[#3aad9a] text-white px-4 py-1.5 rounded-full text-xs font-bold">⭐ Default</span>
                        <Heart size={24} className="text-[#48C9B0] fill-current" />
                      </div>
                      <p className="font-bold text-[#1f2d2b] text-lg mb-2">Home</p>
                      <p className="text-gray-700 font-semibold">{userData?.address || 'No address set'}</p>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs">Edit</Button>
                        <Button size="sm" variant="outline" className="flex-1 text-xs">Delete</Button>
                      </div>
                    </div>
                  </div>
                  <div className="border-3 border-dashed border-gray-300 rounded-xl p-8 flex items-center justify-center hover:border-[#48C9B0] hover:bg-mint/50 transition cursor-pointer group">
                    <div className="text-center">
                      <MapPin size={40} className="text-gray-300 mx-auto mb-3 group-hover:text-[#48C9B0] transition" />
                      <p className="text-gray-600 font-bold text-lg">Add New Address</p>
                      <p className="text-gray-500 text-sm mt-1">Click to add delivery address</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-[#1f2d2b] flex items-center gap-2">
                    <CreditCard size={28} className="text-[#48C9B0]" />
                    Payment Methods
                  </h2>
                  <Button size="sm" className="shadow-lg">+ Add Card</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                    <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-300 shadow-lg group-hover:shadow-2xl transition">
                      <div className="flex items-start justify-between mb-4">
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1.5 rounded-full text-xs font-bold">⭐ Default</span>
                        <CreditCard size={28} className="text-indigo-600" />
                      </div>
                      <p className="font-mono font-bold text-[#1f2d2b] text-xl mb-2 tracking-widest">•••• •••• •••• 4242</p>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-700 font-semibold">Expires 12/25</p>
                        <p className="text-gray-600 text-sm">Visa</p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs">Edit</Button>
                        <Button size="sm" variant="outline" className="flex-1 text-xs">Remove</Button>
                      </div>
                    </div>
                  </div>
                  <div className="border-3 border-dashed border-gray-300 rounded-xl p-8 flex items-center justify-center hover:border-[#48C9B0] hover:bg-mint/50 transition cursor-pointer group">
                    <div className="text-center">
                      <CreditCard size={40} className="text-gray-300 mx-auto mb-3 group-hover:text-[#48C9B0] transition" />
                      <p className="text-gray-600 font-bold text-lg">Add Payment Method</p>
                      <p className="text-gray-500 text-sm mt-1">Add a new credit or debit card</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="animate-fade-in">
                <h2 className="text-3xl font-bold text-[#1f2d2b] mb-6 flex items-center gap-2">
                  <FileText size={28} className="text-[#48C9B0]" />
                  Account Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#48C9B0]/50 transition">
                    <p className="text-xs text-gray-600 mb-2 uppercase font-bold tracking-widest">First Name</p>
                    <p className="text-2xl font-bold text-[#1f2d2b]">{userData?.firstName || 'Not set'}</p>
                  </div>

                  {/* Last Name */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#48C9B0]/50 transition">
                    <p className="text-xs text-gray-600 mb-2 uppercase font-bold tracking-widest">Last Name</p>
                    <p className="text-2xl font-bold text-[#1f2d2b]">{userData?.lastName || 'Not set'}</p>
                  </div>

                  {/* Email */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#48C9B0]/50 transition">
                    <p className="text-xs text-gray-600 mb-2 uppercase font-bold tracking-widest">Email Address</p>
                    <p className="text-lg font-semibold text-[#1f2d2b] break-all">{userData?.email}</p>
                  </div>

                  {/* Phone */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#48C9B0]/50 transition">
                    <p className="text-xs text-gray-600 mb-2 uppercase font-bold tracking-widest">Phone Number</p>
                    <p className="text-lg font-semibold text-[#1f2d2b]">{userData?.phone || 'Not provided'}</p>
                  </div>

                  {/* Member Since */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#48C9B0]/50 transition">
                    <p className="text-xs text-gray-600 mb-2 uppercase font-bold tracking-widest">Member Since</p>
                    <p className="text-lg font-semibold text-[#1f2d2b]">
                      {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  {/* Account Type */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-[#48C9B0]/50 transition">
                    <p className="text-xs text-gray-600 mb-2 uppercase font-bold tracking-widest">Account Type</p>
                    <p className="text-lg font-semibold text-[#1f2d2b] capitalize flex items-center gap-2">
                      <Shield size={20} className="text-[#48C9B0]" />
                      {userData?.userType || 'Customer'} ⭐
                    </p>
                  </div>

                  {/* Full Name Edit */}
                  <div className="md:col-span-2 bg-gradient-to-br from-[#48C9B0]/10 via-mint to-transparent rounded-xl p-6 border-3 border-[#48C9B0]/30 hover:border-[#48C9B0]/50 transition">
                    <p className="text-xs text-gray-600 mb-3 uppercase font-bold tracking-widest">📝 Edit Full Name</p>
                    {isEditingName ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-[#48C9B0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0]/50 font-semibold text-lg"
                          placeholder="Enter your full name"
                          disabled={isSavingName}
                        />
                        <button
                          onClick={() => handleSaveName()}
                          disabled={isSavingName}
                          className="p-3 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition disabled:opacity-50"
                          title="Save"
                        >
                          {isSavingName ? <Spinner /> : <Check size={20} />}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingName(false)
                            setEditingName(userData?.name || '')
                            setNameSaveError('')
                          }}
                          className="p-3 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg transition"
                          title="Cancel"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-white/60 backdrop-blur p-4 rounded-lg border border-white/50">
                        <p className="text-xl font-bold text-[#1f2d2b]">{userData?.name || 'Not set'}</p>
                        <button
                          onClick={() => {
                            setIsEditingName(true)
                            setEditingName(userData?.name || '')
                          }}
                          className="p-2.5 bg-[#48C9B0]/20 text-[#48C9B0] hover:bg-[#48C9B0]/30 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    )}
                    {nameSaveError && <p className="text-red-600 text-sm mt-3 font-semibold">{nameSaveError}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="animate-fade-in">
                <h2 className="text-3xl font-bold text-[#1f2d2b] mb-6 flex items-center gap-2">
                  <Settings size={28} className="text-[#48C9B0]" />
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      title: '📦 Order Updates',
                      desc: 'Get notified about order status changes',
                      default: true
                    },
                    {
                      title: '🎉 Promotional Offers',
                      desc: 'Receive special deals and promotions',
                      default: userData?.marketingTexts ?? false
                    },
                    {
                      title: '🔔 Account Notifications',
                      desc: 'Important account updates and security alerts',
                      default: userData?.accountTexts ?? true
                    },
                    {
                      title: '💬 SMS Messages',
                      desc: 'Receive updates via text message',
                      default: true
                    }
                  ].map((setting, idx) => (
                    <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-[#48C9B0]/50 transition">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>
                          <p className="font-bold text-[#1f2d2b] text-lg">{setting.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{setting.desc}</p>
                        </span>
                        <input
                          type="checkbox"
                          defaultChecked={setting.default}
                          className="w-6 h-6 cursor-pointer accent-[#48C9B0]"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <Button className="mt-8 w-full md:w-auto shadow-lg">💾 Save Preferences</Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="bg-gradient-to-r from-[#1f2d2b] to-[#2a3f3c] text-white border-t-4 border-[#48C9B0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="text-[#48C9B0]" size={28} />
                <h3 className="font-bold text-xl">Washlee</h3>
              </div>
              <p className="text-gray-300 text-sm">Your premium laundry service partner</p>
            </div>
            <div>
              <h3 className="font-bold text-[#48C9B0] mb-4 uppercase tracking-widest">Support</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><a href="#" className="hover:text-[#48C9B0] transition">Help Center</a></li>
                <li><a href="#" className="hover:text-[#48C9B0] transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#48C9B0] transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[#48C9B0] mb-4 uppercase tracking-widest">Company</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><a href="#" className="hover:text-[#48C9B0] transition">About Us</a></li>
                <li><a href="#" className="hover:text-[#48C9B0] transition">Careers</a></li>
                <li><a href="#" className="hover:text-[#48C9B0] transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[#48C9B0] mb-4 uppercase tracking-widest">Legal</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><a href="#" className="hover:text-[#48C9B0] transition">Privacy</a></li>
                <li><a href="#" className="hover:text-[#48C9B0] transition">Terms</a></li>
                <li><a href="#" className="hover:text-[#48C9B0] transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Washlee. All rights reserved. | Crafted with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
