'use client'

import { useAuth } from '@/lib/AuthContext'
import Spinner from '@/components/Spinner'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Home, Package, Settings, Lock, CreditCard, MapPin, LifeBuoy, 
  Smartphone, Menu, X, LogOut, ChevronRight, Gift
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const hasCheckedAuthRef = useRef(false)

  // Centralized auth check for the entire dashboard
  useEffect(() => {
    if (hasCheckedAuthRef.current) {
      return
    }

    // Still loading auth state OR user not set - redirect to login
    if (loading) {
      return
    }

    if (!user) {
      console.log('[DashboardLayout] Auth check complete - no user, redirecting to login')
      hasCheckedAuthRef.current = true
      router.push('/auth/login')
      return
    }

    // User exists but we don't have user data yet - wait
    if (!userData) {
      return
    }

    // Mark as checked FIRST before any async operations
    hasCheckedAuthRef.current = true
    console.log('[DashboardLayout] Auth check starting...')
    console.log('[DashboardLayout] Current pathname:', pathname)
    console.log('[DashboardLayout] User type:', userData.user_type)

    // Don't redirect if on settings page (customer settings)
    const isSettingsPage = pathname?.includes('/dashboard/settings')
    
    // If user is pro/employee, redirect them to employee dashboard (but not from settings)
    if (userData.user_type === 'pro' && !isSettingsPage) {
      console.log('[DashboardLayout] User is pro, redirecting to employee dashboard')
      router.push('/employee/dashboard')
      return
    }

    // User is authenticated customer with data loaded - proceed
    console.log('[DashboardLayout] User authenticated as customer, rendering dashboard')
  }, [loading, user, userData, router, pathname])

  // Show loading state while auth checks happen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Return null while checking auth (prevents rendering before redirect)
  if (!user) {
    return null
  }

  // If user data is not loaded yet, show loading
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray font-semibold">Loading profile...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Render the sidebar layout regardless of auth state
  // Child pages handle their own auth checks

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/orders', label: 'My Orders', icon: Package },
    { href: '/dashboard/addresses', label: 'Addresses', icon: MapPin },
    { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
    { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: Settings },
    { href: '/dashboard/washclub', label: 'Wash Club', icon: Gift },
    { href: '/dashboard/security', label: 'Security', icon: Lock },
    { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
    { href: '/dashboard/mobile', label: 'Mobile App', icon: Smartphone },
  ]

  return (
    <div className="min-h-screen bg-light">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-washlee.png"
              alt="Washlee Logo"
              width={40}
              height={40}
              className="rounded-full"
              style={{ width: 'auto', height: 'auto' }}
            />
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 hover:bg-light rounded-lg"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-t border-gray bg-white">
            <div className="px-4 py-4">
              <p className="text-sm font-semibold text-gray mb-4">Welcome back, {userData?.name}</p>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-light transition text-dark font-semibold"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
              <button
                onClick={() => {
                  handleLogout()
                  setMobileOpen(false)
                }}
                className="w-full mt-4 flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-semibold"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white border-r border-gray min-h-screen sticky top-0">
          <div className="p-6">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <Image
                src="/logo-washlee.png"
                alt="Washlee Logo"
                width={40}
                height={40}
                className="rounded-full"
                style={{ width: 'auto', height: 'auto' }}
              />
              <span className="font-bold text-dark">Washlee</span>
            </Link>

            <div className="bg-light rounded-lg p-4 mb-8">
              <p className="text-xs text-gray font-semibold mb-1">Welcome back</p>
              <p className="text-lg font-bold text-dark">{userData?.name}</p>
              <p className="text-sm text-gray mt-2">{userData?.email}</p>
            </div>

            <nav className="space-y-2 mb-8">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-light transition text-dark font-semibold group"
                  >
                    <Icon size={20} className="group-hover:text-primary transition" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-semibold"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:p-8 p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
