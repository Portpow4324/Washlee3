'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const ADMIN_PASSWORD = '0Anev5Cyh54ZhfNwWM1f' // 20-character password

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
      if (password === ADMIN_PASSWORD) {
        // Store admin access in sessionStorage
        sessionStorage.setItem('ownerAccess', 'true')
        sessionStorage.setItem('adminLoginTime', new Date().toISOString())
        
        // Redirect to admin dashboard
        router.push('/admin')
      } else {
        setError('Invalid password')
        setPassword('')
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-light to-mint/20 py-12 px-4">
        <div className="w-full max-w-md">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-dark">Admin Access</h1>
            <p className="text-gray mt-2">Enter the admin password to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Access Denied</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-dark mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter admin password"
                  className="w-full pl-12 pr-12 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-primary disabled:opacity-50"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </button>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-semibold mb-2">Admin Panel Features:</p>
              <ul className="space-y-1 text-blue-800">
                <li>• View and manage pro applications</li>
                <li>• Generate employee codes</li>
                <li>• Monitor platform analytics</li>
                <li>• Access administrative tools</li>
              </ul>
            </div>
          </form>

          {/* Security Notice */}
          <p className="text-center text-xs text-gray mt-6">
            This is a secure admin area. Keep your password confidential.
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
