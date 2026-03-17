'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, User, Briefcase } from 'lucide-react'

interface DashboardSwitcherProps {
  currentRole: 'customer' | 'employee' | 'both'
  firstName?: string
}

/**
 * Dashboard Switcher Component
 * Shows role selector dropdown when user has multiple roles
 * Only shows single role option if user has only one role
 */
export default function DashboardSwitcher({ currentRole, firstName = 'User' }: DashboardSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  // If user only has customer role, don't show switcher
  if (currentRole === 'customer') {
    return (
      <div className="flex items-center gap-2">
        <User size={18} className="text-primary" />
        <span className="text-sm text-dark">{firstName}</span>
      </div>
    )
  }

  // If user only has employee role, don't show switcher
  if (currentRole === 'employee') {
    return (
      <div className="flex items-center gap-2">
        <Briefcase size={18} className="text-primary" />
        <span className="text-sm text-dark">{firstName}</span>
      </div>
    )
  }

  // User has BOTH roles - show dropdown switcher
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-light hover:bg-primary/10 transition border border-gray/20"
      >
        <div className="flex items-center gap-1">
          <User size={16} className="text-primary" />
          <Briefcase size={16} className="text-primary" />
        </div>
        <span className="text-sm text-dark font-medium">{firstName}</span>
        <ChevronDown size={16} className={`text-gray transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray/20 rounded-lg shadow-lg z-50">
          {/* Customer Dashboard Option */}
          <Link
            href="/dashboard/customer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-light transition border-b border-gray/10 first:rounded-t-lg"
          >
            <User size={18} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-dark">Customer Dashboard</p>
              <p className="text-xs text-gray">Browse & order laundry</p>
            </div>
          </Link>

          {/* Employee Dashboard Option */}
          <Link
            href="/employee/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-light transition last:rounded-b-lg"
          >
            <Briefcase size={18} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-dark">Employee Dashboard</p>
              <p className="text-xs text-gray">Manage your jobs & earnings</p>
            </div>
          </Link>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
