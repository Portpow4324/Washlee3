'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { planDetails } from '@/lib/subscriptionLogic'
import { Check, ChevronLeft, CreditCard, ArrowUp } from 'lucide-react'
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

interface BillingEntry {
  id: string
  date: Timestamp
  amount: number
  plan: string
  status: 'paid' | 'pending' | 'failed'
}

export default function Subscriptions() {
  const { user, userData, loading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingHistory, setBillingHistory] = useState<BillingEntry[]>([])
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

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

  // Fetch billing history from Firebase
  useEffect(() => {
    if (!user || loading) return

    const billingRef = collection(db, 'billingHistory')
    const q = query(billingRef, where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as BillingEntry))
      // Sort by date, most recent first
      setBillingHistory(data.sort((a, b) => b.date?.toMillis() - a.date?.toMillis()))
    })

    return () => unsubscribe()
  }, [user, loading])

  const handleUpgrade = (planKey: string) => {
    setSelectedPlan(planKey)
    setShowUpgradeConfirm(true)
  }

  const handleConfirmUpgrade = () => {
    if (selectedPlan) {
      // TODO: Call /api/subscriptions/update with action: 'upgrade', newPlan: selectedPlan
      alert(`Upgrading to ${selectedPlan} plan...`)
      setShowUpgradeConfirm(false)
    }
  }

  const handlePause = () => {
    if (confirm('Are you sure you want to pause your subscription? You can resume it anytime.')) {
      // TODO: Call /api/subscriptions/update with action: 'pause'
      alert('Subscription paused')
    }
  }

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your access will end at the end of your billing period.')) {
      // TODO: Call /api/subscriptions/update with action: 'cancel'
      alert('Subscription cancelled')
    }
  }

  const getPlanPrice = (key: string, cycle: 'monthly' | 'yearly') => {
    const plan = planDetails[key as keyof typeof planDetails]
    if (!plan) return 0
    const monthlyPrice = plan.monthlyPrice
    if (cycle === 'yearly') {
      return Math.round(monthlyPrice * 12 * 0.8 * 100) / 100 // 20% yearly discount
    }
    return monthlyPrice
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {subscription && subscription.status === 'active' ? (
        <div>
          <h2 className="text-2xl font-bold text-dark mb-6">Your Subscription</h2>
          <Card className="p-6 bg-gradient-to-r from-mint to-transparent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray mb-1">Current Plan</p>
                <h3 className="text-3xl font-bold text-dark capitalize">{subscription.planName}</h3>
                <p className="text-sm text-gray mt-2">${subscription.price}/month</p>
              </div>

              <div>
                <p className="text-sm text-gray mb-2">Next Billing Date</p>
                <p className="font-medium text-dark text-lg">
                  {new Date(subscription.nextBillingDate?.toMillis()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-gray mt-2">Auto-renews unless cancelled</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={handlePause}>
                Pause
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} className="text-red-600 border-red-200">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="bg-gradient-to-r from-primary/5 to-mint/5 border-2 border-primary p-6">
          <p className="text-gray">No active subscription. Choose a plan below to get started.</p>
        </Card>
      )}

      {/* Upgrade Section */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-4">
          {subscription ? 'Upgrade Your Plan' : 'Choose a Plan'}
        </h2>

        {/* Billing Cycle Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-dark">Billing Cycle:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-dark hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg font-medium transition relative ${
                billingCycle === 'yearly'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-dark hover:bg-gray-200'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(planDetails).map(([key, plan]) => (
            <Card
              key={key}
              className={`p-6 transition ${
                subscription?.planName.toLowerCase() === key
                  ? 'ring-2 ring-primary bg-mint'
                  : 'hoverable'
              }`}
            >
              <div className="mb-4">
                <h3 className="font-bold text-dark capitalize text-lg">{key}</h3>
                {subscription?.planName.toLowerCase() === key && (
                  <span className="text-xs font-medium text-primary">Current Plan</span>
                )}
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-dark">
                  ${getPlanPrice(key, billingCycle)}
                </span>
                <span className="text-xs text-gray">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm font-medium text-dark mb-1">{plan.monthlyOrders} orders/month</p>
                <p className="text-xs text-gray">
                  ${(getPlanPrice(key, billingCycle) / plan.monthlyOrders).toFixed(3)} per order
                </p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {typeof plan.features === 'object' && plan.features !== null
                  ? Object.entries(plan.features)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <li key={key} className="flex items-start gap-2 text-xs text-dark">
                          <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />
                          <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </li>
                      ))
                  : null}
              </ul>

              {subscription?.planName.toLowerCase() === key ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="w-full text-sm"
                  onClick={() => handleUpgrade(key)}
                >
                  <ArrowUp size={14} className="mr-1" />
                  {subscription ? 'Upgrade' : 'Choose'}
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">Billing History</h2>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Invoice</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Plan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Status</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray">
                      No billing history yet
                    </td>
                  </tr>
                ) : (
                  billingHistory.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-dark">INV-{invoice.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-gray">
                        {new Date(invoice.date?.toMillis()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-dark capitalize">{invoice.plan}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-dark">
                        ${invoice.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-green-50 text-green-700'
                              : invoice.status === 'pending'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Upgrade Confirmation Modal */}
      {showUpgradeConfirm && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-8 max-w-md">
            <h2 className="text-2xl font-bold text-dark mb-4">Confirm Upgrade</h2>
            <p className="text-gray mb-6">
              You're about to upgrade{subscription ? ` from ${subscription.planName} ` : ' '}to
              <strong> {selectedPlan}</strong>.
            </p>

            <div className="bg-mint p-4 rounded-lg mb-6">
              <p className="text-sm text-gray mb-2">New {billingCycle} cost</p>
              <p className="text-2xl font-bold text-dark">
                ${getPlanPrice(selectedPlan, billingCycle)}
                <span className="text-sm text-gray">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
              </p>
              <p className="text-xs text-gray mt-2">Changes take effect immediately</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUpgradeConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirmUpgrade}
              >
                Confirm Upgrade
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
