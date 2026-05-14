'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Briefcase, Users, Heart, Zap, MapPin, Mail, Sparkles, ArrowRight, Sun } from 'lucide-react'

const openPositions = [
  {
    title: 'Senior Full-Stack Engineer',
    location: 'Melbourne / Remote (AU)',
    type: 'Full-time',
    description:
      'Help shape the next chapter of the Washlee app and website. Strong TypeScript, React, and Postgres experience.',
  },
  {
    title: 'Operations Lead — Melbourne',
    location: 'Melbourne, VIC',
    type: 'Full-time',
    description:
      'Run the day-to-day across our Melbourne facility and Pro network. Logistics, scheduling, and quality.',
  },
  {
    title: 'Customer Support Specialist',
    location: 'Melbourne / Remote (AU)',
    type: 'Full-time',
    description:
      'Be the friendly, helpful voice of Washlee. Email-first with some occasional in-app chat.',
  },
  {
    title: 'Mobile Engineer (Flutter)',
    location: 'Remote (AU)',
    type: 'Full-time',
    description:
      'Build delightful experiences on iOS and Android for both customers and Pros. Flutter and Dart experience required.',
  },
  {
    title: 'Brand &amp; Marketing Lead',
    location: 'Melbourne / Hybrid',
    type: 'Full-time',
    description:
      'Own the Washlee brand and growth across paid, organic, and partnerships in Australia.',
  },
]

const whyJoinUs = [
  {
    icon: Heart,
    title: 'Mission you can feel',
    body: 'You give people back their evenings and weekends. Real impact, every order.',
  },
  {
    icon: Users,
    title: 'Small, sharp team',
    body: 'Work directly with founders and engineers. Decisions fast, ownership real.',
  },
  {
    icon: Zap,
    title: 'Build &amp; ship',
    body: 'We move quickly, iterate openly, and ship things customers actually use.',
  },
  {
    icon: Sparkles,
    title: 'Fair, honest pay',
    body: 'Market-rate compensation with stock options for full-time roles.',
  },
]

const benefits = [
  { emoji: '🩺', title: 'Private health support', body: 'Allowance toward private cover' },
  { emoji: '🌴', title: 'Generous leave', body: 'Standard AU leave + extra mental-health days' },
  { emoji: '💻', title: 'Remote-friendly', body: 'Most roles remote across Australia' },
  { emoji: '🌱', title: 'Super + bonus', body: 'AU superannuation, performance bonus on FT roles' },
  { emoji: '📚', title: 'Learning budget', body: 'Annual budget for courses, books, or conferences' },
  { emoji: '☕', title: 'Team time', body: 'Regular Melbourne meetups for the whole team' },
]

export default function CareersPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <Sun size={14} /> Hiring across Australia
            </span>
            <h1 className="h1 text-dark text-balance mb-4">Build Washlee with us.</h1>
            <p className="text-lg text-gray leading-relaxed">
              We&rsquo;re a small team building the easiest way to get laundry done in Melbourne. If that sounds
              like fun, we&rsquo;d love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="container-page py-14">
        <div className="text-center mb-10">
          <h2 className="section-title">Why Washlee</h2>
          <p className="section-subtitle">Small team, big mission. Honest work, honest comp.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {whyJoinUs.map((item) => (
            <div key={item.title} className="surface-card p-6">
              <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                <item.icon size={18} className="text-primary-deep" />
              </div>
              <h3 className="font-bold text-dark mb-1.5">{item.title}</h3>
              <p className="text-sm text-gray leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="text-center mb-10">
            <h2 className="section-title">What we offer</h2>
            <p className="section-subtitle">All amounts in AUD. Roles based in Australia.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {benefits.map((b) => (
              <div key={b.title} className="surface-card p-5 text-center">
                <div className="text-2xl mb-2" aria-hidden="true">{b.emoji}</div>
                <p className="font-semibold text-dark text-sm">{b.title}</p>
                <p className="text-xs text-gray mt-1">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Positions */}
      <section className="container-page py-14">
        <div className="text-center mb-10">
          <h2 className="section-title">Open roles</h2>
          <p className="section-subtitle">Don&rsquo;t see a fit? Send us a note anyway — we keep an eye out.</p>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          {openPositions.map((position) => (
            <article key={position.title} className="surface-card p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-dark">{position.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} className="text-primary-deep" /> {position.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase size={14} className="text-primary-deep" /> {position.type}
                    </span>
                  </div>
                </div>
                <a
                  href={`mailto:careers@washlee.com.au?subject=${encodeURIComponent(`Application: ${position.title}`)}`}
                  className="btn-outline text-sm self-start"
                >
                  Apply
                  <ArrowRight size={14} />
                </a>
              </div>
              <p className="text-sm text-gray leading-relaxed">{position.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 surface-card p-8 sm:p-10 text-center bg-gradient-to-br from-mint to-white">
          <h3 className="text-2xl font-bold text-dark mb-2">Don&rsquo;t see your role?</h3>
          <p className="text-gray mb-5 max-w-xl mx-auto text-sm sm:text-base">
            We&rsquo;re always interested in great people. Send a note about what you&rsquo;d like to do and a link to anything you&rsquo;ve made.
          </p>
          <Link
            href="mailto:careers@washlee.com.au?subject=General%20application"
            className="btn-primary inline-flex"
          >
            <Mail size={16} />
            careers@washlee.com.au
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
