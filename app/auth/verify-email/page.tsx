'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'
import Button from '@/components/Button'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const email = searchParams.get('email')

    if (!code || !email) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    // Simulate verification success
    // In production, you would verify the code against your backend
    console.log('[VerifyEmail] Email verified:', email, 'Code:', code)
    setStatus('success')
    setMessage(`Email verified successfully! Redirecting to signup...`)

    // Redirect back to signup after 2 seconds
    const timeout = setTimeout(() => {
      router.push(`/auth/signup-customer?email=${encodeURIComponent(email)}&verified=true&code=${code}`)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-light flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-dark mb-2">Verifying Email</h1>
            <p className="text-gray">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4">
              <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-dark mb-2">Email Verified!</h1>
            <p className="text-gray mb-6">{message}</p>
            <Button
              onClick={() => router.push('/auth/signup-customer')}
              variant="primary"
              className="w-full"
            >
              Continue to Signup
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-dark mb-2">Verification Failed</h1>
            <p className="text-gray mb-6">{message}</p>
            <Button
              onClick={() => router.push('/auth/signup-customer')}
              variant="primary"
              className="w-full"
            >
              Back to Signup
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
