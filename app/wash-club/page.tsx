'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  Gift,
  Award,
  Crown,
  CheckCircle,
  ChevronRight,
  Star,
  Sparkles,
  Lock,
  Unlock,
  DollarSign,
  ArrowRight,
  Truck,
  Calendar,
  Wallet,
} from 'lucide-react'
import PhoneMockup from '@/components/marketing/PhoneMockup'
import { RewardsAppScreen } from '@/components/marketing/AppScreens'
import PhotoSlot from '@/components/marketing/PhotoSlot'
import Reveal from '@/components/marketing/Reveal'

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
      icon: <Award size={28} className="text-amber-700" />,
      benefits: [
        '1 point per $1 spent',
        '5% reward rate on points',
        'Access to exclusive deals',
        'Birthday bonus points',
        'Free tier — no membership fee',
      ],
    },
    silver: {
      name: 'Silver',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 border-gray-300',
      pointsPerDollar: 1,
      rewardRate: '7.5%',
      minSpend: 500,
      icon: <Star size={28} className="text-gray-500" />,
      benefits: [
        '1 point per $1 spent',
        '7.5% reward rate on points',
        '10% discount on Express delivery',
        'Priority customer support',
        'Monthly bonus points',
        'Free tier — automatic at $500 spend',
      ],
    },
    gold: {
      name: 'Gold',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-300',
      pointsPerDollar: 1,
      rewardRate: '10%',
      minSpend: 1500,
      icon: <Crown size={28} className="text-yellow-600" />,
      benefits: [
        '1 point per $1 spent',
        '10% reward rate on points',
        '15% discount on Express delivery',
        'Free priority support',
        'Exclusive Gold member sales',
        'Double points on special days',
        'Free tier — automatic at $1,500 spend',
      ],
    },
    platinum: {
      name: 'Platinum',
      color: 'text-primary-deep',
      bgColor: 'bg-mint border-primary',
      pointsPerDollar: 1.25,
      rewardRate: '12.5%',
      minSpend: 4000,
      icon: <Sparkles size={28} className="text-primary-deep" />,
      benefits: [
        '1.25 points per $1 spent',
        '12.5% reward rate on points',
        '20% discount on Express delivery',
        'Dedicated support line',
        'Exclusive Platinum member events',
        'Triple points on special days',
        'Premium services included',
        'Birthday gift worth 500 points',
      ],
    },
  }

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-soft-hero">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative container-page py-14 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-slide-up">
              <span className="pill mb-4">
                <Gift size={14} /> Wash Club rewards
              </span>
              <h1 className="h1 text-dark text-balance mb-4">
                Free loyalty.
                <br />
                <span className="text-primary">Real perks.</span>
              </h1>
              <p className="text-lg text-gray leading-relaxed mb-8 max-w-xl">
                Earn 1 point for every dollar spent. Free to join, free forever — no membership fee, ever.
              </p>

              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark mb-8">
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> No subscription</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Earn on every order</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Tier up automatically</li>
              </ul>

              {!loading && (
                <div className="flex flex-col sm:flex-row gap-3">
                  {user ? (
                    <button onClick={handleJoinClick} className="btn-primary shadow-glow">
                      <Sparkles size={16} /> Start earning now
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <>
                      <button onClick={handleJoinClick} className="btn-primary shadow-glow">
                        <Unlock size={16} /> Join Wash Club
                        <ArrowRight size={16} />
                      </button>
                      <button onClick={handleSignIn} className="btn-outline">
                        <Lock size={16} /> Sign in
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 relative">
              <Reveal as="fade" delay={0.05}>
                <PhotoSlot
                  src="/marketing/wash-club-rewards.jpg"
                  alt="Folded laundry next to a phone showing Wash Club rewards"
                  aspect="aspect-[4/5]"
                  placeholderHint="Folded laundry next to a phone showing rewards in a bright Melbourne home."
                  priority
                  caption="Earn on every order · redeem any time"
                />
              </Reveal>
              {/* Floating phone mockup */}
              <div className="pointer-events-none absolute -right-4 sm:-right-6 lg:-right-8 -bottom-6 sm:-bottom-8 w-[150px] sm:w-[180px] animate-float-slow">
                <div className="rotate-[-5deg]">
                  <PhoneMockup tone="dark" label="Wash Club rewards screen">
                    <RewardsAppScreen />
                  </PhoneMockup>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Points System Explanation */}
      <section className="bg-white">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">How points work</h2>
              <p className="section-subtitle">Three steps. No spreadsheets.</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: DollarSign, title: 'Spend $1', body: 'Every dollar you spend on a Washlee order earns points automatically.' },
              { icon: Star, title: 'Earn points', body: 'Get 1 point per dollar minimum (1.25 at Platinum). Tier up to earn faster.' },
              { icon: Gift, title: 'Redeem rewards', body: 'Use points at checkout — discounts, free Express, or save for bigger perks.' },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <div className="surface-card card-hover p-6 sm:p-7 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-mint flex items-center justify-center mb-4">
                    <s.icon size={22} className="text-primary-deep" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-soft mb-1">Step {i + 1}</p>
                  <h3 className="text-xl font-bold text-dark mb-2">{s.title}</h3>
                  <p className="text-sm text-gray leading-relaxed">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Comparison */}
      <section className="bg-soft-mint">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">Choose your tier</h2>
              <p className="section-subtitle">Tiers unlock automatically as you wash more. No fees at any tier.</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {Object.entries(tiers).map(([key, tier], i) => {
              const isSelected = selectedTier === key
              return (
                <Reveal key={key} delay={i * 0.05}>
                  <button
                    type="button"
                    onClick={() => setSelectedTier(key)}
                    className={`surface-card overflow-hidden text-left transition-all duration-300 w-full h-full ${
                      isSelected ? 'border-primary shadow-glow scale-[1.02]' : 'card-hover'
                    }`}
                  >
                    <div className={`p-5 ${tier.bgColor} border-b border-line`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-xl font-bold ${tier.color}`}>{tier.name}</h3>
                        <div>{tier.icon}</div>
                      </div>
                      {key === 'platinum' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
                          Most rewarding
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-4">
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className={`text-2xl font-bold ${tier.color}`}>{tier.pointsPerDollar}</span>
                          <span className="text-gray text-xs">pts per $1</span>
                        </div>
                        <p className={`text-xs font-semibold ${tier.color}`}>{tier.rewardRate} reward value</p>
                      </div>
                      {tier.minSpend > 0 ? (
                        <div className="rounded-xl bg-light p-3 mb-4">
                          <p className="text-[10px] uppercase tracking-wider text-gray-soft mb-0.5">Unlock at annual spend</p>
                          <p className={`text-base font-bold ${tier.color}`}>${tier.minSpend.toLocaleString()}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-light p-3 mb-4">
                          <p className={`text-sm font-bold ${tier.color}`}>Entry tier — start here</p>
                        </div>
                      )}
                      <ul className="space-y-1.5 mb-5">
                        {tier.benefits.slice(0, 3).map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2 text-xs text-dark">
                            <CheckCircle size={13} className={`${tier.color} flex-shrink-0 mt-0.5`} />
                            <span>{benefit}</span>
                          </li>
                        ))}
                        {tier.benefits.length > 3 && (
                          <li className="text-[11px] text-gray-soft italic ml-5">+{tier.benefits.length - 3} more</li>
                        )}
                      </ul>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${tier.color}`}>
                        See all benefits <ChevronRight size={12} />
                      </span>
                    </div>
                  </button>
                </Reveal>
              )
            })}
          </div>

          {/* Selected tier full details */}
          <Reveal as="fade">
            <div className="surface-card p-6 sm:p-10 bg-white">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl ${tiers[selectedTier].bgColor}`}>
                  {tiers[selectedTier].icon}
                </div>
                <div>
                  <h3 className={`text-2xl sm:text-3xl font-bold ${tiers[selectedTier].color} mb-0.5`}>
                    {tiers[selectedTier].name} tier
                  </h3>
                  <p className="text-sm text-gray">All benefits at this level</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tiers[selectedTier].benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3 bg-light rounded-xl p-3">
                    <CheckCircle size={18} className={`${tiers[selectedTier].color} flex-shrink-0 mt-0.5`} />
                    <span className="text-sm text-dark font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Lifestyle band — photo + perks */}
      <section className="bg-white">
        <div className="section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <PhotoSlot
                  src="/marketing/wash-club-tier.jpg"
                  alt="Folded laundry next to a coffee in a calm Melbourne home"
                  aspect="aspect-[4/3]"
                  placeholderHint="Fresh laundry beside a coffee with the Washlee app open."
                  caption="Real perks · pay-per-order · zero membership fee"
                />
              </Reveal>
            </div>
            <div className="lg:col-span-6">
              <Reveal as="fade" delay={0.05}>
                <h2 className="h2 text-dark mb-3">Loyalty without the catch</h2>
                <p className="text-gray text-base sm:text-lg leading-relaxed mb-6 max-w-xl">
                  Most loyalty programs gate the good stuff behind a monthly fee. Wash Club doesn&rsquo;t. The more you wash, the more you earn — that&rsquo;s the whole deal.
                </p>
                <ul className="space-y-3 max-w-md">
                  {[
                    { icon: Wallet, title: 'No membership fee — ever', body: 'Bronze starts free. Silver, Gold, Platinum unlock by spend, not by payment.' },
                    { icon: Calendar, title: 'Birthday + monthly bonuses', body: 'Earn extra points around your birthday and on featured wash days.' },
                    { icon: Truck, title: 'Express discounts', body: 'Up to 20% off Express delivery once you reach Platinum.' },
                  ].map((line, i) => (
                    <Reveal key={line.title} delay={0.1 + i * 0.05}>
                      <li className="flex items-start gap-3 surface-card card-hover p-4">
                        <div className="w-9 h-9 rounded-lg bg-mint flex items-center justify-center flex-shrink-0">
                          <line.icon size={16} className="text-primary-deep" />
                        </div>
                        <div>
                          <p className="font-bold text-dark text-sm">{line.title}</p>
                          <p className="text-xs text-gray leading-relaxed mt-0.5">{line.body}</p>
                        </div>
                      </li>
                    </Reveal>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Redemption */}
      <section className="bg-soft-mint">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">Turn points into rewards</h2>
              <p className="section-subtitle">A few ways to spend what you&rsquo;ve earned.</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { points: 100, value: '$5.00', reward: 'Free Express upgrade', icon: Truck },
              { points: 250, value: '$12.50', reward: 'Premium care add-on', icon: Sparkles },
              { points: 500, value: '$25.00', reward: 'Discount on any order', icon: Gift },
            ].map((item, i) => (
              <Reveal key={item.reward} delay={i * 0.06}>
                <div className="surface-card card-hover p-6 sm:p-7 text-center h-full">
                  <div className="w-12 h-12 rounded-2xl bg-mint flex items-center justify-center mx-auto mb-4">
                    <item.icon size={22} className="text-primary-deep" />
                  </div>
                  <p className="text-3xl font-bold text-primary-deep">{item.points} <span className="text-sm font-medium text-gray">pts</span></p>
                  <p className="mt-1 text-lg font-bold text-dark">{item.value}</p>
                  <p className="mt-3 text-sm text-gray">{item.reward}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="section">
          <div className="container-narrow">
            <div className="text-center mb-10">
              <Reveal>
                <h2 className="section-title">Questions</h2>
                <p className="section-subtitle">The basics, answered.</p>
              </Reveal>
            </div>
            <div className="space-y-3">
              {[
                { q: 'How do points work?', a: 'Spend $1, earn 1 point. Higher tiers earn more per dollar — at Platinum, you earn 1.25 points per dollar.' },
                { q: 'How do I advance tiers?', a: 'Tier advancement is automatic, based on annual spend. Bronze is free. Silver unlocks at $500, Gold at $1,500, Platinum at $4,000.' },
                { q: 'When can I redeem points?', a: 'Any time at checkout. Use them for discounts, free Express upgrades, or larger perks.' },
                { q: 'Do points expire?', a: 'Points stay active for 24 months. Most regular customers redeem long before then.' },
                { q: 'Can I combine points with promos?', a: 'Yes — you can stack point redemptions with promo codes for maximum savings.' },
                { q: 'Is Wash Club a subscription?', a: 'No. Wash Club is free loyalty only. There&rsquo;s no monthly or annual membership fee at any tier.' },
              ].map((item) => (
                <Reveal key={item.q}>
                  <details className="group surface-card card-hover overflow-hidden">
                    <summary className="flex items-center justify-between cursor-pointer list-none p-5 sm:p-6">
                      <span className="font-semibold text-dark pr-4">{item.q}</span>
                      <span className="text-primary-deep transition group-open:rotate-180 text-lg" aria-hidden>⌄</span>
                    </summary>
                    <p className="px-5 pb-5 sm:px-6 sm:pb-6 -mt-1 text-sm text-gray leading-relaxed">{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page pb-16">
        <Reveal>
          <div className="surface-card overflow-hidden bg-gradient-to-br from-primary to-accent text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center">
              <div className="p-8 sm:p-12 text-center md:text-left">
                <h2 className="text-3xl sm:text-4xl font-bold mb-3">Start earning today</h2>
                <p className="text-white/90 mb-6 max-w-md">
                  Free to join, free forever. Use the Washlee app to track your tier, points, and perks anytime.
                </p>
                {!loading && !user ? (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <button
                      onClick={handleJoinClick}
                      className="inline-flex items-center justify-center gap-2 bg-white text-primary-deep font-bold px-6 py-3 rounded-full hover:shadow-lg transition min-h-[48px]"
                    >
                      <Unlock size={16} /> Sign up free
                    </button>
                    <button
                      onClick={handleSignIn}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white border border-white/30 hover:bg-white/10 transition min-h-[48px]"
                    >
                      Sign in
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleJoinClick}
                    className="inline-flex items-center justify-center gap-2 bg-white text-primary-deep font-bold px-6 py-3 rounded-full hover:shadow-lg transition min-h-[48px]"
                  >
                    <Sparkles size={16} /> Start earning
                  </button>
                )}
                <p className="mt-4 text-xs text-white/75">
                  Or just <Link href="/booking" className="underline">book a pickup</Link> — points start accruing automatically.
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center p-8 lg:p-12">
                <div className="animate-float">
                  <PhoneMockup className="w-[230px]" tone="dark" label="Wash Club rewards screen">
                    <RewardsAppScreen />
                  </PhoneMockup>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  )
}
