'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import { ArrowRight, CheckCircle, Calendar, CreditCard, Zap, AlertCircle, Copy, Check as CheckIcon, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SubscriptionData {
  id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'past_due'
  current_period_start: string
  current_period_end: string
  stripe_customer_id?: string
  created_at: string
}

const planDetails: Record<string, any> = {
  starter: {
    name: 'Starter',
    price: '$14.99',
    period: '/month AUD (inc. GST)',
    color: 'blue',
    description: 'Perfect for regular customers',
    discount: '5-10% discount on services',
    benefits: [
      'Unlimited orders',
      '5-10% discount on services',
      'Free standard delivery',
      'Order tracking',
      '24/7 mobile app access',
      'Monthly billing',
    ],
  },
  professional: {
    name: 'Professional',
    price: '$29.99',
    period: '/month AUD (inc. GST)',
    color: 'emerald',
    description: 'For frequent users',
    discount: '10-15% discount on services',
    benefits: [
      'Unlimited orders',
      '10-15% discount on services',
      'Free priority delivery',
      '24/7 priority support',
      'Order tracking',
      'Mobile app access',
      'Exclusive deals',
    ],
  },
  washly: {
    name: 'Washly Premium',
    price: '$74.99',
    period: '/month AUD (inc. GST)',
    color: 'purple',
    description: 'The ultimate laundry experience',
    discount: '20% discount on services',
    benefits: [
      'Unlimited orders',
      '20% discount on services',
      'Free priority delivery',
      '24/7 concierge service',
      'Order tracking',
      'Mobile app access',
      'Exclusive deals & perks',
      'Custom scheduling',
      'White glove service',
      'Annual rewards bonus',
    ],
  },
}

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/subscriptions/get-current`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.subscription) {
            setCurrentSubscription(data.subscription)
          }
        }
      } catch (err) {
        console.error('Error fetching subscription:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const copyToClipboard = () => {
    if (currentSubscription?.stripe_customer_id) {
      navigator.clipboard.writeText(currentSubscription.stripe_customer_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const daysUntilRenewal = currentSubscription
    ? Math.ceil(
        (new Date(currentSubscription.current_period_end).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  if (authLoading || loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray">Loading your subscription...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // PAY AS YOU GO PLAN
  if (!currentSubscription || currentSubscription.plan_id === 'none') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-mint to-white py-12 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
              <h1 className="text-4xl font-bold text-dark">My Subscription</h1>
              <Link href="/dashboard" className="text-primary hover:text-accent font-semibold">
                ← Dashboard
              </Link>
            </div>

            {/* Pay Per Order Card */}
            <div className="bg-white rounded-3xl border-2 border-gray/20 p-12 shadow-lg text-center mb-12">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-6">
                <CreditCard size={48} className="text-primary" />
              </div>
              
              <h2 className="text-4xl font-bold text-dark mb-3">Pay Per Order</h2>
              <p className="text-xl text-gray mb-8">You're currently on our flexible pay-as-you-go plan</p>
              
              <div className="bg-gradient-to-r from-mint to-accent/20 rounded-2xl p-8 mb-8">
                <p className="text-gray text-sm mb-2">No monthly commitment</p>
                <p className="text-5xl font-bold text-primary mb-2">Flexible</p>
                <p className="text-gray">Pay only for what you use</p>
              </div>

              <div className="space-y-3 mb-12 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                  <span className="text-dark font-medium">No monthly fees</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                  <span className="text-dark font-medium">Pay only for orders you place</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                  <span className="text-dark font-medium">Cancel anytime, no penalties</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                  <span className="text-dark font-medium">Order tracking included</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/booking')}
                  className="flex items-center justify-center gap-2"
                  size="lg"
                >
                  Schedule Pickup <ArrowRight size={20} />
                </Button>
                <Link href="/subscriptions">
                  <Button variant="outline" size="lg" className="w-full">
                    Explore Premium Plans
                  </Button>
                </Link>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
              <div className="flex gap-4">
                <AlertCircle size={24} className="text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Want Premium Features?</h3>
                  <p className="text-blue-700 mb-4">Upgrade to one of our paid plans and unlock exclusive benefits like discounts, priority support, and more.</p>
                  <Link href="/subscriptions" className="text-blue-600 font-semibold hover:underline flex items-center gap-2">
                    Browse Plans <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // ACTIVE PAID SUBSCRIPTION PAGE
  const plan = planDetails[currentSubscription.plan_id] || planDetails.starter

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-mint to-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-dark">My Subscription</h1>
            <Link href="/dashboard" className="text-primary hover:text-accent font-semibold">
              ← Dashboard
            </Link>
          </div>

          {/* Success Status */}
          {currentSubscription.status === 'active' && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <p className="font-bold text-green-900">Subscription Active</p>
                <p className="text-sm text-green-700">Your plan is active and benefits are available</p>
              </div>
            </div>
          )}

          {currentSubscription.status === 'past_due' && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
              <AlertCircle size={24} className="text-yellow-600" />
              <div>
                <p className="font-bold text-yellow-900">Payment Due</p>
                <p className="text-sm text-yellow-700">Please update your payment method to continue enjoying benefits</p>
              </div>
            </div>
          )}

          {/* Main Plan Card */}
          <div className={`bg-white rounded-3xl border-2 shadow-2xl overflow-hidden mb-8 border-${plan.color}-500/30`}>
            <div className={`bg-gradient-to-r from-${plan.color}-500 to-${plan.color}-600 text-white p-12`}>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wide">Active Plan</p>
                  <h2 className="text-5xl font-bold mb-3">{plan.name}</h2>
                  <p className="text-white/90 text-lg">{plan.description}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-6xl font-bold">{plan.price}</span>
                <span className="text-white/80">{plan.period}</span>
              </div>

              <div className="inline-block bg-white/20 rounded-full px-4 py-2">
                <p className="text-white font-semibold">{plan.discount}</p>
              </div>
            </div>

            {/* Plan Details Grid */}
            <div className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 bg-${plan.color}-100 rounded-lg flex items-center justify-center`}>
                    <Calendar className={`text-${plan.color}-600`} size={24} />
                  </div>
                  <div>
                    <p className="text-gray text-sm font-semibold mb-1">Renewal Date</p>
                    <p className="text-2xl font-bold text-dark">{formatDate(currentSubscription.current_period_end)}</p>
                    <p className="text-gray text-sm mt-1">{daysUntilRenewal} days remaining</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 bg-${plan.color}-100 rounded-lg flex items-center justify-center`}>
                    <CreditCard className={`text-${plan.color}-600`} size={24} />
                  </div>
                  <div>
                    <p className="text-gray text-sm font-semibold mb-1">Status</p>
                    <p className="text-2xl font-bold text-dark capitalize">
                      {currentSubscription.status === 'active' ? '✓ Active' : currentSubscription.status}
                    </p>
                    <p className="text-gray text-sm mt-1">Bill automatically</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 bg-${plan.color}-100 rounded-lg flex items-center justify-center`}>
                    <Zap className={`text-${plan.color}-600`} size={24} />
                  </div>
                  <div>
                    <p className="text-gray text-sm font-semibold mb-1">Benefits Active</p>
                    <p className="text-2xl font-bold text-dark">{plan.benefits.length}</p>
                    <p className="text-gray text-sm mt-1">Premium features</p>
                  </div>
                </div>
              </div>

              {/* Benefits List */}
              <div className="mb-12 pb-12 border-b border-gray/10">
                <h3 className="text-2xl font-bold text-dark mb-8">Your Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                      <span className="text-dark font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stripe Customer ID */}
              {currentSubscription.stripe_customer_id && (
                <div className="mb-12 pb-12 border-b border-gray/10">
                  <h3 className="text-lg font-bold text-dark mb-4">Billing Information</h3>
                  <div className="bg-gray/5 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-gray text-sm mb-1">Customer ID</p>
                      <p className="font-mono text-sm text-dark">{currentSubscription.stripe_customer_id}</p>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition"
                    >
                      {copied ? (
                        <>
                          <CheckIcon size={18} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={18} /> Copy ID
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => router.push('/booking')}
                  className="flex-1 flex items-center justify-center gap-2"
                  size="lg"
                >
                  Schedule Pickup <ArrowRight size={20} />
                </Button>
                <Link href="/subscriptions" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full">
                    Change Plan
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <LogOut size={20} className="mr-2" /> Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Next Billing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <div className="flex gap-4">
              <Calendar size={24} className="text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Next Billing Cycle</h3>
                <p className="text-blue-700 mb-1">Your subscription renews on <strong>{formatDate(currentSubscription.current_period_end)}</strong></p>
                <p className="text-blue-600 text-sm">You'll be charged {plan.price} on this date</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-dark mb-4">Cancel Subscription?</h3>
            <p className="text-gray mb-6">
              We'd hate to see you go! Your plan remains active until <strong>{formatDate(currentSubscription.current_period_end)}</strong>. You can resubscribe anytime.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Plan
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-red-600 hover:bg-red-50"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/subscriptions/manage', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user?.id}`,
                      },
                      body: JSON.stringify({ action: 'cancel' }),
                    })

                    if (response.ok) {
                      alert('Subscription cancellation has been processed. Your subscription will end at the end of your current billing period.')
                      setShowCancelModal(false)
                    } else {
                      alert('Failed to cancel subscription. Please try again.')
                    }
                  } catch (err) {
                    console.error('Error canceling subscription:', err)
                    alert('An error occurred. Please try again.')
                  }
                }}
              >
                Confirm Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
