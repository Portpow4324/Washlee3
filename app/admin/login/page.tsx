'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { grantAdminAccess } from '@/lib/useAdminAccess'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setError('Too many attempts. Please wait a few minutes and try again.')
        } else {
          setError('Invalid admin password')
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
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-[#48C9B0] to-[#3aad9a] p-4 rounded-lg inline-block mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#1f2d2b]">Admin Access</h1>
            <p className="text-[#6b7b78] mt-2">Secure administrator portal</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  name="washlee-admin-passphrase"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#48C9B0] transition text-[#1f2d2b]"
                  disabled={isLoading}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-[#6b7b78] hover:text-[#1f2d2b] transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? 'Authenticating...' : 'Access Admin Portal'}
            </Button>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-semibold mb-2">🔐 Secure Access</p>
            <p className="text-xs text-blue-700">
              This portal is restricted to authorized administrators only. All access is logged and monitored.
            </p>
          </div>
        </Card>
      </div>
      <Footer />
    </>
  )
}
