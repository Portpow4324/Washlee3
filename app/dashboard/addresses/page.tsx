'use client'

import { useAuth } from '@/lib/AuthContext'
import Footer from '@/components/Footer'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { MapPin, AlertCircle } from 'lucide-react'

export default function ManageAddresses() {
  const { loading: authLoading, user } = useAuth()

  if (authLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-dark mb-4">Sign In Required</h1>
            <Link href="/auth/login" className="text-primary hover:text-accent font-medium">
              Sign In →
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-mint to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-dark mb-2">Delivery Addresses</h1>
                <p className="text-gray">Manage your delivery and pickup locations</p>
              </div>
              <Link href="/dashboard" className="text-primary hover:text-accent font-semibold">
                ← Dashboard
              </Link>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <div className="flex gap-4">
              <MapPin size={24} className="text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Address Management Coming Soon</h3>
                <p className="text-blue-700 mb-4">
                  You'll be able to save and manage multiple delivery addresses here. For now, you can specify your address when placing an order.
                </p>
                <Link href="/booking" className="text-blue-600 font-semibold hover:underline">
                  Schedule a Pickup →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
