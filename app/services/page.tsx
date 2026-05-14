'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Droplets,
  Shirt,
  Shield,
  Sparkles,
  Wind,
} from 'lucide-react'

const services = [
  {
    icon: Shirt,
    name: 'Standard wash & fold',
    price: '$7.50/kg',
    description:
      'Everyday laundry sorted, washed, dried, folded, and returned next business day.',
    points: [
      'Pickup and delivery included in the Melbourne service area',
      'Eco detergent by default',
      'Medium and large bag sizes supported',
      '$75 minimum order',
    ],
    turnaround: 'Next business day',
  },
  {
    icon: Sparkles,
    name: 'Express same-day',
    price: '$12.50/kg',
    description:
      'A faster turnaround for urgent loads. Order before noon and get it back by 7pm where capacity is available.',
    points: [
      'Priority pickup and processing',
      'Same wash, dry, fold standard',
      'Great for travel, workwear, or last-minute needs',
      '$75 minimum order still applies',
    ],
    turnaround: 'Same day by 7pm',
  },
  {
    icon: Droplets,
    name: 'Delicates / special care',
    price: '$7.50/kg',
    description:
      'Gentler handling for items that need extra attention. Add care notes at booking.',
    points: [
      'Same per-kg rate as standard wash',
      'Care notes reviewed before washing',
      'Best for gentle-cycle and special-instruction items',
      'Dry-clean-only items are not treated as standard laundry',
    ],
    turnaround: 'Next business day',
  },
]

const addOns = [
  {
    icon: Wind,
    name: 'Hang dry',
    price: '+$16.50',
    description: 'Air-dried on racks instead of tumble dry.',
  },
  {
    icon: Shield,
    name: 'Premium protection',
    price: '+$3.50',
    description: 'Higher per-item and per-order cover for a single order.',
  },
  {
    icon: Shield,
    name: 'Premium+ protection',
    price: '+$8.50',
    description: 'Maximum cover for wardrobes with higher-value items.',
  },
]

const notes = [
  'Leather, suede, fur, hazardous items, and visibly unsafe garments cannot be accepted.',
  'Dry-clean-only items must be flagged before booking so we can advise next steps.',
  'Visible stains should be noted at booking. We will pre-treat common stains, but removal is not guaranteed.',
]

export default function ServicesPage() {
  return (
    <>
      <Header />

      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-3xl">
            <span className="pill mb-4">
              <Shirt size={14} />
              Washlee services
            </span>
            <h1 className="h1 text-dark text-balance mb-4">
              Laundry pickup and delivery for everyday Melbourne loads.
            </h1>
            <p className="text-lg text-gray leading-relaxed mb-8">
              Choose standard, express, or special-care handling. Pricing is simple:
              $7.50/kg for standard wash & fold, $12.50/kg for express same-day,
              and a $75 minimum order.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/booking" className="btn-primary">
                Book a pickup
                <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="btn-outline">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="text-center mb-10">
          <h2 className="section-title">Choose your service</h2>
          <p className="section-subtitle">
            Three real options, all built around pickup, washing, folding, and delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <article key={service.name} className="surface-card p-6 sm:p-7 flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary-deep" />
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-dark mb-1">{service.name}</h3>
                  <p className="text-2xl font-bold text-primary-deep">{service.price}</p>
                </div>
                <p className="text-sm text-gray leading-relaxed mb-5">{service.description}</p>
                <ul className="space-y-2 text-sm text-dark flex-1">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-primary-deep flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-line flex items-center gap-2 text-sm text-gray">
                  <Clock size={15} className="text-primary-deep" />
                  <span>{service.turnaround}</span>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="text-center mb-10">
            <h2 className="section-title">Optional add-ons</h2>
            <p className="section-subtitle">Add these at checkout for a single order.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {addOns.map((addon) => {
              const Icon = addon.icon
              return (
                <div key={addon.name} className="surface-card p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mx-auto mb-4">
                    <Icon size={18} className="text-primary-deep" />
                  </div>
                  <h3 className="font-bold text-dark mb-1">{addon.name}</h3>
                  <p className="text-xl font-bold text-primary-deep mb-2">{addon.price}</p>
                  <p className="text-sm text-gray">{addon.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="surface-card p-6 sm:p-8">
            <h2 className="h3 text-dark mb-3">What is included</h2>
            <ul className="space-y-2 text-sm text-dark">
              {[
                'Pickup and delivery inside the current Melbourne service area',
                'Sorting, washing, drying, folding, and order tracking',
                'Basic damage protection on every order',
                'Customer support if something needs attention',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle size={15} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card p-6 sm:p-8 border-amber-200 bg-amber-50">
            <h2 className="h3 text-dark mb-3">Before you book</h2>
            <ul className="space-y-2 text-sm text-dark">
              {notes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle size={15} className="text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="surface-card p-8 sm:p-10 bg-gradient-to-br from-mint to-white text-center">
          <h2 className="h3 text-dark mb-2">Ready for laundry day to feel lighter?</h2>
          <p className="text-gray mb-6 max-w-xl mx-auto">
            Book in the browser today, then use the Washlee app for faster repeat orders,
            tracking, messages, and Wash Club rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/booking" className="btn-primary">
              Book a pickup
              <ArrowRight size={16} />
            </Link>
            <Link href="/mobile-app" className="btn-outline">
              See the app
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
