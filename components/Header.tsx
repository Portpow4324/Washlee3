'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, ArrowLeft, LogOut, User, Droplets, Shield, Briefcase, Settings, ChevronDown, Home, Package, DollarSign } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { createClient } from '@supabase/supabase-js'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showRoleSwitch, setShowRoleSwitch] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, userData, isAuthenticated, loading } = useAuth()
  
  // Show back button if not on homepage
  const isHomepage = pathname === '/'
  const isAuthPage = pathname.includes('/auth/')
  const showBackButton = !isHomepage && !isAuthPage
  
  // Handle back button click - try browser back first, fallback to home
  const handleBackClick = () => {
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
            <Link href="/" className="flex items-center gap-2">
              <div className="w-[80px] h-[80px] rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src="/logo-washlee.png"
                  alt="Washlee Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-xl text-dark hidden sm:inline">Washlee</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-0 flex-1 justify-center">
            <Link href="/" className="px-3 py-2 text-base lg:text-lg text-primary hover:bg-mint rounded-full transition font-semibold">
              Home
            </Link>
            <Link href="/how-it-works" className="px-3 py-2 text-base lg:text-lg text-primary hover:bg-mint rounded-full transition font-semibold">
              How It Works
            </Link>
            <Link href="/pricing" className="px-3 py-2 text-base lg:text-lg text-primary hover:bg-mint rounded-full transition font-semibold">
              Pricing
            </Link>
            <Link href="/subscriptions" className="px-3 py-2 text-base lg:text-lg text-primary hover:bg-mint rounded-full transition font-semibold">
              Plans
            </Link>
            <Link href="/wholesale" className="px-3 py-2 text-base lg:text-lg text-primary hover:bg-mint rounded-full transition font-semibold">
              Wholesale
            </Link>
            <Link href="/faq" className="px-3 py-2 text-base lg:text-lg text-primary hover:bg-mint rounded-full transition font-semibold">
              FAQ
            </Link>
            <Link href="/wash-club" className="px-3 py-2 text-base lg:text-lg text-primary hover:bg-mint rounded-full transition font-semibold">
              WASH Club
            </Link>
            <Link href="/pro" className="px-3 py-2 text-base lg:text-lg text-primary hover:bg-mint rounded-full transition font-semibold">
              Pro
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && !loading ? (
              <>
                <Link
                  href="/booking"
                  className="px-6 py-2.5 bg-primary text-white rounded-full hover:shadow-lg transition font-bold text-lg"
                >
                  Book Now
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
                        <p className="font-bold text-dark text-base">{userData?.name || 'User'}</p>
                        <p className="text-xs text-gray mt-1">{userData?.email || ''}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="block w-full px-4 py-3 text-dark hover:bg-mint transition font-semibold border-b border-gray/20 flex items-center gap-2"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Droplets size={18} className="text-primary" />
                        Dashboard
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
                            {userData?.user_type === 'pro' && (
                              <button
                                onClick={switchToProMode}
                                className="w-full px-4 py-2 text-dark hover:bg-mint transition text-sm text-left flex items-center gap-2 border-b border-gray/20"
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
                {/* Sign In Button */}
                <Link
                  href="/auth/signin"
                  className="px-6 py-3 text-dark bg-white rounded-full shadow-md hover:shadow-lg transition font-semibold text-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-5 py-2.5 bg-primary text-white rounded-full hover:shadow-lg transition font-bold text-base"
                >
                  Get Started
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
            <Link href="/subscriptions" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              Plans
            </Link>
            <Link href="/wholesale" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              Wholesale
            </Link>
            <Link href="/faq" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              FAQ
            </Link>
            <Link href="/wash-club" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              WASH Club
            </Link>
            <Link href="/pro" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              Pro
            </Link>
            <Link href="/app-info" className="block px-4 py-3 text-base text-primary hover:bg-mint rounded-full transition font-semibold">
              App Info
            </Link>
            <hr className="my-2" />
            {isAuthenticated && !loading ? (
              <>
                <Link
                  href="/booking"
                  className="block px-4 py-3 bg-primary text-white rounded-full transition font-semibold text-base"
                  onClick={() => setIsOpen(false)}
                >
                  Book Now
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
                {userData?.user_type === 'pro' && (
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
                <Link href="/auth/signin" className="block px-4 py-3 text-white bg-primary rounded-full transition font-semibold text-base">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="block px-4 py-3 bg-primary text-white rounded-full font-bold text-base">
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
