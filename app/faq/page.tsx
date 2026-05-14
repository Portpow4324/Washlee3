'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, Mail, MessageSquare, ArrowRight, HelpCircle } from 'lucide-react'

const faqCategories = [
  {
    title: 'Getting started',
    questions: [
      {
        q: 'How do I book my first pickup?',
        a: 'Sign up with email or Google, choose a pickup window on the booking page, confirm your address, and you’re done. Most first orders are booked in under two minutes.',
      },
      {
        q: 'Where do you operate?',
        a: 'We currently service Greater Melbourne. Enter your suburb on the booking page to confirm we cover you.',
      },
      {
        q: 'Can I schedule pickups in advance?',
        a: 'Yes. Book up to 14 days ahead, then re-book from your dashboard whenever you need another pickup.',
      },
      {
        q: 'Do I need to prepare my laundry?',
        a: 'No prep needed — just pop everything into a Washlee bag (or any sturdy bag) and leave it for the Pro. Mention any care instructions when you book.',
      },
    ],
  },
  {
    title: 'Pricing & payment',
    questions: [
      {
        q: 'How is the price calculated?',
        a: 'We charge per kilogram. Standard wash & fold is $7.50/kg, Express same-day is $12.50/kg. Bags are weighed at our facility after cleaning, and your final price reflects the actual weight.',
      },
      {
        q: 'Is there a minimum order?',
        a: 'Yes — $75 minimum per order. A medium bag (~10kg) at the standard rate already meets the minimum.',
      },
      {
        q: 'Are pickup and delivery free?',
        a: 'Always. Pickup and delivery anywhere in our Melbourne service area are included in the per-kilo price.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'All major credit and debit cards, plus Apple Pay and Google Pay where supported. Payment is taken once your order is finalised.',
      },
      {
        q: 'Do I need a subscription?',
        a: 'No. Washlee is pay-per-order. We also have a free loyalty program (Wash Club) that earns points on every order — no membership fee, ever.',
      },
    ],
  },
  {
    title: 'Turnaround & delivery',
    questions: [
      {
        q: 'How long does it take?',
        a: 'Standard turnaround is the next business day by 5pm. Express same-day is available if you book before noon — back the same evening by 7pm.',
      },
      {
        q: 'What if I need it back faster?',
        a: 'Choose Express same-day at checkout. Subject to Pro availability in your suburb.',
      },
      {
        q: 'Can I choose my delivery window?',
        a: 'Yes — pick a delivery window when you confirm the order, or let us auto-schedule the next free slot.',
      },
      {
        q: 'What if you miss the delivery window?',
        a: 'We’ll re-schedule and credit your account. Reach out via in-app support and we’ll make it right.',
      },
    ],
  },
  {
    title: 'Care & handling',
    questions: [
      {
        q: 'How do you care for delicate items?',
        a: 'Choose Hang Dry at checkout for items that shouldn’t go in the tumble dryer. We sort by colour and fabric, and wash at the right temperature for each load.',
      },
      {
        q: 'What detergent do you use?',
        a: 'Eco-friendly, low-fragrance detergent by default — gentle on skin and fabrics. Add care notes to your order if you have a specific preference.',
      },
      {
        q: 'Do you handle special items like doonas?',
        a: 'Bulky items may need review before pickup. Mention them in the booking notes and we’ll confirm whether they can be handled safely.',
      },
    ],
  },
  {
    title: 'Damage & issues',
    questions: [
      {
        q: 'What if an item is damaged or missing?',
        a: 'Every order includes basic protection. Open a claim from the order detail page within 14 days and our team will investigate and respond.',
      },
      {
        q: 'Can I add extra protection?',
        a: 'Yes. Choose Premium ($3.50) or Premium+ ($8.50) at checkout for higher per-item and per-order cover.',
      },
    ],
  },
  {
    title: 'Account',
    questions: [
      {
        q: 'How do I reset my password?',
        a: 'Use the “Forgot password” link on the sign-in page. We’ll email you a reset link within a couple of minutes.',
      },
      {
        q: 'Can I save multiple addresses?',
        a: 'Yes — manage saved addresses from your dashboard.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Open Settings → Account from your dashboard and choose Delete account. We’ll remove your personal data on request.',
      },
    ],
  },
]

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<string | null>('0-0')

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <HelpCircle size={14} /> Help &amp; FAQ
            </span>
            <h1 className="h1 text-dark text-balance mb-4">Frequently asked questions</h1>
            <p className="text-lg text-gray leading-relaxed">
              Quick answers to the things people ask most. Can&rsquo;t find what you&rsquo;re looking for? <Link href="/contact" className="text-primary-deep font-semibold underline">Get in touch</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ list */}
      <section className="container-page pb-16">
        <div className="max-w-3xl mx-auto space-y-10">
          {faqCategories.map((category, ci) => (
            <div key={category.title}>
              <h2 className="text-xl sm:text-2xl font-bold text-dark mb-4">{category.title}</h2>
              <div className="space-y-3">
                {category.questions.map((faq, qi) => {
                  const id = `${ci}-${qi}`
                  const open = openFaq === id
                  return (
                    <div key={id} className="surface-card overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : id)}
                        className="w-full flex items-center justify-between p-5 text-left"
                        aria-expanded={open}
                      >
                        <span className="font-semibold text-dark pr-4">{faq.q}</span>
                        <ChevronDown size={20} className={`text-primary flex-shrink-0 transition ${open ? 'rotate-180' : ''}`} />
                      </button>
                      {open && <div className="px-5 pb-5 -mt-1 text-sm text-gray leading-relaxed">{faq.a}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still have questions */}
      <section className="bg-soft-mint">
        <div className="container-page py-14 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="surface-card p-6">
              <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-3">
                <Mail size={18} className="text-primary-deep" />
              </div>
              <h3 className="font-bold text-dark mb-1">Email support</h3>
              <p className="text-sm text-gray mb-3">Replies within one business day.</p>
              <a href="mailto:support@washlee.com.au" className="text-primary-deep font-semibold text-sm hover:underline">support@washlee.com.au</a>
            </div>
            <div className="surface-card p-6">
              <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-3">
                <MessageSquare size={18} className="text-primary-deep" />
              </div>
              <h3 className="font-bold text-dark mb-1">In-app support</h3>
              <p className="text-sm text-gray mb-3">Fastest path for active orders — your Pro and our team can both jump in.</p>
              <Link href="/dashboard/support" className="text-primary-deep font-semibold text-sm hover:underline">Open support</Link>
            </div>
            <div className="surface-card p-6">
              <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-3">
                <HelpCircle size={18} className="text-primary-deep" />
              </div>
              <h3 className="font-bold text-dark mb-1">Help centre</h3>
              <p className="text-sm text-gray mb-3">Step-by-step guides, billing tips, and troubleshooting.</p>
              <Link href="/help-center" className="text-primary-deep font-semibold text-sm hover:underline">Browse articles</Link>
            </div>
          </div>

          <div className="mt-10 surface-card p-8 sm:p-10 bg-white text-center">
            <h2 className="h3 text-dark mb-2">Still need a hand?</h2>
            <p className="text-gray mb-5">Send us a message and the Melbourne team will reply within one business day.</p>
            <Link href="/contact" className="btn-primary inline-flex">
              Contact us
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
