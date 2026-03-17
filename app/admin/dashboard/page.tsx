'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { 
  Lock, Users, LogOut, ShoppingCart, BarChart3, TrendingUp,
  AlertCircle, Settings, Shield, Eye, Bell, RefreshCw, Download, ChevronRight
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

interface QuickStat {
  label: string
  value: number | string
  color: string
  icon: React.ReactNode
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

  const handleAuthenticate = () => {
    if (password === adminPassword) {
      setIsAuthenticated(true)
      localStorage.setItem('adminAuthenticated', 'true')
    } else {
      alert('Invalid password')
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    localStorage.removeItem('adminAuthenticated')
    setIsAuthenticated(false)
    router.push('/')
  }

  useEffect(() => {
    // Load authentication state from localStorage on mount
    const authenticated = localStorage.getItem('adminAuthenticated') === 'true'
    setIsAuthenticated(authenticated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Navigation items organized by collection
  const navigationItems = [
    {
      collection: 'Core Management',
      items: [
        {
          title: 'Users',
          description: 'Manage employees & customers',
          icon: Users,
          href: '/admin',
          color: 'from-blue-500 to-blue-600',
          label: 'Go to Admin',
        },
        {
          title: 'Orders',
          description: 'View all orders & status',
          icon: ShoppingCart,
          href: '/admin/orders',
          color: 'from-green-500 to-green-600',
        },
        {
          title: 'Analytics',
          description: 'Revenue & performance',
          icon: BarChart3,
          href: '/admin/analytics',
          color: 'from-purple-500 to-purple-600',
        },
      ]
    },
    {
      collection: 'Configuration',
      items: [
        {
          title: 'Pricing Rules',
          description: 'Manage pricing & rates',
          icon: Settings,
          href: '/admin/pricing/rules',
          color: 'from-amber-500 to-amber-600',
        },
        {
          title: 'Marketing',
          description: 'Campaigns & promotions',
          icon: TrendingUp,
          href: '/admin/marketing/campaigns',
          color: 'from-pink-500 to-pink-600',
        },
        {
          title: 'Security',
          description: 'Compliance & access',
          icon: Shield,
          href: '/admin/security',
          color: 'from-red-500 to-red-600',
        },
      ]
    },
    {
      collection: 'Support',
      items: [
        {
          title: 'Inquiries',
          description: 'Customer support tickets',
          icon: Bell,
          href: '/admin/inquiries',
          color: 'from-indigo-500 to-indigo-600',
        },
      ]
    }
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#48C9B0] to-[#3aad9a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-[#48C9B0] to-[#3aad9a] p-3 rounded-lg inline-block mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1f2d2b]">Admin Access</h1>
            <p className="text-[#6b7b78] mt-2">Enter password to continue</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
                placeholder="Enter admin password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-600"
              >
                {showPassword ? <Eye size={20} /> : <Eye size={20} className="opacity-30" />}
              </button>
            </div>
            
            <Button
              onClick={handleAuthenticate}
              variant="primary"
              className="w-full"
            >
              Authenticate
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#48C9B0] to-[#3aad9a] p-2.5 rounded-lg shadow-md">
              <Lock size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1f2d2b]">Washlee Admin</h1>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#1f2d2b] mb-2">Welcome to Admin Panel</h2>
          <p className="text-[#6b7b78]">Manage Washlee platform across different sections below</p>
        </div>

        {/* Navigation by Collection */}
        {navigationItems.map((collection) => (
          <div key={collection.collection} className="mb-12">
            <h3 className="text-xl font-bold text-[#1f2d2b] mb-6 flex items-center gap-2">
              <ChevronRight size={20} className="text-[#48C9B0]" />
              {collection.collection}
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {collection.items.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className={`bg-gradient-to-br ${item.color} rounded-lg shadow-md p-6 h-full cursor-pointer hover:shadow-xl transition transform hover:scale-105`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-lg group-hover:bg-opacity-30 transition">
                          <Icon size={28} className="text-white" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-white text-opacity-90 text-sm">{item.description}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg shadow p-8 border border-gray-200">
          <h3 className="text-lg font-bold text-[#1f2d2b] mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200 text-left">
              <RefreshCw size={20} className="text-blue-600 mb-2" />
              <p className="font-semibold text-blue-900">Sync Data</p>
              <p className="text-xs text-blue-700">Refresh all data</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition border border-green-200 text-left">
              <Download size={20} className="text-green-600 mb-2" />
              <p className="font-semibold text-green-900">Export</p>
              <p className="text-xs text-green-700">Export reports</p>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition border border-purple-200 text-left">
              <BarChart3 size={20} className="text-purple-600 mb-2" />
              <p className="font-semibold text-purple-900">Analytics</p>
              <p className="text-xs text-purple-700">View metrics</p>
            </button>
            <button className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition border border-amber-200 text-left">
              <AlertCircle size={20} className="text-amber-600 mb-2" />
              <p className="font-semibold text-amber-900">Support</p>
              <p className="text-xs text-amber-700">Contact us</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
