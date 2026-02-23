'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Lock, Users, Briefcase, LogOut, Eye, EyeOff, ShoppingCart, BarChart3, TrendingUp, AlertCircle, Search, Filter, Download, ChevronDown, CheckCircle, AlertTriangle, Clock, Zap, Globe, Bell, RefreshCw } from 'lucide-react'
import { db, auth } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { 
  getPendingPaymentUsers, 
  getActiveSubscriptionUsers, 
  getWashClubUsers, 
  getEmployeeUsers, 
  getCustomerOnlyUsers,
  confirmPayment,
  rejectPayment
} from '@/lib/adminSortingService'

interface EmployeeAccount {
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string
  state: string
  status: string
  verificationStatus: string
  rating: number
  totalJobs: number
  totalEarnings: number
  hasCustomerProfile: boolean
  createdAt: any
}

interface CustomerAccount {
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string
  status: string
  personalUse: boolean
  ageOver65: boolean
  totalOrders: number
  totalSpent: number
  rating: number
  hasEmployeeProfile: boolean
  createdAt: any
}

export default function SecretAdminDashboard() {
  const router = useRouter()
  const userManagementRef = useRef<HTMLDivElement>(null)
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [employees, setEmployees] = useState<EmployeeAccount[]>([])
  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [activeUserTab, setActiveUserTab] = useState<'all' | 'employees' | 'customers'>('all')
  const [errorMessage, setErrorMessage] = useState('')
  const [isRealtimeActive, setIsRealtimeActive] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')
  const [syncing, setSyncing] = useState(false)
  const [authUsers, setAuthUsers] = useState<any[]>([])
  const [analytics, setAnalytics] = useState({
    orders: {
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      activePercentage: 0,
      completionRate: 0,
      cancellationRate: 0,
    },
    revenue: {
      total: 0,
      average: 0,
      stripeVerified: 0,
      refunds: 0,
    },
    users: {
      totalCustomers: 0,
      totalEmployees: 0,
    },
    stripe: {
      stripeCharges: 0,
      stripeRevenue: 0,
      stripeRefunds: 0,
      stripeFailedCharges: 0,
    },
    dateRange: '30days',
    generatedAt: '',
  })
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsDateRange, setAnalyticsDateRange] = useState('30days')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState('recent')

  // Admin Sorting State
  const [sortingView, setSortingView] = useState<'pending-payments' | 'subscriptions' | 'wash-club' | 'employees' | 'customers-only'>('pending-payments')
  const [sortingData, setSortingData] = useState<any[]>([])
  const [sortingLoading, setSortingLoading] = useState(false)
  const [sortingError, setSortingError] = useState('')
  const [sortingLastUpdated, setSortingLastUpdated] = useState<Date | null>(null)
  const [confirmingUid, setConfirmingUid] = useState<string | null>(null)
  const [rejectingUid, setRejectingUid] = useState<string | null>(null)

  // Filtered employees
  const filteredEmployees = employees
    .filter(emp => {
      const matchesSearch = emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           emp.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || emp.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'earnings') return (b.totalEarnings || 0) - (a.totalEarnings || 0)
      if (sortBy === 'jobs') return (b.totalJobs || 0) - (a.totalJobs || 0)
      return 0
    })

  // Filtered customers
  const filteredCustomers = customers
    .filter(cust => {
      const matchesSearch = cust.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           cust.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           cust.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || cust.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'spending') return (b.totalSpent || 0) - (a.totalSpent || 0)
      if (sortBy === 'orders') return (b.totalOrders || 0) - (a.totalOrders || 0)
      return 0
    })

  // Real-time listeners for customers, employees, and orders
  useEffect(() => {
    if (!isAuthenticated) return

    // Real-time listener for customers
    const customersRef = collection(db, 'customers')
    const customersQuery = query(customersRef, orderBy('createdAt', 'desc'))
    
    const unsubscribeCustomers = onSnapshot(
      customersQuery,
      (snapshot) => {
        const customersList: CustomerAccount[] = []
        snapshot.forEach((doc) => {
          customersList.push({
            uid: doc.id,
            ...doc.data()
          } as CustomerAccount)
        })
        setCustomers(customersList)
        setLastSyncTime(new Date().toLocaleTimeString())
      },
      (error) => {
        console.error('Error with customer real-time listener:', error)
        setErrorMessage('Real-time sync failed for customers')
      }
    )

    // Real-time listener for employees
    const employeesRef = collection(db, 'employees')
    const employeesQuery = query(employeesRef, orderBy('createdAt', 'desc'))
    
    const unsubscribeEmployees = onSnapshot(
      employeesQuery,
      (snapshot) => {
        const employeesList: EmployeeAccount[] = []
        snapshot.forEach((doc) => {
          employeesList.push({
            uid: doc.id,
            ...doc.data()
          } as EmployeeAccount)
        })
        setEmployees(employeesList)
      },
      (error) => {
        console.error('Error with employee real-time listener:', error)
      }
    )

    // Real-time listener for orders (to trigger analytics updates)
    const ordersRef = collection(db, 'orders')
    const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'))
    
    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        // Trigger analytics refresh when orders change
        fetchAnalytics()
      },
      (error) => {
        console.error('Error with orders real-time listener:', error)
      }
    )

    setIsRealtimeActive(true)

    return () => {
      unsubscribeCustomers()
      unsubscribeEmployees()
      unsubscribeOrders()
      setIsRealtimeActive(false)
    }
  }, [isAuthenticated])

  const ADMIN_PASSWORD = 'LukaAnthony040107'

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Trim whitespace from password input
    const trimmedPassword = password.trim()
    
    if (trimmedPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setErrorMessage('')
      fetchEmployees()
      fetchCustomers()
      fetchAnalytics()
    } else {
      console.error('Password mismatch:', {
        entered: `"${trimmedPassword}"`,
        length: trimmedPassword.length,
        expected: `"${ADMIN_PASSWORD}"`,
        expectedLength: ADMIN_PASSWORD.length
      })
      setErrorMessage('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const employeesRef = collection(db, 'employees')
      const q = query(employeesRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const employeesList: EmployeeAccount[] = []
      snapshot.forEach((doc) => {
        employeesList.push({
          uid: doc.id,
          ...doc.data()
        } as EmployeeAccount)
      })
      
      setEmployees(employeesList)
    } catch (error) {
      console.error('Error fetching employees:', error)
      setErrorMessage('Failed to fetch employees')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      const customersRef = collection(db, 'customers')
      const q = query(customersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const customersList: CustomerAccount[] = []
      snapshot.forEach((doc) => {
        customersList.push({
          uid: doc.id,
          ...doc.data()
        } as CustomerAccount)
      })
      
      setCustomers(customersList)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setErrorMessage('Failed to fetch customers')
    } finally {
      setLoadingCustomers(false)
    }
  }

  // Fetch Firebase Auth users to show as employees
  const fetchFirebaseAuthUsers = async () => {
    try {
      setSyncing(true)
      setErrorMessage('')
      
      // Fetch all customers first to see who already has profiles
      const customersRef = collection(db, 'customers')
      const customersSnap = await getDocs(customersRef)
      const existingUids = new Set(customersSnap.docs.map(d => d.id))
      
      // Get Firebase Auth users via API endpoint
      const response = await fetch('/api/admin/get-auth-users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch auth users')
      }
      
      const data = await response.json()
      const newUsers = data.users.filter((u: any) => !existingUids.has(u.uid))
      setAuthUsers(newUsers)
      setLastSyncTime(new Date().toLocaleTimeString())
      
      if (newUsers.length > 0) {
        setErrorMessage(`Found ${newUsers.length} new Firebase auth users that could be synced as employees`)
      }
    } catch (error) {
      console.error('Error fetching auth users:', error)
      setErrorMessage('Could not fetch auth users. Make sure API endpoint is set up.')
    } finally {
      setSyncing(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const response = await fetch(`/api/admin/stripe-analytics?dateRange=${analyticsDateRange}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      if (data.success && data.analytics) {
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setErrorMessage('Failed to fetch analytics data')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Convert Firebase Auth user to Employee profile
  const convertToEmployee = async (authUser: any) => {
    try {
      setSyncing(true)
      setErrorMessage('')

      const response = await fetch('/api/admin/convert-auth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName || 'Employee',
          type: 'employee'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to convert to employee')
      }

      // Refresh data
      await fetchEmployees()
      await fetchFirebaseAuthUsers()
      setErrorMessage(`✓ Successfully converted ${authUser.email} to employee`)
    } catch (error: any) {
      console.error('Error converting to employee:', error)
      setErrorMessage(`Failed to convert: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  // Convert Firebase Auth user to Customer profile
  const convertToCustomer = async (authUser: any) => {
    try {
      setSyncing(true)
      setErrorMessage('')

      const response = await fetch('/api/admin/convert-auth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName || 'Customer',
          type: 'customer'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to convert to customer')
      }

      // Refresh data
      await fetchCustomers()
      await fetchFirebaseAuthUsers()
      setErrorMessage(`✓ Successfully converted ${authUser.email} to customer`)
    } catch (error: any) {
      console.error('Error converting to customer:', error)
      setErrorMessage(`Failed to convert: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleTabChange = (tab: 'all' | 'employees' | 'customers') => {
    setActiveUserTab(tab)
    if (tab === 'employees' && employees.length === 0) {
      fetchEmployees()
    } else if (tab === 'customers' && customers.length === 0) {
      fetchCustomers()
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    setEmployees([])
    setCustomers([])
    setErrorMessage('')
  }

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {})
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  const toggleUserSelection = (uid: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(uid)) newSelected.delete(uid)
    else newSelected.add(uid)
    setSelectedUsers(newSelected)
  }

  // Admin Sorting Functions
  const loadSortingData = async (view: 'pending-payments' | 'subscriptions' | 'wash-club' | 'employees' | 'customers-only') => {
    setSortingLoading(true)
    setSortingError('')
    try {
      let response
      switch (view) {
        case 'pending-payments':
          response = await getPendingPaymentUsers()
          break
        case 'subscriptions':
          response = await getActiveSubscriptionUsers()
          break
        case 'wash-club':
          response = await getWashClubUsers()
          break
        case 'employees':
          response = await getEmployeeUsers()
          break
        case 'customers-only':
          response = await getCustomerOnlyUsers()
          break
      }
      setSortingData(response?.users || [])
      setSortingLastUpdated(new Date())
    } catch (err) {
      setSortingError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setSortingLoading(false)
    }
  }

  const handleSortingViewChange = (view: 'pending-payments' | 'subscriptions' | 'wash-club' | 'employees' | 'customers-only') => {
    setSortingView(view)
    loadSortingData(view)
  }

  const handleConfirmPayment = async (uid: string) => {
    setConfirmingUid(uid)
    try {
      await confirmPayment(uid)
      // Reload data
      loadSortingData(sortingView)
    } catch (err) {
      setSortingError(err instanceof Error ? err.message : 'Failed to confirm payment')
    } finally {
      setConfirmingUid(null)
    }
  }

  const handleRejectPayment = async (uid: string) => {
    setRejectingUid(uid)
    try {
      await rejectPayment(uid)
      // Reload data
      loadSortingData(sortingView)
    } catch (err) {
      setSortingError(err instanceof Error ? err.message : 'Failed to reject payment')
    } finally {
      setRejectingUid(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#48C9B0] via-[#7FE3D3] to-[#48C9B0] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <Card className="shadow-2xl border border-white border-opacity-20 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="bg-white bg-opacity-20 backdrop-blur-md p-4 rounded-full border border-white border-opacity-30">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white">Washlee Admin</h1>
                <p className="text-white text-opacity-90 text-sm mt-2">Secure Dashboard Access</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 border-2 border-[#48C9B0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] focus:ring-offset-2 transition bg-white hover:border-[#3aad9a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-11 text-[#48C9B0] hover:text-[#3aad9a] transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              <Button variant="primary" size="md" className="w-full py-3 font-semibold text-lg">
                Access Dashboard
              </Button>
            </form>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#48C9B0] to-[#3aad9a] p-2.5 rounded-lg shadow-md">
              <Lock size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1f2d2b]">Washlee Admin</h1>
              <p className="text-xs text-gray-500">Platform Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Alert */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-4 mb-8 rounded-lg flex items-start gap-3">
          <Zap className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-blue-900">Active Monitoring</p>
            <p className="text-sm text-blue-700">Real-time data synchronized across all systems</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-semibold text-sm">Total Orders</h3>
              <ShoppingCart className="text-blue-600" size={24} />
            </div>
            <p className="text-4xl font-bold text-blue-900">{analytics.orders.total.toLocaleString()}</p>
            <p className="text-xs text-blue-700 mt-2">↑ All time growth</p>
          </div>

          {/* Active Orders */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border border-green-200 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-semibold text-sm">Active Orders</h3>
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <p className="text-4xl font-bold text-green-900">{analytics.orders.active}</p>
            <p className="text-xs text-green-700 mt-2">{analytics.orders.activePercentage}% conversion</p>
          </div>

          {/* Completed Orders */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl shadow-md p-6 border border-teal-200 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-semibold text-sm">Completed</h3>
              <CheckCircle className="text-teal-600" size={24} />
            </div>
            <p className="text-4xl font-bold text-teal-900">{analytics.orders.completed}</p>
            <p className="text-xs text-teal-700 mt-2">{analytics.orders.completionRate}% success rate</p>
          </div>

          {/* Cancelled Orders */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border border-purple-200 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-semibold text-sm">Cancelled</h3>
              <AlertTriangle className="text-purple-600" size={24} />
            </div>
            <p className="text-4xl font-bold text-purple-900">{analytics.orders.cancelled}</p>
            <p className="text-xs text-purple-700 mt-2">{analytics.orders.cancellationRate}% cancel rate</p>
          </div>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* User Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-[#48C9B0] to-[#3aad9a] px-6 py-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Users size={24} />
                User Management
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-600 mb-4">View employees and customers</p>
              <button
                onClick={() => {
                  if (employees.length === 0) fetchEmployees()
                  if (customers.length === 0) fetchCustomers()
                  setTimeout(() => {
                    userManagementRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                }}
                className="w-full px-4 py-2 bg-[#48C9B0] text-white rounded hover:bg-[#3aad9a] transition text-center font-semibold"
              >
                View All Users
              </button>
            </div>
          </div>

          {/* Orders Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <ShoppingCart size={24} />
                Orders
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-600 mb-4">Manage orders</p>
              <a
                href="/admin/orders"
                className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-center font-semibold"
              >
                View All Orders
              </a>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <BarChart3 size={24} />
                Analytics
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-600 mb-4">View reports</p>
              <a
                href="/admin/analytics"
                className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition text-center font-semibold"
              >
                View Analytics
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Eye size={24} />
                Support
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-600 mb-4">Support tickets</p>
              <a
                href="/admin/support"
                className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-center font-semibold"
              >
                Support Tickets
              </a>
            </div>
          </div>
        </div>

        {/* Data Sync Section */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1f2d2b] flex items-center gap-2">
                  <TrendingUp size={24} className="text-[#48C9B0]" />
                  Live Analytics & Revenue Dashboard
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time data status: {isRealtimeActive ? '🟢 Active' : '🔴 Inactive'}
                  {lastSyncTime && <span> • Last sync: {lastSyncTime}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={analyticsDateRange}
                  onChange={(e) => setAnalyticsDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
                <button
                  onClick={fetchAnalytics}
                  disabled={analyticsLoading}
                  className="px-4 py-2 bg-[#48C9B0] text-white rounded hover:bg-[#3aad9a] transition font-semibold disabled:opacity-50 text-sm"
                >
                  {analyticsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
            
            {/* Order Metrics Grid */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.orders.total}</p>
                <p className="text-xs text-blue-700 mt-1">{analyticsDateRange}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <p className="text-sm font-semibold text-green-900">Active</p>
                <p className="text-2xl font-bold text-green-600">{analytics.orders.active}</p>
                <p className="text-xs text-green-700 mt-1">{analytics.orders.activePercentage}% of total</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <p className="text-sm font-semibold text-purple-900">Completed</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.orders.completed}</p>
                <p className="text-xs text-purple-700 mt-1">{analytics.orders.completionRate}% completion</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                <p className="text-sm font-semibold text-red-900">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{analytics.orders.cancelled}</p>
                <p className="text-xs text-red-700 mt-1">{analytics.orders.cancellationRate}% cancel rate</p>
              </div>
            </div>

            {/* Revenue Section */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-bold text-[#1f2d2b] mb-4">💰 Revenue Analytics</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900">Total Revenue</p>
                  <p className="text-3xl font-bold text-amber-600">${analytics.revenue.total.toLocaleString()}</p>
                  <p className="text-xs text-amber-700 mt-2">
                    Avg per order: ${analytics.revenue.average.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-900">Stripe Verified Revenue</p>
                  <p className="text-3xl font-bold text-emerald-600">${analytics.revenue.stripeVerified.toLocaleString()}</p>
                  <p className="text-xs text-emerald-700 mt-2">
                    Refunds: ${analytics.revenue.refunds.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Stripe Payments Section */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-bold text-[#1f2d2b] mb-4">🔐 Stripe Payment Status</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-sky-900">Total Charges</p>
                  <p className="text-2xl font-bold text-sky-600">{analytics.stripe.stripeCharges}</p>
                  <p className="text-xs text-sky-700 mt-1">Processed via Stripe</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-orange-900">Failed Charges</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.stripe.stripeFailedCharges}</p>
                  <p className="text-xs text-orange-700 mt-1">Payment declined</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-cyan-900">Refunded Amount</p>
                  <p className="text-2xl font-bold text-cyan-600">${analytics.revenue.refunds}</p>
                  <p className="text-xs text-cyan-700 mt-1">Total refunded</p>
                </div>
              </div>
            </div>

            {/* User Statistics Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-[#1f2d2b] mb-4">👥 User Statistics</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-indigo-900">Total Customers</p>
                  <p className="text-2xl font-bold text-indigo-600">{analytics.users.totalCustomers}</p>
                  <p className="text-xs text-indigo-700 mt-1">Active profiles</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-teal-900">Total Employees</p>
                  <p className="text-2xl font-bold text-teal-600">{analytics.users.totalEmployees}</p>
                  <p className="text-xs text-teal-700 mt-1">Service providers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Firebase Auth Sync Section */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1f2d2b] flex items-center gap-2">
                  <Users size={24} className="text-[#48C9B0]" />
                  Firebase Auth User Management
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage and convert Firebase authentication accounts to employee or customer profiles
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">Customers</p>
                <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
                <p className="text-xs text-blue-700 mt-1">Customer profiles</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <p className="text-sm font-semibold text-green-900">Employees</p>
                <p className="text-2xl font-bold text-green-600">{employees.length}</p>
                <p className="text-xs text-green-700 mt-1">Employee profiles</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <p className="text-sm font-semibold text-purple-900">Auth Users</p>
                <p className="text-2xl font-bold text-purple-600">{authUsers.length}</p>
                <p className="text-xs text-purple-700 mt-1">To sync as profiles</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <button
                onClick={fetchFirebaseAuthUsers}
                disabled={syncing}
                className="w-full px-4 py-2 bg-[#48C9B0] text-white rounded hover:bg-[#3aad9a] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Sync Firebase Auth Users'}
              </button>
              <p className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
                💡 Tip: Click to check for Firebase auth accounts that don't have profiles yet. These can be converted to employee or customer accounts.
              </p>
            </div>

            {/* Auth Users List */}
            {authUsers.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-bold text-[#1f2d2b] mb-4">
                  Firebase Auth Users to Convert ({authUsers.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {authUsers.map((user: any) => (
                    <div key={user.uid} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-[#1f2d2b]">{user.displayName || 'No name'}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => convertToEmployee(user)}
                          disabled={syncing}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition disabled:opacity-50"
                        >
                          Employee
                        </button>
                        <button
                          onClick={() => convertToCustomer(user)}
                          disabled={syncing}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition disabled:opacity-50"
                        >
                          Customer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Management Section */}
        {isAuthenticated && (
          <div ref={userManagementRef}>
            {/* User Type Slider */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-[#1f2d2b] mb-1">User Management</h2>
                  <p className="text-gray-600 text-sm">Manage and monitor all platform users</p>
                </div>
                
                {/* Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] text-sm"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] text-sm font-medium"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] text-sm font-medium"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="earnings">Top Earners</option>
                    <option value="jobs">Most Active</option>
                  </select>

                  {/* Export */}
                  <button
                    onClick={() => exportToCSV(activeUserTab === 'employees' ? filteredEmployees : filteredCustomers, `${activeUserTab}.csv`)}
                    className="px-4 py-2 bg-[#48C9B0] text-white rounded-lg hover:bg-[#3aad9a] transition font-medium flex items-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              {/* Slider Toggle */}
              <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-lg w-fit mb-8">
                <button
                  onClick={() => handleTabChange('employees')}
                  className={`px-6 py-3 rounded-lg transition font-semibold flex items-center gap-2 ${
                    activeUserTab === 'employees'
                      ? 'bg-white text-[#48C9B0] shadow-md'
                      : 'bg-transparent text-gray-600 hover:text-[#1f2d2b]'
                  }`}
                >
                  <Briefcase size={18} />
                  Employees ({employees.length})
                </button>
                <button
                  onClick={() => handleTabChange('customers')}
                  className={`px-6 py-3 rounded-lg transition font-semibold flex items-center gap-2 ${
                    activeUserTab === 'customers'
                      ? 'bg-white text-[#48C9B0] shadow-md'
                      : 'bg-transparent text-gray-600 hover:text-[#1f2d2b]'
                  }`}
                >
                  <Users size={18} />
                  Customers ({customers.length})
                </button>
              </div>

              {/* Employees View */}
              {activeUserTab === 'employees' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[#6b7b78]">Showing <span className="font-bold text-[#1f2d2b]">{filteredEmployees.length}</span> of <span className="font-bold text-[#1f2d2b]">{employees.length}</span> employees</p>
                    {loadingEmployees && <p className="text-sm text-[#48C9B0] flex items-center gap-2"><Clock size={16} className="animate-spin" /> Loading...</p>}
                  </div>
                  
                  {filteredEmployees.length === 0 ? (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-12 text-center">
                      <Briefcase size={48} className="mx-auto text-blue-300 mb-4" />
                      <p className="text-[#6b7b78] mb-2 font-semibold">No employees found</p>
                      <p className="text-sm text-[#6b7b78]">
                        {searchQuery ? 'Try adjusting your search filters' : 'Employees will appear here once they complete the pro signup process'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Name</th>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Email</th>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Phone</th>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Status</th>
                            <th className="px-6 py-4 text-center font-semibold text-[#1f2d2b]">Jobs</th>
                            <th className="px-6 py-4 text-center font-semibold text-[#1f2d2b]">Earnings</th>
                            <th className="px-6 py-4 text-center font-semibold text-[#1f2d2b]">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEmployees.map((emp) => (
                            <tr key={emp.uid} className="border-t border-gray-200 hover:bg-gray-50 transition">
                              <td className="px-6 py-4 font-semibold text-[#1f2d2b]">{emp.firstName} {emp.lastName}</td>
                              <td className="px-6 py-4 text-[#6b7b78]">{emp.email}</td>
                              <td className="px-6 py-4 text-[#6b7b78]">{emp.phone || '-'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  emp.status === 'approved' 
                                    ? 'bg-green-100 text-green-700' 
                                    : emp.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {emp.status || 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center font-semibold text-[#1f2d2b]">{emp.totalJobs || 0}</td>
                              <td className="px-6 py-4 text-center font-semibold text-[#48C9B0]">${(emp.totalEarnings || 0).toFixed(2)}</td>
                              <td className="px-6 py-4 text-center font-semibold">{emp.rating ? emp.rating.toFixed(1) : 'N/A'} ⭐</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Customers View */}
              {activeUserTab === 'customers' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[#6b7b78]">Showing <span className="font-bold text-[#1f2d2b]">{filteredCustomers.length}</span> of <span className="font-bold text-[#1f2d2b]">{customers.length}</span> customers</p>
                    {loadingCustomers && <p className="text-sm text-[#48C9B0] flex items-center gap-2"><Clock size={16} className="animate-spin" /> Loading...</p>}
                  </div>
                  
                  {filteredCustomers.length === 0 ? (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-12 text-center">
                      <Users size={48} className="mx-auto text-blue-300 mb-4" />
                      <p className="text-[#6b7b78] mb-2 font-semibold">No customers found</p>
                      <p className="text-sm text-[#6b7b78]">
                        {searchQuery ? 'Try adjusting your search filters' : 'Customers will appear here once they complete signup'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Name</th>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Email</th>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Phone</th>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Status</th>
                            <th className="px-6 py-4 text-center font-semibold text-[#1f2d2b]">Orders</th>
                            <th className="px-6 py-4 text-center font-semibold text-[#1f2d2b]">Total Spent</th>
                            <th className="px-6 py-4 text-center font-semibold text-[#1f2d2b]">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCustomers.map((cust) => (
                            <tr key={cust.uid} className="border-t border-gray-200 hover:bg-gray-50 transition">
                              <td className="px-6 py-4 font-semibold text-[#1f2d2b]">{cust.firstName} {cust.lastName}</td>
                              <td className="px-6 py-4 text-[#6b7b78]">{cust.email}</td>
                              <td className="px-6 py-4 text-[#6b7b78]">{cust.phone || '-'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  cust.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {cust.status || 'Active'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center font-semibold text-[#1f2d2b]">{cust.totalOrders || 0}</td>
                              <td className="px-6 py-4 text-center font-semibold text-[#48C9B0]">${(cust.totalSpent || 0).toFixed(2)}</td>
                              <td className="px-6 py-4 text-center font-semibold">{cust.rating ? cust.rating.toFixed(1) : 'N/A'} ⭐</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin Sorting Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mt-8 border border-gray-200">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-[#1f2d2b] mb-1">User Sorting & Sync</h2>
                  <p className="text-gray-600 text-sm">Manage subscriptions, payments, and user categories</p>
                </div>
                
                {/* Sync Button */}
                <button
                  onClick={() => loadSortingData(sortingView)}
                  disabled={sortingLoading}
                  className="px-6 py-2 bg-[#48C9B0] text-white rounded-lg hover:bg-[#3aad9a] transition font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={18} className={sortingLoading ? 'animate-spin' : ''} />
                  {sortingLoading ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              {/* Error Message */}
              {sortingError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{sortingError}</p>
                  </div>
                </div>
              )}

              {/* Sorting View Tabs */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { key: 'pending-payments', label: '⏳ Pending Payments', icon: Clock },
                  { key: 'subscriptions', label: '✓ Active Subscriptions', icon: CheckCircle },
                  { key: 'wash-club', label: '🧺 Wash Club', icon: Zap },
                  { key: 'employees', label: '👔 Employees', icon: Briefcase },
                  { key: 'customers-only', label: '👥 Customers Only', icon: Users },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSortingViewChange(key as any)}
                    className={`px-4 py-2 rounded-lg transition font-semibold text-sm flex items-center gap-2 ${
                      sortingView === key
                        ? 'bg-[#48C9B0] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Users List */}
              {sortingLoading ? (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-[#48C9B0] mb-4 animate-spin" />
                  <p className="text-gray-600 font-semibold">Loading users...</p>
                </div>
              ) : sortingData.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-semibold">No users found in this category</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Email</th>
                        <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">User ID</th>
                        <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Created</th>
                        {sortingView === 'pending-payments' && (
                          <>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Plan</th>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Status</th>
                          </>
                        )}
                        {sortingView === 'subscriptions' && (
                          <>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Plan</th>
                            <th className="px-6 py-4 text-left font-semibold text-[#1f2d2b]">Active</th>
                          </>
                        )}
                        {sortingView === 'pending-payments' && (
                          <th className="px-6 py-4 text-center font-semibold text-[#1f2d2b]">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sortingData.map((user) => (
                        <tr key={user.uid} className="border-t border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-semibold text-[#1f2d2b]">{user.email}</td>
                          <td className="px-6 py-4 text-[#6b7b78] text-xs font-mono">{user.uid.slice(0, 12)}...</td>
                          <td className="px-6 py-4 text-[#6b7b78] text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          {sortingView === 'pending-payments' && (
                            <>
                              <td className="px-6 py-4 text-[#1f2d2b] font-semibold capitalize">
                                {user.subscription?.plan || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  user.subscription?.paymentStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.subscription?.paymentStatus || 'N/A'}
                                </span>
                              </td>
                            </>
                          )}
                          {sortingView === 'subscriptions' && (
                            <>
                              <td className="px-6 py-4 text-[#1f2d2b] font-semibold capitalize">
                                {user.subscription?.plan || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  user.subscription?.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.subscription?.active ? '✓ Active' : '✕ Inactive'}
                                </span>
                              </td>
                            </>
                          )}
                          {sortingView === 'pending-payments' && (
                            <td className="px-6 py-4 text-center space-x-2">
                              <button
                                onClick={() => handleConfirmPayment(user.uid)}
                                disabled={confirmingUid === user.uid || rejectingUid === user.uid}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-semibold disabled:opacity-50"
                              >
                                {confirmingUid === user.uid ? 'Confirming...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => handleRejectPayment(user.uid)}
                                disabled={confirmingUid === user.uid || rejectingUid === user.uid}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-semibold disabled:opacity-50"
                              >
                                {rejectingUid === user.uid ? 'Rejecting...' : 'Reject'}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Last Updated */}
              {sortingLastUpdated && (
                <p className="text-xs text-gray-500 mt-4">
                  Last synced: {sortingLastUpdated.toLocaleTimeString()} • Total: {sortingData.length} users
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
