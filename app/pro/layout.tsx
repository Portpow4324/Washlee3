'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import ProHeader from '@/components/ProHeader'

export default function ProLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userData, loading } = useAuth()

  // Only protect dashboard routes, not the public /pro page
  const isPublicProPage = pathname === '/pro'

  useEffect(() => {
    if (!loading) {
      // If on public page, no auth needed
      if (isPublicProPage) {
        return
      }

      // If not logged in, redirect to login
      if (!user) {
        router.push('/auth/login')
        return
      }

      // If logged in but NOT a Pro user, redirect to customer dashboard
      if (userData?.userType !== 'pro') {
        router.push('/dashboard')
        return
      }
    }
  }, [user, userData, loading, router, isPublicProPage])

  if (!isPublicProPage && loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 bg-primary rounded-full animate-pulse mb-4"></div>
          <p className="text-dark font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isPublicProPage && (!user || userData?.userType !== 'pro')) {
    return null
  }

  // Return public page without ProHeader
  if (isPublicProPage) {
    return <>{children}</>
  }

  // Return protected dashboard with ProHeader
  return (
    <div className="min-h-screen bg-light">
      <ProHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
