'use client'

import Button from '@/components/Button'
import Link from 'next/link'
import { ArrowLeft, Users, Briefcase } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, Suspense } from 'react'

function SignupChoiceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  // If user is already logged in, redirect them
  useEffect(() => {
    if (loading) return // Wait for auth to load
    
    // Check for type parameter first and redirect accordingly
    const type = searchParams?.get('type')
    if (type === 'pro') {
      router.push('/pro')
      return
    }
    
    if (user) {
      // User is already logged in - redirect to home
      router.push('/')
      return
    }
  }, [user, loading, router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex flex-col">
      {/* Header Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white hover:rounded-full transition"
          title="Go back"
        >
          <ArrowLeft size={24} className="text-primary" />
        </button>
        <Link href="/" className="px-4 py-2 bg-white text-primary rounded-full font-semibold hover:shadow-lg transition">
          Home
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-4xl">
          {/* Title */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-dark mb-4">
              Join Washlee
            </h1>
            <p className="text-xl text-gray">
              Choose how you'd like to get started
            </p>
          </div>

          {/* Two Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Customer Signup */}
            <Link href="/auth/signup-customer">
              <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full flex flex-col items-center justify-center cursor-pointer hover:-translate-y-2">
                <div className="bg-mint rounded-2xl p-6 mb-6 group-hover:bg-accent transition-colors duration-300">
                  <Users size={48} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-dark mb-3 text-center">
                  I'm a Customer
                </h2>
                <p className="text-gray text-center mb-8 flex-1">
                  Get your laundry picked up, washed, and delivered fresh to your door
                </p>
                <div className="w-full">
                  <Button variant="primary" size="lg" className="w-full">
                    Sign Up Now
                  </Button>
                </div>
              </div>
            </Link>

            {/* Washlee Pro Signup */}
            <Link href="/pro">
              <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full flex flex-col items-center justify-center cursor-pointer hover:-translate-y-2">
                <div className="bg-accent rounded-2xl p-6 mb-6 group-hover:bg-mint transition-colors duration-300">
                  <Briefcase size={48} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-dark mb-3 text-center">
                  I'm a Washlee Pro
                </h2>
                <p className="text-gray text-center mb-8 flex-1">
                  Earn money by offering professional laundry services in your area
                </p>
                <div className="w-full">
                  <Button variant="primary" size="lg" className="w-full">
                    Apply Now
                  </Button>
                </div>
              </div>
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-center text-gray text-sm mt-12">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupChoice() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#48C9B0] to-[#7FE3D3] rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray font-semibold">Loading...</p>
        </div>
      </div>
    }>
      <SignupChoiceContent />
    </Suspense>
  )
}
