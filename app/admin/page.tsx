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
  LogOut
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

  // Check admin access
  useEffect(() => {
    console.log('[AdminPage] Auth state:', { user: user?.email, isAdmin: userData?.isAdmin, authLoading })
    
    if (authLoading) return // Wait for auth to load

    if (!user) {
      console.log('[AdminPage] Not logged in, redirecting to login')
      router.push('/auth/login')
      return
    }

    if (!userData?.isAdmin) {
      console.log('[AdminPage] Not admin, redirecting to home')
      console.log('[AdminPage] userData:', userData)
      router.push('/')
      return
    }
    
    console.log('[AdminPage] Admin access granted')
  }, [user, userData, authLoading, router])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_dashboard_summary',
            adminId: user.uid
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

    fetchAnalytics()
  }, [user])

  // Show loading while auth is being checked
  if (authLoading || (loading && user && userData?.isAdmin)) {
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {userData?.name || 'Admin'}</p>
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

          {/* Admin Sections */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Users Management */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-[#3aad9a] px-6 py-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Users size={24} />
                  User Management
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-gray-600 mb-4">Manage customers and pro users</p>
                <a
                  href="/admin/users"
                  className="block px-4 py-2 bg-primary text-white rounded hover:bg-[#3aad9a] transition text-center font-semibold"
                >
                  View All Users
                </a>
                <a
                  href="/admin/users?type=pro"
                  className="block px-4 py-2 border-2 border-primary text-primary rounded hover:bg-mint transition text-center font-semibold"
                >
                  View Pro Applications
                </a>
              </div>
            </div>

            {/* Orders Management */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <ShoppingCart size={24} />
                  Order Management
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-gray-600 mb-4">Manage orders and handle disputes</p>
                <a
                  href="/admin/orders"
                  className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-center font-semibold"
                >
                  View All Orders
                </a>
                <a
                  href="/admin/orders?status=disputed"
                  className="block px-4 py-2 border-2 border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition text-center font-semibold"
                >
                  Disputed Orders
                </a>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <BarChart3 size={24} />
                  Analytics & Reports
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-gray-600 mb-4">View detailed analytics and generate reports</p>
                <a
                  href="/admin/analytics"
                  className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition text-center font-semibold"
                >
                  View Analytics
                </a>
                <button className="w-full px-4 py-2 border-2 border-purple-500 text-purple-500 rounded hover:bg-purple-50 transition font-semibold">
                  Export Report
                </button>
              </div>
            </div>

            {/* Support & Settings */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Eye size={24} />
                  Support & Settings
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-gray-600 mb-4">Support tickets and system settings</p>
                <a
                  href="/admin/support"
                  className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-center font-semibold"
                >
                  Support Tickets
                </a>
                <a
                  href="/admin/settings"
                  className="block px-4 py-2 border-2 border-green-500 text-green-500 rounded hover:bg-green-50 transition text-center font-semibold"
                >
                  System Settings
                </a>
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
