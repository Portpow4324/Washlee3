'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { CheckCircle, AlertCircle } from 'lucide-react'
import Spinner from '@/components/Spinner'

export default function AcceptOfferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const employeeId = searchParams.get('employeeId')
  
  const [isLoading, setIsLoading] = useState(false)
  const [offerAccepted, setOfferAccepted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!employeeId) {
      setError('Invalid offer link. Employee ID is missing.')
    }
  }, [employeeId])

  const handleAcceptOffer = async () => {
    if (!employeeId) {
      setError('Invalid employee ID')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/offers/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept offer')
      }

      setOfferAccepted(true)

      // Redirect to employee dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard/employee')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {offerAccepted ? (
          <Card className="p-12 text-center">
            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-dark mb-4">Offer Accepted!</h1>
            <p className="text-xl text-gray mb-8">Welcome to the Washlee Pro family</p>
            
            <div className="bg-mint rounded-lg p-6 mb-8">
              <p className="text-dark font-semibold mb-2">Your Employee ID:</p>
              <p className="text-3xl font-bold text-primary">{employeeId}</p>
            </div>

            <div className="text-left space-y-4 mb-8">
              <h2 className="text-xl font-semibold text-dark">You now have access to:</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-primary mt-1 flex-shrink-0" />
                  <span className="text-gray">Real-time job listings in your service area</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-primary mt-1 flex-shrink-0" />
                  <span className="text-gray">Earnings tracking and analytics dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-primary mt-1 flex-shrink-0" />
                  <span className="text-gray">Customer ratings and feedback</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-primary mt-1 flex-shrink-0" />
                  <span className="text-gray">Weekly payments and payout management</span>
                </li>
              </ul>
            </div>

            <p className="text-gray mb-8">Redirecting to your dashboard in a moment...</p>
            <Button onClick={() => router.push('/dashboard/employee')}>
              Go to Dashboard
            </Button>
          </Card>
        ) : (
          <Card className="p-12">
            <h1 className="text-4xl font-bold text-dark mb-4">Washlee Pro Offer</h1>
            <p className="text-xl text-gray mb-8">
              You've been approved to become a Washlee Pro Partner!
            </p>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8 flex items-start gap-4">
                <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {!error && (
              <>
                <div className="bg-mint rounded-lg p-6 mb-8">
                  <h2 className="font-semibold text-dark mb-4">What's Next?</h2>
                  <ol className="space-y-3 text-gray">
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
                        1
                      </span>
                      <span>Review the terms and conditions carefully</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
                        2
                      </span>
                      <span>Click "Accept Offer" to activate your account</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex-shrink-0">
                        3
                      </span>
                      <span>Log in to your employee dashboard and start taking jobs</span>
                    </li>
                  </ol>
                </div>

                <div className="border-2 border-gray rounded-lg p-6 mb-8">
                  <h2 className="font-semibold text-dark mb-4">Offer Terms Summary</h2>
                  <ul className="space-y-2 text-sm text-gray">
                    <li>• Earn $3.00 per kilogram of laundry processed</li>
                    <li>• Additional revenue from premium add-on services</li>
                    <li>• Weekly payments via bank transfer</li>
                    <li>• Subscription tiers for expanded earnings potential</li>
                    <li>• 30-day probationary period</li>
                    <li>• Dedicated support and customer service</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                  >
                    Decline
                  </button>
                  <Button
                    onClick={handleAcceptOffer}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Spinner />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Accept Offer'
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}
      </main>
      <Footer />
    </div>
  )
}
