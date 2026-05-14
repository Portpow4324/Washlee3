'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  Smartphone,
  MapPin,
  Bell,
  Sparkles,
  Apple,
  Play,
  ArrowRight,
  Gift,
  Clock,
  Star,
  CheckCircle,
  ShieldCheck,
  Wifi,
} from 'lucide-react'
import PhoneMockup from '@/components/marketing/PhoneMockup'
import {
  HomeAppScreen,
  BookingAppScreen,
  TrackingAppScreen,
  RewardsAppScreen,
} from '@/components/marketing/AppScreens'
import Reveal from '@/components/marketing/Reveal'

const features = [
  {
    icon: MapPin,
    title: 'Real-time tracking',
    body: 'Watch your Pro on the way to pickup or delivery, with live ETAs.',
  },
  {
    icon: Sparkles,
    title: 'Book in under a minute',
    body: 'Save your address, default load size, and care notes. Re-book in two taps.',
  },
  {
    icon: Bell,
    title: 'Smart push updates',
    body: 'Quiet by default — pickup confirmed, on the way, delivered. Nothing else.',
  },
  {
    icon: Gift,
    title: 'Wash Club built in',
    body: 'See your points balance, tier progress, and credit anytime. Free loyalty, no fees.',
  },
  {
    icon: Clock,
    title: 'Reschedule on the fly',
    body: 'Move pickup or delivery from your phone — no calls, no chats, no friction.',
  },
  {
    icon: Smartphone,
    title: 'Made for thumbs',
    body: 'Designed mobile-first so big buttons are exactly where you expect them.',
  },
]

const screens = [
  { component: HomeAppScreen, label: 'Home', sub: 'Quick book and recent orders' },
  { component: BookingAppScreen, label: 'Booking', sub: 'Pick a slot and care notes' },
  { component: TrackingAppScreen, label: 'Tracking', sub: 'Live map and ETA' },
  { component: RewardsAppScreen, label: 'Rewards', sub: 'Wash Club tier and perks' },
]

export default function MobileAppPage() {
  return (
    <>
      <Header />

      {/* Hero — dark band, three phone mockups */}
      <section className="relative overflow-hidden bg-dark text-white">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative container-page py-14 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 animate-slide-up">
              <span className="pill bg-white/10 text-white mb-4">
                <Smartphone size={14} /> Washlee mobile app
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-4">
                Laundry, in your pocket.
              </h1>
              <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-md">
                Book a pickup, track your order live, message your Pro, and watch your Wash Club rewards grow — all from one app.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <a
                  href="https://apps.apple.com/app/washlee"
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 text-dark hover:bg-mint transition min-h-[56px]"
                >
                  <Apple size={26} />
                  <span className="text-left">
                    <span className="block text-[10px] uppercase tracking-wider opacity-60">Download on the</span>
                    <span className="block text-base font-bold">App Store</span>
                  </span>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.washlee"
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white/10 border border-white/15 px-5 py-3 text-white hover:bg-white/20 transition min-h-[56px]"
                >
                  <Play size={26} />
                  <span className="text-left">
                    <span className="block text-[10px] uppercase tracking-wider opacity-70">Get it on</span>
                    <span className="block text-base font-bold">Google Play</span>
                  </span>
                </a>
              </div>
              <p className="text-xs text-white/55">Or use Washlee on the web — works great on any browser.</p>

              {/* Trust mini-row */}
              <ul className="mt-8 grid grid-cols-3 gap-3 max-w-md">
                <li className="rounded-xl bg-white/5 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-white">~ 60s</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/55">to book</p>
                </li>
                <li className="rounded-xl bg-white/5 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-white">Next day</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/55">standard</p>
                </li>
                <li className="rounded-xl bg-white/5 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-white">Free</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/55">Wash Club</p>
                </li>
              </ul>
            </div>

            {/* Three phones */}
            <div className="lg:col-span-6">
              <div className="relative flex items-end justify-center gap-3 sm:gap-5 lg:gap-6">
                <Reveal delay={0.05} className="hidden sm:block translate-y-8">
                  <div className="rotate-[-6deg]">
                    <PhoneMockup className="w-[170px]" tone="cream" label="Booking screen">
                      <BookingAppScreen />
                    </PhoneMockup>
                  </div>
                </Reveal>
                <Reveal delay={0.15} className="z-10">
                  <div className="animate-float-slow">
                    <PhoneMockup className="w-[230px] sm:w-[260px]" tone="dark" label="Home screen">
                      <HomeAppScreen />
                    </PhoneMockup>
                  </div>
                </Reveal>
                <Reveal delay={0.25} className="hidden sm:block translate-y-8">
                  <div className="rotate-[6deg]">
                    <PhoneMockup className="w-[170px]" tone="mint" label="Tracking screen">
                      <TrackingAppScreen />
                    </PhoneMockup>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screens at a glance */}
      <section className="bg-soft-mint">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">Screens at a glance</h2>
              <p className="section-subtitle">A peek at the customer app. (CSS previews — real screenshots dropping in soon.)</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {screens.map((s, i) => {
              const Screen = s.component
              return (
                <Reveal key={s.label} delay={i * 0.05}>
                  <div className="flex flex-col items-center text-center">
                    <PhoneMockup className="w-full max-w-[200px]" tone="dark" label={`${s.label} screen`}>
                      <Screen />
                    </PhoneMockup>
                    <p className="mt-4 text-sm font-bold text-dark">{s.label}</p>
                    <p className="text-xs text-gray">{s.sub}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
          <p className="mt-8 text-center text-xs text-gray-soft">
            TODO: replace with real screenshots in <code className="font-mono text-[11px]">/public/marketing/app-screen-*.png</code>.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-white">
        <div className="section">
          <div className="text-center mb-10">
            <Reveal>
              <h2 className="section-title">What you get in the app</h2>
              <p className="section-subtitle">Same backend as the web — picks up where you left off across devices.</p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05}>
                <div className="surface-card card-hover p-6 h-full">
                  <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center mb-4">
                    <f.icon size={20} className="text-primary-deep" />
                  </div>
                  <h3 className="font-bold text-dark mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray leading-relaxed">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why install */}
      <section className="bg-soft-hero">
        <div className="section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <Reveal>
                <h2 className="h2 text-dark mb-4">Why bother installing?</h2>
                <p className="text-gray text-base sm:text-lg leading-relaxed mb-6 max-w-xl">
                  Three things you can&rsquo;t get on the website: live push notifications when your Pro is on the way,
                  one-tap rebook from your home screen, and offline access to recent orders.
                </p>
              </Reveal>
              <ul className="space-y-3 max-w-xl">
                {[
                  { icon: Bell, title: 'Live push, not email pings', body: 'Pickup confirmed, on the way, delivered. Quiet by default.' },
                  { icon: Wifi, title: 'Recent orders cached offline', body: 'Quickly check your last order even on flaky tram Wi-Fi.' },
                  { icon: ShieldCheck, title: 'Biometric login', body: 'Face ID and Android biometrics — no password to mistype.' },
                  { icon: Star, title: 'One-tap rebook', body: 'Swap your last order onto next Tuesday with one button.' },
                ].map((line, i) => (
                  <Reveal key={line.title} delay={0.05 + i * 0.05}>
                    <li className="flex items-start gap-3 surface-card card-hover p-4">
                      <div className="w-9 h-9 rounded-lg bg-mint flex items-center justify-center flex-shrink-0">
                        <line.icon size={16} className="text-primary-deep" />
                      </div>
                      <div>
                        <p className="font-bold text-dark text-sm">{line.title}</p>
                        <p className="text-xs text-gray leading-relaxed mt-0.5">{line.body}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <Reveal delay={0.1}>
                <div className="animate-float">
                  <PhoneMockup className="w-[260px]" tone="dark" label="Rewards screen preview">
                    <RewardsAppScreen />
                  </PhoneMockup>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page pb-16">
        <Reveal>
          <div className="surface-card overflow-hidden bg-gradient-to-br from-mint to-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-8 sm:p-10">
              <div>
                <h2 className="h3 text-dark mb-2">Don&rsquo;t want the app?</h2>
                <p className="text-gray text-sm sm:text-base max-w-md">No worries — Washlee runs in any modern browser, and your account syncs everywhere.</p>
                <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-dark">
                  <li className="flex items-center gap-1.5"><CheckCircle size={14} className="text-primary" /> Same backend</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={14} className="text-primary" /> Same prices</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={14} className="text-primary" /> Same rewards</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={14} className="text-primary" /> No download</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
                <Link href="/booking" className="btn-primary">
                  Book in browser
                  <ArrowRight size={16} />
                </Link>
                <Link href="/how-it-works" className="btn-outline">
                  How it works
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  )
}
