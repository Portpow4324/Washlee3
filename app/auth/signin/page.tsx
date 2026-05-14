'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Users, Briefcase } from 'lucide-react'

export default function SignInChoicePage() {
  return (
    <main className="min-h-screen bg-soft-hero flex flex-col">
      <header className="container-page py-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-deep font-semibold hover:text-primary transition"
        >
          <ArrowLeft size={18} />
          Back to home
        </Link>
        <Link href="/auth/signup-customer" className="text-sm font-semibold text-gray hover:text-primary-deep transition">
          Sign up
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-3xl animate-slide-up">
          <div className="text-center mb-10">
            <h1 className="h2 text-dark mb-3">Sign in to Washlee</h1>
            <p className="text-gray text-base sm:text-lg max-w-md mx-auto">
              Choose how you want to sign in. Your customer and Pro accounts can share an email.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/auth/login"
              className="group surface-card p-7 sm:p-8 hover:border-primary hover:shadow-glow transition-all"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-mint flex items-center justify-center">
                  <Users size={22} className="text-primary-deep" />
                </div>
                <ArrowRight size={20} className="text-gray-soft group-hover:text-primary-deep transition" />
              </div>
              <h2 className="text-xl font-bold text-dark mb-1.5">Customer sign in</h2>
              <p className="text-sm text-gray leading-relaxed">
                Book pickups, track orders, manage saved addresses, and earn Wash Club points.
              </p>
            </Link>

            <Link
              href="/auth/employee-signin"
              className="group surface-card p-7 sm:p-8 hover:border-primary hover:shadow-glow transition-all"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center">
                  <Briefcase size={22} className="text-white" />
                </div>
                <ArrowRight size={20} className="text-gray-soft group-hover:text-primary-deep transition" />
              </div>
              <h2 className="text-xl font-bold text-dark mb-1.5">Pro sign in</h2>
              <p className="text-sm text-gray leading-relaxed">
                Accept jobs, track earnings, and manage your pickups. Use your 6-digit Pro ID.
              </p>
            </Link>
          </div>

          <p className="text-center text-sm text-gray mt-8">
            New to Washlee?{' '}
            <Link href="/auth/signup-customer" className="text-primary-deep font-semibold hover:underline">
              Create a customer account
            </Link>{' '}
            or{' '}
            <Link href="/pro" className="text-primary-deep font-semibold hover:underline">
              apply to become a Pro
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
