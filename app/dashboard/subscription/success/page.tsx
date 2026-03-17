'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { CheckCircle, Loader } from 'lucide-react'
import Link from 'next/link'

function SubscriptionSuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [error, setError] = useState('')

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found. Please try again.')
      setLoading(false)
      return
    }

    // Verify the payment session
    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (!response.ok) throw new Error('Failed to verify payment')

        const data = await response.json()
        setSubscriptionData(data)
      } catch (err) {
        setError('Failed to verify your payment. Please contact support.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <Loader className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
          <p className="text-gray">Verifying your payment...</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center p-4">
        <Card className="p-8 max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-dark mb-2">Payment Error</h1>
            <p className="text-gray mb-6">{error}</p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => router.push('/dashboard/subscriptions')} className="w-full">
              Back to Subscriptions
            </Button>
            <Link href="/contact" className="block">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-dark mb-2">Welcome to Washlee Premium!</h1>
            <p className="text-gray text-lg">Your subscription is now active</p>
          </div>

          {subscriptionData && (
            <div className="bg-mint rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-dark mb-6">Subscription Details</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray">Plan:</span>
                  <span className="font-semibold text-dark capitalize">{subscriptionData.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray">Price:</span>
                  <span className="font-semibold text-dark">${subscriptionData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray">Billing Cycle:</span>
                  <span className="font-semibold text-dark capitalize">{subscriptionData.interval}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-primary">
                  <span className="text-gray">Next Billing Date:</span>
                  <span className="font-semibold text-dark">
                    {new Date(subscriptionData.currentPeriodEnd * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-dark mb-4">✓ What's Now Unlocked</h3>
            <ul className="space-y-3 text-sm text-gray">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-0.5">✓</span>
                <span>Loads up to 45kg per order</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-0.5">✓</span>
                <span>Express delivery available for loads up to 15kg</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-0.5">✓</span>
                <span>Priority customer support</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-0.5">✓</span>
                <span>Exclusive discounts on add-ons</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={() => router.push('/booking')} className="w-full" size="lg">
              Start Booking
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/subscriptions')} 
              variant="outline" 
              className="w-full"
            >
              View Subscription
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <h3 className="font-bold text-dark mb-3">Need Help?</h3>
          <p className="text-sm text-gray mb-4">
            If you have any questions about your subscription or encounter any issues, our support team is here to help.
          </p>
          <Link href="/contact" className="text-primary font-semibold hover:underline">
            Contact Support →
          </Link>
        </Card>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionSuccessPageContent />
    </Suspense>
  )
}
