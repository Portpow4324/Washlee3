'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  Calendar,
  Truck,
  Sparkles,
  Package,
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Leaf,
  MapPin,
} from 'lucide-react'

const steps = [
  {
    icon: Calendar,
    title: 'Book a pickup',
    body: 'Open the app or website, choose a pickup window, confirm your address, and add any care notes. Two minutes, tops.',
    bullets: [
      'Pickup windows from this afternoon onward',
      'Detergent, drying, and folding preferences',
      'Special care notes for delicates or business attire',
    ],
  },
  {
    icon: Truck,
    title: 'A Pro collects your bag',
    body: 'A vetted local Washlee Pro arrives in your window. Hand it over at the door, or leave it in your nominated spot.',
    bullets: [
      'Live tracking so you know when they’re close',
      'Contactless pickup if you’d prefer',
      'Bag is weighed at our facility — your final price reflects actual weight',
    ],
  },
  {
    icon: Sparkles,
    title: 'Washed and folded with care',
    body: 'Your laundry is sorted, washed at the right temperature with eco-friendly detergent, dried, and folded the way you asked.',
    bullets: [
      'Sorted by colour and fabric',
      'Hang dry on request — no shrinkage on delicates',
      'Quality-checked before it’s packaged',
    ],
  },
  {
    icon: Package,
    title: 'Delivered back to you',
    body: 'Standard orders come back the next business day by 5pm. Choose Express same-day if you need it back faster.',
    bullets: [
      'Standard: next business day by 5pm',
      'Express: order before noon, back by 7pm same day',
      'Notification when your Pro is on the way back',
    ],
  },
]

const reassurances = [
  { icon: Clock, title: 'Fast turnaround', body: 'Most loads are back the next business day. Same-day Express is available before noon.' },
  { icon: Shield, title: 'Damage protection', body: 'Every order includes basic protection. Upgrade to Premium cover at checkout.' },
  { icon: Leaf, title: 'Gentle by default', body: 'Eco-friendly detergent and low temperatures unless you ask for something different.' },
  { icon: MapPin, title: 'Local Pros', body: 'Your bag is handled by a vetted Washlee Pro from your area, end to end.' },
]

export default function HowItWorksPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <Sparkles size={14} /> Four simple steps
            </span>
            <h1 className="h1 text-dark text-balance mb-4">How Washlee works</h1>
            <p className="text-lg text-gray leading-relaxed">
              From bag at your door to fresh laundry back on the shelf — usually within 24 hours, with no subscription required.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="container-page pb-10 sm:pb-16">
        <ol className="space-y-8 sm:space-y-10">
          {steps.map((step, i) => (
            <li key={step.title} className="surface-card p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-1">
                  <div className="w-12 h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center text-lg">
                    {i + 1}
                  </div>
                </div>
                <div className="md:col-span-11">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-mint flex items-center justify-center">
                      <step.icon size={18} className="text-primary-deep" />
                    </div>
                    <h2 className="text-2xl font-bold text-dark">{step.title}</h2>
                  </div>
                  <p className="text-gray text-base leading-relaxed mb-4">{step.body}</p>
                  <ul className="space-y-2">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-dark">
                        <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Reassurance */}
      <section className="bg-soft-mint">
        <div className="section">
          <div className="text-center mb-10">
            <h2 className="section-title">What&rsquo;s included on every order</h2>
            <p className="section-subtitle">Pay-per-order. No tiers, no upsells, no surprise fees.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reassurances.map((r) => (
              <div key={r.title} className="surface-card p-6">
                <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                  <r.icon size={18} className="text-primary-deep" />
                </div>
                <h3 className="font-bold text-dark mb-1.5">{r.title}</h3>
                <p className="text-sm text-gray">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 sm:py-24">
        <div className="surface-card p-8 sm:p-12 bg-gradient-to-br from-mint to-white text-center">
          <h2 className="h2 text-dark mb-3">Ready to skip laundry day?</h2>
          <p className="text-gray text-base sm:text-lg mb-6 max-w-xl mx-auto">
            Book your first Washlee pickup. $7.50/kg standard, $75 minimum. Free pickup and delivery anywhere in Melbourne.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/booking" className="btn-primary text-base sm:text-lg shadow-glow">
              Book a pickup
              <ArrowRight size={18} />
            </Link>
            <Link href="/pricing" className="btn-outline text-base sm:text-lg">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
