'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Heart, Check, AlertCircle, Zap, Shield, ArrowRight, CheckCircle } from 'lucide-react'
import PhotoSlot from '@/components/marketing/PhotoSlot'
import Reveal from '@/components/marketing/Reveal'

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

      <section className="relative overflow-hidden bg-soft-hero">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative container-page py-14 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-slide-up">
              <span className="pill mb-4">
                <Heart size={14} /> Care guarantee
              </span>
              <h1 className="h1 text-dark text-balance mb-4">We treat your clothes like our own.</h1>
              <p className="text-lg text-gray leading-relaxed mb-6 max-w-xl">
                Most loads come back perfect. If something goes wrong, our damage protection makes it right — and you can add extra cover at checkout for delicates or business attire.
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark mb-8">
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Basic cover included</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Premium &amp; Premium+ at checkout</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> 14-day claim window</li>
              </ul>
              <Link href="/booking" className="btn-primary shadow-glow">
                Book a pickup
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="lg:col-span-5">
              <Reveal as="fade" delay={0.05}>
                <PhotoSlot
                  src="/marketing/protection-care.jpg"
                  alt="Folded delicates with care label visible"
                  aspect="aspect-[4/5]"
                  placeholderHint="Folded delicates with care label visible, soft natural light."
                  priority
                  caption="Damage protection on every order · upgrade for delicates"
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="text-center mb-10">
          <Reveal>
            <h2 className="section-title">What&rsquo;s covered</h2>
            <p className="section-subtitle">Real cover for real wear-and-tear scenarios.</p>
          </Reveal>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {coverageGroups.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.05}>
              <div className="surface-card card-hover p-6 h-full">
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
            </Reveal>
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
        <Reveal>
          <div className="surface-card overflow-hidden max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch">
              <div className="md:col-span-7 p-6 sm:p-8">
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
              <div className="md:col-span-5 min-h-[220px] relative">
                <PhotoSlot
                  src="/marketing/protection-handoff.jpg"
                  alt="Pro carefully handing back a wrapped Washlee order"
                  aspect="aspect-[4/3] md:aspect-auto md:h-full"
                  className="md:rounded-l-none md:border-0 md:h-full md:absolute md:inset-0"
                  placeholderHint="Pro carefully handing back a wrapped order at the door."
                  tone="mint"
                />
              </div>
            </div>
          </div>
        </Reveal>
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
