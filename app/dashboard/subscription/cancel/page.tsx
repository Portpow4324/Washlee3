'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

function CheckoutCancelContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <main className="min-h-screen bg-soft-mint flex items-center justify-center px-4 py-12">
      <div className="surface-card max-w-md w-full p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏸️</span>
        </div>
        <h1 className="text-2xl font-bold text-dark mb-2">Checkout cancelled</h1>
        <p className="text-gray text-sm mb-6">
          No charge was made. Washlee is pay-per-order, with free Wash Club rewards. Try again whenever you&rsquo;re ready.
        </p>

        <div className="space-y-3">
          <button onClick={() => router.push('/booking')} className="btn-primary w-full">
            Book a pickup
            <ArrowRight size={16} />
          </button>
          <Link href="/dashboard" className="btn-outline w-full">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>

        <p className="text-xs text-gray mt-6">
          Need help?{' '}
          <Link href="/contact" className="text-primary-deep font-semibold hover:underline">
            Contact support
          </Link>
        </p>

        {sessionId && (
          <p className="text-[10px] text-gray-soft mt-3">Reference: {sessionId.slice(0, 14)}…</p>
        )}
      </div>
    </main>
  )
}

export default function SubscriptionCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray">Loading…</div>}>
      <CheckoutCancelContent />
    </Suspense>
  )
}
