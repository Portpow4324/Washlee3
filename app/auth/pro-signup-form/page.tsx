'use client'

import Button from '@/components/Button'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Mail, Lock, User, Phone, MapPin, CheckCircle, ArrowLeft, Upload, Eye, EyeOff, HelpCircle, AlertCircle, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { AUSTRALIAN_STATES, validateAustralianPhone, formatAustralianPhone, validateEmail, getEmailSuggestions } from '@/lib/australianValidation'
import { WASHLEE_TERMS } from '@/lib/washleeTerms'
import { createEmployeeProfile, getCustomerProfile, upgradeCustomerToEmployee } from '@/lib/userManagement'

export default function ProSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const stepParam = searchParams?.get('step')
  const fromSignin = searchParams?.get('fromSignin') === 'true'
  
  const initialStep = stepParam ? parseInt(stepParam) : 0
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsScrolled, setTermsScrolled] = useState(false)
  const [redirectToProSignin, setRedirectToProSignin] = useState(false)

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
    phoneVerificationCode: '',
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
    // Inquiry form fields
    hasWorkRight: null as boolean | null,
    hasValidLicense: null as boolean | null,
    hasTransport: null as boolean | null,
    hasEquipment: null as boolean | null,
    ageVerified: null as boolean | null,
    skillsAssessment: '',
  })

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
        return (
          formData.firstName.trim() && 
          formData.lastName.trim() && 
          validateEmail(formData.email) &&
          validateAustralianPhone(formData.phone) &&
          formData.state && 
          termsAccepted // Must have accepted terms in modal
        )
      case 1: // Email confirmation - just show info, Next button will confirm
        return true
      case 2: // Phone verification - just need a valid code entered
        return formData.phoneVerificationCode.length === 6
      case 3: // ID verification - just show info, Next button will verify
        return true
      case 4: // Washlee intro (auto-pass)
        return true
      case 5: // Availability and details - optional fields so always true
        return true
      case 6: // Australian Workplace Verification
        return (
          formData.hasWorkRight === true &&
          formData.hasValidLicense === true &&
          formData.hasTransport === true &&
          formData.hasEquipment === true &&
          formData.ageVerified === true
        )
      case 7: // Skills Assessment
        return formData.skillsAssessment.trim().length >= 50
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (currentStep === 0) {
      // Create account on first step completion
      await handleCreateAccount()
    } else if (currentStep === 1) {
      // Email confirmation - mark as confirmed and move to next step
      setFormData({ ...formData, emailConfirmed: true })
      setTimeout(() => setCurrentStep(currentStep + 1), 100)
    } else if (currentStep === 2) {
      // Phone verification - verify and move to next step
      if (formData.phoneVerificationCode.length !== 6) {
        setError('Please enter a 6-digit verification code')
        return
      }
      setFormData({ ...formData, phoneVerified: true })
      setTimeout(() => setCurrentStep(currentStep + 1), 100)
    } else if (currentStep === 3) {
      // ID verification - mark as verified and move to next step
      setFormData({ ...formData, idVerified: true })
      setTimeout(() => setCurrentStep(currentStep + 1), 100)
    } else if (currentStep === 4) {
      // Auto-pass intro step
      setCurrentStep(currentStep + 1)
    } else if (currentStep === 5) {
      // Availability step - just move forward
      setCurrentStep(currentStep + 1)
    } else if (isStepValid()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        // Final submission - create inquiry
        await handleSubmitInquiry()
      }
    } else {
      setError('Please complete this step')
    }
  }

  const handleSubmitInquiry = async () => {
    setError('')
    setIsLoading(true)

    try {
      const currentUser = auth.currentUser
      console.log('[Form] Current user:', currentUser?.uid)
      if (!currentUser) throw new Error('User not found. Please log in again.')

      // If form fields are empty, try to fetch from customer profile
      let firstName = formData.firstName
      let lastName = formData.lastName
      let email = formData.email
      let phone = formData.phone
      let state = formData.state

      if (!firstName || !lastName || !email || !phone || !state) {
        console.log('[Form] Form data incomplete, fetching from customer profile...')
        try {
          const customerData = await getCustomerProfile(currentUser.uid)
          if (customerData) {
            firstName = firstName || customerData.firstName || ''
            lastName = lastName || customerData.lastName || ''
            email = email || customerData.email || currentUser.email || ''
            phone = phone || customerData.phone || ''
            state = state || customerData.state || ''
            console.log('[Form] Loaded customer data:', { firstName, lastName, email, phone, state })
          }
        } catch (err) {
          console.log('[Form] Could not fetch customer profile:', err)
        }
      }

      // Validate that all required fields are populated
      const missingFields = []
      if (!currentUser.uid) missingFields.push('userId')
      if (!firstName?.trim()) missingFields.push('firstName')
      if (!lastName?.trim()) missingFields.push('lastName')
      if (!email?.trim()) missingFields.push('email')
      if (!phone?.trim()) missingFields.push('phone')
      if (!state?.trim()) missingFields.push('state')

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}. Please go back to step 1 and fill in your information.`)
      }

      const inquiryPayload = {
        userId: currentUser.uid,
        firstName,
        lastName,
        email,
        phone,
        state,
        workVerification: {
          hasWorkRight: formData.hasWorkRight,
          hasValidLicense: formData.hasValidLicense,
          hasTransport: formData.hasTransport,
          hasEquipment: formData.hasEquipment,
          ageVerified: formData.ageVerified,
        },
        skillsAssessment: formData.skillsAssessment,
        availability: formData.availability,
        comments: formData.comments,
        createdAt: new Date().toISOString(),
        status: 'pending', // 'pending', 'under-review', 'approved', 'rejected'
      }

      console.log('[Form] Inquiry payload:', inquiryPayload)

      const inquiryResponse = await fetch('/api/inquiries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryPayload),
      })

      if (!inquiryResponse.ok) {
        const errorData = await inquiryResponse.json().catch(() => ({}))
        console.error('API Error Response:', {
          status: inquiryResponse.status,
          statusText: inquiryResponse.statusText,
          data: errorData,
        })
        throw new Error(`API Error: ${inquiryResponse.status} - ${errorData.error || 'Unknown error'}`)
      }

      const responseData = await inquiryResponse.json()
      console.log('Inquiry submitted successfully:', responseData)

      // Move to success screen
      setCurrentStep(steps.length)
    } catch (err: any) {
      console.error('Inquiry submission error:', err.message)
      setError(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsLoading(false)
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

        // Create employee profile in new system
        await createEmployeeProfile(userCredential.user.uid, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          state: formData.state,
          employmentType: 'contractor',
          status: 'pending',
          availability: formData.availability,
          applicationStep: 1,
        })

      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          // Email already exists - this customer wants to become an employee
          try {
            userCredential = await signInWithEmailAndPassword(
              auth,
              formData.email,
              formData.password
            )

            // Check if they already have an employee profile
            const existingCustomer = await getCustomerProfile(userCredential.user.uid)
            
            if (existingCustomer?.hasEmployeeProfile) {
              setError('This account is already registered as a Washlee Pro.')
              setIsLoading(false)
              return
            }

            if (existingCustomer) {
              // Upgrade customer to also have employee profile
              await upgradeCustomerToEmployee(userCredential.user.uid, {
                email: formData.email,
                firstName: formData.firstName || existingCustomer.firstName,
                lastName: formData.lastName || existingCustomer.lastName,
                phone: formData.phone || existingCustomer.phone,
                state: formData.state,
                employmentType: 'contractor',
                status: 'pending',
                availability: formData.availability,
                applicationStep: 1,
              })

              setSuccessMessage('Existing account upgraded to Pro! Moving to next step...')
            } else {
              setError('Account found but could not process. Please try again.')
              setIsLoading(false)
              return
            }
          } catch (signInErr: any) {
            if (signInErr.code === 'auth/wrong-password') {
              setError('Email exists. Please enter the correct password.')
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
          <div className="pt-4 border-t border-gray/20">
            <p className="text-xs text-gray text-center">
              Already have a customer account?{' '}
              <Link 
                href="/auth/login?redirect=/auth/pro-signup-form?step=1"
                className="text-primary font-semibold hover:underline"
              >
                Click here to sign in
              </Link>
            </p>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> In production, this would send a real confirmation email. For testing, marking as confirmed will allow you to proceed.
            </p>
          </div>
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
              name="phoneVerificationCode"
              value={formData.phoneVerificationCode}
              onChange={handleChange}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> For testing, enter any 6-digit code and click Next to proceed.
            </p>
          </div>
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
              <strong>Note:</strong> For testing, you can upload a file or click Next without uploading to proceed.
            </p>
          </div>
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
    {
      title: 'Australian Workplace Verification',
      description: 'Legal requirements to work in Australia',
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-dark">Please confirm you meet all Australian workplace requirements</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                Do you have the right to work in Australia (Australian citizen, PR, or valid visa)?*
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, hasWorkRight: true })}
                >
                  <input
                    type="radio"
                    name="hasWorkRight"
                    checked={formData.hasWorkRight === true}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, hasWorkRight: false })}
                >
                  <input
                    type="radio"
                    name="hasWorkRight"
                    checked={formData.hasWorkRight === false}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                Do you have a valid driver's license and are at least 18 years old?*
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, hasValidLicense: true })}
                >
                  <input
                    type="radio"
                    name="hasValidLicense"
                    checked={formData.hasValidLicense === true}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, hasValidLicense: false })}
                >
                  <input
                    type="radio"
                    name="hasValidLicense"
                    checked={formData.hasValidLicense === false}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                Do you have reliable transportation for pickups and deliveries?*
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, hasTransport: true })}
                >
                  <input
                    type="radio"
                    name="hasTransport"
                    checked={formData.hasTransport === true}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, hasTransport: false })}
                >
                  <input
                    type="radio"
                    name="hasTransport"
                    checked={formData.hasTransport === false}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                Do you have access to laundry equipment (washing machines, dryers)?*
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, hasEquipment: true })}
                >
                  <input
                    type="radio"
                    name="hasEquipment"
                    checked={formData.hasEquipment === true}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, hasEquipment: false })}
                >
                  <input
                    type="radio"
                    name="hasEquipment"
                    checked={formData.hasEquipment === false}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark mb-3">
                I confirm that all information provided is true and accurate*
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, ageVerified: true })}
                >
                  <input
                    type="radio"
                    name="ageVerified"
                    checked={formData.ageVerified === true}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">I Confirm</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setFormData({ ...formData, ageVerified: false })}
                >
                  <input
                    type="radio"
                    name="ageVerified"
                    checked={formData.ageVerified === false}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <span className="text-dark font-medium">I Do Not Confirm</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Skills & Experience Assessment',
      description: 'Tell us about your laundry service skills',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              What laundry service skills and experience do you have?*
            </label>
            <p className="text-sm text-gray mb-4">
              Describe your experience with professional laundry services, garment care, stain removal, or any relevant skills.
            </p>
            <textarea
              name="skillsAssessment"
              value={formData.skillsAssessment}
              onChange={handleChange}
              placeholder="e.g., 5 years experience in dry cleaning, expert in stain removal, trained in delicate fabric care, etc."
              rows={6}
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
            <p className="text-xs text-gray mt-2">Minimum 50 characters required</p>
          </div>
        </div>
      ),
    },
  ]

  // Success screen
  if (currentStep === steps.length) {
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
            <Link href="/pro-support/help-center" className="inline-block mt-8">
              <Button>Access Help Center</Button>
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
          {/* Logo - Clickable to Home */}
          <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition">
            <Image
              src="/logo-washlee.png"
              alt="Washlee"
              width={40}
              height={40}
              className="w-10 h-10"
            />
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
                  
                  // If user clicked "Already have account" link, redirect them to pro-signin
                  if (redirectToProSignin) {
                    setRedirectToProSignin(false)
                    setTimeout(() => {
                      router.push('/auth/pro-signin')
                    }, 500)
                  }
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
