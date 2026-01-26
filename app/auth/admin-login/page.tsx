'use client'

import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get the ID token to check custom claims
      const idTokenResult = await user.getIdTokenResult(true)
      const isAdmin = idTokenResult.claims?.admin === true

      if (!isAdmin) {
        setError('⚠️ This account does not have admin privileges. Please contact support.')
        setIsLoading(false)
        return
      }

      setSuccessMessage(`✅ Welcome, Admin! Redirecting to dashboard...`)

      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    } catch (err: any) {
      console.error('Admin login error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('Admin account not found. Please check your email.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.')
      } else {
        setError(err.message || 'Failed to sign in')
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark to-[#2a3a38] flex flex-col items-center justify-center px-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-lg mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray text-lg">Manage your Washlee platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300">
                {successMessage}
              </div>
            )}

            {/* Sign In Button */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in as Admin
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admin Access Only
          </h3>
          <p className="text-gray text-sm">
            This portal is restricted to authorized administrators only. Only accounts with admin privileges can access the platform management tools.
          </p>
        </div>

        {/* Regular Login Link */}
        <div className="text-center">
          <p className="text-gray text-sm mb-3">
            Not an admin? Use the regular login
          </p>
          <Link
            href="/auth/login"
            className="inline-block text-primary hover:text-primary/80 font-medium transition"
          >
            Customer Login →
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-gray text-xs">
            Washlee Admin Portal v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
