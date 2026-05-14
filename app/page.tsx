'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Calendar,
  Truck,
  Sparkles,
  Package,
  Shield,
  Leaf,
  CheckCircle,
  MapPin,
  Clock,
  Gift,
  Star,
  Apple,
  Play,
  Smartphone,
} from 'lucide-react'
import PhoneMockup from '@/components/marketing/PhoneMockup'
import { HomeAppScreen, RewardsAppScreen, TrackingAppScreen } from '@/components/marketing/AppScreens'
import Reveal from '@/components/marketing/Reveal'
import PlaceholderReviews from '@/components/marketing/PlaceholderReviews'

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero — layered visual with phone mockup + photo placeholder */}
      <section className="relative overflow-hidden bg-soft-hero">
        {/* Decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative container-page py-14 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-slide-up">
              <span className="pill mb-5">
                <MapPin size={14} /> Now serving Melbourne
              </span>
              <h1 className="h1 text-dark text-balance mb-5">
                Laundry, picked up and delivered.
                <br />
                <span className="text-primary">Booked in under a minute.</span>
              </h1>
              <p className="text-lg text-gray max-w-xl mb-8 leading-relaxed">
                Tell us when. A Washlee Pro picks up your bag, washes and folds it the way you like, and drops it back fresh — usually next day.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/booking" className="btn-primary text-base sm:text-lg shadow-glow">
                  Book a pickup
                  <ArrowRight size={18} />
                </Link>
                <Link href="/how-it-works" className="btn-outline text-base sm:text-lg">
                  How it works
                </Link>
              </div>

              <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray">
                <li className="inline-flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" /> Free pickup &amp; delivery
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" /> $7.50/kg standard
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" /> Pay per order, no subscription
                </li>
              </ul>
            </div>

            {/* Visual stack: photo card + floating phone mockup + estimate ribbon */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto w-full max-w-[460px]">
                {/* Photo card — falls back to gradient if /marketing/hero-laundry-pickup.jpg is missing */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-line shadow-[0_24px_60px_-20px_rgba(20,32,30,0.25)] bg-photo-fallback animate-slide-up">
                  {/* TODO: replace with real photo at /public/marketing/hero-laundry-pickup.jpg */}
                  <Image
                    src="/marketing/hero-laundry-pickup.jpg"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 460px, 100vw"
                    className="object-cover"
                    priority
                    onError={(e) => {
                      // hide broken img → gradient fallback shows
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                  {/* Gradient overlay for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-dark/0 to-dark/0" />
                  {/* Floating tag */}
                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-dark shadow-md backdrop-blur">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                    Pickup confirmed · Carlton
                  </div>
                  <div className="absolute left-4 right-4 bottom-4 rounded-2xl bg-white/95 p-4 shadow-md backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-deep">Estimate</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-lg font-bold text-dark">Standard wash &amp; fold</p>
                      <p className="text-2xl font-bold text-primary">$7.50<span className="text-sm font-medium text-gray">/kg</span></p>
                    </div>
                    <p className="text-xs text-gray">Delivered next business day · $75 minimum</p>
                  </div>
                </div>

                {/* Floating phone mockup overlapping the photo */}
                <div className="pointer-events-none absolute -right-6 -bottom-10 sm:-right-8 sm:-bottom-12 lg:-right-12 lg:-bottom-16 w-[180px] sm:w-[210px] animate-float-slow">
                  <div className="rotate-[-6deg]">
                    <PhoneMockup tone="dark" label="Washlee app home screen">
                      <HomeAppScreen />
                    </PhoneMockup>
                  </div>
                </div>

                {/* Floating Pro avatar chip */}
                <div className="absolute -left-3 sm:-left-6 top-1/3 hidden sm:flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg ring-1 ring-line animate-float">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-primary-deep text-xs font-bold">JM</span>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-dark leading-tight">James M.</p>
                    <p className="text-[10px] text-gray leading-tight">Your Pro · 4 min away</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App preview strip — three CSS mockups, scroll reveal */}
      <section className="relative overflow-hidden bg-dark text-white">
        <div aria-hidden className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative container-page py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <Reveal>
                <span className="pill bg-white/10 text-white mb-4">
                  <Smartphone size={14} /> Washlee app
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  The whole service, in your pocket.
                </h2>
                <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-6 max-w-md">
                  Book a pickup, watch your Pro arrive in real time, and track Wash Club rewards — all from one app.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="https://apps.apple.com/app/washlee" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-dark hover:bg-mint transition min-h-[48px]">
                    <Apple size={18} /> App Store
                  </a>
                  <a href="https://play.google.com/store/apps/details?id=com.washlee" className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 transition min-h-[48px] border border-white/15">
                    <Play size={18} /> Google Play
                  </a>
                </div>
                <p className="mt-3 text-xs text-white/60">Or skip the install — Washlee runs in any browser.</p>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <div className="relative flex items-end justify-center gap-4 sm:gap-6">
                <Reveal delay={0.05} className="hidden sm:block translate-y-6">
                  <div className="rotate-[-4deg]">
                    <PhoneMockup className="w-[180px]" tone="mint" label="Washlee app rewards screen">
                      <RewardsAppScreen />
                    </PhoneMockup>
                  </div>
                </Reveal>
                <Reveal delay={0.15} className="z-10">
                  <PhoneMockup className="w-[220px] sm:w-[240px]" tone="dark" label="Washlee app home screen">
                    <HomeAppScreen />
                  </PhoneMockup>
                </Reveal>
                <Reveal delay={0.25} className="hidden sm:block translate-y-6">
                  <div className="rotate-[4deg]">
                    <PhoneMockup className="w-[180px]" tone="cream" label="Washlee app tracking screen">
                      <TrackingAppScreen />
                    </PhoneMockup>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section bg-white">
        <div className="text-center mb-12">
          <Reveal>
            <h2 className="section-title text-balance">Four steps. That&rsquo;s it.</h2>
            <p className="section-subtitle">From bag at the door to fresh laundry back — usually within 24 hours.</p>
          </Reveal>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Calendar, title: 'Book a pickup', body: 'Pick a window, address, and any special care notes.' },
            { icon: Truck, title: 'We collect', body: 'A Washlee Pro picks up your bag at the agreed time.' },
            { icon: Sparkles, title: 'Washed with care', body: 'Sorted, washed, dried, and folded the way you like.' },
            { icon: Package, title: 'Delivered back', body: 'Returned next business day — or same day with Express.' },
          ].map((step, i) => (
            <Reveal key={step.title} delay={i * 0.06}>
              <li className="surface-card card-hover p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center">
                    <step.icon size={18} className="text-primary-deep" />
                  </div>
                  <span className="text-xs font-bold text-gray-soft">STEP {i + 1}</span>
                </div>
                <h3 className="font-bold text-dark mb-1.5">{step.title}</h3>
                <p className="text-sm text-gray leading-relaxed">{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>

        <div className="mt-10 flex justify-center">
          <Link href="/how-it-works" className="btn-outline">
            Learn more about how it works
          </Link>
        </div>
      </section>

      {/* Trust strip with photo placeholders */}
      <section className="bg-soft-mint">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">A real local service.</h2>
              <p className="section-subtitle">Not a marketplace. Not a faceless dispatch. Vetted Pros, transparent pricing, Melbourne-only.</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { src: '/marketing/folded-laundry.jpg', label: 'Folded the way you like' },
              { src: '/marketing/pickup-handoff.jpg', label: 'Front-door pickup' },
              { src: '/marketing/pro-delivery.jpg', label: 'Vetted Melbourne Pros' },
              { src: '/marketing/wash-club-rewards.jpg', label: 'Free Wash Club rewards' },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 0.05}>
                <figure className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-photo-fallback">
                  {/* TODO: replace src with real Washlee photo */}
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 280px, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement
                      t.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/10 to-transparent" />
                  <figcaption className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-semibold opacity-90">{item.label}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Washlee */}
      <section className="bg-white">
        <div className="section">
          <div className="text-center mb-12">
            <Reveal>
              <h2 className="section-title">Built for busy Melbourne homes</h2>
              <p className="section-subtitle">No subscription required. No surprise fees. Real local Pros.</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Clock, title: 'Same-day Express', body: 'Order before noon for delivery the same evening — perfect for last-minute kits and uniforms.' },
              { icon: Shield, title: 'Damage protection', body: 'Every order includes basic protection. Add Premium cover at checkout if you need more.' },
              { icon: Leaf, title: 'Gentle by default', body: 'Eco-friendly detergent and low-temperature cycles unless you ask for something else.' },
              { icon: Gift, title: 'Free Wash Club', body: 'Earn points on every order and unlock perks. No paid membership — ever.' },
              { icon: MapPin, title: 'Local Pros', body: 'A vetted Washlee Pro handles your bag end-to-end. You can see who’s arriving.' },
              { icon: Star, title: 'Per-kilo, transparent', body: '$7.50/kg standard, $12.50/kg Express. $75 minimum. That’s it — no per-item upsells.' },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <div className="surface-card card-hover p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center mb-4">
                    <item.icon size={20} className="text-primary-deep" />
                  </div>
                  <h3 className="font-bold text-dark mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray leading-relaxed">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Wash Club teaser */}
      <section className="section">
        <Reveal>
          <div className="surface-card overflow-hidden bg-gradient-to-br from-mint to-white">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-8 sm:p-12">
              <div className="md:col-span-7">
                <span className="pill mb-4">
                  <Gift size={14} /> Wash Club rewards
                </span>
                <h2 className="h2 text-dark mb-4">Free loyalty. Real perks.</h2>
                <p className="text-gray text-base sm:text-lg leading-relaxed mb-6 max-w-xl">
                  Every dollar you spend earns points. Tier up automatically as you wash more — Bronze starts free, no fees ever.
                </p>
                <ul className="grid sm:grid-cols-2 gap-2 mb-6">
                  {[
                    '1 point earned on every $1 spent',
                    'Tiers unlock by spend, not subscription',
                    'Birthday bonuses and members-only perks',
                    'Redeem for credit on any future order',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-dark">{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/wash-club" className="btn-primary">
                    Join Wash Club
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/booking" className="btn-outline">
                    Book a pickup
                  </Link>
                </div>
              </div>
              <div className="md:col-span-5 flex justify-center">
                <PhoneMockup className="w-[200px]" tone="dark" label="Wash Club rewards preview">
                  <RewardsAppScreen />
                </PhoneMockup>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <PlaceholderReviews className="bg-white pt-0" />

      {/* CTA */}
      <section className="bg-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
        </div>
        <div className="relative container-page py-16 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 text-balance">
            Skip laundry day for good.
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Book your first Washlee pickup in under a minute. No subscription, no card required to browse.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/booking" className="btn-primary text-base sm:text-lg shadow-glow">
              Book a pickup
              <ArrowRight size={18} />
            </Link>
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white border border-white/20 hover:bg-white/10 transition min-h-[48px]">
              Create account
            </Link>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-white/60 text-xs">
            <span>Or grab the Washlee app</span>
            <div className="flex gap-3">
              <a href="https://apps.apple.com/app/washlee" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20 transition">
                <Apple size={14} /> iOS
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.washlee" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20 transition">
                <Play size={14} /> Android
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
