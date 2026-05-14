'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, LogOut, Home, Package, Briefcase, DollarSign, Settings, Zap, ChevronDown, ArrowLeft } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/lib/AuthContext'

export default function ProHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userData } = useAuth()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showModeSwitch, setShowModeSwitch] = useState(false)

  const handleLogout = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Clear pro mode
      localStorage.removeItem('proMode')
      sessionStorage.removeItem('proMode')
      
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const switchToCustomer = async () => {
    try {
      // Clear pro mode
      localStorage.removeItem('proMode')
      sessionStorage.removeItem('proMode')
      
      // Redirect to customer home
      router.push('/')
      setShowModeSwitch(false)
    } catch (error) {
      console.error('Mode switch error:', error)
    }
  }

  const switchToEmployee = async () => {
    try {
      // Set employee mode
      localStorage.setItem('employeeMode', 'true')
      sessionStorage.setItem('employeeMode', 'true')
      
      // Clear pro mode
      localStorage.removeItem('proMode')
      sessionStorage.removeItem('proMode')
      
      // Redirect to employee dashboard
      router.push('/employee/dashboard')
      setShowModeSwitch(false)
    } catch (error) {
      console.error('Mode switch error:', error)
    }
  }

  const isActive = (path: string) => pathname === path

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/employee/dashboard' },
    { label: 'Orders', icon: Package, href: '/employee/orders' },
    { label: 'Available Jobs', icon: Briefcase, href: '/employee/jobs' },
    { label: 'Earnings', icon: DollarSign, href: '/employee/earnings' },
    { label: 'Settings', icon: Settings, href: '/employee/settings' },
  ]

  return (
    <header className="bg-gradient-to-r from-primary to-accent text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/employee/dashboard" className="flex items-center gap-3 font-bold text-2xl">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Zap size={24} className="text-primary" />
          </div>
          <span className="hidden sm:inline">Washlee Pro</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-semibold ${
                isActive(item.href)
                  ? 'bg-white text-primary'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Mode Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowModeSwitch(!showModeSwitch)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold flex items-center gap-2 transition hidden sm:flex"
            >
              <span className="text-sm">Pro Mode</span>
              <ChevronDown size={16} />
            </button>
            
            {showModeSwitch && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-dark rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-primary/10">
                  <p className="font-bold text-dark text-sm">Account Mode</p>
                  <p className="text-xs text-gray mt-1">You are currently in Pro Mode</p>
                </div>
                
                <button
                  onClick={switchToCustomer}
                  className="w-full px-4 py-3 text-left hover:bg-primary/5 transition font-semibold flex items-center gap-2 border-b border-gray-200"
                >
                  <Home size={18} className="text-primary" />
                  <div>
                    <p>Switch to Customer</p>
                    <p className="text-xs text-gray">Browse as regular customer</p>
                  </div>
                </button>
                
                {user && (
                  <button
                    onClick={switchToEmployee}
                    className="w-full px-4 py-3 text-left hover:bg-primary/5 transition font-semibold flex items-center gap-2"
                  >
                    <Briefcase size={18} className="text-primary" />
                    <div>
                      <p>Switch to Employee</p>
                      <p className="text-xs text-gray">Manage orders & jobs</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-primary hover:shadow-lg transition"
              title={user?.email || 'User'}
            >
              {userData?.name?.charAt(0) || user?.email?.charAt(0) || 'P'}
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-dark rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="font-semibold text-dark">{userData?.name}</p>
                  <p className="text-xs text-gray">{user?.email}</p>
                </div>
                <Link
                  href="/employee/settings"
                  className="block w-full px-4 py-3 text-dark hover:bg-primary/10 transition font-semibold border-b border-gray-200 flex items-center gap-2"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={18} className="text-primary" />
                  Settings
                </Link>
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

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <nav className="lg:hidden border-t border-white/20 bg-gradient-to-r from-primary/95 to-accent/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-lg transition flex items-center gap-3 font-semibold ${
                  isActive(item.href)
                    ? 'bg-white text-primary'
                    : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
            
            <button
              onClick={() => {
                switchToCustomer()
                setShowMobileMenu(false)
              }}
              className="px-4 py-3 rounded-lg text-white hover:bg-white/20 transition flex items-center gap-3 font-semibold border-t border-white/20 mt-2"
            >
              <Home size={20} />
              Switch to Customer
            </button>
            
            <button
              onClick={() => {
                handleLogout()
                setShowMobileMenu(false)
              }}
              className="px-4 py-3 rounded-lg text-white hover:bg-white/20 transition flex items-center gap-3 font-semibold"
            >
              <LogOut size={20} />
              Log Out
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
