'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-mint to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray max-w-2xl">
            No hidden fees. No surprises. Just honest pricing for clean laundry.
          </p>
        </div>
      </section>

      {/* Main Pricing */}
      <section className="section bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-4xl font-bold text-dark mb-6">Base Service</h2>
            <div className="bg-light rounded-2xl p-8 mb-8">
              <p className="text-gray text-sm font-semibold mb-2">PRICE PER KILOGRAM</p>
              <p className="text-6xl font-bold text-primary mb-4">$3.00</p>
              <p className="text-gray mb-8">Wash, dry, fold, and deliver</p>

              <div className="border-t border-gray py-8">
                <p className="text-gray text-sm font-semibold mb-4">INCLUDED:</p>
                <ul className="space-y-3">
                  {[
                    'Professional washing & drying',
                    'Expert folding or hanging',
                    'Same bag for pickup & delivery',
                    'Next-day delivery (usually)',
                    'Live tracking',
                    'Customer support',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="text-primary font-bold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <p className="text-gray text-sm font-semibold mb-3">MINIMUM ORDER</p>
                <p className="text-3xl font-bold text-dark">$39</p>
              </div>
            </div>

            <Link href="/auth/signup">
              <Button size="lg" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-dark mb-6">Example Pricing</h3>
            <div className="space-y-4">
              {[
                { weight: '5 kg', price: '$15.00', label: 'Minimum' },
                { weight: '11 kg', price: '$33.00', label: 'Average load' },
                { weight: '23 kg', price: '$69.00', label: 'Large load' },
                { weight: '34 kg', price: '$102.00', label: 'Family load' },
              ].map((example, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-light rounded-lg">
                  <div>
                    <p className="font-bold text-dark">{example.weight}</p>
                    <p className="text-sm text-gray">{example.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">{example.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add-ons */}
        <div className="mt-20 border-t border-gray pt-20">
          <h2 className="text-4xl font-bold text-dark mb-12 text-center">Premium Add-ons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Hang Dry',
                price: '+$3.30/kg',
                description: 'Hang-dry delicate items to preserve fabric quality',
              },
              {
                title: 'Delicates Care',
                price: '+$4.40/kg',
                description: 'Gentle wash for silk, lace, and fine fabrics',
              },
              {
                title: 'Comforter Service',
                price: '$25.00',
                description: 'Dedicated washing for comforters and large items',
              },
              {
                title: 'Stain Treatment',
                price: '+$0.50/item',
                description: 'Professional pre-treatment for stubborn stains',
              },
              {
                title: 'Ironing',
                price: '+$6.60/kg',
                description: 'Professional ironing service',
              },
              {
                title: 'Express Service',
                price: '+$10.00',
                description: '24-hour turnaround guarantee',
              },
            ].map((addon, i) => (
              <Card key={i} hoverable>
                <h3 className="font-bold text-dark mb-2">{addon.title}</h3>
                <p className="text-primary font-bold text-lg mb-3">{addon.price}</p>
                <p className="text-gray text-sm">{addon.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="section bg-light">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: 'Basic',
              price: '/month',
              billing: 'Pay as you go',
              features: ['No membership fee', 'Standard pricing', 'Mobile app access', 'Email support'],
            },
            {
              name: 'Plus',
              price: '$29/month',
              billing: 'Save 10%',
              features: [
                '10% discount on all orders',
                'Priority scheduling',
                'Free stain treatment',
                'Priority support',
                'Monthly insights',
              ],
              highlight: true,
            },
            {
              name: 'Premium',
              price: '$79/month',
              billing: 'Save 20%',
              features: [
                '20% discount on all orders',
                'Bi-weekly scheduled pickups',
                'Free premium add-ons',
                '24/7 priority support',
                'Free annual comforter service',
                'Dedicated pro option',
              ],
            },
          ].map((plan, i) => (
            <Card
              key={i}
              hoverable
              className={plan.highlight ? 'border-2 border-primary' : ''}
            >
              <h3 className="text-2xl font-bold text-dark mb-2">{plan.name}</h3>
              <p className="text-gray text-sm mb-4">{plan.billing}</p>
              <p className="text-4xl font-bold text-primary mb-6">{plan.price}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-dark text-sm">
                    <span className="text-primary">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block">
                <Button
                  variant={plan.highlight ? 'primary' : 'outline'}
                  className="w-full"
                >
                  Choose Plan
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-white">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Pricing FAQ</h2>

        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              q: 'How is laundry weight calculated?',
              a: 'Laundry is weighed at our facility after it arrives. We charge only for the actual weight of your clean laundry in kilograms.',
            },
            {
              q: 'Is there a subscription requirement?',
              a: 'No! You can pay as you go or choose a subscription plan for discounts. Cancel anytime.',
            },
            {
              q: 'What about delivery fees?',
              a: 'Delivery is included in our base price. No hidden fees ever.',
            },
            {
              q: 'Do you offer discounts?',
              a: 'Yes! Subscribe to Plus or Premium for 10-20% discounts on all orders.',
            },
            {
              q: 'What if items are damaged?',
              a: 'Our satisfaction guarantee covers accidental damage. We\'ll replace or refund at no cost.',
            },
          ].map((faq, i) => (
            <div
              key={i}
              className="border border-gray rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-6 hover:bg-light transition text-left"
              >
                <span className="font-bold text-dark">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-primary transition ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 text-gray">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-accent py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Start Your Free Trial
          </h2>
          <p className="text-lg text-white mb-8 opacity-90">
            First pickup included in your first order. No credit card required.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-primary text-white hover:bg-accent">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
