'use client'

import Image from 'next/image'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect')
  
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resetSuccessMessage, setResetSuccessMessage] = useState('')

  const handleGoogleSignIn = async () => {
    setError('')
    setIsLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Show success message
      setSuccessMessage(`✅ Welcome! Signing you in with Google...`)

      // Redirect to specified location or home
      setTimeout(() => {
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.push('/')
        }
      }, 1500)
    } catch (err: any) {
      console.error('Google sign in error:', err)
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in was cancelled')
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked. Please allow pop-ups for this site.')
      } else {
        setError(err.message || 'Failed to sign in with Google')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Show success message
      setSuccessMessage(`✅ Welcome back! Logging you in...`)

      // Redirect to specified location or home
      setTimeout(() => {
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.push('/')
        }
      }, 1500)
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('Incorrect email or password. Please try again or sign up for a new account.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect email or password. Please try again or use Forgot Password.')
      } else if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again or use Forgot Password.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later or use Forgot Password.')
      } else {
        setError(err.message || 'Failed to sign in')
      }
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetSuccessMessage('')
    setError('')
    setIsResetLoading(true)

    try {
      if (!resetEmail.trim()) {
        setError('Please enter your email address')
        setIsResetLoading(false)
        return
      }

      await sendPasswordResetEmail(auth, resetEmail)
      setResetSuccessMessage(`✅ Password reset link sent to ${resetEmail}. Check your email!`)
      setResetEmail('')
      
      // Close forgot password section after 3 seconds
      setTimeout(() => {
        setShowForgotPassword(false)
        setResetSuccessMessage('')
      }, 3000)
    } catch (err: any) {
      console.error('Password reset error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError('Failed to send reset link. Please try again.')
      }
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleBackClick = () => {
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
      <button
        onClick={handleBackClick}
        className="absolute top-6 left-6 p-2 hover:bg-white rounded-full transition"
        title="Go back to sign in"
      >
        <ArrowLeft size={24} className="text-primary" />
      </button>
      <Link href="/" className="absolute top-6 right-6 px-4 py-2 bg-white text-primary rounded-full font-semibold hover:shadow-lg transition">
        Home
      </Link>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Image
              src="/logo-washlee.png"
              alt="Washlee Logo"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="font-bold text-2xl text-dark">Washlee</span>
          </Link>
          <h1 className="text-3xl font-bold text-dark">Sign In</h1>
          <p className="text-gray mt-2">Welcome back! Let's get your laundry done.</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg mb-6 text-center">
              <p className="font-semibold text-base">{successMessage}</p>
            </div>
          )}

          {/* Forgot Password Section */}
          {successMessage ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <Spinner />
              </div>
            </div>
          ) : showForgotPassword ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              {/* Reset Success Message */}
              {resetSuccessMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg mb-6 text-center flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  <p className="font-semibold text-sm">{resetSuccessMessage}</p>
                </div>
              )}

              <h2 className="text-xl font-bold text-dark mb-4">Reset Your Password</h2>
              <p className="text-sm text-gray mb-4">Enter your email and we'll send you a link to reset your password.</p>
              
              <div>
                <label htmlFor="reset-email" className="block text-sm font-semibold text-dark mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full flex-1"
                  disabled={isResetLoading}
                >
                  {isResetLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetEmail('')
                    setResetSuccessMessage('')
                    setError('')
                  }}
                  className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                >
                  Back
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-dark mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-dark mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-primary"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray" />
                    <span className="text-sm text-gray">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:text-accent transition font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && <Spinner />}
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray"></div>
                <span className="text-sm text-gray">OR</span>
                <div className="flex-1 h-px bg-gray"></div>
              </div>

              {/* Google Login */}
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </>
          )}
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray">Don't have an account? </p>
          <Link href="/auth/signup" className="font-semibold text-primary hover:text-accent transition">
            Sign up for free
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
