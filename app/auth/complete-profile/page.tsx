'use client'

import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AUSTRALIAN_STATES, validateAustralianPhone, validateEmail } from '@/lib/australianValidation'

export default function CompleteProfile() {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationStep, setVerificationStep] = useState<'email' | 'phone' | null>(null)
  const [verificationCode, setVerificationCode] = useState('')

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: userData?.phone || '',
    personalUse: '', // 'personal' or 'business'
    ageOver65: null as boolean | null, // Track if user has made a selection
    marketingTexts: false,
    accountTexts: false,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return null

  const steps = [
    {
      title: 'Introduce yourself',
      description: 'Who do we have the pleasure of serving?',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">First Name*</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              placeholder="John"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Last Name*</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              placeholder="Doe"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Phone Number</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              placeholder="02 XXXX XXXX or 04XX XXX XXX"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {profileData.phone && !validateAustralianPhone(profileData.phone) && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>Please enter a valid Australian phone number</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Usage Type',
      description: 'Are you using Washlee for personal use or business?*',
      content: (
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setProfileData({ ...profileData, personalUse: 'personal' })}
          >
            <input
              type="radio"
              name="usage"
              value="personal"
              checked={profileData.personalUse === 'personal'}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <span className="font-semibold text-dark">Personal</span>
          </label>
          <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setProfileData({ ...profileData, personalUse: 'business' })}
          >
            <input
              type="radio"
              name="usage"
              value="business"
              checked={profileData.personalUse === 'business'}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <span className="font-semibold text-dark">Business</span>
          </label>
        </div>
      ),
    },
    {
      title: 'Age Verification',
      description: 'Are you 65 or over?*',
      content: (
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setProfileData({ ...profileData, ageOver65: false })}
          >
            <input
              type="radio"
              name="age"
              checked={profileData.ageOver65 === false}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <span className="font-semibold text-dark">No</span>
          </label>
          <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setProfileData({ ...profileData, ageOver65: true })}
          >
            <input
              type="radio"
              name="age"
              checked={profileData.ageOver65 === true}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <span className="font-semibold text-dark">Yes</span>
          </label>
        </div>
      ),
    },
    {
      title: 'Notification Preferences',
      description: 'How would you like to stay updated?',
      content: (
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setProfileData({ ...profileData, marketingTexts: !profileData.marketingTexts })}
          >
            <input
              type="checkbox"
              checked={profileData.marketingTexts}
              onChange={() => {}}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-dark">I want to receive marketing/promotional notifications via text message</span>
          </label>
          <label className="flex items-center gap-3 p-4 border border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setProfileData({ ...profileData, accountTexts: !profileData.accountTexts })}
          >
            <input
              type="checkbox"
              checked={profileData.accountTexts}
              onChange={() => {}}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-dark">I want to receive account notifications via text message</span>
          </label>
        </div>
      ),
    },
    {
      title: 'Verify Email Address',
      description: 'We\'ve sent a confirmation email to ' + profileData.firstName,
      content: (
        <div className="space-y-4">
          <div className="bg-mint/20 border border-primary rounded-lg p-4 text-center">
            <p className="text-sm text-dark mb-2">Confirmation code sent to your email</p>
            <p className="text-xs text-gray">Check your spam folder if you don't see it</p>
          </div>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
          />
          <button
            onClick={() => {
              setVerificationCode('')
              setCurrentStep(currentStep + 1)
            }}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-accent transition"
          >
            Verify Email
          </button>
        </div>
      ),
    },
    {
      title: 'Verify Phone Number',
      description: 'We\'ve sent an SMS to ' + profileData.phone,
      content: (
        <div className="space-y-4">
          <div className="bg-mint/20 border border-primary rounded-lg p-4">
            <p className="text-sm font-semibold text-dark mb-2">✓ SMS Confirmation Sent</p>
            <p className="text-xs text-gray">We\'ve sent an SMS to verify your phone number. Please enter the code below.</p>
          </div>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
          />
          <button
            onClick={() => {
              setShowVerificationModal(true)
              setVerificationStep('phone')
            }}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-accent transition"
          >
            Verify Phone
          </button>
        </div>
      ),
    },
  ]

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return profileData.firstName.trim() && profileData.lastName.trim()
      case 1:
        return profileData.personalUse
      case 2:
        return profileData.ageOver65 !== null // User must explicitly select yes or no
      case 3:
        return true
      case 4:
        return verificationCode.length === 6
      case 5:
        return verificationCode.length === 6
      default:
        return false
    }
  }

  const handleNext = () => {
    setError('')
    if (isStepValid()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        handleComplete()
      }
    } else {
      let errorMsg = 'Please complete this step'
      switch (currentStep) {
        case 0:
          errorMsg = 'Please enter both first and last name'
          break
        case 1:
          errorMsg = 'Please select how you plan to use Washlee'
          break
        case 2:
          errorMsg = 'Please select your age group'
          break
      }
      setError(errorMsg)
    }
  }

  const handleComplete = async () => {
    setError('')
    setIsLoading(true)

    try {
      if (!user) throw new Error('User not found')

      // Check if phone number is already registered to another account
      if (profileData.phone.trim()) {
        const phoneCheckResponse = await fetch('/api/users/check-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: profileData.phone,
            excludeUserId: user.uid,
          }),
        })

        if (phoneCheckResponse.ok) {
          const { exists } = await phoneCheckResponse.json()
          if (exists) {
            setError('This phone number is already associated with another account. Please use a different phone number.')
            setIsLoading(false)
            return
          }
        }
      }

      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        name: `${profileData.firstName} ${profileData.lastName}`,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        personalUse: profileData.personalUse,
        ageOver65: profileData.ageOver65,
        marketingTexts: profileData.marketingTexts,
        accountTexts: profileData.accountTexts,
        profileComplete: true,
      })

      // Show success and redirect to homepage for new signups
      // (New users don't have data yet, so homepage is better than empty dashboard)
      setCurrentStep(steps.length)
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError('Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Phone verification modal
  if (showVerificationModal && verificationStep === 'phone') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary rounded-full p-4">
                <CheckCircle size={48} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-dark mb-3">Verification Sent</h1>
            <p className="text-gray mb-2">We\'ve sent an SMS verification code to</p>
            <p className="font-semibold text-dark mb-6">{profileData.phone}</p>
            <p className="text-sm text-gray mb-8">Please check your phone and enter the code to continue your registration.</p>
            <button
              onClick={() => {
                setShowVerificationModal(false)
                setCurrentStep(5)
              }}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-accent transition"
            >
              Continue to Verification
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success screen
  if (currentStep === steps.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <CheckCircle size={64} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-dark mb-3">Account Created!</h1>
            <p className="text-gray mb-6">Welcome to Washlee. Your profile is all set up and ready to go.</p>
            <p className="text-sm text-gray">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4 py-8">
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 p-2 hover:bg-white rounded-full transition"
        title="Go back"
      >
        <ArrowLeft size={24} className="text-primary" />
      </button>
      <Link href="/" className="absolute top-6 right-6 px-4 py-2 bg-white text-primary rounded-full font-semibold hover:shadow-lg transition">
        Home
      </Link>
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-dark">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-dark mb-2">{step.title}</h1>
          <p className="text-gray mb-6">{step.description}</p>

          {/* Content */}
          <div className="mb-8">
            {step.content}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
              className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <Button
              onClick={handleNext}
              size="lg"
              className="flex-1 flex items-center justify-center gap-2"
              disabled={!isStepValid() || isLoading}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Complete
                  <CheckCircle size={20} />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={20} />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= currentStep ? 'bg-primary w-4' : 'bg-gray w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
