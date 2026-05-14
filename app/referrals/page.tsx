'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight, Gift, Share2, Sparkles, Users } from 'lucide-react'

const steps = [
  {
    icon: Share2,
    title: 'Share Washlee',
    body: 'Send your referral link to friends, housemates, or family in the Melbourne service area.',
  },
  {
    icon: Users,
    title: 'They book a wash',
    body: 'Once their first paid order is completed, the referral can be attributed to your account.',
  },
  {
    icon: Gift,
    title: 'Credit lands later',
    body: 'Referral rewards are not live yet. This page is a launch-ready shell until the reward rules are final.',
  },
]

export default function ReferralsPage() {
  return (
    <>
      <Header />
      <main className="bg-soft-hero">
        <section className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <Sparkles size={14} /> Referrals
            </span>
            <h1 className="h1 text-dark text-balance mb-4">Share Washlee when referrals open.</h1>
            <p className="text-lg text-gray leading-relaxed">
              The referral program is being prepared for launch. For now, keep using Wash Club rewards and book pay-per-order laundry with no paid membership.
            </p>
          </div>
        </section>

        <section className="container-page pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="surface-card p-6">
                  <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                    <Icon size={18} className="text-primary-deep" />
                  </div>
                  <h2 className="font-bold text-dark mb-1.5">{step.title}</h2>
                  <p className="text-sm text-gray leading-relaxed">{step.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="container-page pb-16">
          <div className="surface-card p-8 sm:p-10 bg-gradient-to-br from-mint to-white text-center">
            <h2 className="h3 text-dark mb-2">Want rewards today?</h2>
            <p className="text-gray mb-6 max-w-xl mx-auto">
              Wash Club is free loyalty. Earn points on completed orders and redeem credit when rewards are available.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/wash-club" className="btn-primary">
                View Wash Club
                <ArrowRight size={16} />
              </Link>
              <Link href="/booking" className="btn-outline">
                Book a pickup
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
