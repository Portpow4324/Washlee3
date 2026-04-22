'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Eye,
  LogOut,
  Briefcase,
  Lock,
  ChevronDown,
  Shield,
  Settings,
  DollarSign,
  Megaphone,
  Bell,
  CreditCard,
  Gift,
  MessageSquare
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  activeUsers: number
  newSignups: number
  pendingApplications: number
  refundRate: number
  averageOrderValue: number
  topProEarnings: number
}

export default function AdminDashboard() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasOwnerAccess, setHasOwnerAccess] = useState(false)

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('ownerAccess')
    sessionStorage.removeItem('adminLoginTime')
    router.push('/admin/login')
  }

  // Check admin access
  useEffect(() => {
    // Check for session-based owner access from password login
    const ownerAccess = sessionStorage.getItem('ownerAccess') === 'true'
    setHasOwnerAccess(ownerAccess)

    console.log('[AdminPage] Auth state:', { ownerAccess })
    
    if (!ownerAccess) {
      console.log('[AdminPage] No admin access, redirecting to admin login')
      router.push('/admin/login')
      return
    }
    
    console.log('[AdminPage] Admin access granted')
  }, [router])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_dashboard_summary',
            adminId: 'password-admin'
          })
        })

        if (response.ok) {
          const data = await response.json()
          setAnalytics(data.analytics)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (hasOwnerAccess) {
      fetchAnalytics()
    }
  }, [hasOwnerAccess])

  // Show loading while checking admin access
  if (!hasOwnerAccess && loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner />
            <p className="text-gray">Loading admin dashboard...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // If no admin access, show denied (this shouldn't happen as we redirect in useEffect)
  if (!hasOwnerAccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have admin access.</p>
            <a
              href="/admin/login"
              className="inline-block px-6 py-2 bg-[#48C9B0] text-white rounded hover:bg-[#3aad9a] transition font-semibold"
            >
              Go to Admin Setup
            </a>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, Owner</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>

          {/* Admin Alert */}
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-8">
            <div className="flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Admin Access Granted</p>
                <p className="text-sm text-red-700">You have full access to platform management. Handle with care.</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {analytics && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold">Total Revenue</h3>
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  ${analytics.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Monthly total</p>
              </div>

              {/* Total Orders */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold">Total Orders</h3>
                  <ShoppingCart className="text-blue-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {analytics.totalOrders.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">All time</p>
              </div>

              {/* Active Users */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold">Active Users</h3>
                  <Users className="text-primary" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {analytics.activeUsers.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">This month</p>
              </div>

              {/* Avg Order Value */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-semibold">Avg Order Value</h3>
                  <BarChart3 className="text-purple-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  ${analytics.averageOrderValue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Average</p>
              </div>
            </div>
          )}

          {/* Collections Organization */}
          
          {/* CORE MANAGEMENT */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase size={28} className="text-primary" />
              Core Management
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Users Management */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Users size={24} />
                    Users
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Manage employees & customers</p>
                  <a
                    href="/admin/users"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-center font-semibold text-sm"
                  >
                    View All Users
                  </a>
                  <a
                    href="/admin/users?type=pro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 border-2 border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition text-center font-semibold text-sm"
                  >
                    Pro Applications
                  </a>
                </div>
              </div>

              {/* Orders Management */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <ShoppingCart size={24} />
                    Orders
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">View all orders & status</p>
                  <a
                    href="/admin/orders"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-center font-semibold text-sm"
                  >
                    All Orders
                  </a>
                  <a
                    href="/admin/orders?status=disputed"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 border-2 border-green-500 text-green-500 rounded hover:bg-green-50 transition text-center font-semibold text-sm"
                  >
                    Disputed Orders
                  </a>
                </div>
              </div>

              {/* Analytics */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <BarChart3 size={24} />
                    Analytics
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Revenue & performance</p>
                  <a
                    href="/admin/analytics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition text-center font-semibold text-sm"
                  >
                    View Analytics
                  </a>
                  <a
                    href="/admin/reports"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 border-2 border-purple-500 text-purple-500 rounded hover:bg-purple-50 transition text-center font-semibold text-sm"
                  >
                    Generate Reports
                  </a>
                </div>
              </div>

              {/* Subscriptions */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <CreditCard size={24} />
                    Subscriptions
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Active subscriptions & plans</p>
                  <a
                    href="/admin/subscriptions"
                    className="block px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition text-center font-semibold text-sm"
                  >
                    View Subscriptions
                  </a>
                  <a
                    href="/admin/subscriptions?status=active"
                    className="block px-4 py-2 border-2 border-cyan-500 text-cyan-500 rounded hover:bg-cyan-50 transition text-center font-semibold text-sm"
                  >
                    Active Only
                  </a>
                </div>
              </div>

              {/* Wash Club Members */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Gift size={24} />
                    Wash Club
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Loyalty program members</p>
                  <a
                    href="/admin/wash-club"
                    className="block px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-center font-semibold text-sm"
                  >
                    View Members
                  </a>
                  <a
                    href="/admin/wash-club?tier=gold"
                    className="block px-4 py-2 border-2 border-yellow-500 text-yellow-500 rounded hover:bg-yellow-50 transition text-center font-semibold text-sm"
                  >
                    Premium Members
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* CONFIGURATION */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings size={28} className="text-amber-600" />
              Configuration
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Pricing Rules */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <DollarSign size={24} />
                    Pricing Rules
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Manage pricing & rates</p>
                  <a
                    href="/admin/pricing/rules"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition text-center font-semibold text-sm"
                  >
                    Pricing Rules
                  </a>
                  <a
                    href="/admin/pricing/rules"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 border-2 border-amber-500 text-amber-500 rounded hover:bg-amber-50 transition text-center font-semibold text-sm"
                  >
                    View All Rates
                  </a>
                </div>
              </div>

              {/* Marketing */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Megaphone size={24} />
                    Marketing
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Campaigns & promotions</p>
                  <a
                    href="/admin/marketing/campaigns"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition text-center font-semibold text-sm"
                  >
                    Campaigns
                  </a>
                  <a
                    href="/admin/marketing/campaigns"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 border-2 border-pink-500 text-pink-500 rounded hover:bg-pink-50 transition text-center font-semibold text-sm"
                  >
                    Promotions
                  </a>
                </div>
              </div>

              {/* Security */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Shield size={24} />
                    Security
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Compliance & access</p>
                  <a
                    href="/admin/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-center font-semibold text-sm"
                  >
                    Security Logs
                  </a>
                  <a
                    href="/admin/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 border-2 border-red-500 text-red-500 rounded hover:bg-red-50 transition text-center font-semibold text-sm"
                  >
                    Access Control
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* SUPPORT */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Bell size={28} className="text-indigo-600" />
              Support & Inquiries
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Pro Applications */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Briefcase size={24} />
                    Pro Applications
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Review and approve service provider applications</p>
                  <a
                    href="/admin/pro-applications"
                    className="block px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition text-center font-semibold text-sm"
                  >
                    View Applications
                  </a>
                  <a
                    href="/admin/pro-applications?status=pending"
                    className="block px-4 py-2 border-2 border-emerald-500 text-emerald-500 rounded hover:bg-emerald-50 transition text-center font-semibold text-sm"
                  >
                    Pending ({analytics?.pendingApplications || 0})
                  </a>
                </div>
              </div>

              {/* Inquiries */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Bell size={24} />
                    Inquiries
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Customer support tickets</p>
                  <a
                    href="/admin/inquiries"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition text-center font-semibold text-sm"
                  >
                    View Inquiries
                  </a>
                  <a
                    href="/admin/inquiries"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 border-2 border-indigo-500 text-indigo-500 rounded hover:bg-indigo-50 transition text-center font-semibold text-sm"
                  >
                    Pending Applications
                  </a>
                </div>
              </div>

              {/* Support Tickets */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <MessageSquare size={24} />
                    Support Tickets
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-gray-600 text-sm">Customer inquiries & issues</p>
                  <a
                    href="/admin/support-tickets"
                    className="block px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition text-center font-semibold text-sm"
                  >
                    View Tickets
                  </a>
                  <a
                    href="/admin/support-tickets?status=pending"
                    className="block px-4 py-2 border-2 border-orange-500 text-orange-500 rounded hover:bg-orange-50 transition text-center font-semibold text-sm"
                  >
                    Pending
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {analytics && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Key Metrics</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-2">New Signups (This Month)</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.newSignups}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Pending Pro Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.pendingApplications}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Refund Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.refundRate.toFixed(1)}%</p>
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
