'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, LogOut, Home, Package, Briefcase, DollarSign, Settings, Zap, ChevronDown } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/AuthContext'

export default function EmployeeHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userData } = useAuth()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showRoleSwitch, setShowRoleSwitch] = useState(false)

  const handleLogout = async () => {
    try {
      // Clear employee mode
      localStorage.removeItem('employeeMode')
      sessionStorage.removeItem('employeeMode')
      
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const switchToCustomer = async () => {
    try {
      // Clear employee mode
      localStorage.removeItem('employeeMode')
      sessionStorage.removeItem('employeeMode')
      
      // Redirect to customer home
      router.push('/')
      setShowRoleSwitch(false)
    } catch (error) {
      console.error('Mode switch error:', error)
    }
  }

  const switchToProMode = async () => {
    try {
      // Set pro mode
      localStorage.setItem('proMode', 'true')
      sessionStorage.setItem('proMode', 'true')
      
      // Clear employee mode
      localStorage.removeItem('employeeMode')
      sessionStorage.removeItem('employeeMode')
      
      // Redirect to employee dashboard
      router.push('/employee/dashboard')
      setShowRoleSwitch(false)
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
    <header className="bg-white text-dark sticky top-0 z-50 shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/employee/dashboard" className="flex items-center gap-3 font-bold text-2xl">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Zap size={24} className="text-white" />
          </div>
          <span className="hidden sm:inline text-dark">Washlee</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-semibold ${
                isActive(item.href)
                  ? 'bg-primary text-white'
                  : 'text-dark hover:bg-light'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side - User Menu & Mobile Toggle */}
        <div className="flex items-center gap-4">
          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitch(!showRoleSwitch)}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold flex items-center gap-2 transition hidden sm:flex"
            >
              <span className="text-sm">Employee Mode</span>
              <ChevronDown size={16} />
            </button>
            
            {showRoleSwitch && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-dark rounded-lg shadow-xl overflow-hidden">
                {userData?.userType === 'pro' && (
                  <button
                    onClick={switchToProMode}
                    className="w-full px-4 py-3 text-left hover:bg-mint transition font-semibold flex items-center gap-2 border-b border-gray/20"
                  >
                    <Briefcase size={18} className="text-primary" />
                    <div>
                      <p>Access Pro Dashboard</p>
                      <p className="text-xs text-gray font-normal">Professional contractor view</p>
                    </div>
                  </button>
                )}
                <Link
                  href="/dashboard"
                  className="w-full px-4 py-3 text-left hover:bg-mint transition font-semibold flex items-center gap-2 border-b border-gray/20"
                  onClick={() => setShowRoleSwitch(false)}
                >
                  <Home size={18} className="text-primary" />
                  <div>
                    <p>Customer Dashboard</p>
                    <p className="text-xs text-gray font-normal">View your orders</p>
                  </div>
                </Link>
                <button
                  onClick={switchToCustomer}
                  className="w-full px-4 py-3 text-left hover:bg-mint transition font-semibold flex items-center gap-2 border-b border-gray/20"
                >
                  <Home size={18} className="text-primary" />
                  <div>
                    <p>Switch to Customer</p>
                    <p className="text-xs text-gray font-normal">Browse as regular customer</p>
                  </div>
                </button>
                <div className="px-4 py-2 text-xs text-gray bg-gray/5">
                  {user?.email}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center font-bold text-dark hover:shadow-lg transition"
              title={user?.email || 'User'}
            >
              {userData?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-dark rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray/20">
                  <p className="font-semibold text-dark">{userData?.firstName} {userData?.lastName}</p>
                  <p className="text-xs text-gray">{user?.email}</p>
                </div>
                <Link
                  href="/employee/settings"
                  className="block w-full px-4 py-3 text-dark hover:bg-mint transition font-semibold border-b border-gray/20 flex items-center gap-2"
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
            className="lg:hidden p-2 hover:bg-gray/10 rounded-lg transition"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <nav className="lg:hidden border-t border-gray-200 bg-light">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-lg transition flex items-center gap-3 font-semibold ${
                  isActive(item.href)
                    ? 'bg-primary text-white'
                    : 'text-dark hover:bg-gray-100'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
            {userData?.userType === 'pro' && (
              <button
                onClick={() => {
                  switchToProMode()
                  setShowMobileMenu(false)
                }}
                className="px-4 py-3 rounded-lg text-primary hover:bg-primary/10 transition flex items-center gap-3 font-semibold border-t border-gray/20 mt-2"
              >
                <Briefcase size={20} />
                Access Pro Dashboard
              </button>
            )}
            <Link
              href="/dashboard"
              className="px-4 py-3 rounded-lg text-primary hover:bg-primary/10 transition flex items-center gap-3 font-semibold"
              onClick={() => setShowMobileMenu(false)}
            >
              <Home size={20} />
              Customer Dashboard
            </Link>
            <button
              onClick={() => {
                switchToCustomer()
                setShowMobileMenu(false)
              }}
              className="px-4 py-3 rounded-lg text-primary hover:bg-primary/10 transition flex items-center gap-3 font-semibold"
            >
              <Home size={20} />
              Switch to Customer
            </button>
            <button
              onClick={() => {
                handleLogout()
                setShowMobileMenu(false)
              }}
              className="px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition flex items-center gap-3 font-semibold"
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
