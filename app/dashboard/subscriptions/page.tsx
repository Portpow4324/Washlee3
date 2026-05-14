'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { ArrowRight, ArrowLeft, CheckCircle, CreditCard, Gift } from 'lucide-react'

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Keep the existing endpoint touch so any side-effects continue.
    // Washlee no longer sells paid subscription tiers — the public-facing
    // story is always pay-per-order + free Wash Club rewards.
    const probe = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        await fetch('/api/subscriptions/get-current', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.id}`,
          },
        })
      } catch {
        // ignore — display the neutral state regardless
      } finally {
        setLoading(false)
      }
    }
    probe()
  }, [user])

  if (authLoading || loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-gray text-sm">Loading…</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-soft-mint pb-16">
        <div className="container-page py-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-6 hover:text-primary transition">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">Membership</h1>
            <p className="text-gray text-base">
              Washlee is pay-per-order. There&rsquo;s no paid subscription — you only pay when you book a wash.
            </p>
          </div>

          {/* Pay-per-order */}
          <div className="surface-card p-6 sm:p-10 bg-gradient-to-br from-mint to-white mb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-soft mb-4">
              <CreditCard size={26} className="text-primary-deep" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-2">Pay per order</h2>
            <p className="text-gray text-base sm:text-lg mb-8 max-w-md mx-auto">
              Standard $7.50/kg, Express $12.50/kg, $75 minimum. Free pickup &amp; delivery, every time.
            </p>

            <ul className="space-y-3 text-left max-w-md mx-auto mb-8">
              {[
                'No monthly fees, ever',
                'Pay only when you book a pickup',
                'Cancel any pending order at no cost',
                'Order tracking and Pro chat included',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3 border border-line">
                  <CheckCircle size={18} className="text-primary-deep flex-shrink-0" />
                  <span className="text-sm font-medium text-dark">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/booking" className="btn-primary">
                Book a pickup
                <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="btn-outline">
                View pricing
              </Link>
            </div>
          </div>

          {/* Wash Club */}
          <div className="surface-card p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Gift size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-dark mb-1">Wash Club rewards</h3>
                <p className="text-gray text-sm mb-4">
                  Free loyalty program. Earn 1 point on every dollar you spend, tier up automatically, and redeem for credit at checkout. No membership fee — ever.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard/washclub" className="btn-primary text-sm">
                    Open Wash Club
                    <ArrowRight size={14} />
                  </Link>
                  <Link href="/wash-club" className="btn-outline text-sm">
                    How it works
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
