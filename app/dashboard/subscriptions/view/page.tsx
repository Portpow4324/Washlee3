'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Check, ArrowLeft, CreditCard, Calendar, AlertCircle, Settings } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'

interface Subscription {
  id: string
  planId: string
  planName: string
  price: number
  status: 'active' | 'cancelled' | 'paused'
  nextBillingDate: Timestamp
}

export default function SubscriptionDetails() {
  const { user, loading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

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

  const planFeatures = {
    starter: [
      { text: 'Up to 2 orders/month', included: true },
      { text: 'Free pickup & delivery', included: true },
      { text: 'Basic wash only', included: true },
      { text: 'Priority support', included: false },
      { text: 'Loyalty rewards', included: false },
      { text: 'Custom care requests', included: false },
    ],
    pro: [
      { text: 'Unlimited orders', included: true },
      { text: 'Free pickup & delivery', included: true },
      { text: 'All wash types', included: true },
      { text: 'Priority support', included: true },
      { text: 'Loyalty rewards', included: true },
      { text: 'Custom care requests', included: false },
    ],
    premium: [
      { text: 'Unlimited orders', included: true },
      { text: 'Free pickup & delivery', included: true },
      { text: 'All wash types', included: true },
      { text: 'Priority support', included: true },
      { text: 'Loyalty rewards', included: true },
      { text: 'Custom care requests', included: true },
    ],
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
        <div className="text-center text-gray">Loading subscription details...</div>
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
            <p className="text-gray mb-4">No active subscription found</p>
            <Link href="/dashboard/subscriptions">
              <Button>Browse Plans</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const features = planFeatures[subscription.planId as keyof typeof planFeatures] || []

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/subscriptions">
        <button className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-6">
          <ArrowLeft size={20} />
          Back to Subscriptions
        </button>
      </Link>

      {/* Plan Details Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-mint/5 border-2 border-primary">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">{subscription.planName} Plan</h1>
          <p className="text-gray">Complete plan details and features</p>
        </div>

        {/* Price and Billing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-gray/20">
          <div>
            <p className="text-gray text-sm mb-2">Monthly Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-primary">${subscription.price}</span>
              <span className="text-gray">/month</span>
            </div>
          </div>

          <div>
            <p className="text-gray text-sm mb-2">Next Billing Date</p>
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-primary" />
              <div>
                <p className="text-xl font-bold text-dark">
                  {new Date(subscription.nextBillingDate?.toMillis()).toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-8">
          <p className="text-gray text-sm mb-2">Status</p>
          <div className="inline-block">
            <span
              className={`px-4 py-2 rounded-full font-semibold ${
                subscription.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : subscription.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </span>
          </div>
        </div>
      </Card>

      {/* Plan Features */}
      <Card>
        <h2 className="text-2xl font-bold text-dark mb-6">Plan Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-light transition">
              {feature.included ? (
                <Check size={24} className="text-green-600 flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded border-2 border-gray/30 flex-shrink-0" />
              )}
              <span className={`text-lg ${feature.included ? 'text-dark font-semibold' : 'text-gray/50'}`}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Plan Management */}
      <Card>
        <h2 className="text-2xl font-bold text-dark mb-6">Manage Your Plan</h2>
        <div className="space-y-4">
          {/* Change Payment Method */}
          <Link href="/dashboard/payments">
            <button className="w-full p-4 border-2 border-gray/30 rounded-lg hover:border-primary hover:bg-primary/5 transition flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-gray group-hover:text-primary" />
                <div className="text-left">
                  <p className="font-semibold text-dark">Change Payment Method</p>
                  <p className="text-sm text-gray">Update your billing information</p>
                </div>
              </div>
              <span className="text-gray group-hover:text-primary">→</span>
            </button>
          </Link>

          {/* Pause Subscription */}
          <button className="w-full p-4 border-2 border-gray/30 rounded-lg hover:border-primary hover:bg-primary/5 transition flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-gray group-hover:text-primary" />
              <div className="text-left">
                <p className="font-semibold text-dark">Pause Subscription</p>
                <p className="text-sm text-gray">Temporarily pause for up to 30 days</p>
              </div>
            </div>
            <span className="text-gray group-hover:text-primary">→</span>
          </button>

          {/* Cancel Subscription */}
          <Link href="/dashboard/subscriptions/cancel">
            <button className="w-full p-4 border-2 border-red-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-red-600 group-hover:text-red-700" />
                <div className="text-left">
                  <p className="font-semibold text-red-600 group-hover:text-red-700">Cancel Subscription</p>
                  <p className="text-sm text-gray">End your plan and become a free user</p>
                </div>
              </div>
              <span className="text-red-600 group-hover:text-red-700">→</span>
            </button>
          </Link>
        </div>
      </Card>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Your subscription will renew automatically on the next billing date. You can cancel anytime without penalties.
        </p>
      </div>
    </div>
  )
}
