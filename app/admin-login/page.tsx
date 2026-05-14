'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { grantAdminAccess } from '@/lib/useAdminAccess'

function formatRetryAfter(secondsValue: string | null) {
  const seconds = Number(secondsValue)
  if (!Number.isFinite(seconds) || seconds <= 0) return 'a few minutes'

  const minutes = Math.ceil(seconds / 60)
  return minutes === 1 ? '1 minute' : `${minutes} minutes`
}

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Too many attempts. Please wait ${formatRetryAfter(response.headers.get('Retry-After'))} and try again.`)
        } else {
          setError('Invalid password')
        }
        setPassword('')
        return
      }

      grantAdminAccess()
      const next = new URLSearchParams(window.location.search).get('next')
      router.push(next?.startsWith('/admin') ? next : '/admin')
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl shadow-soft mb-4">
              <Lock size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-950">Admin access</h1>
            <p className="text-sm text-gray-600 mt-1">
              Enter the admin password to open the Washlee control center.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-5"
            autoComplete="off"
          >
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 text-sm">Access denied</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-800 mb-2">
                Admin password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  id="admin-password"
                  name="washlee-admin-passphrase"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter admin password"
                  className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  disabled={loading}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-deep disabled:opacity-50 transition"
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-deep disabled:bg-primary/40 text-white font-semibold py-3 rounded-full transition disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying…' : 'Open admin control center'}
              {!loading && <ArrowRight size={16} />}
            </button>

            <div className="rounded-xl bg-mint/40 border border-primary/15 p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-950 mb-1.5">What&rsquo;s inside</p>
              <ul className="space-y-1 text-xs text-gray-700">
                <li>• Orders, users, and Pro applications</li>
                <li>• Payouts, support tickets, and inquiries</li>
                <li>• Analytics, monitoring, and security logs</li>
                <li>• Wash Club, marketing, and pricing tools</li>
              </ul>
            </div>
          </form>

          <p className="text-center text-xs text-gray-500 mt-5">
            Authorised personnel only. Sessions are short-lived and rate-limited.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
