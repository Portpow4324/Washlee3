'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Info, ArrowRight, ArrowLeft, Gift } from 'lucide-react'

export default function CancelSubscriptionPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-soft-mint py-14">
        <div className="container-narrow">
          <div className="surface-card p-6 sm:p-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-mint mb-4">
              <Info size={20} className="text-primary-deep" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">No subscription to cancel</h1>
            <p className="text-gray text-base sm:text-lg leading-relaxed mb-6">
              Washlee is pay-per-order — there&rsquo;s no monthly membership to cancel. You only pay when you book a wash, and you can stop using Washlee at any time without any fees or notice.
            </p>

            <div className="rounded-2xl bg-mint/60 border border-primary/15 p-5 mb-6">
              <div className="flex items-start gap-3">
                <Gift size={18} className="text-primary-deep flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-dark mb-1">Wash Club is free</p>
                  <p className="text-sm text-gray">
                    Wash Club rewards have no membership fee. You can leave Wash Club from your account settings whenever you like — your earned credit stays with your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="btn-primary flex-1">
                Go to dashboard
                <ArrowRight size={16} />
              </Link>
              <Link href="/dashboard/settings" className="btn-outline flex-1">
                <ArrowLeft size={16} />
                Account settings
              </Link>
            </div>

            <p className="text-xs text-gray text-center mt-6">
              Want your Washlee data removed?{' '}
              <Link href="/contact" className="text-primary-deep font-semibold hover:underline">
                Contact support
              </Link>{' '}
              and we&rsquo;ll help.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
