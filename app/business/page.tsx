'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Coffee,
  Dumbbell,
  Scissors,
  Briefcase,
  Home,
  CalendarClock,
  Truck,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle,
  MapPin,
  Quote,
} from 'lucide-react'
import PhotoSlot from '@/components/marketing/PhotoSlot'
import Reveal from '@/components/marketing/Reveal'
import BusinessQuoteFunnel from '@/components/marketing/BusinessQuoteFunnel'

const audience = [
  { icon: Coffee, title: 'Cafés & restaurants', body: 'Tea towels, aprons, napkins, and bar towels washed on a schedule that fits service.' },
  { icon: Building2, title: 'Bakeries', body: 'Daily aprons, cloths, and tea towels kept clean for early starts and long shifts.' },
  { icon: Scissors, title: 'Salons & beauty', body: 'Fresh salon towels and capes, turned around so you never run short mid-day.' },
  { icon: Dumbbell, title: 'Gyms & studios', body: 'Member and class towels collected and returned on a recurring rhythm.' },
  { icon: Briefcase, title: 'Offices & workplaces', body: 'Kitchen cloths, hand towels, and team uniforms handled without an in-house laundry.' },
  { icon: Home, title: 'Short-stay & Airbnb', body: 'Towels and everyday linens for short-stay operators across the service area.' },
]

const items = [
  'Tea towels',
  'Aprons',
  'Uniforms',
  'Bar towels',
  'Hand towels',
  'Salon / gym towels',
]

const steps = [
  {
    icon: CalendarClock,
    title: 'Set your schedule',
    body: 'Pick weekly, twice weekly, three times weekly, or daily high-volume pickups — whatever your venue runs through.',
  },
  {
    icon: Truck,
    title: 'We collect on the day',
    body: 'A Washlee Pro collects your bins or bags in your chosen window. Hand over at the counter or a nominated spot.',
  },
  {
    icon: Sparkles,
    title: 'Washed to a hygiene standard',
    body: 'Sorted, washed at the right temperature, dried, and folded — ready for the floor.',
  },
  {
    icon: PackageCheck,
    title: 'Delivered back, ready to use',
    body: 'Clean laundry returned on schedule so your team always has what it needs.',
  },
]

const trust = [
  { icon: ShieldCheck, title: 'Hygiene-minded washing', body: 'Appropriate temperatures and cycles for hospitality and venue laundry, with eco detergent by default.' },
  { icon: Clock, title: 'Reliable recurring pickup', body: 'A set rhythm you can plan around — same window, same process, every cycle.' },
  { icon: MapPin, title: 'Melbourne-first Pros', body: 'Vetted local Washlee Pros handle collection and delivery across the service area.' },
  { icon: CheckCircle, title: 'Clear, quote-based pricing', body: 'Business pricing is scoped to your volume and frequency — no guesswork, no surprise fees.' },
]

const faqs = [
  {
    q: 'How is business pricing worked out?',
    a: 'Business laundry is quote-based — we scope a price around your item types, volume, and pickup frequency. It is separate from consumer pricing ($7.50/kg standard, $12.50/kg express, $75 minimum), which stays as-is for individual customers.',
  },
  {
    q: 'Do you supply the towels and linen?',
    a: 'Not yet. Washlee Business Laundry is customer-owned laundry — we collect, wash, and return your own tea towels, aprons, uniforms, and towels. Linen rental and exchange is something we may add later.',
  },
  {
    q: 'Which areas do you cover?',
    a: 'Greater Melbourne, suburb by suburb. Use the area check on this page — if we cover you, request a quote; if not, join the business waitlist.',
  },
  {
    q: 'How often can you pick up?',
    a: 'Weekly, twice weekly, three times weekly, or daily for high-volume venues. We set a recurring window that fits your trading hours.',
  },
  {
    q: 'Is this a subscription or Wash Club?',
    a: 'No. Business Laundry is a recurring service quoted for your venue — it is not a paid subscription, and it is separate from Wash Club, which remains free loyalty for individual customers.',
  },
  {
    q: 'Can we start small?',
    a: 'Yes. Many venues start with one weekly pickup and adjust frequency once the rhythm is working.',
  },
]

export default function BusinessLaundryPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-soft-hero">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative container-page py-14 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-slide-up">
              <span className="pill mb-4">
                <Building2 size={14} /> Washlee for business
              </span>
              <h1 className="h1 text-dark text-balance mb-4">
                Business laundry for Melbourne teams.
              </h1>
              <p className="text-lg text-gray leading-relaxed mb-6 max-w-xl">
                Recurring pickup and delivery for tea towels, aprons, uniforms, towels, and everyday
                business laundry — washed on a schedule, returned ready to use.
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark mb-8">
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Quote-based pricing</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Recurring pickup</li>
                <li className="inline-flex items-center gap-2"><MapPin size={16} className="text-primary" /> Greater Melbourne</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#quote" className="btn-primary shadow-glow">
                  Check your area
                  <ArrowRight size={16} />
                </a>
                <a href="#quote" className="btn-outline">
                  Request a quote
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <Reveal as="fade" delay={0.05}>
                <PhotoSlot
                  src="/marketing/business-cafe.jpg"
                  alt="A Melbourne café counter with fresh tea towels and aprons"
                  aspect="aspect-[4/5]"
                  placeholderHint="Melbourne café or venue with fresh tea towels / aprons, warm daylight."
                  priority
                  caption="Recurring pickup for cafés, salons, gyms &amp; local teams"
                />
              </Reveal>
              <div className="absolute -bottom-6 -left-3 sm:-left-6 lg:-left-10 w-[220px] sm:w-[250px] surface-card p-4 sm:p-5 bg-white shadow-lg ring-1 ring-line">
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary-deep mb-2">Recurring rhythm</p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center justify-between"><span className="text-gray">Frequency</span><span className="font-bold text-dark">Weekly → daily</span></li>
                  <li className="flex items-center justify-between"><span className="text-gray">Laundry</span><span className="font-bold text-dark">Customer-owned</span></li>
                  <li className="flex items-center justify-between"><span className="text-gray">Pricing</span><span className="font-bold text-dark">Quote-based</span></li>
                  <li className="flex items-center justify-between"><span className="text-gray">Area</span><span className="font-bold text-primary-deep">Melbourne</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-white">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">Who it&rsquo;s for</h2>
              <p className="section-subtitle">Built for Melbourne venues and teams with laundry that comes around every week.</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {audience.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.05}>
                <div className="surface-card card-hover p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center mb-4">
                    <a.icon size={20} className="text-primary-deep" />
                  </div>
                  <h3 className="font-bold text-dark mb-1.5">{a.title}</h3>
                  <p className="text-sm text-gray leading-relaxed">{a.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What we wash */}
      <section className="bg-soft-mint">
        <div className="section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <PhotoSlot
                  src="/marketing/business-folded-towels.jpg"
                  alt="Stacks of freshly folded café tea towels and aprons"
                  aspect="aspect-[4/3]"
                  placeholderHint="Stacks of folded tea towels / aprons / bar towels, clean and bright."
                  caption="Customer-owned laundry, washed and folded on schedule"
                />
              </Reveal>
            </div>
            <div className="lg:col-span-6">
              <Reveal as="fade" delay={0.05}>
                <h2 className="h2 text-dark mb-3">What we wash</h2>
                <p className="text-gray text-base sm:text-lg leading-relaxed mb-6 max-w-xl">
                  The everyday laundry your venue runs through — collected, washed to a hygiene standard,
                  and returned folded and ready for the floor.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 surface-card card-hover p-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint flex-shrink-0">
                        <CheckCircle size={14} className="text-primary-deep" />
                      </span>
                      <span className="text-sm font-semibold text-dark">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-2xl border border-dashed border-primary/40 bg-mint/40 p-4">
                  <p className="text-sm text-dark">
                    <span className="font-bold">Customer-owned laundry first.</span> Washlee collects and
                    returns your own items. Linen rental and exchange isn&rsquo;t offered yet — it may come later.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* How recurring pickup works */}
      <section className="bg-white">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">How recurring pickup works</h2>
              <p className="section-subtitle">A set rhythm your team can plan around.</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <div className="surface-card card-hover p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center shadow-md">
                      {i + 1}
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-mint flex items-center justify-center">
                      <step.icon size={17} className="text-primary-deep" />
                    </div>
                  </div>
                  <h3 className="font-bold text-dark mb-1.5">{step.title}</h3>
                  <p className="text-sm text-gray leading-relaxed">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Process photo strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { src: '/marketing/business-pickup-bins.jpg', label: 'Collected', hint: 'Pickup bins / bags of venue laundry at a café back door.' },
              { src: '/marketing/business-aprons.jpg', label: 'Washed & folded', hint: 'Folded aprons and tea towels, clean and bright.' },
              { src: '/marketing/business-handoff.jpg', label: 'Delivered back', hint: 'Pro returning clean folded laundry to a Melbourne venue.' },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 0.06}>
                <PhotoSlot
                  src={item.src}
                  alt={`${item.label} — Washlee business laundry`}
                  aspect="aspect-[4/3]"
                  placeholderHint={item.hint}
                  caption={item.label}
                  tone={i === 1 ? 'warm' : 'mint'}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Funnel */}
      <section id="quote" className="bg-soft-hero scroll-mt-20">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <span className="pill mb-3">
                <MapPin size={14} /> Service area check
              </span>
              <h2 className="section-title">Check your area, then request a quote</h2>
              <p className="section-subtitle">
                Start with your suburb or postcode. If we cover you, you&rsquo;ll get the full quote form.
              </p>
            </Reveal>
          </div>
          <div className="max-w-2xl mx-auto">
            <BusinessQuoteFunnel />
          </div>
        </div>
      </section>

      {/* Hygiene / reliability trust */}
      <section className="bg-white">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">Hygiene and reliability</h2>
              <p className="section-subtitle">What your venue can count on, every cycle.</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trust.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.05}>
                <div className="surface-card card-hover p-6 h-full">
                  <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                    <t.icon size={18} className="text-primary-deep" />
                  </div>
                  <h3 className="font-bold text-dark mb-1.5">{t.title}</h3>
                  <p className="text-sm text-gray leading-relaxed">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Placeholder example note — clearly marked, no fake proof */}
          <Reveal>
            <figure className="surface-card p-6 sm:p-8 mt-8 max-w-3xl mx-auto border-amber-200 bg-amber-50/40">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Example content
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">
                  Not a real customer
                </span>
              </div>
              <Quote size={18} className="text-primary-deep mb-2" />
              <blockquote className="text-dark text-base leading-relaxed">
                Example placeholder: &ldquo;A recurring pickup means our team never runs short on clean
                tea towels mid-service.&rdquo; — sample copy for layout only.
              </blockquote>
              <figcaption className="mt-3 text-xs text-amber-900">
                Placeholder example. Replace with a verified business reference before launch, or remove this block.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-soft-mint">
        <div className="section">
          <div className="container-narrow">
            <div className="text-center mb-10">
              <Reveal>
                <h2 className="section-title">Business laundry FAQ</h2>
                <p className="section-subtitle">The basics, answered.</p>
              </Reveal>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <Reveal key={faq.q}>
                  <details className="group surface-card card-hover overflow-hidden">
                    <summary className="flex items-center justify-between cursor-pointer list-none p-5 sm:p-6">
                      <span className="font-semibold text-dark pr-4">{faq.q}</span>
                      <span className="text-primary-deep transition group-open:rotate-180 text-lg" aria-hidden>⌄</span>
                    </summary>
                    <p className="px-5 pb-5 sm:px-6 sm:pb-6 -mt-1 text-sm text-gray leading-relaxed">{faq.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page py-16">
        <Reveal>
          <div className="surface-card overflow-hidden bg-gradient-to-br from-primary to-accent text-white">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch">
              <div className="md:col-span-7 p-8 sm:p-12 text-center md:text-left">
                <h2 className="text-3xl sm:text-4xl font-bold mb-3">Ready for a business quote?</h2>
                <p className="text-white/90 mb-6 max-w-md">
                  Check your area and tell us what you need washed. We&rsquo;ll come back with pricing scoped to your venue.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <a
                    href="#quote"
                    className="inline-flex items-center justify-center gap-2 bg-white text-primary-deep font-bold px-6 py-3 rounded-full hover:shadow-lg transition min-h-[48px]"
                  >
                    Check your area
                    <ArrowRight size={16} />
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white border border-white/30 hover:bg-white/10 transition min-h-[48px]"
                  >
                    Contact support
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 min-h-[200px] relative">
                <PhotoSlot
                  src="/marketing/business-melbourne.jpg"
                  alt="A local Melbourne business street"
                  aspect="aspect-[4/3] md:aspect-auto md:h-full"
                  className="md:rounded-l-none md:border-0 md:h-full md:absolute md:inset-0"
                  placeholderHint="Local Melbourne business street — cafés / shopfronts, daylight."
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
