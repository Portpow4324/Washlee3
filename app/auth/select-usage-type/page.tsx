'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Button from '@/components/Button'
import Link from 'next/link'

function SelectUsageTypeContent() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [usageType, setUsageType] = useState<'customer' | 'pro'>('customer')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get email from localStorage (set during code verification)
    const verifiedEmail = localStorage.getItem('verifiedEmail')
    
    if (verifiedEmail) {
      setEmail(verifiedEmail)
      setIsLoading(false)
    } else {
      setError('No verified email found. Please verify your email again.')
      setIsLoading(false)
    }
  }, [])

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Email not found. Please start over.')
      return
    }

    // Store selected usage type
    localStorage.setItem('selectedUsageType', usageType)

    // For customers, go to complete profile
    // For pro, they would go through pro application process
    if (usageType === 'customer') {
      router.push('/auth/email-confirmed')
    } else {
      // Redirect to pro signup/application
      router.push('/auth/pro-signup-form')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint to-white">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4 py-8">
      <Link href="/" className="absolute top-6 right-6 px-4 py-2 bg-white text-primary rounded-full font-semibold hover:shadow-lg transition">
        Home
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-dark">Email Verified! 🎉</h1>
            <p className="text-gray mt-2">Your email has been confirmed</p>
            <p className="font-semibold text-primary mt-1 text-sm">{email}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleContinue} className="space-y-6">
            {/* Usage Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-4">
                What's your next step? (Select for customers only)
              </label>
              
              <div className="space-y-3">
                {/* Customer Option */}
                <label 
                  className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition"
                  style={{
                    borderColor: usageType === 'customer' ? '#48C9B0' : '#e0e0e0',
                    backgroundColor: usageType === 'customer' ? '#E8FFFB' : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="usageType"
                    value="customer"
                    checked={usageType === 'customer'}
                    onChange={(e) => setUsageType(e.target.value as 'customer' | 'pro')}
                    className="w-4 h-4 mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-dark">👕 I'm a Customer</p>
                    <p className="text-xs text-gray mt-1">I want to send my laundry to be cleaned</p>
                  </div>
                </label>

                {/* Pro Option */}
                <label 
                  className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition"
                  style={{
                    borderColor: usageType === 'pro' ? '#48C9B0' : '#e0e0e0',
                    backgroundColor: usageType === 'pro' ? '#E8FFFB' : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="usageType"
                    value="pro"
                    checked={usageType === 'pro'}
                    onChange={(e) => setUsageType(e.target.value as 'customer' | 'pro')}
                    className="w-4 h-4 mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-dark">💼 I'm a Pro/Service Provider</p>
                    <p className="text-xs text-gray mt-1">I want to offer laundry services and earn money</p>
                  </div>
                </label>
              </div>

              {usageType === 'pro' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Pro Tip:</strong> As a service provider, you'll complete a more detailed application and background check process.
                  </p>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
            >
              {usageType === 'customer' ? 'Continue to Profile Setup' : 'Continue to Pro Application'}
            </Button>

            {/* Help Text */}
            <p className="text-center text-xs text-gray">
              You can change this later in your account settings
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SelectUsageTypePage() {
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
      <SelectUsageTypeContent />
    </Suspense>
  )
}
