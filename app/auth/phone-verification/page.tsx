'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Phone, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import { supabase } from '@/lib/supabaseClient'
import { validateAustralianPhone, formatAustralianPhone } from '@/lib/australianValidation'
import { AUSTRALIAN_STATES } from '@/lib/australianValidation'

function PhoneVerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''
  const devMode = searchParams?.get('dev') === 'true' || process.env.NODE_ENV === 'development'
  
  const [step, setStep] = useState<'input' | 'verification'>('input')
  const [phone, setPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [devTestCode, setDevTestCode] = useState<string | null>(null)

  // Load user's phone if they're authenticated
  useEffect(() => {
    const loadUserPhone = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) {
          console.warn('[PhoneVerification] No authenticated user found')
          return
        }

        // Get user's phone from customers or employees table
        const { data: customerData } = await supabase
          .from('customers')
          .select('phone')
          .eq('id', user.id)
          .single()

        if (customerData?.phone) {
          setUserPhone(customerData.phone)
          setPhone(customerData.phone)
          setStep('verification')
        }
      } catch (err) {
        console.error('[PhoneVerification] Error loading user phone:', err)
      }
    }

    loadUserPhone()
  }, [])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!phone.trim()) {
      setError('Please enter your phone number')
      return
    }

    if (!validateAustralianPhone(phone)) {
      setError('Please enter a valid Australian phone number')
      return
    }

    // Check if phone is already used by another user
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.id) {
        setError('Please log in first')
        setIsLoading(false)
        return
      }

      // Check if phone exists for another user
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .neq('id', user.id)
        .single()

      if (existingPhone) {
        setError('This phone number is already registered to another account')
        setIsLoading(false)
        return
      }

      // Send verification code
      const response = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          userId: user.id,
          email: user.email,
          devMode // Pass dev mode flag
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code')
        setIsLoading(false)
        return
      }

      setUserPhone(phone)
      setStep('verification')
      setSuccessMessage('Verification code sent to your phone')
      
      // In dev mode, show the test code
      if (devMode && data.testCode) {
        setDevTestCode(data.testCode)
        console.log('[PhoneVerification] 🔧 DEV MODE: Test code is', data.testCode)
      }
      
      setIsLoading(false)
    } catch (err: any) {
      console.error('[PhoneVerification] Error sending code:', err)
      setError(err.message || 'Failed to send verification code')
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!verificationCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits')
      return
    }

    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.id) {
        setError('Please log in first')
        setIsLoading(false)
        return
      }

      // Verify code
      const response = await fetch('/api/auth/verify-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userPhone,
          code: verificationCode,
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid verification code')
        setIsLoading(false)
        return
      }

      setIsVerified(true)
      setSuccessMessage('Phone verified successfully!')
      
      // Redirect to appropriate dashboard after successful verification
      setTimeout(() => {
        router.push('/dashboard/customer')
      }, 2000)
      
      setIsLoading(false)
    } catch (err: any) {
      console.error('[PhoneVerification] Error verifying code:', err)
      setError(err.message || 'Failed to verify code')
      setIsLoading(false)
    }
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle size={64} className="text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-dark mb-2">Phone Verified!</h1>
          <p className="text-gray mb-6">Your phone number has been successfully verified.</p>
          <p className="text-sm text-gray">Redirecting you now...</p>
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4 mx-auto">
            <Phone size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2 text-center">Verify Your Phone</h1>
          <p className="text-sm text-gray text-center">
            We'll send a verification code to confirm your phone number
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {step === 'input' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Phone Number (Australian)*
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="02 XXXX XXXX or 04XX XXX XXX"
                className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray mt-2">
                Enter a valid Australian phone number (e.g., 02 XXXX XXXX or 04XX XXX XXX)
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !phone.trim()}
              className="w-full"
            >
              {isLoading ? <Spinner /> : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Verification Code
              </label>
              <p className="text-sm text-gray mb-3">
                We sent a 6-digit code to <strong>{userPhone}</strong>
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                required
                disabled={isLoading}
                maxLength={6}
              />
              <p className="text-xs text-gray mt-2">
                Enter the 6-digit code from your SMS message
              </p>
              
              {/* DEV MODE: Show test code */}
              {devMode && devTestCode && (
                <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                  <p className="text-xs font-bold text-yellow-800 mb-1">🔧 DEV MODE - Test Code:</p>
                  <p className="text-lg font-mono font-bold text-yellow-900">{devTestCode}</p>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(devTestCode)}
                    className="text-xs text-yellow-700 hover:underline mt-2 font-semibold"
                  >
                    Click to auto-fill
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full"
            >
              {isLoading ? <Spinner /> : 'Verify Phone'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep('input')
                setVerificationCode('')
              }}
              className="w-full text-primary font-semibold hover:underline text-sm"
            >
              Use Different Phone Number
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-xs text-gray text-center mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-primary font-semibold hover:underline"
          >
            ← Back
          </button>
        </p>
      </div>
    </div>
  )
}

export default function PhoneVerification() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center">
        <Spinner />
      </div>
    }>
      <PhoneVerificationContent />
    </Suspense>
  )
}
