'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Check, Zap, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('customer_id', user.id)
          .maybeSingle()

        if (data && !error) {
          setCurrentPlan(data.plan_type)
        }
      } catch (err) {
        console.error('Error fetching subscription:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Pass',
      price: '$29',
      period: '/month',
      description: 'Perfect for regular laundry',
      features: [
        'Unlimited pickups & deliveries',
        '15% discount on all services',
        'Priority customer support',
        'Free protection plan',
        'Monthly loyalty points bonus',
      ],
      icon: Zap,
    },
    {
      id: 'quarterly',
      name: 'Quarterly Bundle',
      price: '$79',
      period: '/quarter',
      description: 'Best value for monthly users',
      features: [
        'Unlimited pickups & deliveries',
        '20% discount on all services',
        'Priority support + Express support',
        'Free premium protection plan',
        'Double loyalty points',
        'Exclusive member perks',
      ],
      icon: Crown,
      popular: true,
    },
    {
      id: 'yearly',
      name: 'Annual Plan',
      price: '$199',
      period: '/year',
      description: 'Maximum savings',
      features: [
        'Unlimited pickups & deliveries',
        '25% discount on all services',
        'VIP customer support',
        'Free premium+ protection plan',
        'Triple loyalty points',
        'Exclusive member events',
        'Free service month (April)',
      ],
      icon: Crown,
    },
  ]

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#48C9B0] mx-auto mb-4"></div>
            <p className="text-[#6b7b78]">Loading subscriptions...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#1f2d2b] mb-4">Subscription Plans</h1>
            <p className="text-lg text-[#6b7b78]">Choose the perfect plan for your laundry needs</p>
          </div>

          {/* Current Plan */}
          {currentPlan && (
            <div className="mb-12 p-6 bg-[#E8FFFB] rounded-lg border-2 border-[#48C9B0]">
              <p className="text-[#6b7b78] mb-2">Current Plan</p>
              <p className="text-2xl font-bold text-[#1f2d2b] capitalize">{currentPlan} Plan</p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => {
              const IconComponent = plan.icon
              const isCurrentPlan = currentPlan === plan.id
              
              return (
                <Card
                  key={plan.id}
                  hoverable
                  className={`flex flex-col p-8 ${isCurrentPlan ? 'ring-2 ring-[#48C9B0]' : ''} ${
                    plan.popular ? 'md:scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="mb-4 inline-block px-3 py-1 bg-[#48C9B0] text-white text-sm font-bold rounded">
                      MOST POPULAR
                    </div>
                  )}

                  <IconComponent className="w-10 h-10 text-[#48C9B0] mb-4" />
                  <h3 className="text-2xl font-bold text-[#1f2d2b] mb-2">{plan.name}</h3>
                  <p className="text-[#6b7b78] mb-4 text-sm">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[#1f2d2b]">{plan.price}</span>
                    <span className="text-[#6b7b78]">{plan.period}</span>
                  </div>

                  {isCurrentPlan ? (
                    <Button disabled className="w-full mb-6">
                      Current Plan
                    </Button>
                  ) : (
                    <Button className="w-full mb-6">Subscribe Now</Button>
                  )}

                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check size={20} className="text-[#48C9B0] flex-shrink-0 mt-0.5" />
                        <span className="text-[#1f2d2b] text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* FAQ Section */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-[#1f2d2b] mb-6">Subscription FAQs</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Can I change my plan anytime?',
                  a: 'Yes, you can upgrade or downgrade your subscription at any time. Changes take effect at your next billing cycle.',
                },
                {
                  q: 'Is there a cancellation fee?',
                  a: 'No! You can cancel your subscription anytime without any penalties.',
                },
                {
                  q: 'Do I get a refund?',
                  a: 'We offer a 30-day money-back guarantee if you\'re not satisfied with your subscription.',
                },
                {
                  q: 'Can I pause my subscription?',
                  a: 'Yes, you can pause your subscription for up to 3 months without losing your benefits.',
                },
              ].map((faq, idx) => (
                <div key={idx}>
                  <h3 className="font-bold text-[#1f2d2b] mb-2">{faq.q}</h3>
                  <p className="text-[#6b7b78]">{faq.a}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Back Link */}
          <div className="mt-12 text-center">
            <Link href="/dashboard" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
