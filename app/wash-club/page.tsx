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
  Lock,
  Unlock,
  DollarSign,
  Percent,
  AlertCircle,
} from 'lucide-react'

interface TierData {
  name: string
  color: string
  bgColor: string
  pointsPerDollar: number
  rewardRate: string
  minSpend: number
  benefits: string[]
  icon: React.ReactNode
}

export default function WashClubPage() {
  const [selectedTier, setSelectedTier] = useState('silver')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleJoinClick = async () => {
    if (user) {
      router.push(`/wash-club/onboarding?email=${encodeURIComponent(user.email || '')}`)
    } else {
      router.push('/auth/signup')
    }
  }

  const handleSignIn = () => {
    router.push('/auth/login')
  }

  const tiers: Record<string, TierData> = {
    bronze: {
      name: 'Bronze',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200',
      pointsPerDollar: 1,
      rewardRate: '5%',
      minSpend: 0,
      icon: <Award size={32} className="text-amber-700" />,
      benefits: [
        '1 point per $1 spent',
        '5% reward rate on points',
        'Access to exclusive deals',
        'Birthday bonus points',
        'Free tier - no membership fee',
      ],
    },
    silver: {
      name: 'Silver',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 border-gray-300',
      pointsPerDollar: 1,
      rewardRate: '7.5%',
      minSpend: 500,
      icon: <Star size={32} className="text-gray-500" />,
      benefits: [
        '1 point per $1 spent',
        '7.5% reward rate on points',
        '10% discount on express delivery',
        'Priority customer support',
        'Monthly bonus points',
        'Free tier - automatic at $500 spend',
      ],
    },
    gold: {
      name: 'Gold',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 border-yellow-300',
      pointsPerDollar: 1,
      rewardRate: '10%',
      minSpend: 1500,
      icon: <Crown size={32} className="text-yellow-500" />,
      benefits: [
        '1 point per $1 spent',
        '10% reward rate on points',
        '15% discount on express delivery',
        'Free priority support',
        'Exclusive Gold member sales',
        'Double points on special days',
        'Free tier - automatic at $1,500 spend',
      ],
    },
    platinum: {
      name: 'Platinum',
      color: 'text-primary',
      bgColor: 'bg-primary/5 border-primary',
      pointsPerDollar: 1.25,
      rewardRate: '12.5%',
      minSpend: 4000,
      icon: <Sparkles size={32} className="text-primary" />,
      benefits: [
        '1.25 points per $1 spent',
        '12.5% reward rate on points',
        '20% discount on express delivery',
        '24/7 dedicated support line',
        'Exclusive Platinum member events',
        'Triple points on special days',
        'Free premium services',
        'Birthday gift worth 500 points',
      ],
    },
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-light via-white to-light">
        {/* Premium Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-10" />
          <div className="max-w-6xl mx-auto px-4 py-24 relative z-10">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles size={48} className="text-primary animate-pulse" />
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Wash Club Rewards
                </h1>
              </div>
              <p className="text-xl text-gray max-w-2xl mx-auto mb-3">
                Earn 1 point for every dollar spent. Free to join, free forever — no membership fee, ever.
              </p>
              <span className="pill"><Sparkles size={14} /> Pay-per-order. Wash Club just rewards you.</span>
            </div>

            {/* Auth CTA - Prominent */}
            {!loading && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                {user ? (
                  <>
                    <Button 
                      onClick={handleJoinClick}
                      className="bg-primary text-white hover:bg-primary/90 text-lg px-8 py-3"
                    >
                      <Sparkles size={20} />
                      Start Earning Now
                    </Button>
                    <p className="text-sm text-gray self-center">Welcome back, {user.email?.split('@')[0]}!</p>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={handleJoinClick}
                      className="bg-primary text-white hover:bg-primary/90 text-lg px-8 py-3"
                    >
                      <Unlock size={20} />
                      Sign Up for Rewards
                    </Button>
                    <Button 
                      onClick={handleSignIn}
                      variant="outline"
                      className="border-2 border-primary text-primary hover:bg-primary/5 text-lg px-8 py-3"
                    >
                      <Lock size={20} />
                      Sign In
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Points System Explanation */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-dark mb-12 text-center">How Points Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-gradient-to-br from-primary to-accent p-8 rounded-lg text-white mb-4 inline-block w-24 h-24 flex items-center justify-center">
                  <DollarSign size={48} />
                </div>
                <h3 className="text-2xl font-bold text-dark mb-2">Spend $1</h3>
                <p className="text-gray">Every dollar you spend on any wash service earns you points.</p>
              </div>

              <div className="text-center">
                <div className="bg-gradient-to-br from-accent to-primary p-8 rounded-lg text-white mb-4 inline-block w-24 h-24 flex items-center justify-center">
                  <Star size={48} />
                </div>
                <h3 className="text-2xl font-bold text-dark mb-2">Earn 1+ Points</h3>
                <p className="text-gray">Get 1 point minimum (up to 1.25 at Platinum level). Tier up to earn more!</p>
              </div>

              <div className="text-center">
                <div className="bg-gradient-to-br from-yellow-400 to-primary p-8 rounded-lg text-white mb-4 inline-block w-24 h-24 flex items-center justify-center">
                  <Gift size={48} />
                </div>
                <h3 className="text-2xl font-bold text-dark mb-2">Redeem Rewards</h3>
                <p className="text-gray">Convert points to discounts at checkout or save them for bigger rewards.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tier Comparison - Premium Cards */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-dark mb-4 text-center">Choose Your Tier</h2>
            <p className="text-center text-gray text-lg mb-16 max-w-2xl mx-auto">
              Automatically advance through tiers as you spend more. The more you wash, the more you earn.
            </p>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {Object.entries(tiers).map(([key, tier]) => {
                const isSelected = selectedTier === key

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedTier(key)}
                    className={`cursor-pointer transition-all duration-300 rounded-2xl border-2 overflow-hidden ${
                      isSelected
                        ? `${tier.bgColor} border-2 transform scale-105 shadow-lg`
                        : `border-gray/10 hover:border-gray/20 bg-white`
                    }`}
                  >
                    {/* Tier Header */}
                    <div className={`${tier.bgColor} p-6`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-2xl font-bold ${tier.color}`}>{tier.name}</h3>
                        <div className={`${tier.color}`}>{tier.icon}</div>
                      </div>
                      {key === 'platinum' && (
                        <div className="bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-xs font-bold inline-block">
                          Most Rewarding ⭐
                        </div>
                      )}
                    </div>

                    {/* Tier Body */}
                    <div className="p-6">
                      {/* Points Rate */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className={`text-3xl font-bold ${tier.color}`}>
                            {tier.pointsPerDollar}
                          </span>
                          <span className="text-gray text-sm">pts per $1</span>
                        </div>
                        <div className={`text-sm ${tier.color} font-semibold`}>
                          {tier.rewardRate} reward value
                        </div>
                      </div>

                      {/* Spend Requirement */}
                      {tier.minSpend > 0 ? (
                        <div className="bg-light rounded-lg p-3 mb-6">
                          <p className="text-xs text-gray mb-1">Unlock at annual spend:</p>
                          <p className={`text-lg font-bold ${tier.color}`}>${tier.minSpend.toLocaleString()}</p>
                        </div>
                      ) : (
                        <div className="bg-light rounded-lg p-3 mb-6">
                          <p className={`text-lg font-bold ${tier.color}`}>🎁 Entry Level - Start Here</p>
                        </div>
                      )}

                      {/* Benefits Preview */}
                      <div className="space-y-2 mb-6">
                        {tier.benefits.slice(0, 3).map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle size={16} className={`${tier.color} flex-shrink-0 mt-0.5`} />
                            <span className="text-dark">{benefit}</span>
                          </div>
                        ))}
                        {tier.benefits.length > 3 && (
                          <p className="text-xs text-gray/60 ml-6 italic">+{tier.benefits.length - 3} more benefits</p>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Button 
                        onClick={handleJoinClick}
                        variant={isSelected ? 'primary' : 'outline'}
                        className="w-full"
                      >
                        {user ? `Apply ${tier.name}` : 'Sign Up'}
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Tier Full Details */}
            <div className="bg-gradient-to-r from-light to-white rounded-2xl border-2 border-gray/10 p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-lg ${tiers[selectedTier].bgColor}`}>
                  {tiers[selectedTier].icon}
                </div>
                <div>
                  <h3 className={`text-3xl font-bold ${tiers[selectedTier].color} mb-1`}>
                    {tiers[selectedTier].name} Tier
                  </h3>
                  <p className="text-gray">All the benefits you get</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tiers[selectedTier].benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray/10">
                    <CheckCircle size={20} className={`${tiers[selectedTier].color} flex-shrink-0 mt-0.5`} />
                    <span className="text-dark font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Redemption Examples */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-dark mb-16 text-center">Turn Points Into Rewards</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  points: 100,
                  value: '$5.00',
                  reward: 'Free Express Delivery',
                  icon: '🚚',
                },
                {
                  points: 250,
                  value: '$12.50',
                  reward: 'Premium Stain Treatment',
                  icon: '✨',
                },
                {
                  points: 500,
                  value: '$25.00',
                  reward: 'Complete Order Discount',
                  icon: '🎁',
                },
              ].map((item, idx) => (
                <Card key={idx} className="text-center p-8 bg-gradient-to-b from-light to-white">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-primary mb-2">{item.points} pts</div>
                    <div className="text-2xl font-bold text-accent">{item.value}</div>
                  </div>
                  <p className="text-dark font-semibold mb-4">{item.reward}</p>
                  <Button variant="outline" className="w-full">
                    Learn More
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-dark mb-16 text-center">Questions?</h2>

            <div className="space-y-4">
              {[
                {
                  q: '💰 How do points really work?',
                  a: 'Simple: Spend $1, earn 1 point. Higher tiers earn more points per dollar. At Platinum, earn 1.25 points per dollar.',
                },
                {
                  q: '📈 How do I advance tiers?',
                  a: 'Tier advancement is automatic based on annual spending. Bronze is free to join. Silver requires $500, Gold $1,500, and Platinum $4,000 annual spend.',
                },
                {
                  q: '🎁 When can I redeem my points?',
                  a: 'Redeem anytime at checkout! Points are worth 5¢ each at minimum. Use them for discounts, free services, or exclusive rewards.',
                },
                {
                  q: '⏰ Do points expire?',
                  a: "Points remain active for 24 months. With regular orders, you'll always have rewards available.",
                },
                {
                  q: '🔄 Can I combine points with promotions?',
                  a: 'Absolutely! Use your points alongside promotional codes for maximum savings on your laundry orders.',
                },
                {
                  q: '👥 Can I share points with family?',
                  a: 'Each Wash Club membership is personal to your account. Sign up all your family members to maximize household rewards!',
                },
              ].map((item, idx) => (
                <Card key={idx} className="p-6 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-dark text-lg mb-3">{item.q}</h4>
                  <p className="text-gray">{item.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-5" />
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-dark mb-4">
              Start Earning Points Today
            </h2>
            <p className="text-xl text-gray mb-12 max-w-2xl mx-auto">
              Join Wash Club in seconds. No fees, no catches — just rewards that grow with every wash.
            </p>

            {!loading && !user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleJoinClick}
                  className="bg-primary text-white hover:bg-primary/90 text-lg px-8 py-4"
                >
                  <Unlock size={20} />
                  Sign Up Now
                </Button>
                <Button 
                  onClick={handleSignIn}
                  variant="outline"
                  className="border-2 border-dark text-dark hover:bg-dark/5 text-lg px-8 py-4"
                >
                  Already have an account? Sign In
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleJoinClick}
                className="bg-primary text-white hover:bg-primary/90 text-lg px-8 py-4"
              >
                <Sparkles size={20} />
                Start Your Wash Club Journey
              </Button>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
