'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function BookingInfo() {
  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-dark mb-4">Book Your Laundry</h1>
          <p className="text-lg text-gray">Choose which booking experience you'd like to try</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="p-12 text-center hover:shadow-lg transition">
            <h2 className="text-2xl font-bold text-dark mb-3">📖 Original Washlee</h2>
            <p className="text-gray mb-6">Our classic 6-step booking flow with comprehensive options and a complete order summary.</p>
            <Link href="/booking" className="inline-block">
              <Button size="lg" className="flex items-center justify-center gap-2">
                Book with Washlee <ArrowRight size={20} />
              </Button>
            </Link>
          </Card>

          <Card className="p-12 text-center hover:shadow-lg transition border-2 border-primary bg-mint/30">
            <h2 className="text-2xl font-bold text-primary mb-3">⭐10/10 Hybrid (NEW)</h2>
            <p className="text-gray mb-6">Our brand new experience combining the best of Washlee and Poplin with modals, quantity controls, and protection plans.</p>
            <Link href="/booking-hybrid" className="inline-block">
              <Button size="lg" variant="outline" className="flex items-center justify-center gap-2 border-primary text-primary">
                Try Hybrid Booking <ArrowRight size={20} />
              </Button>
            </Link>
          </Card>
        </div>

        <Card className="p-8 mb-12">
          <h3 className="text-xl font-bold text-dark mb-6">What's Different?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-dark mb-4">Original (6 Steps)</h4>
              <ul className="space-y-2 text-sm text-gray">
                <li>✓ Service selection with emoji cards</li>
                <li>✓ Traditional step-by-step form</li>
                <li>✓ Full order summary at the end</li>
                <li>✓ Simple delivery options</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-dark mb-4">Hybrid (7 Steps) ⭐ NEW</h4>
              <ul className="space-y-2 text-sm text-gray">
                <li>✓ Service selection with emoji cards</li>
                <li>✓ Modal dialogs for selections (like Poplin)</li>
                <li>✓ +/- buttons for bag count</li>
                <li>✓ Protection plan options (Basic/Premium/Premium+)</li>
                <li>✓ Real-time pricing display</li>
                <li>✓ Poplin dot progress indicator</li>
                <li>✓ Pickup instructions info modal</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <Link href="/booking-demo">
            <Button size="lg" variant="outline">
              View Full Comparison & Features
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
