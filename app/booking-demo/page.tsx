'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function BookingDemo() {
  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-dark mb-4">Two Booking Experiences</h1>
          <p className="text-xl text-gray max-w-2xl mx-auto">
            Compare our original Washlee booking flow with our new hybrid 10/10 experience inspired by Poplin
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Original Washlee Booking */}
          <Card className="p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">ORIGINAL</div>
            
            <h2 className="text-2xl font-bold text-dark mb-4">Washlee Booking</h2>
            <p className="text-gray mb-8">Our original 6-step booking flow with service selection, schedule, preferences, weight, delivery, and confirmation.</p>

            <div className="space-y-3 mb-8">
              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <div>
                  <p className="font-semibold text-dark">Service Cards</p>
                  <p className="text-sm text-gray">Visual service selection with emojis</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <div>
                  <p className="font-semibold text-dark">Complete Order Summary</p>
                  <p className="text-sm text-gray">Full breakdown before payment</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <div>
                  <p className="font-semibold text-dark">Preferences & Delivery</p>
                  <p className="text-sm text-gray">Detailed care options and delivery choices</p>
                </div>
              </div>
            </div>

            <Link href="/booking">
              <Button className="w-full flex items-center justify-center gap-2">
                Try Washlee Booking <ArrowRight size={20} />
              </Button>
            </Link>
          </Card>

          {/* Hybrid Poplin-Washlee Booking */}
          <Card className="p-8 relative overflow-hidden border-2 border-primary">
            <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">10/10 HYBRID</div>
            
            <h2 className="text-2xl font-bold text-dark mb-4">Washlee × Poplin Hybrid</h2>
            <p className="text-gray mb-8">Our brand new 7-step experience combining the best of Washlee and Poplin for a premium booking journey.</p>

            <div className="space-y-3 mb-8">
              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <div>
                  <p className="font-semibold text-dark">Modal Dialogs (Poplin)</p>
                  <p className="text-sm text-gray">Clean selection modals for detergent & pickup spot</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <div>
                  <p className="font-semibold text-dark">Quantity Controls (Poplin)</p>
                  <p className="text-sm text-gray">+/- buttons for bag count like Poplin</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <div>
                  <p className="font-semibold text-dark">Protection Plan (Poplin)</p>
                  <p className="text-sm text-gray">Basic/Premium/Premium+ coverage options</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <div>
                  <p className="font-semibold text-dark">Real-time Pricing (Poplin)</p>
                  <p className="text-sm text-gray">Price display at bottom with delivery options</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-primary font-bold">✓</span>
                <div>
                  <p className="font-semibold text-dark">Service Cards (Washlee)</p>
                  <p className="text-sm text-gray">Beautiful visual service selection</p>
                </div>
              </div>
            </div>

            <Link href="/booking-hybrid">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-primary text-primary">
                Try Hybrid Booking <ArrowRight size={20} />
              </Button>
            </Link>
          </Card>
        </div>

        {/* Detailed Comparison Table */}
        <Card className="p-8 mb-12">
          <h3 className="text-2xl font-bold text-dark mb-8">Feature Comparison</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray">
                  <th className="text-left py-3 px-4 font-bold text-dark">Feature</th>
                  <th className="text-center py-3 px-4 font-bold text-dark">Washlee</th>
                  <th className="text-center py-3 px-4 font-bold text-dark">Hybrid</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray hover:bg-light">
                  <td className="py-4 px-4">Total Steps</td>
                  <td className="text-center">6 steps</td>
                  <td className="text-center">7 steps</td>
                </tr>
                <tr className="border-b border-gray hover:bg-light">
                  <td className="py-4 px-4">Service Selection</td>
                  <td className="text-center">✅ Cards</td>
                  <td className="text-center">✅ Cards</td>
                </tr>
                <tr className="border-b border-gray hover:bg-light">
                  <td className="py-4 px-4">Modal Dialogs</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">✅ (Poplin style)</td>
                </tr>
                <tr className="border-b border-gray hover:bg-light">
                  <td className="py-4 px-4">Bag Count Control</td>
                  <td className="text-center">Text input</td>
                  <td className="text-center">✅ +/- buttons</td>
                </tr>
                <tr className="border-b border-gray hover:bg-light">
                  <td className="py-4 px-4">Protection Plan</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">✅ (3 tiers)</td>
                </tr>
                <tr className="border-b border-gray hover:bg-light">
                  <td className="py-4 px-4">Delivery Speed Options</td>
                  <td className="text-center">Standard/Same-day</td>
                  <td className="text-center">✅ Standard/Express + pricing</td>
                </tr>
                <tr className="border-b border-gray hover:bg-light">
                  <td className="py-4 px-4">Progress Indicator</td>
                  <td className="text-center">Circular steps</td>
                  <td className="text-center">✅ Poplin dot style</td>
                </tr>
                <tr className="border-b border-gray hover:bg-light">
                  <td className="py-4 px-4">Real-time Total</td>
                  <td className="text-center">Summary page</td>
                  <td className="text-center">✅ Bottom display</td>
                </tr>
                <tr className="border-b border-gray hover:bg-light">
                  <td className="py-4 px-4">Pickup Instructions Modal</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">✅ Info modal</td>
                </tr>
                <tr className="hover:bg-light">
                  <td className="py-4 px-4">Order Minimum Alert</td>
                  <td className="text-center">Validation on submit</td>
                  <td className="text-center">✅ Real-time feedback</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Steps Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8">
            <h3 className="text-xl font-bold text-dark mb-6">Washlee (6 Steps)</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                <span className="text-dark">Select Service</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                <span className="text-dark">Schedule Pickup</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                <span className="text-dark">Preferences</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">4</span>
                <span className="text-dark">Weight & Add-ons</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">5</span>
                <span className="text-dark">Delivery Options</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">6</span>
                <span className="text-dark">Review & Confirm</span>
              </li>
            </ol>
          </Card>

          <Card className="p-8 border-2 border-primary">
            <h3 className="text-xl font-bold text-dark mb-6">Hybrid (7 Steps)</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                <span className="text-dark">Select Service</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                <span className="text-dark">Pickup Location</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                <span className="text-dark">Laundry Care</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">4</span>
                <span className="text-dark">Bag Count</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">5</span>
                <span className="text-dark">Delivery Speed</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">6</span>
                <span className="text-dark">Protection Plan</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">7</span>
                <span className="text-dark">Review & Confirm</span>
              </li>
            </ol>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
