'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState } from 'react'
import {
  Smartphone,
  BookOpen,
  MessageSquare,
  DollarSign,
  Clock,
  Shield,
  MapPin,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'

const supportTopics = [
  {
    icon: Smartphone,
    title: 'Pro app guide',
    description: 'How to use the Pro app — accept jobs, manage your day, and track payouts.',
    articles: [
      'Getting started with the Pro app',
      'Accepting and managing jobs',
      'Communication with customers',
      'Navigation and pickup notes',
    ],
  },
  {
    icon: DollarSign,
    title: 'Earnings & payouts',
    description: 'How commission per order works, and when money lands in your bank account.',
    articles: [
      'How earnings are calculated',
      'View your earnings report',
      'Weekly payout schedule (AU bank)',
      'Tax: ABN, GST, and BAS basics',
    ],
  },
  {
    icon: Shield,
    title: 'Safety & guidelines',
    description: 'How to keep yourself, customer items, and the platform safe.',
    articles: [
      'Pro code of conduct',
      'Safety protocols on pickup and delivery',
      'Reporting an incident',
      'Customer communication best practices',
    ],
  },
  {
    icon: Clock,
    title: 'Availability',
    description: 'How to control which jobs you see, and when.',
    articles: [
      'Setting your availability',
      'Blocking out time',
      'Service area preferences',
      'Going on a break',
    ],
  },
  {
    icon: MapPin,
    title: 'Service area',
    description: 'Where Washlee operates today and what&rsquo;s coming next.',
    articles: [
      'Greater Melbourne coverage',
      'Suburb expansions',
      'Pickup &amp; delivery windows',
      'Express same-day eligibility',
    ],
  },
  {
    icon: BookOpen,
    title: 'Training & resources',
    description: 'Care basics, customer service standards, and quality checklists.',
    articles: [
      'Laundry care training',
      'Handling delicates and special items',
      'Quality checklist before delivery',
      'Common customer questions',
    ],
  },
]

const proFaqs = [
  {
    question: 'What are the requirements to become a Washlee Pro?',
    answer:
      'You must be at least 18, have the right to work in Australia, hold a valid Australian driver licence with a reliable vehicle, run your own ABN, pass an ID and national police check, and have a smartphone with the Pro app installed.',
  },
  {
    question: 'How does pay work?',
    answer:
      'You&rsquo;re paid commission per completed order — there&rsquo;s no hourly rate, salary, or wage. Each order shows the payout amount before you accept it. Larger or further jobs pay more, and you keep 100% of any tips.',
  },
  {
    question: 'When are payouts?',
    answer:
      'Weekly. Earnings from Monday to Sunday are paid out the following Monday into the Australian bank account on your profile.',
  },
  {
    question: 'What equipment do I need?',
    answer:
      'Your own vehicle, smartphone, and mobile data. Washlee provides access to partner laundry facilities and pickup/delivery materials. You manage your own fuel, vehicle, and insurance.',
  },
  {
    question: 'Do I need my own laundry facility?',
    answer:
      'No. We partner with commercial laundry facilities across Melbourne. You pick up the bag, process at a partner facility, then deliver it back.',
  },
  {
    question: 'What if there&rsquo;s a problem with a customer?',
    answer:
      'Use the in-app message thread on the order — both you and our support team can see it. We&rsquo;ll step in if it needs escalating, and we always prioritise your safety.',
  },
  {
    question: 'How do ratings work?',
    answer:
      'Customers can rate orders from 1 to 5 stars. Higher ratings unlock more visibility for future orders. Quality, on-time delivery, and clear communication are the biggest drivers.',
  },
  {
    question: 'Can I lose my account?',
    answer:
      'Repeated quality issues, missed jobs, or breaches of our code of conduct can lead to deactivation. We always reach out first and give you a chance to fix things.',
  },
]

export default function ProSupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)

  return (
    <>
      <Header />

      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <HelpCircle size={14} /> Pro support
            </span>
            <h1 className="h1 text-dark text-balance mb-4">Help for Washlee Pros.</h1>
            <p className="text-lg text-gray leading-relaxed">
              Guides, payout details, and answers to the things our Melbourne Pros ask most.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="text-center mb-10">
          <h2 className="section-title">Resources</h2>
          <p className="section-subtitle">Pick a topic to dig in.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportTopics.map((topic) => {
            const Icon = topic.icon
            return (
              <div key={topic.title} className="surface-card p-6">
                <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                  <Icon size={18} className="text-primary-deep" />
                </div>
                <h3
                  className="font-bold text-dark mb-1.5"
                  dangerouslySetInnerHTML={{ __html: topic.title }}
                />
                <p
                  className="text-sm text-gray mb-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: topic.description }}
                />
                <ul className="space-y-1.5 text-sm text-dark">
                  {topic.articles.map((article) => (
                    <li
                      key={article}
                      className="flex items-start gap-1.5"
                      dangerouslySetInnerHTML={{
                        __html: `<span class="text-primary-deep font-bold">•</span> ${article}`,
                      }}
                    />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="surface-card p-8 sm:p-10 max-w-4xl mx-auto bg-gradient-to-br from-mint to-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-2" aria-hidden>📱</div>
                <h3 className="font-bold text-dark mb-1">In-app messages</h3>
                <p className="text-sm text-gray">Fastest path during a job. Open it from your active order.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2" aria-hidden>💬</div>
                <h3 className="font-bold text-dark mb-1">In-app support</h3>
                <p className="text-sm text-gray">For non-job questions and account issues.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2" aria-hidden>📧</div>
                <h3 className="font-bold text-dark mb-1">Email support</h3>
                <p className="text-sm text-gray">
                  <a href="mailto:pros@washlee.com.au" className="text-primary-deep font-semibold hover:underline">
                    pros@washlee.com.au
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="text-center mb-10">
          <h2 className="section-title">Pro FAQ</h2>
          <p className="section-subtitle">The basics, in plain English.</p>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {proFaqs.map((faq, idx) => {
            const open = expandedFaq === idx
            return (
              <div key={faq.question} className="surface-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(open ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4"
                  aria-expanded={open}
                >
                  <span className="font-semibold text-dark">{faq.question}</span>
                  <span className={`text-primary-deep transition ${open ? 'rotate-180' : ''}`} aria-hidden>
                    ⌄
                  </span>
                </button>
                {open && (
                  <p
                    className="px-5 pb-5 -mt-1 text-sm text-gray leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="surface-card p-8 sm:p-10 bg-gradient-to-br from-mint to-white text-center">
          <h2 className="h3 text-dark mb-2">Not yet a Pro?</h2>
          <p className="text-gray mb-6 max-w-xl mx-auto">
            Apply to drive — independent contractor, paid commission per completed order, weekly payouts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pro" className="btn-primary">
              Become a Washlee Pro
              <ArrowRight size={16} />
            </Link>
            <Link href="/auth/employee-signin" className="btn-outline">
              I&rsquo;m already a Pro
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
