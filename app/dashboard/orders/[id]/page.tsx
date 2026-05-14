'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function OrderDetailRedirect() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string

  useEffect(() => {
    if (orderId) {
      router.replace(`/tracking?orderId=${orderId}`)
    }
  }, [orderId, router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="surface-card max-w-md w-full p-8 text-center">
        {orderId ? (
          <>
            <div className="animate-spin inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-gray text-sm">Opening your order…</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-dark mb-2">Order not found</h1>
            <p className="text-gray text-sm mb-5">We couldn&rsquo;t find that order ID.</p>
            <Link
              href="/dashboard/orders"
              className="btn-primary inline-flex"
            >
              <ArrowLeft size={16} />
              Back to my orders
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
