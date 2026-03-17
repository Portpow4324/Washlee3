'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'

function SubscriptionCancelPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sessionId = searchParams.get('session_id')

  return (
    <div className="min-h-screen bg-light flex items-center justify-center p-4">
      <Card className="p-8 max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏸️</span>
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">Subscription Cancelled</h1>
          <p className="text-gray mb-2">Your payment was not completed</p>
          <p className="text-xs text-gray">No charges have been made to your account</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            You can try again anytime. Your subscription plans are still available when you're ready.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => router.push('/dashboard/subscriptions')} className="w-full">
            Back to Plans
          </Button>
          <Button 
            onClick={() => router.push('/pricing')} 
            variant="outline" 
            className="w-full"
          >
            View Pricing
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray/20">
          <p className="text-xs text-gray text-center">
            Need help?{' '}
            <Link href="/contact" className="text-primary font-semibold hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionCancelPageContent />
    </Suspense>
  )
}
