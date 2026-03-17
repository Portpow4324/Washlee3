'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import { AlertCircle, ArrowLeft, CheckCircle, Loader } from 'lucide-react'

export default function CancelSubscription() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [selectedReason, setSelectedReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const reasons = [
    { id: 'too-expensive', label: 'Plan is too expensive' },
    { id: 'not-using', label: 'Not using the service enough' },
    { id: 'switching-service', label: 'Switching to another service' },
    { id: 'quality-issues', label: 'Quality concerns' },
    { id: 'other', label: 'Other reason' },
  ]

  const handleCancelSubscription = async () => {
    if (!selectedReason) {
      setError('Please select a reason for cancellation')
      return
    }

    if (!user) {
      setError('You must be logged in to cancel your subscription')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // Get ID token from Firebase
      const token = await user.getIdToken()

      // Call API to cancel subscription
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: selectedReason,
          feedback: feedback,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel subscription')
      }

      // Success - show confirmation
      setSuccess(true)

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard/customer?tab=payments')
      }, 3000)
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <p className="text-gray font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 pt-20 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-[#3aad9a] mb-8 font-semibold transition"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>

          {!success ? (
            <>
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8 border-l-4 border-red-500">
                <div className="flex items-start gap-4 mb-6">
                  <AlertCircle size={32} className="text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2">
                      We're sorry to see you go
                    </h1>
                    <p className="text-gray text-lg">
                      Your subscription will be cancelled immediately. You'll lose access to all premium features.
                    </p>
                  </div>
                </div>

                {/* Current Plan Info */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                  <p className="text-sm text-gray mb-1">Current Plan:</p>
                  <p className="text-lg font-bold text-dark capitalize">
                    {userData.currentPlan === 'starter' && 'Starter Plan'}
                    {userData.currentPlan === 'professional' && 'Professional Plan'}
                    {userData.currentPlan === 'washly' && 'Washly Premium Plan'}
                  </p>
                </div>

                {/* What You'll Lose */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm font-semibold text-dark mb-3">After cancellation, you'll lose:</p>
                  <ul className="space-y-2 text-sm text-gray">
                    <li>✕ Discounted rates on laundry services</li>
                    <li>✕ Free or priority delivery options</li>
                    <li>✕ Priority customer support</li>
                    <li>✕ Exclusive deals and perks</li>
                  </ul>
                  <p className="text-xs text-gray mt-3 italic">
                    You'll still have access to our standard Pay Per Order service.
                  </p>
                </div>
              </div>

              {/* Cancellation Form */}
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                <h2 className="text-2xl font-bold text-dark mb-6">Why are you cancelling?</h2>

                {/* Reason Selection */}
                <div className="space-y-3 mb-8">
                  {reasons.map((reason) => (
                    <label
                      key={reason.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedReason === reason.id
                          ? 'border-primary bg-mint/30'
                          : 'border-gray-200 hover:border-primary/50 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.id}
                        checked={selectedReason === reason.id}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <span className="font-medium text-dark">{reason.label}</span>
                    </label>
                  ))}
                </div>

                {/* Additional Feedback */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-dark mb-2">
                    Additional feedback (optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Help us improve by sharing your thoughts..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray mt-2">
                    Your feedback helps us serve you better in the future.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8 flex gap-3">
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="flex-1 py-3 font-semibold"
                    disabled={isProcessing}
                  >
                    Keep My Subscription
                  </Button>
                  <Button
                    onClick={handleCancelSubscription}
                    className="flex-1 py-3 font-semibold bg-red-600 hover:bg-red-700"
                    disabled={isProcessing || !selectedReason}
                  >
                    {isProcessing ? (
                      <>
                        <Loader size={20} className="animate-spin mr-2 inline" />
                        Cancelling...
                      </>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </Button>
                </div>

                {/* Info */}
                <p className="text-xs text-gray text-center mt-6">
                  This action cannot be undone. You can always resubscribe later.
                </p>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 rounded-full p-6">
                  <CheckCircle size={48} className="text-green-600" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-dark mb-4">Subscription Cancelled</h2>

              <p className="text-gray text-lg mb-6">
                Your subscription has been successfully cancelled. You'll be returned to your dashboard shortly.
              </p>

              <div className="bg-blue-50 rounded-lg p-4 mb-8 border border-blue-200">
                <p className="text-sm text-gray mb-2">What's next?</p>
                <p className="text-dark font-semibold">
                  You can still use Washlee with our Pay Per Order service. Resubscribe anytime from your dashboard.
                </p>
              </div>

              <Button
                onClick={() => router.push('/dashboard/customer?tab=payments')}
                className="w-full py-3 font-semibold"
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
