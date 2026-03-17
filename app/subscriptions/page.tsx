'use client'

import React from 'react'
import Button from '@/components/Button'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import { Check, X, Zap, Loader, CreditCard, Star, Rocket, Crown, Lightbulb } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '@/lib/AuthContext'
import { auth } from '@/lib/firebase'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function SubscriptionsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSignup = searchParams.get('from') === 'signup'
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { user, isAuthenticated, userData } = useAuth()

  const plans = [
    {
      id: 'none',
      name: 'Pay Per Order',
      price: 'Flexible',
      description: 'No commitment, pay as you go',
      icon: CreditCard,
      features: [
        'Pay only for what you use',
        'No monthly fee',
        'Standard service',
        'Order tracking',
        'Mobile app access',
      ],
      notIncluded: ['Discounted rates', 'Priority support', 'Exclusive perks'],
      highlighted: false,
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '$14.99',
      period: '/month AUD (inc. GST)',
      description: 'Perfect for regular customers',
      icon: Star,
      features: [
        'Unlimited orders',
        '5-10% discount on services',
        'Free standard delivery',
        'Order tracking',
        'Mobile app access',
        'Monthly billing',
      ],
      notIncluded: ['Priority support', 'Exclusive perks', 'Premium add-ons'],
      highlighted: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$29.99',
      period: '/month AUD (inc. GST)',
      description: 'For frequent users',
      icon: Rocket,
      features: [
        'Unlimited orders',
        '10-15% discount on services',
        'Free priority delivery',
        '24/7 priority support',
        'Order tracking',
        'Mobile app access',
        'Exclusive deals',
      ],
      notIncluded: ['Concierge service', 'Custom scheduling'],
      highlighted: true,
    },
    {
      id: 'washly',
      name: 'Washly Premium',
      price: '$74.99',
      period: '/month AUD (inc. GST)',
      description: 'The ultimate laundry experience',
      icon: Crown,
      features: [
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
      notIncluded: [],
      highlighted: false,
    },
  ]

  const handleSelectPlan = async (planId: string) => {
    setLoadingPlan(planId)
    
    try {
      if (fromSignup) {
        // If coming from signup, complete signup with selected plan
        router.push(`/auth/signup-customer?plan=${planId}`)
      } else {
        // If logged in, redirect to Stripe checkout
        if (!isAuthenticated || !user) {
          alert('Please log in to upgrade your subscription')
          router.push('/auth/login')
          return
        }

        // Get the ID token from Firebase
        const token = await user.getIdToken()

        const response = await fetch('/api/subscriptions/create-checkout-session', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan: planId }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to create checkout session')
        }
        
        const { sessionId, url } = await response.json()
        
        // Open Stripe checkout in a new tab
        if (url) {
          sessionStorage.setItem('lastPlanId', planId)
          window.open(url, '_blank')
          // Show a message to the user
          alert('Payment page opened in a new tab. Complete your payment there and you\'ll receive a confirmation. You can close the payment tab after confirming success.')
        } else if (sessionId) {
          // Fallback to constructing URL from sessionId
          sessionStorage.setItem('lastPlanId', planId)
          window.open(`https://checkout.stripe.com/pay/${sessionId}`, '_blank')
          alert('Payment page opened in a new tab. Complete your payment there and you\'ll receive a confirmation. You can close the payment tab after confirming success.')
        } else {
          throw new Error('No checkout URL or session ID returned from API')
        }
      }
    } catch (error) {
      console.error('Error selecting plan:', error)
      alert('Failed to process plan selection. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleNoThanks = () => {
    if (fromSignup) {
      // Complete signup without plan selection
      router.push('/auth/signup-customer?plan=none')
    } else {
      // Go back to previous page
      router.back()
    }
  }

  // Check if a plan is the user's current plan
  const isCurrentPlan = (planId: string): boolean => {
    if (!isAuthenticated || !userData) return false
    const userPlan = userData.currentPlan || 'none'
    return userPlan === planId
  }

  // Get button text and disabled state
  const getButtonState = (planId: string): { text: string; disabled: boolean } => {
    if (fromSignup) {
      return { text: 'Choose Plan', disabled: false }
    }

    if (isCurrentPlan(planId)) {
      return { text: 'Current Plan', disabled: true }
    }

    return { text: 'Upgrade to ' + plans.find(p => p.id === planId)?.name, disabled: false }
  }

  return (
    <>
      <Header />
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Content */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-dark mb-6 leading-tight">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray max-w-3xl mx-auto mb-10 leading-relaxed">
              Whether you're an occasional customer or a laundry enthusiast, we have the perfect plan for you. Switch anytime, no contracts.
            </p>
            
            {fromSignup && (
              <div className="bg-blue-50 border-l-4 border-primary rounded-lg px-6 py-4 inline-block mb-10">
                <p className="text-base text-dark flex items-center gap-2">
                  <Lightbulb size={18} className="text-primary flex-shrink-0" />
                  <span><span className="font-semibold">Tip:</span> You can change your plan anytime from your dashboard</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl transition-all duration-300 overflow-hidden flex flex-col h-full ${
                plan.highlighted
                  ? 'ring-2 ring-primary shadow-2xl scale-105 md:scale-100 lg:scale-105 bg-white'
                  : 'bg-white shadow-lg hover:shadow-xl border-2 border-gray/20'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-gradient-to-r from-primary to-accent text-white py-3 px-6 text-center font-bold text-sm tracking-wide flex items-center justify-center gap-2">
                  <Star size={18} />
                  MOST POPULAR
                </div>
              )}

              <div className="p-8 flex flex-col flex-grow">
                {/* Plan Header */}
                <div className="mb-6">{React.createElement(plan.icon as any, { size: 48, className: 'text-primary' })}</div>
                <h3 className="text-3xl font-bold text-dark mb-3">{plan.name}</h3>
                <p className="text-gray text-base mb-8 leading-relaxed">{plan.description}</p>

                {/* Price */}
                <div className="mb-10">
                  <span className="text-5xl font-bold text-primary">{plan.price}</span>
                  {plan.period && <span className="text-gray text-lg ml-2">{plan.period}</span>}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check size={22} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-base text-dark leading-relaxed">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, idx) => (
                    <div key={`not-${idx}`} className="flex items-start gap-3 opacity-40">
                      <X size={22} className="text-gray flex-shrink-0 mt-0.5" />
                      <span className="text-base text-gray leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  size="lg"
                  className="w-full text-lg py-3 font-semibold"
                  disabled={loadingPlan === plan.id || getButtonState(plan.id).disabled}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader size={20} className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    getButtonState(plan.id).text
                  )}
                </Button>
              </div>
            </div>
          ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="bg-white rounded-3xl p-12 md:p-16 shadow-lg">
            <h2 className="text-4xl font-bold text-dark mb-12 text-center">Frequently Asked Questions</h2>
            
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div>
                <h4 className="font-bold text-lg text-dark mb-4 flex items-center gap-3">
                  <Zap size={24} className="text-primary" />
                  Can I change plans?
                </h4>
                <p className="text-gray text-base leading-relaxed">
                  Yes! You can upgrade or downgrade your plan anytime. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-lg text-dark mb-4 flex items-center gap-3">
                  <Zap size={24} className="text-primary" />
                  Is there a contract?
                </h4>
                <p className="text-gray text-base leading-relaxed">
                  No contracts. Cancel anytime, no questions asked. We want to earn your business daily.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-lg text-dark mb-4 flex items-center gap-3">
                  <Zap size={24} className="text-primary" />
                  When does billing happen?
                </h4>
                <p className="text-gray text-base leading-relaxed">
                  Subscriptions bill monthly on your sign-up date. Pay-as-you-go charges appear after each order.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-lg text-dark mb-4 flex items-center gap-3">
                  <Zap size={24} className="text-primary" />
                  What if I have questions?
                </h4>
                <p className="text-gray text-base leading-relaxed">
                  Contact our support team 24/7 via chat, email, or phone. We're here to help!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-12">
          {fromSignup ? (
            <>
              <p className="text-gray text-lg mb-8">Not ready to commit? No problem!</p>
              <Button
                onClick={handleNoThanks}
                variant="ghost"
                size="lg"
                className="text-lg font-semibold px-8 py-3"
                disabled={loadingPlan !== null}
              >
                No Thanks, I'll Pay Per Order
              </Button>
            </>
          ) : (
            <p className="text-gray text-lg">
              Questions? <Link href="/faq" className="text-primary font-semibold hover:underline">Check our FAQ</Link> or contact support
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionsPageContent />
    </Suspense>
  )
}
