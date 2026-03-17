'use client'

import Button from '@/components/Button'
import Link from 'next/link'
import { ArrowLeft, Users, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SigninChoice() {
  const router = useRouter()
  
  const handleBackClick = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex flex-col">
      {/* Header Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <button
          onClick={handleBackClick}
          className="p-2 hover:bg-white hover:rounded-full transition"
          title="Go back to home"
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
              Sign In to Washlee
            </h1>
            <p className="text-xl text-gray">
              Choose how you'd like to get started
            </p>
          </div>

          {/* Two Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Sign In */}
            <Link href="/auth/login">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full flex flex-col items-center justify-center cursor-pointer hover:scale-105">
                <div className="bg-mint rounded-full p-6 mb-6">
                  <Users size={48} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-dark mb-3 text-center">
                  Customer Sign In
                </h2>
                <p className="text-gray text-center mb-6">
                  Access your laundry orders, track pickups, and manage your preferences.
                </p>
                <div className="mt-auto">
                  <Button variant="primary" size="lg">
                    Sign In
                  </Button>
                </div>
              </div>
            </Link>

            {/* Washlee Pro Sign In */}
            <Link href="/auth/employee-signin">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full flex flex-col items-center justify-center cursor-pointer hover:scale-105">
                <div className="bg-accent rounded-full p-6 mb-6">
                  <Briefcase size={48} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-dark mb-3 text-center">
                  Washlee Pro Sign In
                </h2>
                <p className="text-gray text-center mb-6">
                  Access your professional dashboard, view available jobs, and manage your earnings.
                </p>
                <div className="mt-auto">
                  <Button variant="primary" size="lg">
                    Sign In
                  </Button>
                </div>
              </div>
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-center text-gray text-sm mt-12">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
