'use client'

import Image from 'next/image'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { useState, Suspense, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect')
  
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resetSuccessMessage, setResetSuccessMessage] = useState('')
  const [emailNotConfirmedError, setEmailNotConfirmedError] = useState('')

  // Load remember me credentials on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('loginEmail')
    const rememberMeEnabled = localStorage.getItem('rememberMe') === 'true'
    const rememberMeExpiry = localStorage.getItem('rememberMeExpiry')

    if (storedEmail && rememberMeEnabled && rememberMeExpiry) {
      const expiryDate = new Date(rememberMeExpiry)
      if (expiryDate > new Date()) {
        // Remember me still valid
        setEmail(storedEmail)
        setRememberMe(true)
      } else {
        // Remember me expired, clear it
        localStorage.removeItem('loginEmail')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberMeExpiry')
      }
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setError('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      if (error) throw error

      setSuccessMessage(`✅ Welcome! Signing you in with Google...`)

      setTimeout(() => {
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.push('/')
        }
      }, 1500)
    } catch (err: any) {
      console.error('Google sign in error:', err)
      setError(err.message || 'Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailNotConfirmedError('')
    setIsLoading(true)

    console.log('[Login] Attempting login with email:', email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('[Login] Response:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message,
        userId: data?.user?.id,
        emailConfirmed: data?.user?.email_confirmed_at
      })

      if (error) {
        console.error('[Login] Supabase error:', {
          message: error.message,
          status: error.status,
          type: error.name
        })
        throw error
      }

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        console.log('[Login] Email not confirmed:', email)
        setEmailNotConfirmedError(email)
        setIsLoading(false)
        return
      }

      console.log('[Login] ✅ Login successful for:', email)
      setSuccessMessage(`✅ Welcome back! Logging you in...`)

      // Check if user needs phone verification
      const { data: userData } = await supabase
        .from('users')
        .select('phone_verified, phone')
        .eq('id', data.user.id)
        .single()

      // Store remember me if checked
      if (rememberMe) {
        localStorage.setItem('loginEmail', email)
        localStorage.setItem('rememberMe', 'true')
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7) // 7 days
        localStorage.setItem('rememberMeExpiry', expiryDate.toISOString())
      } else {
        localStorage.removeItem('loginEmail')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberMeExpiry')
      }

      // Check if phone verification is needed
      if (userData && !userData.phone_verified) {
        console.log('[Login] Phone verification needed for:', email)
        setTimeout(() => {
          router.push(`/auth/phone-verification?email=${encodeURIComponent(email)}`)
        }, 1000)
      } else {
        setTimeout(() => {
          if (redirectTo) {
            router.push(redirectTo)
          } else {
            router.push('/')
          }
        }, 1500)
      }
    } catch (err: any) {
      console.error('Login error:', {
        message: err.message,
        status: err.status,
        fullError: err
      })
      if (err.message.includes('Invalid login credentials')) {
        setError('❌ Incorrect email or password. Please try again.\n\nTip: If you signed up via Google, use "Sign in with Google" instead.')
      } else {
        setError(err.message || 'Failed to sign in')
      }
      setIsLoading(false)
    }
  }

  const handleResendConfirmationEmail = async () => {
    try {
      setError('')
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNotConfirmedError })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`Error: ${data.error}`)
        return
      }

      setSuccessMessage('✅ Confirmation email sent! Check your inbox.')
      setEmailNotConfirmedError('')
      setTimeout(() => {
        setSuccessMessage('')
      }, 4000)
    } catch (err: any) {
      setError('Failed to resend confirmation email. Please try again.')
      console.error('Resend error:', err)
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

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail)

      if (error) throw error

      setResetSuccessMessage(`✅ Password reset link sent to ${resetEmail}. Check your email!`)
      setResetEmail('')
      
      setTimeout(() => {
        setShowForgotPassword(false)
        setResetSuccessMessage('')
      }, 3000)
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError('Failed to send reset link. Please try again.')
    } finally {
      setIsResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 p-2 hover:bg-white rounded-full transition"
        title="Go back"
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

          {/* Email Not Confirmed Message */}
          {emailNotConfirmedError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-4 rounded-lg mb-6">
              <p className="font-semibold mb-3">📧 Email Not Confirmed</p>
              <p className="text-sm mb-4">Your email address hasn't been verified yet. We've sent you a confirmation email at <span className="font-semibold">{emailNotConfirmedError}</span></p>
              <p className="text-sm mb-4">Check your inbox for the confirmation link, or <button
                type="button"
                onClick={handleResendConfirmationEmail}
                className="text-primary font-semibold underline hover:opacity-75 transition"
              >
                click here to resend the email
              </button>.</p>
              <button
                type="button"
                onClick={() => {
                  setEmailNotConfirmedError('')
                  setEmail('')
                  setPassword('')
                }}
                className="px-4 py-2 border border-yellow-200 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-100 transition text-sm"
              >
                Back
              </button>
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
          ) : emailNotConfirmedError ? (
            // Don't show login form when email is not confirmed
            null
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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border border-gray accent-primary"
                    />
                    <span className="text-sm text-gray">Remember me for 7 days</span>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <LoginContent />
    </Suspense>
  )
}
