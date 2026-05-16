'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ShoppingBag, Zap, CheckCircle, Clock, Shield, ArrowRight, MapPin } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import PlaceholderReviews from '@/components/marketing/PlaceholderReviews'
import PhotoSlot from '@/components/marketing/PhotoSlot'
import Reveal from '@/components/marketing/Reveal'

const STANDARD_RATE = 7.5
const EXPRESS_RATE = 12.5
const MIN_ORDER = 75

const BAG_OPTIONS = [
  { id: 'medium', label: 'Medium bag', kg: 10, helper: '~10kg — about a week of clothes' },
  { id: 'large', label: 'Large bag', kg: 15, helper: '~15kg — household load' },
] as const

type BagId = (typeof BAG_OPTIONS)[number]['id']

export default function PricingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [bagId, setBagId] = useState<BagId>('medium')
  const [bagCount, setBagCount] = useState(1)
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard')
  const [hangDry, setHangDry] = useState(false)
  const [protectionPlan, setProtectionPlan] = useState<'basic' | 'premium' | 'premium-plus'>('basic')

  const bag = BAG_OPTIONS.find((b) => b.id === bagId)!
  const weight = bag.kg * bagCount
  const rate = deliverySpeed === 'express' ? EXPRESS_RATE : STANDARD_RATE
  const basePrice = weight * rate
  const addonsPrice = hangDry ? 16.5 : 0
  const protectionPrice = protectionPlan === 'premium' ? 3.5 : protectionPlan === 'premium-plus' ? 8.5 : 0
  const subtotal = basePrice + addonsPrice + protectionPrice
  const minTopUp = subtotal < MIN_ORDER ? MIN_ORDER - subtotal : 0
  const total = subtotal + minTopUp

  const handleBookNow = () => {
    if (loading) return
    router.push(user ? '/booking' : '/auth/signup-customer')
  }

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-soft-hero">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative container-page py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-slide-up">
              <span className="pill mb-4">
                <CheckCircle size={14} /> Pay-per-order. No subscription.
              </span>
              <h1 className="h1 text-dark text-balance mb-4">Simple, per-kilo pricing.</h1>
              <p className="text-lg text-gray leading-relaxed mb-6 max-w-xl">
                One rate for standard, one for Express. Free pickup and delivery, every time. The price you see is the price you pay.
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark">
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> $7.50/kg standard</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> $12.50/kg Express</li>
                <li className="inline-flex items-center gap-2"><MapPin size={16} className="text-primary" /> Greater Melbourne</li>
              </ul>
            </div>
            <div className="lg:col-span-5">
              <Reveal as="fade" delay={0.05}>
                <PhotoSlot
                  src="/marketing/folded-laundry.jpg"
                  alt="Freshly folded laundry stacked in a clean Melbourne home"
                  aspect="aspect-[4/3]"
                  placeholderHint="Freshly folded clean laundry on a light timber table."
                  priority
                  caption="Standard wash &amp; fold · returned next business day"
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Headline rates */}
      <section className="container-page pb-10 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="surface-card p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3 text-primary-deep">
              <Clock size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">Standard</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-dark mb-1">
              $7.50<span className="text-lg font-medium text-gray">/kg</span>
            </p>
            <p className="text-gray text-sm">Delivered by 5pm next business day. Free pickup &amp; drop-off.</p>
          </div>
          <div className="surface-card p-6 sm:p-8 bg-gradient-to-br from-mint to-white border-primary/20">
            <div className="flex items-center gap-2 mb-3 text-primary-deep">
              <Zap size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">Express same-day</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-dark mb-1">
              $12.50<span className="text-lg font-medium text-gray">/kg</span>
            </p>
            <p className="text-gray text-sm">Order before noon, back by 7pm. Subject to Pro availability.</p>
          </div>
        </div>
        <p className="text-xs text-gray mt-3 pl-1">Minimum order $75. All prices in AUD, GST included. Final price calculated by actual weight after washing.</p>
      </section>

      {/* Bag sizes */}
      <section className="section-tight bg-white">
        <div className="text-center mb-10">
          <Reveal>
            <h2 className="section-title">Choose a bag</h2>
            <p className="section-subtitle">We offer two bag sizes — pick the one closest to your load.</p>
          </Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {BAG_OPTIONS.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.06}>
              <div className="surface-card card-hover overflow-hidden h-full">
                <div className="grid grid-cols-3 gap-0">
                  <div className="col-span-1 relative">
                    {/* Visual bag scale */}
                    <div className={`flex h-full items-end justify-center pb-3 pt-4 px-3 ${b.id === 'medium' ? 'bg-soft-mint' : 'bg-photo-fallback-warm'}`}>
                      <div className="relative">
                        {/* Stylised bag illustration */}
                        <div
                          className={`relative rounded-b-2xl rounded-t-md bg-gradient-to-b from-primary to-primary-deep shadow-md ${
                            b.id === 'medium' ? 'h-20 w-16' : 'h-28 w-20'
                          }`}
                        >
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-8 rounded-t-full border border-primary-deep bg-mint" />
                          <span className="absolute inset-x-0 bottom-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/90">
                            {b.kg}kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-mint flex items-center justify-center">
                        <ShoppingBag size={16} className="text-primary-deep" />
                      </div>
                      <h3 className="font-bold text-dark">{b.label}</h3>
                    </div>
                    <p className="text-sm text-gray mb-3">{b.helper}</p>
                    <div className="text-sm text-dark space-y-1">
                      <p>Standard <span className="float-right font-bold text-primary-deep">${(b.kg * STANDARD_RATE).toFixed(2)}</span></p>
                      <p>Express <span className="float-right font-bold text-primary-deep">${(b.kg * EXPRESS_RATE).toFixed(2)}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Calculator */}
      <section className="bg-soft-mint">
        <div className="container-page py-14 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="section-title">Estimate your order</h2>
            <p className="section-subtitle">Adjust the options to see your total. Final invoice is based on actual weight.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Controls */}
            <div className="space-y-4">
              {/* Bag size */}
              <div className="surface-card p-6">
                <p className="label-field uppercase text-xs tracking-wider text-gray">Bag size</p>
                <div className="grid grid-cols-2 gap-3">
                  {BAG_OPTIONS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBagId(b.id)}
                      className={`text-left p-4 rounded-xl border-2 transition ${
                        bagId === b.id ? 'border-primary bg-mint' : 'border-line bg-white hover:border-primary/40'
                      }`}
                    >
                      <p className="font-semibold text-dark">{b.label}</p>
                      <p className="text-xs text-gray">~{b.kg}kg</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bag count */}
              <div className="surface-card p-6">
                <p className="label-field uppercase text-xs tracking-wider text-gray">How many bags?</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setBagCount(Math.max(1, bagCount - 1))}
                    className="w-11 h-11 rounded-full bg-dark text-white font-bold text-xl flex items-center justify-center hover:bg-dark-soft transition"
                    aria-label="Decrease bag count"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <p className="text-3xl font-bold text-dark">{bagCount}</p>
                    <p className="text-xs text-gray">{weight}kg total</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBagCount(Math.min(10, bagCount + 1))}
                    className="w-11 h-11 rounded-full bg-dark text-white font-bold text-xl flex items-center justify-center hover:bg-dark-soft transition"
                    aria-label="Increase bag count"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Delivery speed */}
              <div className="surface-card p-6">
                <p className="label-field uppercase text-xs tracking-wider text-gray">Delivery speed</p>
                <div className="space-y-2">
                  {[
                    { id: 'standard', label: 'Standard', helper: 'Next business day by 5pm', rate: STANDARD_RATE },
                    { id: 'express', label: 'Express same-day', helper: 'Order before noon, back by 7pm', rate: EXPRESS_RATE },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                        deliverySpeed === opt.id ? 'border-primary bg-mint' : 'border-line hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliverySpeed === opt.id}
                        onChange={() => setDeliverySpeed(opt.id as 'standard' | 'express')}
                        className="w-4 h-4 accent-primary"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-dark">{opt.label}</p>
                        <p className="text-xs text-gray">{opt.helper}</p>
                      </div>
                      <span className="text-sm font-bold text-primary-deep">${opt.rate.toFixed(2)}/kg</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              <div className="surface-card p-6">
                <p className="label-field uppercase text-xs tracking-wider text-gray">Add-ons</p>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-line hover:border-primary/40 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hangDry}
                    onChange={(e) => setHangDry(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-dark text-sm">Hang dry</p>
                    <p className="text-xs text-gray">Air-dry instead of tumble dry</p>
                  </div>
                  <span className="text-sm font-bold text-primary-deep">$16.50</span>
                </label>
              </div>

              {/* Protection */}
              <div className="surface-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-primary-deep" />
                  <p className="label-field uppercase text-xs tracking-wider text-gray mb-0">Protection plan</p>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'basic', label: 'Basic (included)', helper: 'Standard care guarantee', price: 'Free' },
                    { id: 'premium', label: 'Premium', helper: 'Higher per-item cover', price: '$3.50' },
                    { id: 'premium-plus', label: 'Premium+', helper: 'Maximum cover', price: '$8.50' },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                        protectionPlan === p.id ? 'border-primary bg-mint' : 'border-line hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="protection"
                        checked={protectionPlan === p.id}
                        onChange={() => setProtectionPlan(p.id as typeof protectionPlan)}
                        className="w-4 h-4 accent-primary"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-dark text-sm">{p.label}</p>
                        <p className="text-xs text-gray">{p.helper}</p>
                      </div>
                      <span className="text-sm font-bold text-primary-deep">{p.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="surface-card p-6 sm:p-8 bg-white">
                <h3 className="text-2xl font-bold text-dark mb-6">Order summary</h3>

                <div className="space-y-3 pb-5 border-b border-line text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray">Bags</span>
                    <span className="font-semibold text-dark">{bagCount} × {bag.label.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Estimated weight</span>
                    <span className="font-semibold text-dark">{weight}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Speed</span>
                    <span className="font-semibold text-dark capitalize">{deliverySpeed}</span>
                  </div>
                </div>

                <div className="space-y-3 py-5 border-b border-line text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray">{weight}kg @ ${rate.toFixed(2)}/kg</span>
                    <span className="font-semibold text-dark">${basePrice.toFixed(2)}</span>
                  </div>
                  {addonsPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray">Hang dry</span>
                      <span className="font-semibold text-dark">+${addonsPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {protectionPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray">Protection plan</span>
                      <span className="font-semibold text-dark">+${protectionPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {minTopUp > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>$75 minimum top-up</span>
                      <span className="font-semibold">+${minTopUp.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-5 mb-5">
                  <span className="font-bold text-dark">Estimated total</span>
                  <span className="text-3xl font-bold text-primary">${total.toFixed(2)}</span>
                </div>

                <button onClick={handleBookNow} className="btn-primary w-full text-base">
                  Book now
                  <ArrowRight size={16} />
                </button>
                <p className="text-xs text-gray text-center mt-3">Final price based on actual weight after washing. GST included.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PlaceholderReviews context="pricing" className="bg-white" />

      {/* FAQ */}
      <section className="section bg-soft-mint">
        <div className="container-narrow">
          <div className="text-center mb-10">
            <h2 className="section-title">Pricing questions</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'How is the price calculated?',
                a: 'We charge per kilogram. Standard wash & fold is $7.50/kg, Express same-day is $12.50/kg. Bags are weighed at our facility after cleaning, and your final price reflects the actual weight.',
              },
              {
                q: 'Is there a minimum order?',
                a: 'Yes — $75 minimum per order. If your laundry weighs less than that, the minimum still applies. A medium bag (10kg) at standard rate already meets the minimum.',
              },
              {
                q: 'What bag sizes do you offer?',
                a: 'Two sizes: Medium (~10kg) and Large (~15kg). Pick whichever is closest to your load. Use multiple bags for larger orders.',
              },
              {
                q: 'Are pickup and delivery free?',
                a: 'Always. Pickup and delivery anywhere in our Melbourne service area are included in the per-kilo price.',
              },
              {
                q: 'When is Express available?',
                a: 'Order before 12pm and an Express load comes back the same day by 7pm, subject to Pro availability in your suburb.',
              },
              {
                q: 'Do I need a subscription?',
                a: 'No. Washlee is pay-per-order — book whenever you want. Wash Club rewards (free to join) earn points on every order.',
              },
            ].map((faq, i) => (
              <div key={i} className="surface-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-dark pr-4">{faq.q}</span>
                  <ChevronDown size={20} className={`text-primary flex-shrink-0 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 -mt-1 text-sm text-gray leading-relaxed">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-16 sm:pb-24">
        <div className="surface-card p-8 sm:p-12 bg-gradient-to-r from-primary to-accent text-white text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Ready when you are.</h2>
          <p className="text-white/90 mb-6">Book your first pickup in under a minute.</p>
          <Link href="/booking" className="inline-flex items-center justify-center gap-2 bg-white text-primary-deep font-bold px-8 py-3 rounded-full hover:shadow-lg transition min-h-[48px]">
            Book a pickup
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
