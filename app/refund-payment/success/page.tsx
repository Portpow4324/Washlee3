'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { CheckCircle } from 'lucide-react'

function RefundSuccessPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <CheckCircle size={64} className="mx-auto mb-6 text-green-500" />
              <h1 className="text-4xl font-bold text-[#1f2d2b] mb-2">
                Refund Processed!
              </h1>
              <p className="text-[#6b7b78] text-lg mb-8">
                Your refund has been successfully processed
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-[#1f2d2b] mb-4">What happens next?</h2>
                <ul className="space-y-3 text-[#6b7b78]">
                  <li className="flex gap-3">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span>You will receive a confirmation email shortly</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span>Funds will be returned to your original payment method</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span>Processing time: 3-5 business days</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span>Order ID: {orderId?.slice(0, 8)}</span>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <p className="text-[#6b7b78] text-sm mb-4">
                  Have questions? Check your email for more details.
                </p>
              </div>

              <Link href="/dashboard/customer">
                <Button size="lg">Back to Dashboard</Button>
              </Link>
            </div>
          </Card>

          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-xs text-[#6b7b78] text-center">
              🔒 Transaction ID: {orderId?.slice(0, 16)}...
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default function RefundSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RefundSuccessPageContent />
    </Suspense>
  )
}
