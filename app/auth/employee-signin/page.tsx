'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Link from 'next/link'
import { Mail, Lock, Briefcase, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function EmployeeSignIn() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Strict session check on mount
  useEffect(() => {
    const rememberMeExpiry = localStorage.getItem('employeeRememberMeExpiry')
    const sessionOnly = sessionStorage.getItem('employeeSessionOnly')
    
    // If remember me expired, clear it
    if (rememberMeExpiry && new Date(rememberMeExpiry) < new Date()) {
      localStorage.removeItem('employeeRememberMe')
      localStorage.removeItem('employeeToken')
      localStorage.removeItem('employeeData')
      localStorage.removeItem('employeeRememberMeExpiry')
    }
    
    // Strict rule: No remember me and new session = log out
    if (!sessionOnly && !localStorage.getItem('employeeRememberMe')) {
      localStorage.removeItem('employeeToken')
      localStorage.removeItem('employeeData')
    }
  }, [])

  const saveSessionPreference = (remember: boolean) => {
    if (remember) {
      // Store for 7 days (stricter than customer login)
      localStorage.setItem('employeeRememberMe', 'true')
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7)
      localStorage.setItem('employeeRememberMeExpiry', expiryDate.toISOString())
    } else {
      // Session-only - cleared on tab close
      sessionStorage.setItem('employeeSessionOnly', 'true')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validate input
    if (!employeeId.trim() || !email.trim() || !password.trim()) {
      setError('Please enter employee ID, email, and password')
      return
    }

    // Accept multiple formats:
    // 1. 6-digit: 123456
    // 2. Standard: EMP-1773230849589-1ZE64
    // 3. Payslip: PS-20240304-X9K2L
    const isSixDigit = /^\d{6}$/.test(employeeId.trim())
    const isStandardFormat = /^EMP-\d+-[A-Z0-9]+$/.test(employeeId.trim())
    const isPayslipFormat = /^PS-\d{8}-[A-Z0-9]+$/.test(employeeId.trim())

    if (!isSixDigit && !isStandardFormat && !isPayslipFormat) {
      setError('Invalid employee ID. Use 6 digits or full format from your email.')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const requestPayload = {
        employeeId: employeeId.trim(),
        email: email.trim(),
        password,
      }
      
      console.log('[Employee Login] Sending:', { employeeId: requestPayload.employeeId, email: requestPayload.email, password: '***' })

      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const data = await response.json()
      console.log('[Employee Login] Response:', { status: response.status, data })

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      setSuccessMessage(`Welcome, ${data.employee.firstName}!`)

      // Save session preference (strict rules for employees)
      saveSessionPreference(rememberMe)

      // Store token and data
      localStorage.setItem('employeeToken', data.token)
      localStorage.setItem('employeeData', JSON.stringify(data.employee))
      // Mark as authenticated employee for dashboard fallback
      localStorage.setItem('isEmployeeUser', 'true')
      // Set employee mode flag
      localStorage.setItem('employeeMode', 'true')
      sessionStorage.setItem('employeeMode', 'true')

      // Sign into Supabase on the client side using the email and password
      // This maintains the user session for authenticated operations
      try {
        const { error: supabaseError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })
        
        if (supabaseError) {
          throw supabaseError
        }
        
        console.log('[Employee Login] Successfully signed into Supabase')
        
        // Wait a moment for Supabase session to be ready
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Redirect to employee dashboard
        router.push('/employee/dashboard')
      } catch (authError: any) {
        console.error('[Employee Login] Auth sign-in error:', authError)
        setError('Authentication failed: ' + authError.message)
        setIsLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-[#48C9B0] transition mb-6">
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-[#48C9B0] to-[#3aad9a] p-3 rounded-lg">
              <Briefcase size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1f2d2b]">Employee Portal</h1>
              <p className="text-gray-600 text-sm">Sign in to your dashboard</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee ID Field */}
            <div>
              <label htmlFor="employeeId" className="block text-sm font-bold text-[#1f2d2b] mb-2 uppercase tracking-widest">
                Employee ID
              </label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="employeeId"
                  type="text"
                  placeholder="Enter your Employee ID (6 digits or full code)"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] focus:border-transparent transition"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Format: 6 digits (234567) or full code from email (EMP-xxx-xxx)</p>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-[#1f2d2b] mb-2 uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] focus:border-transparent transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-[#1f2d2b] mb-2 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 py-3 w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0] focus:border-transparent transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 transition"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me - STRICTER for employees */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray"
                />
                <span className="text-sm text-gray-600">Remember me for 7 days</span>
              </label>
              <span className="text-xs text-red-600 font-semibold">🔒 Strict Security</span>
            </div>

            {/* Security Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <p><strong>⚠️ Security Notice:</strong> If you don't enable "Remember me", you will be logged out when you close this tab or reload the page.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex gap-3 items-start">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg flex gap-3 items-start">
                <span className="text-2xl">✓</span>
                <p className="font-semibold">{successMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !employeeId || !password}
              className="w-full py-3 text-lg font-bold"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>

          {/* Signup Link */}
          <Link href="/pro">
            <Button variant="outline" className="w-full py-3 text-lg font-bold">
              Become an Employee
            </Button>
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-[#1f2d2b] mb-2">💡 Need Help?</h3>
          <p className="text-sm text-gray-700 mb-3">
            Your 6-digit employee ID was provided when you completed your application.
          </p>
          <p className="text-xs text-gray-600">
            Check your email for your employee credentials. If you don't have them, contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
