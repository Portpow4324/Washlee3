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
import PhotoSlot from '@/components/marketing/PhotoSlot'
import PhoneMockup from '@/components/marketing/PhoneMockup'
import { BookingAppScreen, TrackingAppScreen } from '@/components/marketing/AppScreens'
import Reveal from '@/components/marketing/Reveal'

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
    photo: {
      src: '/marketing/step-book.jpg',
      hint: 'Phone in hand booking a pickup, calm Melbourne kitchen.',
    },
    showPhoneMockup: 'booking' as const,
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
    photo: {
      src: '/marketing/pickup-handoff.jpg',
      hint: 'Pro picking up a reusable laundry bag at a Melbourne doorway.',
    },
    showPhoneMockup: 'tracking' as const,
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
    photo: {
      src: '/marketing/step-wash.jpg',
      hint: 'Clean facility wash & fold, warm light, no logos visible.',
    },
    showPhoneMockup: null,
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
    photo: {
      src: '/marketing/step-deliver.jpg',
      hint: 'Pro handing folded laundry bag back at a Melbourne front door.',
    },
    showPhoneMockup: null,
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

      {/* Hero — text + photo split */}
      <section className="relative overflow-hidden bg-soft-hero">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative container-page py-14 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-slide-up">
              <span className="pill mb-4">
                <Sparkles size={14} /> Four simple steps
              </span>
              <h1 className="h1 text-dark text-balance mb-4">How Washlee works</h1>
              <p className="text-lg text-gray leading-relaxed mb-6 max-w-xl">
                From bag at your door to fresh laundry back on the shelf — usually within 24 hours, with no subscription required.
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark mb-8">
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Free pickup &amp; delivery</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Live tracking</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> $7.50/kg standard</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/booking" className="btn-primary shadow-glow">
                  Book a pickup
                  <ArrowRight size={16} />
                </Link>
                <Link href="/pricing" className="btn-outline">
                  See pricing
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <Reveal as="fade" delay={0.05}>
                <PhotoSlot
                  src="/marketing/pickup-handoff.jpg"
                  alt="A Washlee Pro picking up a laundry bag at a Melbourne doorway"
                  aspect="aspect-[4/5]"
                  className="shadow-[0_24px_60px_-20px_rgba(20,32,30,0.25)]"
                  placeholderHint="Front-door pickup handoff with a Washlee bag, Melbourne residential."
                  priority
                  caption="Pickup at the door · usually within your chosen window"
                />
              </Reveal>
              {/* Floating phone mockup */}
              <div className="pointer-events-none absolute -right-4 sm:-right-6 lg:-right-8 -bottom-6 sm:-bottom-8 w-[150px] sm:w-[170px] animate-float-slow">
                <div className="rotate-[-5deg]">
                  <PhoneMockup tone="dark" label="Tracking screen preview">
                    <TrackingAppScreen />
                  </PhoneMockup>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps — alternating image/content layout */}
      <section className="container-page pb-10 sm:pb-16">
        <ol className="space-y-8 sm:space-y-12 mt-8">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.05}>
              <li className="surface-card overflow-hidden card-hover">
                <div className={`grid grid-cols-1 md:grid-cols-12 gap-0 ${i % 2 === 1 ? 'md:[&>*:first-child]:order-last' : ''}`}>
                  {/* Photo side */}
                  <div className="md:col-span-5 relative min-h-[220px] sm:min-h-[260px]">
                    <PhotoSlot
                      src={step.photo.src}
                      alt={`${step.title} — Washlee process step ${i + 1}`}
                      aspect="aspect-[4/3] md:aspect-auto md:h-full"
                      className="md:rounded-none md:border-0 md:h-full md:absolute md:inset-0"
                      placeholderHint={step.photo.hint}
                      sizes="(min-width: 768px) 40vw, 100vw"
                      tone={i % 2 === 0 ? 'mint' : 'warm'}
                      rounded="2xl"
                    />
                    {step.showPhoneMockup && (
                      <div className="hidden md:block pointer-events-none absolute right-3 bottom-3 w-[110px] animate-float">
                        <div className="rotate-[-4deg]">
                          <PhoneMockup tone="dark" label={`${step.showPhoneMockup} preview`}>
                            {step.showPhoneMockup === 'booking' ? <BookingAppScreen /> : <TrackingAppScreen />}
                          </PhoneMockup>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content side */}
                  <div className="md:col-span-7 p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center text-lg shadow-md">
                        {i + 1}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-mint flex items-center justify-center">
                        <step.icon size={18} className="text-primary-deep" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-soft">Step {i + 1}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-dark mb-3">{step.title}</h2>
                    <p className="text-gray text-base leading-relaxed mb-5">{step.body}</p>
                    <ul className="space-y-2.5">
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
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Reassurance */}
      <section className="bg-soft-mint">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">What&rsquo;s included on every order</h2>
              <p className="section-subtitle">Pay-per-order. No tiers, no upsells, no surprise fees.</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reassurances.map((r, i) => (
              <Reveal key={r.title} delay={i * 0.05}>
                <div className="surface-card card-hover p-6 h-full">
                  <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                    <r.icon size={18} className="text-primary-deep" />
                  </div>
                  <h3 className="font-bold text-dark mb-1.5">{r.title}</h3>
                  <p className="text-sm text-gray">{r.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 sm:py-24">
        <Reveal>
          <div className="surface-card overflow-hidden bg-gradient-to-br from-mint to-white">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch">
              <div className="md:col-span-7 p-8 sm:p-12 text-center md:text-left">
                <h2 className="h2 text-dark mb-3">Ready to skip laundry day?</h2>
                <p className="text-gray text-base sm:text-lg mb-6 max-w-xl">
                  Book your first Washlee pickup. $7.50/kg standard, $75 minimum. Free pickup and delivery anywhere in Melbourne.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link href="/booking" className="btn-primary text-base sm:text-lg shadow-glow">
                    Book a pickup
                    <ArrowRight size={18} />
                  </Link>
                  <Link href="/pricing" className="btn-outline text-base sm:text-lg">
                    See pricing
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 min-h-[220px] relative">
                <PhotoSlot
                  src="/marketing/folded-laundry.jpg"
                  alt="Freshly folded laundry stacked on a light timber table"
                  aspect="aspect-[4/3] md:aspect-auto md:h-full"
                  className="md:rounded-l-none md:border-0 md:h-full md:absolute md:inset-0"
                  placeholderHint="Freshly folded clean laundry on a light timber table."
                  tone="mint"
                  hideHint={false}
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
