'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { Gift, Star, Crown, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react'

interface WashClubStatus {
  isEnrolled: boolean
  enrollmentDate?: string
  cardsCollected: number
  totalWashes: number
}

export default function DashboardWashClubPage() {
  const { user, loading: authLoading } = useAuth()
  const [clubStatus, setClubStatus] = useState<WashClubStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return

    const loadClubStatus = async () => {
      try {
        setIsLoading(true)
        // TODO: Wire to /api/wash-club/membership when available.
        setClubStatus({
          isEnrolled: false,
          cardsCollected: 0,
          totalWashes: 0,
        })
      } catch (err) {
        console.error('Error loading wash club status:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadClubStatus()
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  const enrolled = clubStatus?.isEnrolled ?? false
  const cards = clubStatus?.cardsCollected ?? 0
  const totalWashes = clubStatus?.totalWashes ?? 0
  const progress = Math.min(100, Math.floor((cards % 10) * 10))

  return (
    <>
      <main className="min-h-screen bg-soft-mint pb-16">
        <div className="container-page py-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-6 hover:text-primary transition">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-dark">Wash Club</h1>
              <p className="text-gray text-base mt-1">Free loyalty rewards. Earn on every wash, no membership fee.</p>
            </div>
          </div>

          {/* Status card */}
          {enrolled ? (
            <div className="surface-card p-6 sm:p-8 mb-6 bg-gradient-to-br from-mint to-white">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="pill mb-3"><Sparkles size={12} /> Active member</span>
                  <p className="text-2xl font-bold text-dark">You&rsquo;re in.</p>
                  {clubStatus?.enrollmentDate && (
                    <p className="text-sm text-gray mt-1">
                      Member since {new Date(clubStatus.enrollmentDate).toLocaleDateString('en-AU')}
                    </p>
                  )}
                </div>
                <Crown className="w-10 h-10 text-primary-deep" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-4 text-center border border-line">
                  <p className="text-3xl font-bold text-primary-deep">{cards}</p>
                  <p className="text-xs text-gray mt-1">Cards collected</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-line">
                  <p className="text-3xl font-bold text-primary-deep">{totalWashes}</p>
                  <p className="text-xs text-gray mt-1">Total washes</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-line">
                  <p className="text-3xl font-bold text-primary-deep">{progress}%</p>
                  <p className="text-xs text-gray mt-1">To next reward</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray mt-2 text-center">{Math.max(0, 10 - (cards % 10))} more cards to your next reward</p>
              </div>
            </div>
          ) : (
            <div className="surface-card p-8 sm:p-10 mb-6 bg-gradient-to-br from-mint to-white text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-soft mb-4">
                <Gift className="w-8 h-8 text-primary-deep" />
              </div>
              <h2 className="text-2xl font-bold text-dark mb-2">Join Wash Club</h2>
              <p className="text-gray mb-6 max-w-md mx-auto">
                Free to join, free forever — earn rewards on every order and unlock perks as you wash more.
              </p>
              <Link href="/wash-club" className="btn-primary">
                Learn more &amp; enroll
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* How it works */}
          <div className="surface-card p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold text-dark mb-5">How Wash Club works</h2>
            <ol className="space-y-5">
              {[
                { title: 'Earn on every wash', body: 'Every dollar you spend earns one point automatically — no scanning, no codes.' },
                { title: 'Tier up by spend', body: 'Bronze starts free. Silver, Gold and Platinum unlock as your annual spend grows.' },
                { title: 'Redeem for credit', body: 'Convert points to credit at checkout, or save them for bigger rewards.' },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark mb-1">{step.title}</h3>
                    <p className="text-sm text-gray">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Tier preview */}
          <div className="surface-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-dark">Tier perks</h2>
              <Link href="/wash-club" className="text-sm font-semibold text-primary-deep hover:underline">See all</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'Silver', icon: Star, perks: ['7.5% reward rate', 'Priority support', 'Monthly bonus points'] },
                { name: 'Gold', icon: Star, perks: ['10% reward rate', '15% off Express', 'Exclusive deals'] },
                { name: 'Platinum', icon: Crown, perks: ['12.5% reward rate', '20% off Express', 'Birthday gift'] },
              ].map((tier) => (
                <div key={tier.name} className="rounded-xl border border-line bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <tier.icon size={16} className="text-primary-deep" />
                    <h3 className="font-bold text-dark">{tier.name}</h3>
                  </div>
                  <ul className="space-y-1.5 text-sm text-gray">
                    {tier.perks.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
