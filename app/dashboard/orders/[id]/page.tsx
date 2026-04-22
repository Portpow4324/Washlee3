'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'

export default function OrderDetail() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string

  // Redirect to tracking page with the order ID using useEffect
  useEffect(() => {
    if (orderId) {
      router.replace(`/tracking?orderId=${orderId}`)
    }
  }, [orderId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {orderId ? (
          <>
            <div className="animate-spin inline-block w-8 h-8 border-4 border-[#48C9B0] border-t-transparent rounded-full mb-4"></div>
            <p className="text-[#6b7b78]">Loading order details...</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-[#1f2d2b] mb-4">Order Not Found</h1>
            <p className="text-[#6b7b78] mb-6">
              The order ID could not be found. Please try again.
            </p>
            <Link href="/dashboard/orders" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
              ← Back to My Orders
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
