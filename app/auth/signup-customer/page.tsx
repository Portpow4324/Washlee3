'use client'

import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle, ArrowLeft, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export default function SignupCustomer() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    personalUse: '',
    ageOver65: false,
    marketingTexts: false,
    accountTexts: false,
    selectedPlan: 'none',
  })

  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Password validation helpers
  const validatePassword = (pwd: string) => ({
    hasLength: pwd.length >= 8,
    hasNumber: /\d/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  })

  const passwordRules = validatePassword(formData.password)
  const isPasswordValid = Object.values(passwordRules).every(Boolean)

  const steps = [
    {
      title: 'Create Your Account',
      description: 'Get started with your email and password',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Email*</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Password*</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-primary"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-dark">Passwords must include:</p>
              <div className="space-y-1">
                {[
                  { key: 'hasLength', label: '8+ Characters' },
                  { key: 'hasNumber', label: '1 Number' },
                  { key: 'hasLower', label: '1 Lowercase Letter' },
                  { key: 'hasUpper', label: '1 Uppercase Letter' },
                  { key: 'hasSpecial', label: '1 Special Character' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    {passwordRules[key as keyof typeof passwordRules] ? (
                      <CheckCircle size={16} className="text-primary flex-shrink-0" />
                    ) : (
                      <X size={16} className="text-gray flex-shrink-0" />
                    )}
                    <span className={`text-sm ${passwordRules[key as keyof typeof passwordRules] ? 'text-primary' : 'text-gray'}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Confirm Password*</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Introduce yourself',
      description: 'Who do we have the pleasure of serving?',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">First Name*</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Last Name*</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
            onClick={() => setFormData({ ...formData, personalUse: 'personal' })}
          >
            <input
              type="radio"
              name="usage"
              value="personal"
              checked={formData.personalUse === 'personal'}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <span className="font-semibold text-dark">Personal</span>
          </label>
          <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setFormData({ ...formData, personalUse: 'business' })}
          >
            <input
              type="radio"
              name="usage"
              value="business"
              checked={formData.personalUse === 'business'}
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
            onClick={() => setFormData({ ...formData, ageOver65: false })}
          >
            <input
              type="radio"
              name="age"
              checked={formData.ageOver65 === false}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <span className="font-semibold text-dark">No</span>
          </label>
          <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setFormData({ ...formData, ageOver65: true })}
          >
            <input
              type="radio"
              name="age"
              checked={formData.ageOver65 === true}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <span className="font-semibold text-dark">Yes</span>
          </label>
        </div>
      ),
    },
    {
      title: 'Choose Your Plan',
      description: 'Select a subscription to get started or choose to pay per order',
      content: (
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setFormData({ ...formData, selectedPlan: 'none' })}
          >
            <input
              type="radio"
              name="plan"
              value="none"
              checked={formData.selectedPlan === 'none'}
              onChange={() => {}}
              className="w-4 h-4 mt-1"
            />
            <div>
              <span className="font-semibold text-dark block">Pay Per Order</span>
              <span className="text-sm text-gray">No commitment, pay as you go</span>
            </div>
          </label>
          <label className="flex items-start gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setFormData({ ...formData, selectedPlan: 'starter' })}
          >
            <input
              type="radio"
              name="plan"
              value="starter"
              checked={formData.selectedPlan === 'starter'}
              onChange={() => {}}
              className="w-4 h-4 mt-1"
            />
            <div>
              <span className="font-semibold text-dark block">Starter Plan - $9.99/month</span>
              <span className="text-sm text-gray">Unlimited orders, discounts on add-ons</span>
            </div>
          </label>
          <label className="flex items-start gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setFormData({ ...formData, selectedPlan: 'professional' })}
          >
            <input
              type="radio"
              name="plan"
              value="professional"
              checked={formData.selectedPlan === 'professional'}
              onChange={() => {}}
              className="w-4 h-4 mt-1"
            />
            <div>
              <span className="font-semibold text-dark block">Professional Plan - $19.99/month</span>
              <span className="text-sm text-gray">Premium services, priority support</span>
            </div>
          </label>
          <label className="flex items-start gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
            onClick={() => setFormData({ ...formData, selectedPlan: 'washly' })}
          >
            <input
              type="radio"
              name="plan"
              value="washly"
              checked={formData.selectedPlan === 'washly'}
              onChange={() => {}}
              className="w-4 h-4 mt-1"
            />
            <div>
              <span className="font-semibold text-dark block">Washly Plan - $49.99/month</span>
              <span className="text-sm text-gray">All premium features, concierge service</span>
            </div>
          </label>
        </div>
      ),
    },
  ]

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.email && formData.password && formData.confirmPassword && isPasswordValid && formData.password === formData.confirmPassword
      case 1:
        return formData.firstName.trim() && formData.lastName.trim()
      case 2:
        return formData.personalUse
      case 3:
        return formData.ageOver65 !== undefined
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (isStepValid()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        // Reached final step - create account
        await handleCreateAccount()
      }
    } else {
      setError('Please complete this step')
    }
  }

  const handleCreateAccount = async () => {
    setError('')
    setIsLoading(true)

    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Missing required information.')
        setIsLoading(false)
        return
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim()

      // Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // Create Firestore user document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || '',
        personalUse: formData.personalUse,
        ageOver65: formData.ageOver65,
        marketingTexts: formData.marketingTexts,
        accountTexts: formData.accountTexts,
        selectedPlan: formData.selectedPlan,
        userType: 'customer',
        createdAt: new Date().toISOString(),
        profileComplete: true,
      })

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard/customer')
      }, 1500)
    } catch (err: any) {
      console.error('Signup error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please try another.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak.')
      } else {
        setError(err.message || 'Failed to create account')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStep === steps.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <CheckCircle size={64} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-dark mb-3">Account Created!</h1>
            <p className="text-gray mb-6">Welcome to Washlee. Your account is all set up.</p>
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
        onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : router.back()}
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
              onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : router.back()}
              className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Back
            </button>
            <Button
              onClick={handleNext}
              size="lg"
              className="flex-1"
              disabled={!isStepValid() || isLoading}
            >
              {isLoading ? <Spinner /> : (currentStep === steps.length - 1 ? 'Create Account' : 'Next')}
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
