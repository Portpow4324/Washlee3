'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import {
  Gift,
  TrendingUp,
  Zap,
  Award,
  Crown,
  CheckCircle,
  ChevronRight,
  Star,
  Sparkles,
  Target,
} from 'lucide-react'
import { WASH_CLUB_TIERS } from '@/lib/washClub'

export default function WashClubPage() {
  const [selectedTier, setSelectedTier] = useState(2)
  const { user, loading } = useAuth()
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (!loading) {
      setAuthReady(true)
      console.log('[Wash Club] Auth initialized - user:', user?.email || 'not authenticated')
    }
  }, [loading, user])

  const handleJoinClick = async () => {
    console.log('[Wash Club] Join button clicked')
    console.log('[Wash Club] Auth ready:', authReady)
    console.log('[Wash Club] User state:', user)
    
    if (user) {
      // Logged in - go directly to onboarding
      console.log('[Wash Club] User authenticated:', user.email, '-> navigating to onboarding')
      router.push(`/wash-club/onboarding?email=${encodeURIComponent(user.email || '')}`)
    } else {
      // Not logged in - go to signup
      console.log('[Wash Club] User not authenticated -> navigating to signup')
      router.push('/auth/signup')
    }
  }

  const tiers = [1, 2, 3, 4]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-light">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-accent text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
              <Sparkles size={40} />
              <h1 className="text-4xl md:text-5xl font-bold">Wash Club</h1>
            </div>
            <p className="text-xl opacity-90 mb-6 max-w-2xl">
              Join our loyalty program and earn credits on every order. The more you wash, the more you save.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={handleJoinClick}
                className="bg-white text-primary hover:bg-light"
              >
                Join Wash Club
                <ChevronRight size={18} />
              </Button>
              <Link href="/auth/login">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-dark mb-12 text-center">How Wash Club Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  icon: <Zap size={32} className="text-primary" />,
                  title: 'Earn Credits',
                  description: 'Get 5-15% credits back on every order based on your tier',
                },
                {
                  icon: <TrendingUp size={32} className="text-accent" />,
                  title: 'Level Up',
                  description: 'Reach higher tiers with more annual spending',
                },
                {
                  icon: <Gift size={32} className="text-primary" />,
                  title: 'Unlock Benefits',
                  description: 'Get order discounts, priority support, and exclusive perks',
                },
                {
                  icon: <Award size={32} className="text-accent" />,
                  title: 'Redeem Rewards',
                  description: 'Use credits as discounts on future orders',
                },
              ].map((item, idx) => (
                <Card key={idx} className="text-center p-6">
                  <div className="flex justify-center mb-4">{item.icon}</div>
                  <h3 className="text-lg font-bold text-dark mb-2">{item.title}</h3>
                  <p className="text-gray text-sm">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tier Comparison */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-dark mb-4 text-center">Choose Your Tier</h2>
            <p className="text-center text-gray mb-12 max-w-2xl mx-auto">
              Advance through tiers as you spend more and unlock premium benefits
            </p>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {tiers.map((tierNum) => {
                const tier = WASH_CLUB_TIERS[tierNum]
                const isSelected = selectedTier === tierNum
                
                return (
                  <div
                    key={tierNum}
                    onClick={() => setSelectedTier(tierNum)}
                    className={`cursor-pointer transition-all rounded-lg border-2 p-6 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray/20 hover:border-primary'
                    } ${tier.priority === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                  >
                    <div className="mb-4">
                      {tier.priority === 4 && (
                        <div className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold mb-2">
                          <Crown size={14} /> Most Popular
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-dark flex items-center gap-2">
                        {tier.name}
                        {tier.priority === 4 && <Crown size={24} className="text-accent" />}
                      </h3>
                      <p className="text-sm text-gray mt-2">{tier.description}</p>
                    </div>

                    <div className="bg-light rounded-lg p-4 mb-4">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {(tier.creditEarnRate * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray">Credits earned per $</div>
                      
                      {tier.perksPercentage > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray/20">
                          <div className="text-xl font-bold text-accent">
                            {tier.perksPercentage}%
                          </div>
                          <div className="text-xs text-gray">Discount on all orders</div>
                        </div>
                      )}
                    </div>

                    <div className="text-sm mb-4">
                      {tier.minSpend === 0 ? (
                        <div className="text-primary font-semibold">Entry level</div>
                      ) : (
                        <div>
                          <div className="text-gray text-xs mb-1">Minimum annual spend:</div>
                          <div className="text-primary font-bold">${tier.minSpend}</div>
                        </div>
                      )}
                    </div>

                    {tier.annualFee && (
                      <div className="text-xs text-gray mb-4">
                        Annual fee: ${tier.annualFee}
                      </div>
                    )}

                    <Button 
                      onClick={handleJoinClick}
                      variant="outline" 
                      className="w-full mb-4"
                    >
                      Join {tier.name}
                    </Button>
                  </div>
                )
              })}
            </div>

            {/* Selected Tier Details */}
            <div className="bg-light rounded-lg p-8">
              <h3 className="text-2xl font-bold text-dark mb-6">
                {WASH_CLUB_TIERS[selectedTier].name} Tier Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WASH_CLUB_TIERS[selectedTier].benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-dark">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Credits FAQ */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-dark mb-12 text-center">Frequently Asked Questions</h2>

            <div className="space-y-6">
              {[
                {
                  q: 'How do I earn Wash Club credits?',
                  a: 'You automatically earn credits on every order you place. The percentage depends on your tier—from 5% for Bronze to 15% for Platinum members.',
                },
                {
                  q: 'How do I use my credits?',
                  a: 'During checkout, you can choose to apply your credits to your order. Each credit is worth $0.01, and you can use up to 50% of your order total in credits.',
                },
                {
                  q: 'How do I advance to a higher tier?',
                  a: 'Your tier is based on annual spending. Once you reach the spending threshold, you automatically advance to the next tier.',
                },
                {
                  q: 'Do my credits expire?',
                  a: 'Yes, credits expire after 12 months of account inactivity. We send reminders before expiration.',
                },
                {
                  q: 'Can I combine credits with other promotions?',
                  a: 'Credits provide an automatic discount. You can also receive tier-based order discounts independently.',
                },
                {
                  q: 'Is there a fee to join Wash Club?',
                  a: 'Bronze, Silver, and Gold tiers are free. Platinum tier has a $49.99 annual fee but includes premium benefits.',
                },
              ].map((item, idx) => (
                <Card key={idx} className="p-6">
                  <h4 className="font-bold text-dark mb-2 flex items-center gap-2">
                    <Target size={18} className="text-primary" />
                    {item.q}
                  </h4>
                  <p className="text-gray">{item.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Saving?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join Wash Club today and start earning credits on your laundry orders
            </p>
            <Button 
              onClick={handleJoinClick}
              className="bg-white text-primary hover:bg-light text-lg px-8"
            >
              Join Wash Club Now
              <ChevronRight size={20} />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
