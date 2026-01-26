'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { AlertCircle } from 'lucide-react'

function CancelContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <Card className="p-8 text-center max-w-md">
      <div className="flex justify-center mb-6">
        <AlertCircle size={64} className="text-orange-500" />
      </div>
      <h1 className="text-3xl font-bold text-dark mb-3">Payment Cancelled</h1>
      <p className="text-gray mb-6">You cancelled the payment. Your order is still pending.</p>
      
      <div className="bg-light rounded-lg p-4 mb-6">
        <p className="text-sm text-gray mb-2">Order ID (Draft)</p>
        <p className="font-mono text-dark font-semibold text-lg">{orderId}</p>
      </div>

      <div className="space-y-3 mb-6 text-left text-sm text-gray">
        <div className="flex gap-2">
          <span className="text-orange-500 font-bold">!</span>
          <span>Your order was created but payment was not completed</span>
        </div>
        <div className="flex gap-2">
          <span className="text-orange-500 font-bold">!</span>
          <span>You can complete payment from your dashboard</span>
        </div>
        <div className="flex gap-2">
          <span className="text-orange-500 font-bold">!</span>
          <span>Your order will expire in 24 hours if not paid</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={() => router.push('/booking')}
        >
          Try Again
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/dashboard/customer')}
        >
          View Pending Orders
        </Button>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
        >
          Back to Home
        </button>
      </div>
    </Card>
  )
}

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <CancelContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
