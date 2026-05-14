'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Heart, Check, AlertCircle, Zap, Shield, ArrowRight } from 'lucide-react'

const coverageGroups = [
  {
    icon: Zap,
    title: 'Accidental damage',
    items: ['Tears or rips', 'Snags', 'Holes', 'Seam separation'],
  },
  {
    icon: AlertCircle,
    title: 'Colour issues',
    items: ['Fading', 'Bleeding', 'Colour transfer', 'Discolouration'],
  },
  {
    icon: Shield,
    title: 'Shrinkage &amp; sizing',
    items: ['Unexpected shrinkage', 'Sizing changes', 'Elastic failure', 'Waistband stretch'],
  },
  {
    icon: Check,
    title: 'Hardware &amp; details',
    items: ['Lost buttons', 'Broken zippers', 'Snaps', 'Decorative damage'],
  },
]

const tiers = [
  { name: 'Basic', price: 'Included', perItem: '$50/item', perOrder: '$300/order' },
  { name: 'Premium', price: '+$3.50', perItem: '$100/item', perOrder: '$500/order' },
  { name: 'Premium+', price: '+$8.50', perItem: '$150/item', perOrder: '$1,000/order' },
]

export default function DamageProtectionPage() {
  return (
    <>
      <Header />

      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <Heart size={14} /> Care guarantee
            </span>
            <h1 className="h1 text-dark text-balance mb-4">We treat your clothes like our own.</h1>
            <p className="text-lg text-gray leading-relaxed">
              Most loads come back perfect. If something goes wrong, our damage protection makes it right — and you can add extra cover at checkout for delicates or business attire.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="text-center mb-10">
          <h2 className="section-title">What&rsquo;s covered</h2>
          <p className="section-subtitle">Real cover for real wear-and-tear scenarios.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {coverageGroups.map((c) => (
            <div key={c.title} className="surface-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center">
                  <c.icon size={18} className="text-primary-deep" />
                </div>
                <h3
                  className="text-lg font-bold text-dark"
                  dangerouslySetInnerHTML={{ __html: c.title }}
                />
              </div>
              <ul className="space-y-1.5 text-sm text-gray">
                {c.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check size={14} className="text-primary-deep flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="text-center mb-10">
            <h2 className="section-title">Coverage levels</h2>
            <p className="section-subtitle">Choose at checkout — applies to that order only.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {tiers.map((t) => (
              <div key={t.name} className="surface-card p-6 text-center">
                <h3 className="text-lg font-bold text-dark mb-1">{t.name}</h3>
                <p className="text-2xl font-bold text-primary-deep mb-4">{t.price}</p>
                <p className="text-sm text-gray mb-1">Up to <strong>{t.perItem}</strong></p>
                <p className="text-sm text-gray">Up to <strong>{t.perOrder}</strong></p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray text-center mt-3">All amounts in AUD. See <Link href="/protection-plan" className="text-primary-deep font-semibold hover:underline">Protection plan</Link> for full details.</p>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="surface-card p-6 sm:p-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-dark mb-4">If something goes wrong</h2>
          <ol className="space-y-3 text-sm text-dark">
            {[
              'Open the affected order from your dashboard within 14 days of delivery.',
              'Tap “Report an issue” and add photos plus a short description.',
              'Our team responds within 2 business days with next steps.',
              'Approved claims are paid back to your original payment method or as account credit.',
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="surface-card p-8 sm:p-10 bg-gradient-to-br from-mint to-white text-center">
          <h2 className="h3 text-dark mb-2">Book with peace of mind</h2>
          <p className="text-gray mb-6 max-w-xl mx-auto">Every order includes basic protection. Add Premium or Premium+ at checkout if you need a higher cap.</p>
          <Link href="/booking" className="btn-primary inline-flex">
            Book a pickup
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
