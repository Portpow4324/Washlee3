'use client'

import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Mail, Lock, User, Phone, MapPin, CheckCircle, ArrowLeft, Upload, Eye, EyeOff, HelpCircle, Home, AlertCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { AUSTRALIAN_STATES, validateAustralianPhone, formatAustralianPhone, validateEmail, getEmailSuggestions } from '@/lib/australianValidation'
import { WASHLEE_TERMS } from '@/lib/washleeTerms'

export default function ProSignupForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsScrolled, setTermsScrolled] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    state: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    emailConfirmed: false,
    phoneVerified: false,
    idVerified: false,
    idFile: null as File | null,
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    comments: '',
  })

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      if (name.startsWith('availability.')) {
        const day = name.split('.')[1]
        setFormData({
          ...formData,
          availability: { ...formData.availability, [day]: checked }
        })
      } else {
        setFormData({ ...formData, [name]: checked })
      }
    } else {
      setFormData({ ...formData, [name]: value })
      
      // Handle email suggestions
      if (name === 'email') {
        if (value.length > 1) {
          const suggestions = getEmailSuggestions(value)
          setEmailSuggestions(suggestions)
          setShowEmailSuggestions(suggestions.length > 0)
        } else {
          setShowEmailSuggestions(false)
        }
      }
    }
  }

  const handleEmailSuggestionClick = (email: string) => {
    setFormData({ ...formData, email })
    setShowEmailSuggestions(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, idFile: e.target.files[0] })
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Initial application form
        return formData.firstName && 
               formData.lastName && 
               validateEmail(formData.email) &&
               validateAustralianPhone(formData.phone) &&
               formData.state && 
               formData.termsAccepted &&
               termsAccepted // Must have accepted terms in modal
      case 1: // Email confirmation
        return formData.emailConfirmed
      case 2: // Phone verification
        return formData.phoneVerified
      case 3: // ID verification
        return formData.idVerified
      case 4: // Washlee intro (auto-pass)
        return true
      case 5: // Availability and details
        return formData.firstName && formData.lastName
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (currentStep === 0) {
      // Create account on first step completion
      await handleCreateAccount()
    } else if (isStepValid()) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1)
      } else {
        // Final submission
        await handleFinalSubmission()
      }
    } else {
      setError('Please complete this step')
    }
  }

  const handleCreateAccount = async () => {
    setError('')
    setIsLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }

      if (!isPasswordValid) {
        setError('Password does not meet requirements')
        setIsLoading(false)
        return
      }

      let userCredential

      try {
        // Try to create new account
        userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        )

        // Create initial Firestore document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          state: formData.state,
          userType: 'pro',
          createdAt: new Date().toISOString(),
          proApplicationStep: 1,
        })
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          // Email already exists - this customer wants to become a Pro
          // Try to sign in with existing credentials first
          try {
            userCredential = await signInWithEmailAndPassword(
              auth,
              formData.email,
              formData.password
            )

            // Check if they're already a Pro
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
            if (userDoc.exists() && userDoc.data().userType === 'pro') {
              setError('This account is already registered as a Washlee Pro.')
              setIsLoading(false)
              return
            }

            // Update existing customer account to Pro
            const existingData = userDoc.data()
            await updateDoc(doc(db, 'users', userCredential.user.uid), {
              userType: 'pro',
              proApplicationStep: 1,
              proApplicationDate: new Date().toISOString(),
              // Update with any new pro info if provided
              firstName: formData.firstName || existingData?.firstName || '',
              lastName: formData.lastName || existingData?.lastName || '',
              phone: formData.phone || existingData?.phone || '',
              state: formData.state || existingData?.state || '',
            })

            setSuccessMessage('Existing account upgraded to Pro! Moving to next step...')
          } catch (signInErr: any) {
            if (signInErr.code === 'auth/wrong-password') {
              setError('Email exists as a customer account. Please enter the correct password.')
            } else if (signInErr.code === 'auth/user-not-found') {
              setError('Account not found.')
            } else {
              setError('Unable to access existing account. Please try again.')
            }
            setIsLoading(false)
            return
          }
        } else if (createErr.code === 'auth/weak-password') {
          setError('Password is too weak.')
          setIsLoading(false)
          return
        } else {
          setError(createErr.message || 'Failed to create account')
          setIsLoading(false)
          return
        }
      }

      setCurrentStep(1)
      if (!userCredential) {
        setError('Failed to process account')
        setIsLoading(false)
        return
      }
      
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to process signup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinalSubmission = async () => {
    setError('')
    setIsLoading(true)

    try {
      // In a real app, you would update the user document with final data
      // For now, we'll just show success
      setCurrentStep(6) // Success screen
    } catch (err: any) {
      setError('Failed to submit application')
    } finally {
      setIsLoading(false)
    }
  }

  // Step configurations
  const steps = [
    {
      title: 'Tell us about yourself',
      description: 'We\'ll verify your information to get you started',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">First Name*</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Last Name*</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Email*</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@gmail.com"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              {!validateEmail(formData.email) && formData.email && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>Please enter a valid email address</span>
                </div>
              )}
              {showEmailSuggestions && emailSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray rounded-lg shadow-lg z-10">
                  {emailSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEmailSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-light transition text-sm text-dark"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Phone Number (Australian)*</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="02 XXXX XXXX or 04XX XXX XXX"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              {!validateAustralianPhone(formData.phone) && formData.phone && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>Please enter a valid Australian phone number (e.g., 02 XXXX XXXX or 04XX XXX XXX)</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Select Your State*</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                required
              >
                <option value="">Choose a state...</option>
                {AUSTRALIAN_STATES.map(state => (
                  <option key={state.code} value={state.code}>{state.name} ({state.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Create Password*</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
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
                      <span className="text-gray text-sm">✕</span>
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
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div className="flex items-start gap-3 py-2">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted && termsAccepted}
              onChange={(e) => {
                const checked = e.target.checked
                if (checked && !termsAccepted) {
                  // Open modal without changing checkbox yet
                  setShowTermsModal(true)
                  setTermsScrolled(false)
                } else {
                  // Allow unchecking
                  setFormData({ ...formData, termsAccepted: false })
                  setTermsAccepted(false)
                }
              }}
              className="w-4 h-4 rounded border-gray mt-1"
              required
            />
            <span className="text-xs text-gray">
              I agree to the <button type="button" onClick={() => { setShowTermsModal(true); setTermsScrolled(false) }} className="text-primary hover:underline">Terms & Conditions</button> and <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Confirmation Email Sent',
      description: `A confirmation link was sent to ${formData.email}`,
      content: (
        <div className="space-y-6">
          <div className="bg-mint/30 border-2 border-primary rounded-lg p-6 text-center">
            <Mail size={48} className="text-primary mx-auto mb-4" />
            <h3 className="font-bold text-dark mb-2">Check Your Email</h3>
            <p className="text-gray text-sm mb-4">
              A confirmation link was sent to <strong>{formData.email}</strong>. Click the link in your email to verify your address.
            </p>
            <p className="text-gray text-xs">
              Once verified, click the button below to continue.
            </p>
          </div>
          <button
            onClick={() => setFormData({ ...formData, emailConfirmed: true })}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-accent transition flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            I've Confirmed My Email
          </button>
          <p className="text-center text-gray text-sm">
            Typical response time: 24-48 hours
          </p>
        </div>
      ),
    },
    {
      title: 'Verify Your Phone',
      description: 'Enter the verification code we sent to your phone',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Phone Verification Code</label>
            <p className="text-sm text-gray mb-3">
              We sent a verification code to <strong>{formData.phone}</strong>
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Firebase phone verification setup required. Placeholder for now.
            </p>
          </div>
          <button
            onClick={() => setFormData({ ...formData, phoneVerified: true })}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-accent transition"
          >
            Verify Phone Number
          </button>
        </div>
      ),
    },
    {
      title: 'ID Verification',
      description: 'Upload a clear photo of your ID',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Upload ID Document</label>
            <p className="text-sm text-gray mb-4">
              Please upload a clear photo of your driver's license or government-issued ID.
            </p>
            <div className="border-2 border-dashed border-gray rounded-lg p-8 text-center">
              <Upload size={48} className="text-gray mx-auto mb-4" />
              <label className="cursor-pointer">
                <p className="font-semibold text-dark mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-gray">PNG, JPG, GIF up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            {formData.idFile && (
              <p className="text-sm text-primary mt-2">
                ✓ File selected: {formData.idFile.name}
              </p>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Firebase Storage setup required. Placeholder for now.
            </p>
          </div>
          <button
            onClick={() => setFormData({ ...formData, idVerified: true })}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-accent transition"
          >
            Verify ID
          </button>
        </div>
      ),
    },
    {
      title: 'Washlee Pro Introduction',
      description: 'Learn about our program and best practices',
      content: (
        <div className="space-y-6">
          <div className="bg-light rounded-lg p-6">
            <h4 className="font-bold text-dark mb-3">Welcome to Washlee Pro!</h4>
            <p className="text-gray text-sm mb-4">
              You're about to join a community of professional laundry service providers. Here's what you need to know:
            </p>
            <ul className="space-y-2 text-sm text-gray">
              <li className="flex gap-2">
                <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <span>Provide high-quality laundry services</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <span>Build your reputation through ratings</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <span>Earn competitive rates</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <span>Work on your own schedule</span>
              </li>
            </ul>
          </div>
          <div className="bg-accent/20 rounded-lg p-6">
            <h4 className="font-bold text-dark mb-3">📺 Practice Videos & Getting Started Guide</h4>
            <p className="text-gray text-sm">
              You now have access to our complete training materials including:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray">
              <li>• Best practices for laundry handling</li>
              <li>• Customer communication tips</li>
              <li>• Using the Washlee Pro app</li>
              <li>• 10-minute getting started guide</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Your Availability & Contact Info',
      description: 'Tell us when you\'re available to work',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-dark mb-4">When are you available?</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(formData.availability).map((day) => (
                <label key={day} className="flex items-center gap-2 p-3 border border-gray rounded-lg hover:bg-light transition cursor-pointer">
                  <input
                    type="checkbox"
                    name={`availability.${day}`}
                    checked={formData.availability[day as keyof typeof formData.availability]}
                    onChange={handleChange}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-semibold text-dark capitalize">{day}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Any Additional Comments</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              placeholder="Tell us how we can better serve you or any questions you have..."
              rows={4}
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      ),
    },
  ]

  // Success screen
  if (currentStep === 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <CheckCircle size={64} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-dark mb-3">Thanks for Applying!</h1>
            <p className="text-gray mb-2">An Agent will get into contact with you shortly.</p>
            <p className="text-sm text-gray">Typical response time: 24-48 hours</p>
            <Link href="/" className="inline-block mt-8">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray/20 py-4 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Brand Name - Clickable to Help Center */}
          <Link href="/pro-support/help-center" className="flex items-center gap-2 group">
            <div className="bg-primary rounded-lg p-2">
              <Home size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-dark group-hover:text-primary transition">Washlee</span>
          </Link>

          {/* Help Icon Button */}
          <button
            onClick={() => router.push('/pro-support/help-center')}
            className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition"
            title="Help Center"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <button
          onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : router.back()}
          className="absolute top-20 left-6 p-2 hover:bg-white rounded-full transition"
          title="Go back"
        >
          <ArrowLeft size={24} className="text-primary" />
        </button>
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

          {/* Success */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {successMessage}
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
              className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition flex items-center justify-center gap-2"
            >
              Back
            </button>
            <Button
              onClick={handleNext}
              size="lg"
              className="flex-1 flex items-center justify-center gap-2"
              disabled={!isStepValid() || isLoading}
            >
              {isLoading ? <Spinner /> : 'Next'}
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

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray/20">
              <h2 className="text-2xl font-bold text-dark">Terms & Conditions</h2>
              <button
                onClick={() => {
                  setShowTermsModal(false)
                }}
                className="p-2 hover:bg-light rounded-full transition"
              >
                <X size={24} className="text-dark" />
              </button>
            </div>

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto p-6 text-sm text-gray space-y-6"
              onScroll={(e) => {
                const element = e.currentTarget
                const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
                setTermsScrolled(isAtBottom)
              }}
            >
              <div className="prose prose-sm max-w-none text-gray whitespace-pre-wrap">
                {WASHLEE_TERMS}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray/20 p-6 bg-light/30 flex gap-3">
              <button
                onClick={() => {
                  setShowTermsModal(false)
                  // Don't change formData, user can try again
                }}
                className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-white transition"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  setTermsAccepted(true)
                  setFormData({ ...formData, termsAccepted: true })
                  setShowTermsModal(false)
                }}
                disabled={!termsScrolled}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  termsScrolled
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray/20 text-gray cursor-not-allowed'
                }`}
              >
                {termsScrolled ? 'I Accept' : 'Scroll to Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
