'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted or dismissed cookies
    const cookieConsent = localStorage.getItem('cookieConsent')
    if (!cookieConsent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setIsVisible(false)
  }

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected')
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary shadow-2xl z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-dark mb-1">Cookie Consent</h3>
            <p className="text-gray text-sm">
              We use cookies to enhance your experience, analyze site usage, and deliver personalized ads. By accepting, you consent to our use of cookies. See our{' '}
              <Link href="/cookie-policy" className="text-primary underline hover:text-primary font-semibold">
                Cookie Policy
              </Link>{' '}
              for details.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-dark bg-gray-200 rounded-full hover:bg-gray-300 transition font-semibold text-sm whitespace-nowrap"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-primary text-white rounded-full hover:bg-opacity-90 transition font-bold text-sm whitespace-nowrap"
            >
              Accept All
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 md:hidden text-gray hover:text-dark transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
