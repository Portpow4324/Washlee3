'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Heart, Sparkles, Shield, Leaf, MapPin, ArrowRight, CheckCircle } from 'lucide-react'
import PhotoSlot from '@/components/marketing/PhotoSlot'
import Reveal from '@/components/marketing/Reveal'

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

      <section className="relative overflow-hidden bg-soft-hero">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative container-page py-14 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-slide-up">
              <span className="pill mb-4">
                <MapPin size={14} /> Made in Melbourne
              </span>
              <h1 className="h1 text-dark text-balance mb-4">A simpler way to do laundry.</h1>
              <p className="text-lg text-gray leading-relaxed mb-6 max-w-xl">
                Washlee is a Melbourne-based laundry pickup and delivery service. We pair you with a vetted local Pro, wash and fold with care, and have your bag back to you — usually next day.
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark mb-6">
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Pay-per-order</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Free pickup &amp; delivery</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Local independent Pros</li>
              </ul>
            </div>

            <div className="lg:col-span-5">
              <Reveal as="fade" delay={0.05}>
                <PhotoSlot
                  src="/marketing/melbourne-service-area.jpg"
                  alt="A Melbourne residential street where Washlee operates"
                  aspect="aspect-[4/5]"
                  placeholderHint="Melbourne street/suburb photo from the Washlee service area."
                  priority
                  caption="Greater Melbourne · pickup &amp; delivery free, every order"
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Why we started + counts */}
      <section className="container-page py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 className="h2 text-dark mb-4">Why we started</h2>
              <p className="text-gray text-base sm:text-lg mb-4 leading-relaxed">
                Washlee began with a simple frustration: weekends shouldn&rsquo;t be spent watching the dryer. Existing services were either pricey, hard to schedule, or hidden behind subscriptions.
              </p>
              <p className="text-gray text-base sm:text-lg leading-relaxed mb-6">
                We built Washlee to be the opposite — pay-per-order, transparent per-kilo pricing, and Pros who actually live near you. Free Wash Club rewards on top, because loyalty shouldn&rsquo;t cost extra.
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <PhotoSlot
                src="/marketing/folded-laundry.jpg"
                alt="Freshly folded clean laundry in a Melbourne home"
                aspect="aspect-[3/2]"
                placeholderHint="Freshly folded clean laundry on a light timber table."
                caption="Folded the way you like · returned next business day"
              />
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start space-y-5">
            <div className="surface-card p-6 sm:p-7 bg-soft-mint">
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

            <Reveal delay={0.05}>
              <PhotoSlot
                src="/marketing/team-founder.jpg"
                alt="Founder portrait"
                aspect="aspect-[1/1]"
                placeholderHint="Founder or team portrait — natural daylight, friendly Melbourne setting."
                rounded="2xl"
                tone="warm"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-soft-mint">
        <div className="container-page py-14 sm:py-20">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">How we work</h2>
              <p className="section-subtitle">Four principles we don&rsquo;t compromise on.</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <div className="surface-card card-hover p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center mb-4">
                    <p.icon size={20} className="text-primary-deep" />
                  </div>
                  <h3 className="font-bold text-dark mb-1.5">{p.title}</h3>
                  <p
                    className="text-sm text-gray leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: p.body }}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Photo strip */}
      <section className="container-page py-14">
        <div className="text-center mb-8">
          <Reveal>
            <h2 className="section-title">A real local service</h2>
            <p className="section-subtitle">Vetted Pros, transparent process, Melbourne-only.</p>
          </Reveal>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { src: '/marketing/pickup-handoff.jpg', label: 'Doorstep pickup', hint: 'Front-door pickup in a Melbourne residential setting.' },
            { src: '/marketing/folded-laundry.jpg', label: 'Folded with care', hint: 'Freshly folded laundry, soft natural light.' },
            { src: '/marketing/pro-delivery.jpg', label: 'Vetted Pros', hint: 'Pro carrying a laundry bag in a Melbourne street.' },
            { src: '/marketing/wash-club-rewards.jpg', label: 'Free rewards', hint: 'Folded laundry next to phone showing rewards screen.' },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 0.05}>
              <PhotoSlot
                src={item.src}
                alt={item.label}
                aspect="aspect-[3/4]"
                placeholderHint={item.hint}
                caption={item.label}
                rounded="2xl"
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <Reveal>
          <div className="surface-card overflow-hidden bg-gradient-to-br from-mint to-white">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch">
              <div className="md:col-span-7 p-8 sm:p-12 text-center md:text-left">
                <h2 className="h3 text-dark mb-3">Want to be a Washlee Pro?</h2>
                <p className="text-gray text-sm sm:text-base mb-6 max-w-xl">
                  Independent contractors paid commission per completed order. Set your own hours, work in your suburb, no shifts.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link href="/pro" className="btn-primary">
                    Apply to drive
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/booking" className="btn-outline">
                    Book a pickup instead
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 min-h-[220px] relative">
                <PhotoSlot
                  src="/marketing/pro-driving.jpg"
                  alt="Washlee Pro loading a laundry bag into a car"
                  aspect="aspect-[4/3] md:aspect-auto md:h-full"
                  className="md:rounded-l-none md:border-0 md:h-full md:absolute md:inset-0"
                  placeholderHint="Pro loading a laundry bag into a car, Melbourne street."
                  tone="warm"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  )
}
