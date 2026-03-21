'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import { CheckCircle, ArrowRight } from 'lucide-react'

function PaymentSuccessContent() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const orderId = params.get('orderId')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-[#1f2d2b] mb-4">Payment Successful!</h1>
          <p className="text-lg text-[#6b7b78] mb-8">
            Your payment has been processed successfully. Your order is now confirmed.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-[#E8FFFB] rounded-lg p-8 mb-8">
          <h3 className="text-lg font-bold text-[#1f2d2b] mb-4">What Happens Next?</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-[#48C9B0] font-bold">1</span>
              <span className="text-[#1f2d2b]">We'll send you a confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#48C9B0] font-bold">2</span>
              <span className="text-[#1f2d2b]">Our team will pick up your laundry at the scheduled time</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#48C9B0] font-bold">3</span>
              <span className="text-[#1f2d2b]">We'll professionally wash and prepare your items</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#48C9B0] font-bold">4</span>
              <span className="text-[#1f2d2b]">Your clean laundry will be delivered back to you</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {orderId && (
            <Link href={`/tracking?orderId=${orderId}`} className="flex-1">
              <Button className="w-full">
                Track Your Order
                <ArrowRight size={18} />
              </Button>
            </Link>
          )}
          <Link href="/dashboard/orders" className="flex-1">
            <Button variant="outline" className="w-full">
              View All Orders
            </Button>
          </Link>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-[#6b7b78] mb-4">Need help?</p>
          <Link href="/contact" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
            Contact our support team
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <PaymentSuccessContent />
      </Suspense>
      <Footer />
    </>
  )
}
