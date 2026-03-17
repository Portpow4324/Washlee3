'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Loyalty() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/wash-club')
  }, [router])

  return null
}
