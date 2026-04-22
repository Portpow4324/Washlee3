'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Spinner from '@/components/Spinner'

// Dynamically import the pro-signup-form page content to avoid code duplication
const ProSignupFormContent = dynamic(
  () => import('@/app/auth/pro-signup-form/page').then(mod => mod.default),
  { loading: () => <Spinner />, ssr: false }
)

interface ProSignupFormProps {
  onBack?: () => void
}

export default function ProSignupForm({ onBack }: ProSignupFormProps) {
  return (
    <div className="min-h-screen">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-10 p-2 hover:bg-white rounded-full transition"
        >
          ← Back
        </button>
      )}
      <Suspense fallback={<Spinner />}>
        <ProSignupFormContent />
      </Suspense>
    </div>
  )
}
