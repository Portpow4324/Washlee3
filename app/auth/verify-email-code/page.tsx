'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, AlertCircle } from 'lucide-react'
import Button from '@/components/Button'
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
    // Get email from URL params or localStorage
    const emailParam = searchParams?.get('email')
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    } else {
      // Try to get from localStorage (set during login attempt)
      const storedEmail = localStorage.getItem('pendingVerificationEmail')
      if (storedEmail) {
        setEmail(storedEmail)
      } else {
        setStatus('error')
        setError('No email found. Please try signing up or logging in again.')
      }
    }
  }, [searchParams])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsVerifying(true)

    try {
      if (!code.trim() || code.length < 4) {
        setError('Please enter a valid verification code')
        setIsVerifying(false)
        return
      }

      if (!email) {
        setError('Email address not found. Please try again.')
        setIsVerifying(false)
        return
      }

      // Verify the code using our custom API endpoint
      console.log('[VerifyEmailCode] Verifying code for email:', email)
      
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[VerifyEmailCode] Verification error:', data)
        setError(data.error || 'Invalid verification code. Please try again.')
        setIsVerifying(false)
        return
      }

      if (!data.success) {
        console.error('[VerifyEmailCode] Verification not successful')
        setError('Verification failed. Please try again.')
        setIsVerifying(false)
        return
      }

      console.log('[VerifyEmailCode] ✓ Email verified:', data.userId)
      setSuccessMessage('✅ Email verified! Redirecting to complete your profile...')
      setStatus('success')

      // Store email in localStorage for next step
      localStorage.setItem('verifiedEmail', email)
      localStorage.removeItem('pendingVerificationEmail')

      // Redirect to usage type selection after 2 seconds
      setTimeout(() => {
        router.push('/auth/select-usage-type')
      }, 2000)
    } catch (err: any) {
      console.error('[VerifyEmailCode] Error verifying code:', err)
      setError(err.message || 'Failed to verify code. Please try again.')
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

      console.log('[VerifyEmailCode] Resending verification code to:', email)

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[VerifyEmailCode] Resend error:', data)
        setError(data.error || 'Failed to resend verification code. Please try again.')
        setIsResending(false)
        return
      }

      console.log('[VerifyEmailCode] ✓ Verification code resent successfully')
      setSuccessMessage('✅ New verification code sent! Check your email.')
      setCode('')
      setIsResending(false)
    } catch (err: any) {
      console.error('[VerifyEmailCode] Error resending code:', err)
      setError(err.message || 'Failed to resend verification code. Please try again.')
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4 py-8">
      <Link href="/" className="absolute top-6 right-6 px-4 py-2 bg-white text-primary rounded-full font-semibold hover:shadow-lg transition">
        Home
      </Link>

      <div className="w-full max-w-md">
        {/* Form State */}
        {status === 'form' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-block bg-blue-100 rounded-full p-4 mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-dark">Verify Your Email</h1>
              <p className="text-gray mt-2">We sent a verification code to:</p>
              <p className="font-semibold text-primary mt-1">{email}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm text-center">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-5">
              {/* Code Input */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Q7ZGM2"
                  maxLength={10}
                  required
                  autoFocus
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg font-bold text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray mt-2">The code is in the email we just sent you. It expires in 24 hours.</p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isVerifying}
                variant="primary"
                className="w-full mt-8 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="inline-block">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>

              {/* Help Text */}
              <div className="space-y-3 mt-6">
                <p className="text-center text-sm text-gray">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResendCode}
                    className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                </p>
                <p className="text-center text-xs text-gray">
                  <button
                    type="button"
                    onClick={() => router.push('/auth/login')}
                    className="text-primary hover:underline"
                  >
                    Back to Login
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-dark mb-2">Email Verified! 🎉</h1>
            <p className="text-gray mb-6">
              Great! Your email has been confirmed. Let's complete your profile setup.
            </p>
            <p className="text-sm text-gray">Redirecting to profile setup...</p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-dark mb-2">Something Went Wrong</h1>
            <p className="text-gray mb-8">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/login')}
                variant="primary"
                className="w-full"
              >
                Back to Login
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint to-white">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray mt-4">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailCodeContent />
    </Suspense>
  )
}
