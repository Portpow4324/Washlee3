'use client'

import Link from 'next/link'
import { useState, Suspense, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import OAuthButtons from '@/components/OAuthButtons'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [emailNotConfirmedError, setEmailNotConfirmedError] = useState('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Already authenticated → bounce to dashboard / requested redirect.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          router.push(redirectTo || '/dashboard')
          return
        }
      } catch (err) {
        console.error('[Login] Error checking auth:', err)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router, redirectTo])

  // Restore remember-me email if still in window.
  useEffect(() => {
    const storedEmail = localStorage.getItem('loginEmail')
    const rememberMeEnabled = localStorage.getItem('rememberMe') === 'true'
    const rememberMeExpiry = localStorage.getItem('rememberMeExpiry')

    if (storedEmail && rememberMeEnabled && rememberMeExpiry) {
      const expiryDate = new Date(rememberMeExpiry)
      if (expiryDate > new Date()) {
        setEmail(storedEmail)
        setRememberMe(true)
      } else {
        localStorage.removeItem('loginEmail')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberMeExpiry')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailNotConfirmedError('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (error.message?.includes('Email not confirmed')) {
          localStorage.setItem('pendingVerificationEmail', email)
          setEmailNotConfirmedError(email)
          setIsLoading(false)
          return
        }
        throw error
      }

      if (data.user && !data.user.email_confirmed_at) {
        setEmailNotConfirmedError(email)
        setIsLoading(false)
        return
      }

      setSuccessMessage('Welcome back. Logging you in…')

      // Look up phone-verified flag for non-customer redirects.
      const { data: userData } = await supabase
        .from('users')
        .select('phone_verified, phone, user_type')
        .eq('id', data.user.id)
        .single()

      if (rememberMe) {
        localStorage.setItem('loginEmail', email)
        localStorage.setItem('rememberMe', 'true')
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
        localStorage.setItem('rememberMeExpiry', expiryDate.toISOString())
      } else {
        localStorage.removeItem('loginEmail')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberMeExpiry')
      }

      if (userData && !userData.phone_verified && userData.user_type !== 'customer') {
        setTimeout(() => {
          router.push(`/auth/phone-verification?email=${encodeURIComponent(email)}`)
        }, 1000)
      } else {
        setTimeout(() => {
          router.push(redirectTo || '/dashboard')
        }, 1500)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in'
      console.error('Login error:', err)
      if (message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. If you signed up with Google or Apple, use that sign-in button instead.')
      } else {
        setError(message)
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
        body: JSON.stringify({ email: emailNotConfirmedError }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not resend confirmation email.')
        return
      }
      setSuccessMessage('Confirmation email sent. Check your inbox.')
      setEmailNotConfirmedError('')
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Resend error:', err)
      setError('Failed to resend confirmation email.')
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft-hero">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Checking your sign-in…</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-soft-hero flex flex-col">
      <header className="container-page py-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary-deep font-semibold hover:text-primary transition"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <Link href="/" className="text-sm font-semibold text-gray hover:text-primary-deep transition">
          Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-7">
            <span className="pill mb-3"><Sparkles size={14} /> Welcome back</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-1">Sign in to Washlee</h1>
            <p className="text-sm text-gray">Pick up where you left off — book, track, and manage orders.</p>
          </div>

          <div className="surface-card p-6 sm:p-8">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 flex gap-2">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl bg-mint border border-primary/20 px-4 py-3 mb-5 flex items-center gap-2">
                <CheckCircle size={18} className="text-primary-deep flex-shrink-0" />
                <p className="text-sm font-semibold text-dark">{successMessage}</p>
              </div>
            )}

            {emailNotConfirmedError ? (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
                <p className="font-semibold text-amber-900 mb-2">Email not confirmed</p>
                <p className="text-sm text-amber-900 mb-3">
                  Your email hasn&rsquo;t been verified yet. We sent a verification code to:
                </p>
                <p className="font-mono bg-white border border-amber-200 px-3 py-2 rounded-lg text-center text-sm font-semibold text-dark mb-4 break-all">
                  {emailNotConfirmedError}
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/auth/verify-email-code?email=${encodeURIComponent(emailNotConfirmedError)}`)}
                  className="btn-primary w-full mb-3"
                >
                  Enter verification code
                  <ArrowRight size={16} />
                </button>
                <p className="text-sm text-amber-900 text-center mb-3">
                  Didn&rsquo;t get the email?{' '}
                  <button
                    type="button"
                    onClick={handleResendConfirmationEmail}
                    className="font-semibold underline hover:opacity-80"
                  >
                    Resend it
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmailNotConfirmedError('')
                    setEmail('')
                    setPassword('')
                  }}
                  className="w-full text-sm text-amber-900 underline"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="label-field">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-soft" size={18} />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-12"
                        required
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
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-soft hover:text-primary-deep transition"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-primary-deep hover:text-primary font-semibold"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
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

                <OAuthButtons
                  intent="login"
                  redirectTo={redirectTo || '/dashboard'}
                  onError={setError}
                  onStart={(provider) => {
                    setError('')
                    setSuccessMessage(`Opening ${provider === 'apple' ? 'Apple' : 'Google'} sign in...`)
                  }}
                />
              </>
            )}
          </div>

          <p className="text-center text-sm text-gray mt-6">
            Don&rsquo;t have an account?{' '}
            <Link href="/auth/signup-customer" className="font-semibold text-primary-deep hover:text-primary">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
