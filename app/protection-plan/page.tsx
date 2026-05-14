'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Shield, Users, Zap, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react'

const trust = [
  {
    icon: Shield,
    title: 'ID verified',
    body: 'Every Washlee Pro is identity-verified before they accept their first order.',
  },
  {
    icon: Shield,
    title: 'Background checked',
    body: 'We run national police checks on every Pro before approval.',
  },
  {
    icon: Zap,
    title: 'Reviewed continuously',
    body: 'Customer ratings and signals from every order feed into who keeps getting jobs.',
  },
  {
    icon: Users,
    title: 'Real local Pros',
    body: 'Pros are independent contractors paid commission per completed order — not anonymous handlers.',
  },
]

const tiers = [
  {
    name: 'Basic',
    price: 'Included',
    perItem: 'Up to $50 per item',
    perOrder: 'Up to $300 per order',
    body: 'Comes with every Washlee order, no opt-in needed.',
  },
  {
    name: 'Premium',
    price: '+$3.50',
    perItem: 'Up to $100 per item',
    perOrder: 'Up to $500 per order',
    body: 'Add at checkout for higher per-item and per-order cover.',
    highlight: true,
  },
  {
    name: 'Premium+',
    price: '+$8.50',
    perItem: 'Up to $150 per item',
    perOrder: 'Up to $1,000 per order',
    body: 'For wardrobes that include investment pieces.',
  },
]

const claimSteps = [
  { step: 1, title: 'Open the order', body: 'From your dashboard, open the affected order within 14 days of delivery.' },
  { step: 2, title: 'Submit a claim', body: 'Tap “Report an issue” and add photos plus a short description.' },
  { step: 3, title: 'Quick review', body: 'Our team reviews most claims within 2 business days and gets in touch.' },
  { step: 4, title: 'Resolution', body: 'Approved claims are paid back to your original payment method or in account credit.' },
]

export default function ProtectionPlanPage() {
  return (
    <>
      <Header />

      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <Shield size={14} /> Damage protection on every order
            </span>
            <h1 className="h1 text-dark text-balance mb-4">You&rsquo;re covered.</h1>
            <p className="text-lg text-gray leading-relaxed">
              Every Washlee order includes basic damage protection. Need a higher cap for delicates or business attire? Pick Premium or Premium+ at checkout — that&rsquo;s it.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="text-center mb-10">
          <h2 className="section-title">Why you can trust us with your wardrobe</h2>
          <p className="section-subtitle">Vetted Pros, transparent process, real cover.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trust.map((t) => (
            <div key={t.title} className="surface-card p-6">
              <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                <t.icon size={18} className="text-primary-deep" />
              </div>
              <h3 className="font-bold text-dark mb-1.5">{t.title}</h3>
              <p className="text-sm text-gray leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="text-center mb-10">
            <h2 className="section-title">Choose your level</h2>
            <p className="section-subtitle">Pick at checkout — applies to that single order.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`surface-card p-6 sm:p-7 ${t.highlight ? 'border-primary bg-gradient-to-br from-mint to-white shadow-glow' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-dark">{t.name}</h3>
                  {t.highlight && (
                    <span className="pill text-[10px]">Most popular</span>
                  )}
                </div>
                <p className="text-3xl font-bold text-primary-deep mb-1">{t.price}</p>
                <p className="text-sm text-gray mb-4">{t.body}</p>
                <ul className="space-y-2 text-sm text-dark">
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary-deep flex-shrink-0 mt-0.5" /> {t.perItem}</li>
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary-deep flex-shrink-0 mt-0.5" /> {t.perOrder}</li>
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray text-center mt-4">All caps in AUD. Cover applies to accidental damage or loss during the laundry process.</p>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="text-center mb-10">
          <h2 className="section-title">Making a claim</h2>
          <p className="section-subtitle">Simple, no paperwork-fortress.</p>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {claimSteps.map((s) => (
            <li key={s.step} className="surface-card p-6">
              <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center mb-3">
                {s.step}
              </div>
              <h3 className="font-bold text-dark mb-1.5">{s.title}</h3>
              <p className="text-sm text-gray leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page pb-16">
        <div className="surface-card p-6 sm:p-8 bg-mint/40 border-primary/15 max-w-3xl mx-auto">
          <div className="flex gap-3">
            <AlertCircle size={20} className="text-primary-deep flex-shrink-0 mt-0.5" />
            <div className="text-sm text-dark leading-relaxed">
              <p className="font-semibold mb-1">A note on what isn&rsquo;t covered</p>
              <p className="text-gray">
                Pre-existing damage, items mis-declared as machine-washable, dry-clean-only items sent through standard wash, and consequential losses are not covered. Please tell us about delicates or special care needs at booking — we&rsquo;ll handle them appropriately.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="surface-card p-8 sm:p-10 bg-gradient-to-br from-mint to-white text-center">
          <h2 className="h3 text-dark mb-2">Book with confidence</h2>
          <p className="text-gray mb-6 max-w-xl mx-auto">$7.50/kg standard, $12.50/kg express, $75 minimum. Damage protection on every order.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/booking" className="btn-primary">
              Book a pickup
              <ArrowRight size={16} />
            </Link>
            <Link href="/pricing" className="btn-outline">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
