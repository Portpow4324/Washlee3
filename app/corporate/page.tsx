'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  Mail,
  MapPin,
  Shield,
  Users,
} from 'lucide-react'

const solutions = [
  {
    icon: Users,
    title: 'Staff laundry benefits',
    description:
      'Offer laundry pickup as a practical employee perk for teams in the Melbourne service area.',
    points: ['Optional monthly allowance', 'Employee self-booking', 'Simple reporting'],
  },
  {
    icon: Briefcase,
    title: 'Workwear and uniforms',
    description:
      'Recurring wash & fold for small teams that need clean workwear without managing laundry in-house.',
    points: ['Scheduled pickups', 'Order-level tracking', 'Care notes for each load'],
  },
  {
    icon: ClipboardList,
    title: 'Business and hospitality loads',
    description:
      'A managed pickup flow for offices, studios, clinics, salons, and local hospitality teams.',
    points: ['Central contact', 'Flexible pickup windows', 'Invoice-friendly enquiry flow'],
  },
]

const steps = [
  {
    title: 'Tell us what you need',
    description:
      'Share your business type, suburb, approximate weekly volume, and pickup requirements.',
  },
  {
    title: 'We confirm fit and pricing',
    description:
      'We check service area, load size, frequency, and whether standard or express turnaround is right.',
  },
  {
    title: 'Start with a simple pilot',
    description:
      'Run a small first batch before moving into recurring pickup or staff-benefit usage.',
  },
]

const faqs = [
  {
    q: 'What is the base pricing?',
    a: 'Standard wash & fold is $7.50/kg, express same-day is $12.50/kg, and the minimum order is $75. Business volume may be quoted separately after review.',
  },
  {
    q: 'Do you serve every suburb?',
    a: 'Washlee is Melbourne-first. We confirm each business address before promising pickup or recurring service.',
  },
  {
    q: 'Can employees book themselves?',
    a: 'Yes. For staff-benefit pilots, employees can use the normal customer booking flow while your team manages allowance rules separately.',
  },
  {
    q: 'Do you handle dry cleaning?',
    a: 'No. Washlee is focused on laundry pickup, wash & fold, express laundry, and special-care handling where suitable.',
  },
]

export default function CorporateServicesPage() {
  return (
    <>
      <Header />

      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-3xl">
            <span className="pill mb-4">
              <Briefcase size={14} />
              Business laundry
            </span>
            <h1 className="h1 text-dark text-balance mb-4">
              Laundry pickup for Melbourne teams and local businesses.
            </h1>
            <p className="text-lg text-gray leading-relaxed mb-8">
              Use Washlee for staff benefits, recurring workwear, or simple business
              laundry pickup. We keep the promise conservative: Melbourne-first,
              priced clearly, and scoped after we understand your volume.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="mailto:corporate@washlee.com.au" className="btn-primary">
                Talk to business support
                <ArrowRight size={16} />
              </a>
              <Link href="/pricing" className="btn-outline">
                See standard pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: MapPin, label: 'Melbourne-first service area' },
            { icon: Shield, label: 'Basic protection included' },
            { icon: CalendarClock, label: 'One-off or recurring enquiries' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="surface-card p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center">
                  <Icon size={18} className="text-primary-deep" />
                </div>
                <p className="font-semibold text-dark text-sm">{item.label}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center mb-10">
          <h2 className="section-title">Ways businesses use Washlee</h2>
          <p className="section-subtitle">No inflated claims, just practical laundry support.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {solutions.map((solution) => {
            const Icon = solution.icon
            return (
              <article key={solution.title} className="surface-card p-6 sm:p-7">
                <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary-deep" />
                </div>
                <h3 className="text-xl font-bold text-dark mb-2">{solution.title}</h3>
                <p className="text-sm text-gray leading-relaxed mb-5">{solution.description}</p>
                <ul className="space-y-2 text-sm text-dark">
                  {solution.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-primary-deep flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="text-center mb-10">
            <h2 className="section-title">How business onboarding works</h2>
            <p className="section-subtitle">Start small, prove the workflow, then scale if it fits.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.title} className="surface-card p-6">
                <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center mb-4">
                  {index + 1}
                </div>
                <h3 className="font-bold text-dark mb-2">{step.title}</h3>
                <p className="text-sm text-gray leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="surface-card p-6 sm:p-8">
            <h2 className="h3 text-dark mb-3">What to include in your enquiry</h2>
            <ul className="space-y-2 text-sm text-dark">
              {[
                'Business name and Melbourne suburb',
                'Approximate weekly laundry volume',
                'Standard or express turnaround needs',
                'Whether this is staff benefit, workwear, or customer-facing laundry',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle size={15} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card p-6 sm:p-8 bg-gradient-to-br from-mint to-white">
            <h2 className="h3 text-dark mb-3">Business pricing starts with the public rate</h2>
            <p className="text-sm text-gray leading-relaxed mb-4">
              Use $7.50/kg standard, $12.50/kg express, and a $75 minimum as the baseline.
              For recurring business volume, we confirm the operational fit before quoting.
            </p>
            <a href="mailto:corporate@washlee.com.au" className="btn-primary inline-flex">
              <Mail size={16} />
              Email corporate support
            </a>
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="text-center mb-8">
          <h2 className="section-title">Business FAQ</h2>
        </div>
        <div className="space-y-3 max-w-4xl mx-auto">
          {faqs.map((faq) => (
            <div key={faq.q} className="surface-card p-5">
              <h3 className="font-bold text-dark mb-1">{faq.q}</h3>
              <p className="text-sm text-gray leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}
