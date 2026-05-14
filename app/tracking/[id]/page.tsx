'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TrackingByIdRedirect() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string

  useEffect(() => {
    if (orderId) {
      router.replace(`/tracking?orderId=${orderId}`)
    }
  }, [orderId, router])

  return (
    <div className="min-h-screen flex items-center justify-center text-gray">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">Opening your order…</p>
      </div>
    </div>
  )
}
