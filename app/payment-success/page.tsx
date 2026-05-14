'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CheckCircle, ArrowRight, Truck, Sparkles, Package, Mail } from 'lucide-react'

function PaymentSuccessContent() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const orderId = params.get('orderId')

  const steps = [
    { icon: Mail, body: 'You’ll receive a confirmation email with the order details.' },
    { icon: Truck, body: 'Your Washlee Pro arrives in your pickup window.' },
    { icon: Sparkles, body: 'We sort, wash and fold your laundry with care.' },
    { icon: Package, body: 'Fresh laundry is delivered back — usually next business day.' },
  ]

  return (
    <main className="min-h-screen bg-soft-mint py-12 sm:py-20">
      <div className="container-narrow">
        <div className="surface-card p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mint mb-5">
            <CheckCircle className="w-9 h-9 text-primary-deep" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">Payment received</h1>
          <p className="text-gray text-base sm:text-lg mb-6">Your order is confirmed and we&rsquo;re on it.</p>

          <div className="text-left bg-mint/40 rounded-2xl p-6 mb-8">
            <p className="text-xs uppercase tracking-wider text-primary-deep font-bold mb-4">What happens next</p>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center flex-shrink-0">
                    <step.icon size={16} className="text-primary-deep" />
                  </div>
                  <span className="text-sm text-dark leading-relaxed">{step.body}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {orderId ? (
              <Link href={`/tracking?orderId=${orderId}`} className="btn-primary flex-1">
                Track this order
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href="/dashboard/orders" className="btn-primary flex-1">
                View my orders
                <ArrowRight size={16} />
              </Link>
            )}
            <Link href="/dashboard" className="btn-outline flex-1">
              Go to dashboard
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray">
            Need help?{' '}
            <Link href="/contact" className="text-primary-deep font-semibold hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function PaymentSuccessPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray">Loading…</div>}>
        <PaymentSuccessContent />
      </Suspense>
      <Footer />
    </>
  )
}
