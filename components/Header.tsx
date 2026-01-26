'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, ArrowLeft, LogOut, User, Droplets, Shield, Briefcase, Settings } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, userData, isAuthenticated, loading } = useAuth()
  
  // Show back button if not on homepage
  const isHomepage = pathname === '/'
  const showBackButton = !isHomepage

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setShowUserMenu(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-mint rounded-full transition"
                title="Go back"
              >
                <ArrowLeft size={24} className="text-primary" />
              </button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="font-bold text-xl text-dark hidden sm:inline">Washlee</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              Home
            </Link>
            <Link href="/how-it-works" className="px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              How It Works
            </Link>
            <Link href="/pricing" className="px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              Pricing
            </Link>
            <Link href="/faq" className="px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              FAQ
            </Link>
            <Link href="/loyalty" className="px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              WASH Club
            </Link>
            <Link href="/pro" className="px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              Become a Pro
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
                    <span className="text-dark">{userData?.name?.split(' ')[0] || 'User'}</span>
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
                      {userData && userData.userType === 'pro' && (
                        <Link
                          href="/dashboard/pro/dashboard"
                          className="block w-full px-4 py-3 text-dark hover:bg-mint transition font-semibold border-b border-gray/20 flex items-center gap-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Briefcase size={18} className="text-primary" />
                          Pro Dashboard
                        </Link>
                      )}
                      {userData?.isAdmin && (
                        <>
                          <div className="px-4 py-2 bg-gray-100 text-xs font-bold text-primary border-b border-gray/20">
                            ADMIN PANEL
                          </div>
                          <Link
                            href="/admin"
                            className="block w-full px-4 py-3 text-dark hover:bg-red-50 transition font-semibold border-b border-gray/20 flex items-center gap-2"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Shield size={18} className="text-red-600" />
                            Admin Dashboard
                          </Link>
                        </>
                      )}
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
                  href="/auth/admin-login"
                  className="px-5 py-2.5 text-white border-2 border-primary rounded-full hover:shadow-lg transition font-semibold text-sm bg-primary/80 hover:bg-primary flex items-center gap-2"
                  title="Admin Login"
                >
                  <Shield size={16} />
                  Admin
                </Link>
                <Link
                  href="/auth/login"
                  className="px-5 py-2.5 text-white border-2 border-primary rounded-full hover:shadow-lg transition font-semibold text-lg bg-primary"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-6 py-2.5 bg-primary text-white rounded-full hover:shadow-lg transition font-bold text-lg"
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
            <Link href="/" className="block px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              Home
            </Link>
            <Link href="/how-it-works" className="block px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              How It Works
            </Link>
            <Link href="/pricing" className="block px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              Pricing
            </Link>
            <Link href="/faq" className="block px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              FAQ
            </Link>
            <Link href="/loyalty" className="block px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              WASH Club
            </Link>
            <Link href="/pro" className="block px-4 py-2 text-primary hover:bg-mint rounded-full transition font-semibold">
              Become a Pro
            </Link>
            <hr className="my-2" />
            {isAuthenticated && !loading ? (
              <>
                <Link
                  href="/booking"
                  className="block px-4 py-2 bg-primary text-white rounded-full transition font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Book Now
                </Link>
                <div className="px-4 py-3 bg-gradient-to-r from-mint to-primary/10 border-l-4 border-primary rounded flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-dark">{userData?.name || 'Loading...'}</p>
                    <p className="text-xs text-gray">{userData?.email || ''}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2.5 text-dark bg-mint hover:bg-opacity-80 rounded-full transition font-semibold border-2 border-primary flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Droplets size={18} className="text-primary" />
                  Dashboard
                </Link>
                {userData && userData.userType === 'pro' && (
                  <Link
                    href="/dashboard/pro/dashboard"
                    className="block px-4 py-2.5 text-dark bg-mint hover:bg-opacity-80 rounded-full transition font-semibold border-2 border-primary flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Briefcase size={18} className="text-primary" />
                    Pro Dashboard
                  </Link>
                )}
                {userData?.isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-full transition font-semibold border-2 border-red-700 flex items-center gap-2"
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
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition flex items-center gap-2 font-semibold"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/admin-login" className="block px-4 py-2 text-white bg-primary/80 hover:bg-primary rounded-full transition font-semibold flex items-center gap-2">
                  <Shield size={16} />
                  Admin Login
                </Link>
                <Link href="/auth/login" className="block px-4 py-2 text-white bg-primary rounded-full transition font-semibold">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="block px-4 py-2 bg-primary text-white rounded-full font-bold">
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
