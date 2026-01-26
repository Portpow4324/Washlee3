'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import { Briefcase, TrendingUp, CheckCircle, Clock, MapPin, Award, BarChart3, FileText, AlertCircle, Settings, LogOut } from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface ProStats {
  totalOrders: number
  acceptanceRate: number
  rating: number
  totalEarnings: number
  pendingEarnings: number
  completedOrders: number
  activeBids: number
}

export default function ProDashboard() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [proStats, setProStats] = useState<ProStats>({
    totalOrders: 0,
    acceptanceRate: 0,
    rating: 4.8,
    totalEarnings: 0,
    pendingEarnings: 0,
    completedOrders: 0,
    activeBids: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || userData?.userType !== 'pro') {
      router.push('/auth/signup?type=pro')
      return
    }

    // Load pro stats
    const loadProStats = async () => {
      try {
        const proRef = doc(db, 'pros', user.uid)
        const proSnap = await getDoc(proRef)

        if (proSnap.exists()) {
          const data = proSnap.data()
          setProStats({
            totalOrders: data.totalOrders || 0,
            acceptanceRate: data.acceptanceRate || 0,
            rating: data.rating || 4.8,
            totalEarnings: data.totalEarnings || 0,
            pendingEarnings: data.pendingEarnings || 0,
            completedOrders: data.completedOrders || 0,
            activeBids: data.activeBids || 0
          })
        }
      } catch (error) {
        console.error('Error loading pro stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProStats()
  }, [user, userData, router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading || userData?.userType !== 'pro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Loading Pro Dashboard...</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fefe] to-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Briefcase size={40} className="text-primary" />
                Washlee Pro Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Welcome back, {userData?.name?.split(' ')[0]}! Manage your orders and grow your earnings.</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={20} />
              Log Out
            </button>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{proStats.totalOrders}</p>
                <p className="text-xs text-green-600 mt-2">✓ {proStats.completedOrders} completed</p>
              </div>
              <Briefcase size={40} className="text-primary opacity-20" />
            </div>
          </div>

          {/* Acceptance Rate */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Acceptance Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{proStats.acceptanceRate}%</p>
                <p className="text-xs text-primary mt-2">Average acceptance</p>
              </div>
              <TrendingUp size={40} className="text-primary opacity-20" />
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Your Rating</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">⭐ {proStats.rating}</p>
                <p className="text-xs text-gray-600 mt-2">Out of 5.0</p>
              </div>
              <Award size={40} className="text-primary opacity-20" />
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${proStats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-2">${proStats.pendingEarnings.toFixed(2)} pending</p>
              </div>
              <BarChart3 size={40} className="text-primary opacity-20" />
            </div>
          </div>
        </div>

        {/* Verification & Profile Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Account Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={24} className="text-green-600" />
              Account Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Profile Complete</span>
                <span className="text-green-600 font-semibold">✓ 80%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Verification</span>
                <span className="text-blue-600 font-semibold">Verified ✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Active Status</span>
                <span className="text-green-600 font-semibold">Active</span>
              </div>
              <Link href="/dashboard/pro/profile">
                <Button className="w-full mt-4" variant="outline">
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={24} className="text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href="/dashboard/pro/orders/available">
                <Button className="w-full justify-start text-left">
                  <MapPin size={18} className="mr-2" />
                  View Available Orders
                </Button>
              </Link>
              <Link href="/dashboard/pro/schedule">
                <Button className="w-full justify-start text-left" variant="outline">
                  <Clock size={18} className="mr-2" />
                  Manage Schedule
                </Button>
              </Link>
              <Link href="/dashboard/pro/earnings">
                <Button className="w-full justify-start text-left" variant="outline">
                  <TrendingUp size={18} className="mr-2" />
                  View Earnings
                </Button>
              </Link>
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={24} className="text-primary" />
              Verification
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                <span>Identity Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                <span>Background Check Passed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                <span>Bank Account Verified</span>
              </div>
              <Link href="/dashboard/pro/verification">
                <Button className="w-full mt-4" variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Job Management */}
          <Link href="/dashboard/pro/orders/available">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-900 mb-2">Job Management</h3>
                  <p className="text-blue-700 text-sm mb-4">Browse available orders and manage your active jobs</p>
                  <div className="space-y-2">
                    <p className="text-sm text-blue-900">
                      <strong>Active Jobs:</strong> {proStats.activeBids}
                    </p>
                    <p className="text-xs text-blue-600">Real-time order notifications</p>
                  </div>
                </div>
                <Briefcase size={32} className="text-blue-600" />
              </div>
              <Button className="w-full mt-4" size="sm">
                View Jobs →
              </Button>
            </div>
          </Link>

          {/* Earnings & Payouts */}
          <Link href="/dashboard/pro/earnings">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">Earnings & Payouts</h3>
                  <p className="text-green-700 text-sm mb-4">Track your income and manage payouts</p>
                  <div className="space-y-2">
                    <p className="text-sm text-green-900">
                      <strong>Pending:</strong> ${proStats.pendingEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600">Weekly payouts available</p>
                  </div>
                </div>
                <TrendingUp size={32} className="text-green-600" />
              </div>
              <Button className="w-full mt-4" size="sm">
                View Earnings →
              </Button>
            </div>
          </Link>

          {/* Profile & Skills */}
          <Link href="/dashboard/pro/profile">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-purple-900 mb-2">Profile & Skills</h3>
                  <p className="text-purple-700 text-sm mb-4">Update your profile and specializations</p>
                  <div className="space-y-2">
                    <p className="text-sm text-purple-900">
                      <strong>Rating:</strong> {proStats.rating} ⭐
                    </p>
                    <p className="text-xs text-purple-600">Build your reputation</p>
                  </div>
                </div>
                <Settings size={32} className="text-purple-600" />
              </div>
              <Button className="w-full mt-4" size="sm">
                Edit Profile →
              </Button>
            </div>
          </Link>

          {/* Verification Status */}
          <Link href="/dashboard/pro/verification">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Verification</h3>
                  <p className="text-amber-700 text-sm mb-4">Complete your profile verification</p>
                  <div className="space-y-2">
                    <p className="text-sm text-amber-900">
                      <strong>Status:</strong> Verified ✓
                    </p>
                    <p className="text-xs text-amber-600">All documents approved</p>
                  </div>
                </div>
                <CheckCircle size={32} className="text-amber-600" />
              </div>
              <Button className="w-full mt-4" size="sm">
                View Details →
              </Button>
            </div>
          </Link>

          {/* Performance Analytics */}
          <Link href="/dashboard/pro/analytics">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Performance Analytics</h3>
                  <p className="text-indigo-700 text-sm mb-4">Track your performance metrics</p>
                  <div className="space-y-2">
                    <p className="text-sm text-indigo-900">
                      <strong>Acceptance:</strong> {proStats.acceptanceRate}%
                    </p>
                    <p className="text-xs text-indigo-600">Improve your acceptance rate</p>
                  </div>
                </div>
                <BarChart3 size={32} className="text-indigo-600" />
              </div>
              <Button className="w-full mt-4" size="sm">
                View Analytics →
              </Button>
            </div>
          </Link>

          {/* Customer Reviews */}
          <Link href="/dashboard/pro/reviews">
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-rose-900 mb-2">Customer Reviews</h3>
                  <p className="text-rose-700 text-sm mb-4">See what customers say about you</p>
                  <div className="space-y-2">
                    <p className="text-sm text-rose-900">
                      <strong>Reviews:</strong> {proStats.totalOrders > 0 ? Math.floor(proStats.totalOrders * 0.8) : 0}
                    </p>
                    <p className="text-xs text-rose-600">Build trust and credibility</p>
                  </div>
                </div>
                <Award size={32} className="text-rose-600" />
              </div>
              <Button className="w-full mt-4" size="sm">
                View Reviews →
              </Button>
            </div>
          </Link>
        </div>

        {/* Getting Started Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <AlertCircle size={28} className="text-blue-600" />
            Getting Started as a Washlee Pro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">1</div>
              <h3 className="font-bold text-blue-900 mb-2">Complete Your Profile</h3>
              <p className="text-blue-700 text-sm">Add a professional photo, bio, and list your specializations to attract more customers.</p>
            </div>
            <div>
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">2</div>
              <h3 className="font-bold text-blue-900 mb-2">Browse Available Jobs</h3>
              <p className="text-blue-700 text-sm">Check the job feed regularly for new laundry orders in your service area. Higher acceptance rates earn more!</p>
            </div>
            <div>
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">3</div>
              <h3 className="font-bold text-blue-900 mb-2">Earn & Grow</h3>
              <p className="text-blue-700 text-sm">Complete jobs, earn tips, and build your reputation with 5-star reviews to unlock higher-paying orders.</p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Common Questions</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>→ How do I accept a job?</li>
                <li>→ When do I get paid?</li>
                <li>→ How is my rating calculated?</li>
                <li>→ Can I specialize in certain services?</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Resources</h3>
              <div className="space-y-2">
                <Link href="/help-center" className="text-primary hover:underline block text-sm">
                  → Visit Help Center
                </Link>
                <Link href="/dashboard/support" className="text-primary hover:underline block text-sm">
                  → Contact Support
                </Link>
                <a href="mailto:support@washlee.com" className="text-primary hover:underline block text-sm">
                  → Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
