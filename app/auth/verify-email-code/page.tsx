'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Mail, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailCodeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form')

  useEffect(() => {
    const emailParam = searchParams?.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
      return
    }
    const storedEmail = localStorage.getItem('pendingVerificationEmail')
    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      setStatus('error')
      setError('No email found. Please sign up or sign in again.')
    }
  }, [searchParams])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsVerifying(true)

    try {
      if (!code.trim() || code.length < 4) {
        setError('Please enter a valid verification code.')
        setIsVerifying(false)
        return
      }
      if (!email) {
        setError('Email address not found. Please try again.')
        setIsVerifying(false)
        return
      }

      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid verification code. Please try again.')
        setIsVerifying(false)
        return
      }
      if (!data.success) {
        setError('Verification failed. Please try again.')
        setIsVerifying(false)
        return
      }

      setSuccessMessage('Email verified — redirecting…')
      setStatus('success')
      localStorage.setItem('verifiedEmail', email)
      localStorage.removeItem('pendingVerificationEmail')

      setTimeout(() => router.push('/auth/select-usage-type'), 1800)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify code'
      console.error('[VerifyEmailCode] Error verifying code:', err)
      setError(message)
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setSuccessMessage('')
    setIsResending(true)

    try {
      if (!email) {
        setError('Email address not found. Please try again.')
        setIsResending(false)
        return
      }

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to resend verification code.')
        setIsResending(false)
        return
      }

      setSuccessMessage('A fresh code is on its way. Check your inbox.')
      setCode('')
      setIsResending(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification code'
      console.error('[VerifyEmailCode] Error resending code:', err)
      setError(message)
      setIsResending(false)
    }
  }

  return (
    <main className="min-h-screen bg-soft-hero flex flex-col">
      <header className="container-page py-5 flex items-center justify-between">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-primary-deep font-semibold hover:text-primary transition"
        >
          <ArrowLeft size={18} />
          Back to sign in
        </Link>
        <Link href="/" className="text-sm font-semibold text-gray hover:text-primary-deep transition">
          Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-md animate-slide-up">
          {status === 'form' && (
            <div className="surface-card p-6 sm:p-8">
              <div className="text-center mb-7">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-4">
                  <Mail size={20} className="text-primary-deep" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-1">Verify your email</h1>
                <p className="text-sm text-gray">We sent a code to:</p>
                <p className="font-semibold text-primary-deep break-all mt-1">{email}</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 flex gap-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl bg-mint border border-primary/20 px-4 py-3 mb-5 flex items-center gap-2">
                  <CheckCircle size={18} className="text-primary-deep flex-shrink-0" />
                  <p className="text-sm font-semibold text-dark">{successMessage}</p>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div>
                  <label htmlFor="code" className="label-field">Verification code</label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Q7ZGM2"
                    maxLength={10}
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode="text"
                    className="input-field text-center text-2xl font-bold tracking-[0.4em] uppercase"
                  />
                  <p className="text-xs text-gray-soft mt-1.5">The code is in the email we just sent. It expires in 24 hours.</p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isVerifying ? 'Verifying…' : 'Verify email'}
                  {!isVerifying && <ArrowRight size={16} />}
                </button>

                <p className="text-center text-sm text-gray">
                  Didn&rsquo;t receive it?{' '}
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResendCode}
                    className="text-primary-deep font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending ? 'Sending…' : 'Resend code'}
                  </button>
                </p>
              </form>
            </div>
          )}

          {status === 'success' && (
            <div className="surface-card p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-mint mb-4">
                <CheckCircle className="w-8 h-8 text-primary-deep" />
              </div>
              <h1 className="text-2xl font-bold text-dark mb-1">Email verified</h1>
              <p className="text-gray text-sm">{successMessage || 'Redirecting to set up your profile…'}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="surface-card p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-dark mb-2">Something went wrong</h1>
              <p className="text-gray text-sm mb-6">{error}</p>
              <div className="space-y-3">
                <button onClick={() => router.push('/auth/login')} className="btn-primary w-full">
                  Back to sign in
                </button>
                <Link href="/" className="btn-outline w-full">
                  Back to home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function VerifyEmailCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailCodeContent />
    </Suspense>
  )
}
