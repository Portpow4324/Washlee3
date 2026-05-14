'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState } from 'react'
import {
  Gift,
  Check,
  Heart,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

const presetAmounts = [75, 100, 150, 200, 300]

const featurePairs = [
  { icon: Heart, title: 'The gift of time', body: 'Hand someone an evening back. Perfect for new parents, busy professionals, or anyone juggling too much.' },
  { icon: Sparkles, title: 'Never expires', body: 'Use the credit on any future Washlee order. No restrictions, no clock ticking.' },
  { icon: Mail, title: 'Sent by email', body: 'Choose a delivery date — we&rsquo;ll email the recipient with your custom message and a redeem link.' },
  { icon: Check, title: 'Easy to redeem', body: 'They sign up (or sign in) and the credit lands in their Washlee account automatically.' },
]

export default function GiftCardsPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(150)

  return (
    <>
      <Header />

      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <Gift size={14} /> Washlee gift cards
            </span>
            <h1 className="h1 text-dark text-balance mb-4">Give the gift of fresh laundry.</h1>
            <p className="text-lg text-gray leading-relaxed">
              A Washlee gift card is the easiest way to hand someone back their weekend. Sent by email, redeemable across the Melbourne service area, and never expires.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="text-center mb-10">
          <h2 className="section-title">Why a Washlee gift card</h2>
          <p className="section-subtitle">Practical, generous, and very easy to send.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featurePairs.map((f) => (
            <div key={f.title} className="surface-card p-6">
              <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                <f.icon size={18} className="text-primary-deep" />
              </div>
              <h3 className="font-bold text-dark mb-1.5">{f.title}</h3>
              <p
                className="text-sm text-gray leading-relaxed"
                dangerouslySetInnerHTML={{ __html: f.body }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="text-center mb-10">
            <h2 className="section-title">Popular amounts</h2>
            <p className="section-subtitle">Each one covers at least one full Washlee order ($75 minimum).</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { amount: 75, title: 'Single order', body: '~10kg of standard wash &amp; fold' },
              { amount: 150, title: 'Two orders', body: 'About a fortnight of laundry, sorted', highlight: true },
              { amount: 300, title: 'Set them up for the season', body: 'Roughly a month of weekly washes' },
            ].map((card) => (
              <div
                key={card.amount}
                className={`surface-card p-6 text-center ${card.highlight ? 'border-primary bg-gradient-to-br from-mint to-white shadow-glow' : ''}`}
              >
                {card.highlight && (
                  <span className="pill mb-3 text-[10px]">Most popular</span>
                )}
                <p className="text-4xl font-bold text-primary-deep mb-1">${card.amount}</p>
                <p className="font-bold text-dark mb-1.5">{card.title}</p>
                <p
                  className="text-sm text-gray"
                  dangerouslySetInnerHTML={{ __html: card.body }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray text-center mt-3">All amounts in AUD, GST inclusive. $75 minimum applies to each Washlee order.</p>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="surface-card p-6 sm:p-10 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-dark mb-2">Custom amount</h2>
          <p className="text-sm text-gray mb-6">Choose a preset or enter any amount from $75 to $500.</p>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedAmount(amount)}
                className={`py-2.5 rounded-xl font-bold text-sm border-2 transition ${
                  selectedAmount === amount
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-dark border-line hover:border-primary'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>

          <label htmlFor="customAmount" className="label-field">
            Or enter a custom amount
          </label>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-dark">$</span>
            <input
              id="customAmount"
              type="number"
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(Number(e.target.value))}
              min={75}
              max={500}
              className="input-field text-lg font-semibold"
            />
          </div>
          <p className="text-xs text-gray-soft mb-6">Minimum $75 · Maximum $500</p>

          <div className="rounded-2xl bg-mint/40 border border-primary/15 p-4 text-sm text-dark mb-6 flex gap-3">
            <AlertCircle size={18} className="text-primary-deep flex-shrink-0 mt-0.5" />
            <p>
              Gift card checkout is in beta — to send a card now, email{' '}
              <a href="mailto:gifts@washlee.com.au" className="font-semibold text-primary-deep hover:underline">
                gifts@washlee.com.au
              </a>{' '}
              with the recipient&rsquo;s email, the amount, and your message. We&rsquo;ll send it for you.
            </p>
          </div>

          <a
            href={`mailto:gifts@washlee.com.au?subject=${encodeURIComponent('Gift card request')}&body=${encodeURIComponent(`Amount: $${selectedAmount} AUD\nRecipient email:\nMessage:\n`)}`}
            className="btn-primary w-full"
          >
            Email a $&thinsp;{selectedAmount} gift card
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="surface-card p-8 sm:p-10 bg-gradient-to-br from-mint to-white text-center">
          <h2 className="h3 text-dark mb-2">Got a card to redeem?</h2>
          <p className="text-gray mb-6 max-w-xl mx-auto">Sign in (or create an account) and the credit will appear in your Washlee balance.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup-customer" className="btn-primary">
              Create account
              <ArrowRight size={16} />
            </Link>
            <Link href="/auth/login" className="btn-outline">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
