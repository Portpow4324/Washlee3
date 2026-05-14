'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Heart, Sparkles, Shield, Leaf, MapPin, ArrowRight } from 'lucide-react'

const principles = [
  {
    icon: Heart,
    title: 'Free up your time',
    body: 'Laundry shouldn’t eat your weekend. We handle pickup, washing, and delivery so you can do something better with your hours.',
  },
  {
    icon: Shield,
    title: 'Treat clothes with care',
    body: 'Sorted, washed at the right temperature, and folded the way you asked. Every order includes basic damage protection.',
  },
  {
    icon: Leaf,
    title: 'Gentle by default',
    body: 'Eco-friendly detergent, low-temperature cycles, and air-dry on request. No surprises, no harsh chemicals.',
  },
  {
    icon: Sparkles,
    title: 'Fair pricing, no fluff',
    body: 'Per-kilo pricing — $7.50/kg standard, $12.50/kg express. $75 minimum. Free pickup &amp; delivery, every time.',
  },
]

export default function AboutPage() {
  return (
    <>
      <Header />

      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <MapPin size={14} /> Made in Melbourne
            </span>
            <h1 className="h1 text-dark text-balance mb-4">A simpler way to do laundry.</h1>
            <p className="text-lg text-gray leading-relaxed">
              Washlee is a Melbourne-based laundry pickup and delivery service. We pair you with a vetted local Pro, wash and fold with care, and have your bag back to you — usually next day.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="h2 text-dark mb-4">Why we started</h2>
            <p className="text-gray text-base sm:text-lg mb-4 leading-relaxed">
              Washlee began with a simple frustration: weekends shouldn&rsquo;t be spent watching the dryer. Existing services were either pricey, hard to schedule, or hidden behind subscriptions.
            </p>
            <p className="text-gray text-base sm:text-lg leading-relaxed">
              We built Washlee to be the opposite — pay-per-order, transparent per-kilo pricing, and Pros who actually live near you. Free Wash Club rewards on top, because loyalty shouldn&rsquo;t cost extra.
            </p>
          </div>
          <div className="surface-card p-6 sm:p-8 bg-soft-mint">
            <h3 className="font-bold text-dark text-lg mb-4">What you can count on</h3>
            <ul className="space-y-3 text-sm text-dark">
              {[
                '$7.50/kg standard, $12.50/kg express',
                '$75 minimum order — free pickup &amp; delivery',
                'Wash Club rewards, free to join',
                'Independent Melbourne Pros, paid per order',
                'Damage protection on every order',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ArrowRight size={16} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-soft-mint">
        <div className="container-page py-14 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="section-title">How we work</h2>
            <p className="section-subtitle">Four principles we don&rsquo;t compromise on.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {principles.map((p) => (
              <div key={p.title} className="surface-card p-6">
                <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center mb-4">
                  <p.icon size={20} className="text-primary-deep" />
                </div>
                <h3 className="font-bold text-dark mb-1.5">{p.title}</h3>
                <p
                  className="text-sm text-gray leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: p.body }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="surface-card p-8 sm:p-12 text-center bg-gradient-to-br from-mint to-white">
          <h2 className="h3 text-dark mb-3">Want to be a Washlee Pro?</h2>
          <p className="text-gray text-sm sm:text-base mb-6 max-w-xl mx-auto">
            Independent contractors paid commission per completed order. Set your own hours, work in your suburb, no shifts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pro" className="btn-primary">
              Apply to drive
              <ArrowRight size={16} />
            </Link>
            <Link href="/booking" className="btn-outline">
              Book a pickup instead
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
