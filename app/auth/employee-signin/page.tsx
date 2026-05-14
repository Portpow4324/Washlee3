'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Briefcase, AlertCircle, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function EmployeeSignInPage() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const rememberMeExpiry = localStorage.getItem('employeeRememberMeExpiry')
    const sessionOnly = sessionStorage.getItem('employeeSessionOnly')

    if (rememberMeExpiry && new Date(rememberMeExpiry) < new Date()) {
      localStorage.removeItem('employeeRememberMe')
      localStorage.removeItem('employeeToken')
      localStorage.removeItem('employeeData')
      localStorage.removeItem('employeeRememberMeExpiry')
    }

    if (!sessionOnly && !localStorage.getItem('employeeRememberMe')) {
      localStorage.removeItem('employeeToken')
      localStorage.removeItem('employeeData')
    }
  }, [])

  const saveSessionPreference = (remember: boolean) => {
    if (remember) {
      localStorage.setItem('employeeRememberMe', 'true')
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7)
      localStorage.setItem('employeeRememberMeExpiry', expiryDate.toISOString())
    } else {
      sessionStorage.setItem('employeeSessionOnly', 'true')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!employeeId.trim() || !email.trim() || !password.trim()) {
      setError('Enter your Pro ID, email, and password.')
      return
    }

    const isSixDigit = /^\d{6}$/.test(employeeId.trim())
    const isStandardFormat = /^EMP-\d+-[A-Z0-9]+$/.test(employeeId.trim())
    const isPayslipFormat = /^PS-\d{8}-[A-Z0-9]+$/.test(employeeId.trim())

    if (!isSixDigit && !isStandardFormat && !isPayslipFormat) {
      setError('Invalid Pro ID. Use your 6-digit Pro ID or full legacy code.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)

    try {
      const requestPayload = {
        employeeId: employeeId.trim(),
        email: email.trim(),
        password,
      }

      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Sign in failed.')
        setIsLoading(false)
        return
      }

      setSuccessMessage(`Welcome, ${data.employee.firstName}.`)
      saveSessionPreference(rememberMe)

      localStorage.setItem('employeeToken', data.token)
      localStorage.setItem('employeeData', JSON.stringify(data.employee))
      localStorage.setItem('isEmployeeUser', 'true')
      localStorage.setItem('employeeMode', 'true')
      sessionStorage.setItem('employeeMode', 'true')

      try {
        const { error: supabaseError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (supabaseError) throw supabaseError

        await new Promise((resolve) => setTimeout(resolve, 1000))
        router.push('/employee/dashboard')
      } catch (authError) {
        const message = authError instanceof Error ? authError.message : 'Authentication failed'
        console.error('[Employee Login] Auth sign-in error:', authError)
        setError(`Authentication failed: ${message}`)
        setIsLoading(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during sign in.'
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-soft-hero flex flex-col">
      <header className="container-page py-5 flex items-center justify-between">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-primary-deep font-semibold hover:text-primary transition"
        >
          <ArrowLeft size={18} />
          All sign-in options
        </Link>
        <Link href="/" className="text-sm font-semibold text-gray hover:text-primary-deep transition">
          Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-deep mb-3">
              <Briefcase size={22} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-1">Pro sign in</h1>
            <p className="text-sm text-gray">Access your jobs, earnings, and pickups.</p>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="employeeId" className="label-field">Pro ID</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                  <input
                    id="employeeId"
                    type="text"
                    placeholder="6-digit Pro ID"
                    autoComplete="username"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="input-field pl-12"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-soft mt-1.5">Format: 6 digits (e.g. 234567), or your full legacy code (EMP-…).</p>
              </div>

              <div>
                <label htmlFor="email" className="label-field">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label-field">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12 pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-soft hover:text-primary-deep transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-line accent-primary"
                  />
                  <span className="text-sm text-gray">Remember me for 7 days</span>
                </label>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                  <Shield size={12} /> Strict security
                </span>
              </div>

              <p className="text-xs text-gray bg-mint/40 border border-primary/15 rounded-xl px-3 py-2">
                If &ldquo;Remember me&rdquo; is off you&rsquo;ll be signed out when you close this tab.
              </p>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex gap-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl bg-mint border border-primary/20 px-4 py-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-primary-deep flex-shrink-0" />
                  <p className="text-sm font-semibold text-dark">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !employeeId || !password}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
                {!isLoading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-line" />
              <span className="text-xs text-gray-soft uppercase tracking-wider font-semibold">or</span>
              <div className="flex-1 h-px bg-line" />
            </div>

            <Link href="/pro" className="btn-outline w-full">
              Become a Washlee Pro
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-6 surface-card p-5 bg-mint/40 border-primary/10">
            <h3 className="font-bold text-dark text-sm mb-1">Need help?</h3>
            <p className="text-sm text-gray">
              Your 6-digit Pro ID was emailed to you when your application was approved. Lost it?{' '}
              <Link href="/contact" className="text-primary-deep font-semibold hover:underline">
                Contact support
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
