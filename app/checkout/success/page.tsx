'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { CheckCircle, Loader } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const sessionId = searchParams.get('session_id')
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    // Simulate processing time
    const timer = setTimeout(() => {
      setIsProcessing(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isProcessing) {
    return (
      <Card className="p-8 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Loader size={64} className="text-primary animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-dark mb-3">Processing Payment...</h1>
        <p className="text-gray">Please wait while we confirm your order</p>
      </Card>
    )
  }

  return (
    <Card className="p-8 text-center max-w-md">
      <div className="flex justify-center mb-6">
        <CheckCircle size={64} className="text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-dark mb-3">Payment Successful! 🎉</h1>
      <p className="text-gray mb-6">Your order has been confirmed and payment received</p>
      
      <div className="bg-light rounded-lg p-4 mb-6">
        <p className="text-sm text-gray mb-2">Order ID</p>
        <p className="font-mono text-dark font-semibold text-lg">{orderId}</p>
      </div>

      <div className="space-y-3 mb-6 text-left text-sm text-gray">
        <div className="flex gap-2">
          <span className="text-primary font-bold">✓</span>
          <span>Payment confirmed with Stripe</span>
        </div>
        <div className="flex gap-2">
          <span className="text-primary font-bold">✓</span>
          <span>Your Washlee Pro will arrive soon</span>
        </div>
        <div className="flex gap-2">
          <span className="text-primary font-bold">✓</span>
          <span>You'll receive updates via email</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={() => router.push('/dashboard/customer')}
        >
          View Order in Dashboard
        </Button>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
        >
          Back to Home
        </button>
      </div>

      <p className="text-xs text-gray mt-6">Session ID: {sessionId}</p>
    </Card>
  )
}

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
