'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'

export default function Pricing() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [weight, setWeight] = useState(5)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])

  const handleGetStarted = () => {
    if (loading) return
    if (user) {
      // User is logged in, go to booking
      router.push('/booking')
    } else {
      // User not logged in, go to signup
      router.push('/auth/signup')
    }
  }

  // Calculate pricing
  const basePrice = weight * 3.0
  const minOrder = 24
  
  let addonsPrice = 0
  selectedAddons.forEach(addon => {
    switch (addon) {
      case 'hang-dry':
        addonsPrice += weight * 3.3
        break
      case 'delicates':
        addonsPrice += weight * 4.4
        break
      case 'comforter':
        addonsPrice += 25
        break
      case 'stain':
        addonsPrice += 0.5
        break
      case 'ironing':
        addonsPrice += weight * 6.6
        break
    }
  })
  
  // Only apply minimum order if total (with add-ons) is below $24
  const totalBeforeAddons = basePrice
  const totalWithAddons = totalBeforeAddons + addonsPrice
  const minOrderApplied = totalWithAddons < minOrder ? minOrder - totalBeforeAddons : 0
  const totalPrice = totalWithAddons + minOrderApplied

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
                <p className="text-3xl font-bold text-dark">$24</p>
              </div>
            </div>

            <Link href="/booking">
              <Button size="lg" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-dark mb-6">Price Calculator</h3>
            
            {/* Weight Slider */}
            <Card className="p-6 mb-6">
              <label className="block mb-4">
                <p className="text-gray text-sm font-semibold mb-2">LAUNDRY WEIGHT (KG)</p>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value))}
                  className="w-full h-2 bg-light rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-4xl font-bold text-primary mt-3">{weight} kg</p>
              </label>
            </Card>

            {/* Add-ons Selection */}
            <Card className="p-6 mb-6">
              <p className="text-gray text-sm font-semibold mb-4">ADD-ONS (OPTIONAL)</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-light transition">
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes('hang-dry')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAddons([...selectedAddons, 'hang-dry'])
                      } else {
                        setSelectedAddons(selectedAddons.filter(a => a !== 'hang-dry'))
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-dark">Hang Dry</p>
                    <p className="text-xs text-gray">+${(weight * 3.3).toFixed(2)}</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-light transition">
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes('delicates')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAddons([...selectedAddons, 'delicates'])
                      } else {
                        setSelectedAddons(selectedAddons.filter(a => a !== 'delicates'))
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-dark">Delicates Care</p>
                    <p className="text-xs text-gray">+${(weight * 4.4).toFixed(2)}</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-light transition">
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes('comforter')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAddons([...selectedAddons, 'comforter'])
                      } else {
                        setSelectedAddons(selectedAddons.filter(a => a !== 'comforter'))
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-dark">Comforter Service</p>
                    <p className="text-xs text-gray">+$25.00</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-light transition">
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes('stain')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAddons([...selectedAddons, 'stain'])
                      } else {
                        setSelectedAddons(selectedAddons.filter(a => a !== 'stain'))
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-dark">Stain Treatment</p>
                    <p className="text-xs text-gray">+$0.50/item</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-light transition">
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes('ironing')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAddons([...selectedAddons, 'ironing'])
                      } else {
                        setSelectedAddons(selectedAddons.filter(a => a !== 'ironing'))
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-dark">Ironing</p>
                    <p className="text-xs text-gray">+${(weight * 6.6).toFixed(2)}</p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Price Breakdown */}
            <Card className="p-6 bg-gradient-to-br from-mint to-light">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray">Base Service ({weight} kg @ $3.00):</span>
                  <span className="font-semibold text-dark">${Math.max(basePrice, 0).toFixed(2)}</span>
                </div>
                {minOrderApplied > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Minimum Order Applied:</span>
                    <span>+${minOrderApplied.toFixed(2)}</span>
                  </div>
                )}
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray">Add-ons:</span>
                    <span className="font-semibold text-dark">+${addonsPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-primary pt-3 flex justify-between items-center">
                <span className="font-bold text-dark">Total:</span>
                <span className="text-4xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" 
                className="w-full mt-6"
                onClick={handleGetStarted}
              >
                Book Now
              </Button>
            </Card>
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
          <div className="flex justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-primary text-white hover:bg-accent">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
