'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { ArrowLeft, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc } from 'firebase/firestore'

interface Subscription {
  id: string
  planId: string
  planName: string
  price: number
  status: 'active' | 'cancelled' | 'paused'
  nextBillingDate: Timestamp
}

export default function CancelSubscription() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [step, setStep] = useState(1) // 1: Reasons, 2: Feedback, 3: Confirm, 4: Complete
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const reasons = [
    { id: 'too-expensive', label: 'Too expensive', icon: '💰' },
    { id: 'low-usage', label: 'Low usage / rarely use', icon: '📉' },
    { id: 'better-alternative', label: 'Found a better alternative', icon: '🔄' },
    { id: 'quality-issues', label: 'Quality or service issues', icon: '⚠️' },
    { id: 'moving', label: 'Moving / relocating', icon: '📍' },
    { id: 'no-longer-needed', label: 'No longer needed', icon: '✋' },
    { id: 'other', label: 'Other reason', icon: '📝' },
  ]

  // Fetch subscription from Firebase
  useEffect(() => {
    if (!user || loading) return

    setSubscriptionLoading(true)
    const subscriptionsRef = collection(db, 'subscriptions')
    const q = query(subscriptionsRef, where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as Subscription
        setSubscription({ ...data, id: snapshot.docs[0].id })
      }
      setSubscriptionLoading(false)
    })

    return () => unsubscribe()
  }, [user, loading])

  const toggleReason = (reasonId: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonId) ? prev.filter((r) => r !== reasonId) : [...prev, reasonId]
    )
  }

  const handleConfirmCancellation = async () => {
    if (!subscription || !user) return

    setIsCancelling(true)
    try {
      // Update subscription status in Firebase
      const subRef = doc(db, 'subscriptions', subscription.id)
      await updateDoc(subRef, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReasons: selectedReasons,
        cancellationFeedback: feedback,
      })

      // Move to completion step
      setStep(4)
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
      setIsCancelling(false)
    }
  }

  if (subscriptionLoading) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/subscriptions">
          <button className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-6">
            <ArrowLeft size={20} />
            Back to Subscriptions
          </button>
        </Link>
        <div className="text-center text-gray">Loading...</div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/subscriptions">
          <button className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-6">
            <ArrowLeft size={20} />
            Back to Subscriptions
          </button>
        </Link>
        <Card>
          <div className="p-8 text-center">
            <p className="text-gray">No active subscription to cancel</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/subscriptions">
        <button className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-6">
          <ArrowLeft size={20} />
          Back to Subscriptions
        </button>
      </Link>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                step >= s ? 'bg-primary text-white' : 'bg-gray/20 text-gray'
              }`}
            >
              {s <= 3 ? s : <CheckCircle2 size={20} />}
            </div>
            {s < 4 && (
              <div className={`flex-1 h-1 mx-2 rounded transition ${step > s ? 'bg-primary' : 'bg-gray/20'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Why are you leaving? */}
      {step === 1 && (
        <Card>
          <h2 className="text-2xl font-bold text-dark mb-2">Why are you leaving?</h2>
          <p className="text-gray mb-6">Help us understand so we can improve</p>

          <div className="space-y-3 mb-8">
            {reasons.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedReasons.includes(reason.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray/30 hover:border-gray'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedReasons.includes(reason.id)}
                  onChange={() => toggleReason(reason.id)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <span className="ml-3 text-lg">{reason.icon}</span>
                <span className="ml-3 font-semibold text-dark">{reason.label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/subscriptions" className="flex-1">
              <button className="w-full px-6 py-3 border-2 border-gray/30 rounded-lg font-semibold text-dark hover:border-gray transition">
                Keep Plan
              </button>
            </Link>
            <button
              onClick={() => setStep(2)}
              disabled={selectedReasons.length === 0}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Continue
            </button>
          </div>
        </Card>
      )}

      {/* Step 2: Additional Feedback */}
      {step === 2 && (
        <Card>
          <h2 className="text-2xl font-bold text-dark mb-2">Help us improve</h2>
          <p className="text-gray mb-6">Any additional feedback? (Optional)</p>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us how we can better serve you..."
            className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-32 mb-8"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-6 py-3 border-2 border-gray/30 rounded-lg font-semibold text-dark hover:border-gray transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Continue
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm Cancellation */}
      {step === 3 && (
        <Card className="border-2 border-red-200 bg-red-50">
          <div className="flex items-start gap-4 mb-8">
            <AlertCircle size={32} className="text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-dark mb-2">Cancel Subscription</h2>
              <p className="text-gray">
                Are you sure? Your {subscription.planName} plan will be cancelled at the end of your current billing cycle.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 mb-8 border border-gray/20">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray mb-1">Current Plan</p>
                <p className="text-xl font-bold text-dark">{subscription.planName}</p>
              </div>
              <div>
                <p className="text-sm text-gray mb-1">Monthly Cost</p>
                <p className="text-xl font-bold text-dark">${subscription.price}</p>
              </div>
            </div>

            <div className="border-t border-gray/20 pt-6">
              <p className="text-sm text-gray mb-2">Cancellation Date</p>
              <p className="text-lg font-semibold text-dark">
                {new Date(subscription.nextBillingDate?.toMillis()).toLocaleDateString('en-AU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> You'll continue to have access to your {subscription.planName} features until your next billing date.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-6 py-3 border-2 border-gray/30 rounded-lg font-semibold text-dark hover:border-gray transition"
            >
              Back
            </button>
            <button
              onClick={handleConfirmCancellation}
              disabled={isCancelling}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
            </button>
          </div>
        </Card>
      )}

      {/* Step 4: Completion */}
      {step === 4 && (
        <Card>
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-dark mb-3">Subscription Cancelled</h2>
            <p className="text-gray text-lg mb-8">
              Your {subscription.planName} plan has been successfully cancelled.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-bold text-dark mb-3">What's Next?</h3>
              <ul className="space-y-2 text-sm text-gray">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Access to your plan features continues until {new Date(subscription.nextBillingDate?.toMillis()).toLocaleDateString('en-AU')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>No further charges will be applied</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>You'll receive a confirmation email shortly</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
              <Link href="/dashboard/subscriptions" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Subscriptions
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
