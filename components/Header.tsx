'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, ArrowLeft, LogOut, User, Droplets, Shield, Briefcase, Settings, ChevronDown, Home, Package, DollarSign, AlertCircle, Clock } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { clearAdminAccess } from '@/lib/useAdminAccess'
import { createClient } from '@supabase/supabase-js'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showRoleSwitch, setShowRoleSwitch] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [proInquiryStatus, setProInquiryStatus] = useState<'pending' | 'approved' | null>(null)
  const [proInquiryLoading, setProInquiryLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, userData, isAuthenticated, loading } = useAuth()
  const isAdminRoute = pathname?.startsWith('/admin') || pathname === '/admin-login' || pathname === '/admin-setup'

  // Fetch pro inquiry status for user
  useEffect(() => {
    if (isAdminRoute) return

    if (isAuthenticated && user?.id && !loading) {
      const fetchProInquiryStatus = async () => {
        try {
          setProInquiryLoading(true)
          
          console.log('[Header] Fetching pro inquiry for user:', user.id)
          
          // Use API endpoint to fetch pro inquiry status (API uses service role)
          const response = await fetch('/api/auth/check-pro-inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          })

          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`)
          }

          const data = await response.json()
          
          console.log('[Header] Pro inquiry API result:', data)
          
          if (data.proInquiry) {
            console.log('[Header] Pro inquiry status found:', data.proInquiry.status)
            setProInquiryStatus(data.proInquiry.status as 'pending' | 'approved')
          } else {
            console.log('[Header] No pro inquiry found for user')
          }
        } catch (err) {
          console.error('[Header] Error fetching pro inquiry status:', err)
        } finally {
          setProInquiryLoading(false)
        }
      }

      fetchProInquiryStatus()
    }
  }, [isAuthenticated, user?.id, loading, isAdminRoute])

  // Log role switch state for debugging
  useEffect(() => {
    if (showRoleSwitch) {
      console.log('[Header] Role switch logic:', {
        isEmployee: userData?.is_employee,
        userType: userData?.user_type,
        proStatus: proInquiryStatus
      })
    }
  }, [showRoleSwitch, userData?.is_employee, userData?.user_type, proInquiryStatus])
  
  // Show back button if not on homepage, auth page, or specific excluded pages
  const isHomepage = pathname === '/'
  const isAuthPage = pathname.includes('/auth/')
  const pagesWithoutBackButton = [
    '/how-it-works',
    '/pricing',
    '/business',
    '/faq',
    '/wash-club',
    '/pro',
  ]
  const isPageWithoutBackButton = pagesWithoutBackButton.some(page => pathname.startsWith(page))
  const showBackButton = !isHomepage && !isAuthPage && !isPageWithoutBackButton
  
  // Handle back button click - try browser back first, fallback to home
  const handleBackClick = () => {
    if (isAdminRoute) {
      router.push('/admin')
      return
    }

    const referrer = document.referrer
    if (referrer && referrer.includes(window.location.host)) {
      // If referrer is from same domain, use browser back
      router.back()
    } else {
      // Otherwise go to signin
      router.push('/auth/signin')
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.signOut()
      setShowUserMenu(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleAdminLogout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined)
    clearAdminAccess()
    router.push('/admin/login')
    router.refresh()
  }

  const switchToEmployeeDashboard = () => {
    localStorage.setItem('employeeMode', 'true')
    sessionStorage.setItem('employeeMode', 'true')
    localStorage.removeItem('proMode')
    router.push('/employee/dashboard')
    setShowRoleSwitch(false)
  }

  const switchToProMode = () => {
    localStorage.setItem('proMode', 'true')
    sessionStorage.setItem('proMode', 'true')
    localStorage.removeItem('employeeMode')
    router.push('/employee/dashboard')
    setShowRoleSwitch(false)
  }

  if (isAdminRoute) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-white">
                <Image
                  src="/logo-washlee.png"
                  alt="Washlee Logo"
                  width={48}
                  height={32}
                  className="rounded-full object-contain"
                  style={{ width: '48px', height: 'auto' }}
                />
              </div>
              <span className="font-bold text-xl text-dark">Washlee Admin</span>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              <Link href="/admin" className="px-3 py-2 text-sm font-semibold text-primary hover:bg-mint rounded-lg transition">
                Control Center
              </Link>
              <Link href="/admin/monitoring" className="px-3 py-2 text-sm font-semibold text-primary hover:bg-mint rounded-lg transition">
                Monitoring
              </Link>
              <Link href="/admin/security" className="px-3 py-2 text-sm font-semibold text-primary hover:bg-mint rounded-lg transition">
                Security
              </Link>
              <Link href="/" className="px-3 py-2 text-sm font-semibold text-gray hover:bg-light rounded-lg transition">
                Public Site
              </Link>
            </div>

            <button
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="p-2 hover:bg-mint rounded-full transition"
                title="Go back to previous page"
              >
                <ArrowLeft size={24} className="text-primary" />
              </button>
            )}
            <Link href="/" className="flex items-center gap-2.5" aria-label="Washlee home">
              <div className="flex h-11 w-11 items-center justify-center rounded-full overflow-hidden flex-shrink-0 shadow-soft sm:h-12 sm:w-12">
                <Image
                  src="/logo-washlee.png"
                  alt=""
                  width={48}
                  height={32}
                  className="rounded-full object-contain"
                  style={{ width: '44px', height: 'auto' }}
                />
              </div>
              <span className="font-bold text-lg text-dark">Washlee</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <Link href="/" className="px-3 py-2 text-sm text-primary hover:bg-mint rounded-full transition font-semibold whitespace-nowrap">
              Home
            </Link>
            <Link href="/how-it-works" className="px-3 py-2 text-sm text-primary hover:bg-mint rounded-full transition font-semibold whitespace-nowrap">
              How It Works
            </Link>
            <Link href="/pricing" className="px-3 py-2 text-sm text-primary hover:bg-mint rounded-full transition font-semibold whitespace-nowrap">
              Pricing
            </Link>
            <Link href="/business" className="px-3 py-2 text-sm text-primary hover:bg-mint rounded-full transition font-semibold whitespace-nowrap">
              Business
            </Link>
            <Link href="/faq" className="px-3 py-2 text-sm text-primary hover:bg-mint rounded-full transition font-semibold whitespace-nowrap">
              FAQ
            </Link>
            <Link href="/wash-club" className="px-3 py-2 text-sm text-primary hover:bg-mint rounded-full transition font-semibold whitespace-nowrap">
              Wash Club
            </Link>
            <Link href="/pro" className="px-3 py-2 text-sm text-primary hover:bg-mint rounded-full transition font-semibold whitespace-nowrap">
              Pro
            </Link>
            <Link href="/mobile-app" className="px-3 py-2 text-sm text-primary hover:bg-mint rounded-full transition font-semibold whitespace-nowrap">
              Mobile app
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && !loading ? (
              <>
                <Link
                  href="/booking"
                  className="px-5 py-2.5 bg-primary text-white rounded-full hover:shadow-lg transition font-bold text-base whitespace-nowrap"
                  data-analytics-event="booking_started"
                  data-analytics-label="header_book_pickup_signed_in"
                >
                  Book Pickup
                </Link>
                
                
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-mint to-primary/10 border-2 border-primary rounded-full hover:shadow-lg transition font-semibold text-sm"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                      <User size={16} />
                    </div>
                    <span className="text-dark">
                      {loading ? '...' : userData?.name?.split(' ')[0] || 'User'}
                    </span>
                  </button>

                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 overflow-hidden border-2 border-primary">
                      <div className="p-4 bg-mint border-b-2 border-primary">
                        <p className="font-bold text-dark text-base">
                          {userData?.first_name && userData?.last_name 
                            ? `${userData.first_name} ${userData.last_name}` 
                            : userData?.name || userData?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray mt-1">{userData?.email || ''}</p>
                        {proInquiryStatus === 'pending' && (
                          <div className="flex items-center gap-1 mt-2 text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-semibold">
                            <Clock size={12} />
                            Application Pending
                          </div>
                        )}
                      </div>
                      <Link
                        href="/dashboard"
                        className="block w-full px-4 py-3 text-dark hover:bg-mint transition font-semibold border-b border-gray/20 flex items-center gap-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package size={18} className="text-primary" />
                        My Dashboard
                      </Link>
                      <div className="relative border-b border-gray/20">
                        <button
                          onClick={() => setShowRoleSwitch(!showRoleSwitch)}
                          className="w-full px-4 py-3 text-dark hover:bg-mint transition font-semibold flex items-center gap-2 text-left"
                        >
                          <Briefcase size={18} className="text-primary" />
                          Roles
                          <ChevronDown size={14} className="ml-auto" />
                        </button>
                        {showRoleSwitch && (
                          <div className="absolute top-full left-0 right-0 bg-white border-t border-gray/20 shadow-lg">
                            {userData?.is_employee && (
                              <button
                                onClick={switchToEmployeeDashboard}
                                className="w-full px-4 py-2 text-dark hover:bg-mint transition text-sm text-left flex items-center gap-2 border-b border-gray/20"
                              >
                                <Package size={16} className="text-primary" />
                                Employee Dashboard
                              </button>
                            )}
                            {proInquiryStatus === 'pending' && userData?.is_employee && (
                              <button
                                onClick={() => {
                                  setShowRoleSwitch(false)
                                  setShowUserMenu(false)
                                  setShowPendingModal(true)
                                }}
                                className="w-full px-4 py-2 text-dark hover:bg-mint transition text-sm text-left flex items-center gap-2 border-b border-gray/20"
                              >
                                <Clock size={16} className="text-yellow-600" />
                                Pro Dashboard
                              </button>
                            )}
                            {userData?.user_type === 'pro' && proInquiryStatus === 'approved' && (
                              <button
                                onClick={switchToProMode}
                                className="w-full px-4 py-2 text-dark hover:bg-mint transition text-sm text-left flex items-center gap-2 border-b border-gray/20"
                              >
                                <Briefcase size={16} className="text-primary" />
                                Pro Dashboard
                              </button>
                            )}
                            {proInquiryStatus === 'approved' && userData?.user_type !== 'pro' && (
                              <button
                                onClick={switchToProMode}
                                className="w-full px-4 py-2 text-dark hover:bg-mint transition text-sm text-left flex items-center gap-2 border-b border-gray/20"
                              >
                                <Briefcase size={16} className="text-primary" />
                                Pro Dashboard (Approved)
                              </button>
                            )}
                            {userData?.user_type !== 'pro' && !userData?.is_employee && proInquiryStatus === 'pending' && (
                              <button
                                onClick={() => {
                                  setShowRoleSwitch(false)
                                  setShowUserMenu(false)
                                  setShowPendingModal(true)
                                }}
                                className="w-full px-4 py-2 text-dark hover:bg-mint transition text-sm text-left flex items-center gap-2 border-b border-gray/20"
                              >
                                <Clock size={16} className="text-yellow-600" />
                                Pro Dashboard (Pending)
                              </button>
                            )}
                            {userData?.user_type !== 'pro' && !userData?.is_employee && (!proInquiryStatus || proInquiryStatus !== 'pending' && proInquiryStatus !== 'approved') && (
                              <button
                                onClick={() => {
                                  setShowRoleSwitch(false)
                                  setShowProModal(true)
                                }}
                                className="w-full px-4 py-2 text-dark hover:bg-mint transition text-sm text-left flex items-center gap-2"
                              >
                                <Briefcase size={16} className="text-primary" />
                                Pro Dashboard
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <Link
                        href="/dashboard/settings"
                        className="block w-full px-4 py-3 text-dark hover:bg-mint transition font-semibold border-b border-gray/20 flex items-center gap-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={18} className="text-primary" />
                        Settings
                      </Link>
                      {/* Admin access removed from UI - admins can access directly via /admin route */}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition flex items-center gap-2 font-semibold"
                      >
                        <LogOut size={18} />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2.5 text-dark bg-white rounded-full hover:bg-mint transition font-semibold text-base whitespace-nowrap"
                  data-analytics-event="login_started"
                  data-analytics-label="header_sign_in"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup-customer"
                  className="px-4 py-2.5 text-primary-deep bg-white border border-line rounded-full hover:border-primary hover:bg-mint transition font-semibold text-base whitespace-nowrap"
                  data-analytics-event="customer_signup_started"
                  data-analytics-label="header_sign_up"
                >
                  Sign Up
                </Link>
                <Link
                  href="/booking"
                  className="px-5 py-2.5 bg-primary text-white rounded-full hover:shadow-lg transition font-bold text-base whitespace-nowrap"
                  data-analytics-event="booking_started"
                  data-analytics-label="header_book_pickup"
                >
                  Book Pickup
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              Home
            </Link>
            <Link href="/how-it-works" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              How It Works
            </Link>
            <Link href="/pricing" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              Pricing
            </Link>
            <Link href="/business" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              Business
            </Link>
            <Link href="/faq" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              FAQ
            </Link>
            <Link href="/wash-club" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              Wash Club
            </Link>
            <Link href="/pro" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              Pro
            </Link>
            <Link href="/mobile-app" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              Mobile app
            </Link>
            <hr className="my-2" />
            {isAuthenticated && !loading ? (
              <>
                <Link
                  href="/booking"
                  className="block px-4 py-3 bg-primary text-white rounded-full transition font-semibold text-base"
                  onClick={() => setIsOpen(false)}
                  data-analytics-event="booking_started"
                  data-analytics-label="mobile_header_book_pickup_signed_in"
                >
                  Book Pickup
                </Link>
                <div className="px-4 py-3 bg-gradient-to-r from-mint to-primary/10 border-l-4 border-primary rounded flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-dark text-base">{userData?.name || 'Loading...'}</p>
                    <p className="text-sm text-gray">{userData?.email || ''}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-4 py-3 text-dark bg-mint hover:bg-opacity-80 rounded-full transition font-semibold border-2 border-primary flex items-center gap-2 text-base"
                  onClick={() => setIsOpen(false)}
                >
                  <Droplets size={18} className="text-primary" />
                  Dashboard
                </Link>
                {userData?.is_employee && (
                  <button
                    onClick={() => {
                      switchToEmployeeDashboard()
                      setIsOpen(false)
                    }}
                    className="w-full block px-4 py-3 text-dark bg-mint hover:bg-opacity-80 rounded-full transition font-semibold border-2 border-primary flex items-center gap-2 text-base text-left"
                  >
                    <Package size={18} className="text-primary" />
                    Employee Dashboard
                  </button>
                )}
                {userData?.user_type === 'pro' && proInquiryStatus === 'approved' && (
                  <button
                    onClick={() => {
                      switchToProMode()
                      setIsOpen(false)
                    }}
                    className="w-full block px-4 py-3 text-dark bg-mint hover:bg-opacity-80 rounded-full transition font-semibold border-2 border-primary flex items-center gap-2 text-base text-left"
                  >
                    <Briefcase size={18} className="text-primary" />
                    Pro Dashboard
                  </button>
                )}
                {proInquiryStatus === 'pending' && userData?.is_employee && (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowPendingModal(true)
                    }}
                    className="w-full block px-4 py-3 text-dark bg-yellow-50 hover:bg-yellow-100 rounded-full transition font-semibold border-2 border-yellow-300 flex items-center gap-2 text-base"
                  >
                    <Clock size={18} className="text-yellow-600" />
                    Pro Dashboard (Pending)
                  </button>
                )}
                {userData?.is_admin && (
                  <Link
                    href="/admin"
                    className="block px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-full transition font-semibold border-2 border-red-700 flex items-center gap-2 text-base"
                    onClick={() => setIsOpen(false)}
                  >
                    <Shield size={18} />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition flex items-center gap-2 font-semibold text-base"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/booking"
                  className="block px-4 py-3 bg-primary text-white rounded-full font-bold text-base text-center"
                  onClick={() => setIsOpen(false)}
                  data-analytics-event="booking_started"
                  data-analytics-label="mobile_header_book_pickup"
                >
                  Book Pickup
                </Link>
                <Link
                  href="/auth/signup-customer"
                  className="block px-4 py-3 text-primary-deep bg-white border border-line rounded-full transition font-semibold text-base text-center hover:bg-mint"
                  onClick={() => setIsOpen(false)}
                  data-analytics-event="customer_signup_started"
                  data-analytics-label="mobile_header_sign_up"
                >
                  Sign Up
                </Link>
                <Link
                  href="/auth/signin"
                  className="block px-4 py-3 text-dark bg-white rounded-full transition font-semibold text-base text-center hover:bg-mint"
                  onClick={() => setIsOpen(false)}
                  data-analytics-event="login_started"
                  data-analytics-label="mobile_header_sign_in"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        )}

      {/* Pro Modal - Encourage user to join */}
      {showProModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Briefcase size={24} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-dark">Join Our Team</h2>
            </div>
            
            <p className="text-gray mb-4">
              Want to earn money with Washlee? Become a Pro member and start accepting laundry jobs in your area.
            </p>
            
            <div className="bg-mint rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-dark mb-2">As a Pro member, you&rsquo;ll:</p>
              <ul className="text-sm text-dark space-y-1">
                <li>✓ Accept laundry pickup & delivery jobs</li>
                <li>✓ Earn competitive rates per order</li>
                <li>✓ Set your own schedule</li>
                <li>✓ Track earnings in real-time</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowProModal(false)}
                className="flex-1 px-4 py-3 bg-gray/20 text-dark rounded-lg hover:bg-gray/30 transition font-semibold"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowProModal(false)
                  router.push('/pro')
                }}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:shadow-lg transition font-semibold"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Application Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-dark">Application Pending</h2>
            </div>
            
            <p className="text-gray mb-6">
              While waiting for approval of your Washlee Pro application, enjoy our Pro help center for more additional information about being a Pro and being the best!
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-900 font-semibold mb-2">In the meantime:</p>
              <ul className="text-sm text-yellow-900 space-y-1">
                <li>✓ Learn about Pro features & benefits</li>
                <li>✓ Explore earning opportunities</li>
                <li>✓ Get ready to accept your first jobs</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPendingModal(false)}
                className="flex-1 px-4 py-3 bg-gray/20 text-dark rounded-lg hover:bg-gray/30 transition font-semibold"
              >
                I&rsquo;ll Wait
              </button>
              <button
                onClick={() => {
                  setShowPendingModal(false)
                  router.push('/pro-support/help-center')
                }}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:shadow-lg transition font-semibold"
              >
                I&rsquo;m Interested
              </button>
            </div>
          </div>
        </div>
      )}
      </nav>
    </header>
  )
}
