'use client'

export const dynamic = 'force-dynamic'

import Spinner from '@/components/Spinner'
import Button from '@/components/Button'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { Mail, Lock, User, Phone, MapPin, CheckCircle, ArrowLeft, Upload, Eye, EyeOff, HelpCircle, AlertCircle, X, Info, Clock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AUSTRALIAN_STATES, validateAustralianPhone, formatAustralianPhone, validateEmail, getEmailSuggestions } from '@/lib/australianValidation'
import { WASHLEE_TERMS } from '@/lib/washleeTerms'
import { createEmployeeProfile, getCustomerProfile } from '@/lib/userManagement'
import { requestVerificationCode, verifyCode, isAdminUser, getVerificationCodeForTesting } from '@/lib/verification'
import { useAuth } from '@/lib/AuthContext'
import { getAddressDetails, AddressParts } from '@/lib/googlePlaces'
import { supabase } from '@/lib/supabaseClient'

function ProSignupFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const stepParam = searchParams?.get('step')
  const fromSignin = searchParams?.get('fromSignin') === 'true'
  const { user: authUser, loading: authLoading } = useAuth()
  
  const initialStep = stepParam ? parseInt(stepParam) : 0
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsScrolled, setTermsScrolled] = useState(false)
  const [redirectToProSignin, setRedirectToProSignin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedInUser, setIsLoggedInUser] = useState(false)
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [phoneCodeSent, setPhoneCodeSent] = useState(false)
  const [idProcessing, setIdProcessing] = useState(false)
  const [testVerificationCode, setTestVerificationCode] = useState<string | null>(null)
  const [workAddressPredictions, setWorkAddressPredictions] = useState<any[]>([])
  const [showWorkAddressPredictions, setShowWorkAddressPredictions] = useState(false)
  const [isValidatingWorkAddress, setIsValidatingWorkAddress] = useState(false)
  const [workAddressError, setWorkAddressError] = useState('')
  const [workAddressCoordinates, setWorkAddressCoordinates] = useState<{ lat: number, lng: number } | null>(null)
  const [workAddressVerified, setWorkAddressVerified] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    state: '',
    workAddress: '',
    workSuburb: '',
    workPostcode: '',
    workCountry: 'Australia',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    emailConfirmed: false,
    phoneVerificationCode: '',
    emailVerificationCode: '',
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

  // Work Address autocomplete functions
  const fetchWorkAddressPredictions = async (input: string) => {
    if (!input || input.length < 2) {
      setWorkAddressPredictions([])
      setShowWorkAddressPredictions(false)
      setWorkAddressError('')
      return
    }

    try {
      setWorkAddressError('')
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          componentRestrictions: { country: 'au' } // Restrict to Australia
        }),
      })
      if (!response.ok) throw new Error('Failed to fetch predictions')
      const data = await response.json()
      setWorkAddressPredictions(data.predictions || [])
      setShowWorkAddressPredictions((data.predictions || []).length > 0)
    } catch (err) {
      console.error('Error fetching work address predictions:', err)
      setWorkAddressPredictions([])
      setShowWorkAddressPredictions(false)
    }
  }

  const selectWorkAddress = async (prediction: any) => {
    setIsValidatingWorkAddress(true)
    setWorkAddressError('')
    
    try {
      const addressDetails = await getAddressDetails(prediction.placeId)
      
      if (!addressDetails) {
        setWorkAddressError('Failed to validate address. Please try again.')
        setIsValidatingWorkAddress(false)
        return
      }

      // Verify the address is in Australia
      if (addressDetails.country?.toLowerCase() !== 'australia') {
        setWorkAddressError('Work address must be in Australia')
        setIsValidatingWorkAddress(false)
        return
      }

      setFormData({
        ...formData,
        workAddress: addressDetails.formattedAddress,
        workSuburb: addressDetails.suburb || '',
        workPostcode: addressDetails.postcode || '',
        workCountry: addressDetails.country || 'Australia'
      })
      
      // Store coordinates for existing customers' work address verification
      if (addressDetails.latitude && addressDetails.longitude) {
        setWorkAddressCoordinates({
          lat: addressDetails.latitude,
          lng: addressDetails.longitude
        })
      }
      
      setShowWorkAddressPredictions(false)
      setWorkAddressPredictions([])
    } catch (err) {
      console.error('Error selecting work address:', err)
      setWorkAddressError('Failed to validate address. Please try again.')
    } finally {
      setIsValidatingWorkAddress(false)
    }
  }

  // Load customer profile data on component mount if user is already logged in
  useEffect(() => {
    // Wait for auth to finish loading before checking user status
    if (authLoading) {
      console.log('[ProSignup] Waiting for auth to load...')
      return
    }

    const loadCustomerData = async () => {
      try {
        // First, check if we have data in sessionStorage (from redirect)
        const savedFormData = sessionStorage.getItem('proSignupFormData')
        if (savedFormData) {
          console.log('[ProSignup] Loading form data from sessionStorage')
          const parsedData = JSON.parse(savedFormData)
          setFormData(prev => ({ ...prev, ...parsedData }))
          sessionStorage.removeItem('proSignupFormData') // Clear after loading
          return
        }

        if (authUser) {
          console.log('[ProSignup] Loading customer data for user:', authUser.id)
          setIsLoggedInUser(true)
          const customerData = await getCustomerProfile(authUser.id)
          
          if (customerData) {
            const data = customerData as any
            console.log('[ProSignup] Customer data loaded:', {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              state: data.state,
            })
            setFormData(prev => ({
              ...prev,
              firstName: data.firstName || prev.firstName,
              lastName: data.lastName || prev.lastName,
              email: data.email || prev.email,
              phone: data.phone || prev.phone,
              state: data.state || prev.state,
              termsAccepted: true, // Auto-accept for logged-in users with complete data
            }))
            
            // AUTO-ADVANCE: Only advance if customer has ALL required Pro fields including state
            // If state is missing, user needs to stay on Step 0 to fill it in
            if (initialStep === 0 && data.state && data.phone) {
              console.log('[ProSignup] User has existing customer profile WITH state and phone - advancing to step 1')
              setCurrentStep(1)
            } else if (initialStep === 0 && (!data.state || !data.phone)) {
              console.log('[ProSignup] User has customer profile but missing state/phone - staying on step 0 to collect it')
              // Stay on Step 0 to allow user to fill in the state field
            }
          } else {
            console.log('[ProSignup] No customer data found for user')
            // Logged-in user with no customer profile - still needs to fill Step 0 fields
            // They'll fill in firstName, lastName, phone, state and click Next to proceed
          }
        } else {
          console.log('[ProSignup] No current user logged in')
        }
      } catch (err) {
        console.error('[ProSignup] Error loading customer data:', err)
        // Don't show error to user - they can still fill in manually
      }
    }

    loadCustomerData()
  }, [authUser?.id, initialStep]) // Only re-run when user ID or initialStep changes

  // Update test verification code when email or phone changes
  // Only fetch in development/for admins (the endpoint is disabled in production)
  useEffect(() => {
    const updateTestCode = async () => {
      if (formData.email && formData.phone && isAdmin) {
        try {
          // Only try in development or for admins
          const code = await getVerificationCodeForTesting(formData.email, formData.phone)
          setTestVerificationCode(code)
        } catch (err) {
          // Silently fail - endpoint disabled in production
          setTestVerificationCode(null)
        }
      } else {
        setTestVerificationCode(null)
      }
    }

    updateTestCode()
  }, [formData.email, formData.phone, isAdmin])

  // Helper function to get current step title
  const getCurrentStepTitle = () => {
    if (currentStep >= 0 && currentStep < steps.length) {
      return steps[currentStep]?.title || ''
    }
    return ''
  }

  const isStepValid = () => {
    const stepTitle = getCurrentStepTitle()
    
    // Match by step title to handle conditional steps
    switch (stepTitle) {
      case 'Tell us about yourself':
        return (
          formData.firstName.trim() && 
          formData.lastName.trim() && 
          validateEmail(formData.email) &&
          validateAustralianPhone(formData.phone) &&
          formData.state && 
          (!isLoggedInUser || formData.workAddress.trim()) && // Only require workAddress for new users
          isPasswordValid &&
          formData.password === formData.confirmPassword &&
          formData.termsAccepted
        )
      case 'Verify Your Email':
        return formData.emailVerificationCode.length === 6
      case 'Verify Your Phone':
        return formData.phoneVerificationCode.length === 6
      case 'Verify Your Work Location':
        return formData.workAddress.trim() && workAddressVerified && workAddressCoordinates !== null
      case 'ID Verification':
        return true
      case 'Washlee Pro Introduction':
        return true
      case 'Your Availability & Contact Info':
        return true
      case 'Australian Workplace Verification':
        return (
          formData.hasWorkRight === true &&
          formData.hasValidLicense === true &&
          formData.hasTransport === true &&
          formData.hasEquipment === true &&
          formData.ageVerified === true
        )
      case 'Skills & Experience Assessment':
        return formData.skillsAssessment.trim().length >= 50
      default:
        return false
    }
  }

  // Send email verification code
  const sendEmailVerification = async () => {
    if (emailCodeSent) return // Already sent

    setError('')
    setIsLoading(true)
    try {
      const result = await requestVerificationCode(
        formData.email,
        formData.phone,
        formData.firstName,
        'email'
      )

      if (result.success) {
        setEmailCodeSent(true)
        setSuccessMessage('Verification code sent to your email')
        
        // In dev mode, auto-fill the code for testing
        if (result.code) {
          setFormData((prev) => ({
            ...prev,
            emailCode: result.code || '',
          }))
          console.log('[Dev Mode] Email code auto-filled:', result.code)
        }
      } else {
        setError(result.error || 'Failed to send email verification')
      }
    } catch (err: any) {
      setError('Failed to send email verification')
    } finally {
      setIsLoading(false)
    }
  }

  // Send phone verification code
  const sendPhoneVerification = async () => {
    if (phoneCodeSent) return // Already sent

    setError('')
    setIsLoading(true)
    try {
      const result = await requestVerificationCode(
        formData.email,
        formData.phone,
        formData.firstName,
        'phone'
      )

      if (result.success) {
        setPhoneCodeSent(true)
        setSuccessMessage('Verification code sent to your phone')
        
        // In dev mode, auto-fill the code for testing
        if (result.code) {
          setFormData((prev) => ({
            ...prev,
            phoneCode: result.code || '',
          }))
          console.log('[Dev Mode] Phone code auto-filled:', result.code)
        }
      } else {
        setError(result.error || 'Failed to send phone verification')
      }
    } catch (err: any) {
      setError('Failed to send phone verification')
    } finally {
      setIsLoading(false)
    }
  }

  // Process ID verification
  const processIdVerification = async () => {
    if (!formData.idFile) {
      setError('Please upload an ID document')
      return
    }

    setIdProcessing(true)
    setError('')
    try {
      // TODO: Implement AI ID verification
      // For now, just simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In real implementation, this would:
      // 1. Upload to cloud storage
      // 2. Run AI analysis for realism and fact checking
      // 3. Store result in database
      // 4. Send notification to admin
      
      setFormData({ ...formData, idVerified: true })
      setSuccessMessage('ID verification submitted for review')
    } catch (err: any) {
      setError('Failed to process ID verification')
    } finally {
      setIdProcessing(false)
    }
  }

  const handleNext = async () => {
    const stepTitle = getCurrentStepTitle()

    if (stepTitle === 'Tell us about yourself') {
      // Step 0: Collect details, create account, send email verification
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
        setError('Please fill in all required fields')
        return
      }
      
      // For new users, require workAddress
      if (!isLoggedInUser && !formData.workAddress.trim()) {
        setError('Please enter your work address')
        return
      }
      
      // Create account
      setError('')
      setIsLoading(true)
      const result = await handleCreateAccount()
      setIsLoading(false)
      
      if (!result.success) {
        setError('Failed to create account. Check console for details.')
        return
      }
      
      // If existing customer with verified email, skip to phone verification
      if (result.skipEmailVerification) {
        console.log('[ProSignup] Existing customer - skipping email verification')
        // Move directly to phone verification (skip email step)
        setCurrentStep(currentStep + 2)
        return
      }
      
      // Account created, send email verification code
      setIsLoading(true)
      await sendEmailVerification()
      setIsLoading(false)
      
      // Move to next step (email verification)
      setCurrentStep(currentStep + 1)
    } else if (stepTitle === 'Verify Your Email') {
      // Email verification
      const trimmedEmailCode = formData.emailVerificationCode.trim().replace(/\s+/g, '')
      if (trimmedEmailCode.length !== 6) {
        setError('Please enter a 6-digit verification code')
        return
      }
      
      setIsLoading(true)
      const emailVerified = await verifyCode(
        formData.email,
        formData.phone,
        trimmedEmailCode
      )
      setIsLoading(false)
      
      if (!emailVerified) {
        setError('Invalid verification code')
        return
      }

      setFormData({ ...formData, emailConfirmed: true })
      setCurrentStep(currentStep + 1)
    } else if (stepTitle === 'Verify Your Phone') {
      // Phone verification
      if (!phoneCodeSent) {
        setError('')
        setIsLoading(true)
        await sendPhoneVerification()
        setIsLoading(false)
        return // Don't advance yet
      }
      
      const trimmedPhoneCode = formData.phoneVerificationCode.trim().replace(/\s+/g, '')
      if (trimmedPhoneCode.length !== 6) {
        setError('Please enter a 6-digit verification code')
        return
      }
      
      setIsLoading(true)
      const phoneVerified = await verifyCode(
        formData.email,
        formData.phone,
        trimmedPhoneCode
      )
      setIsLoading(false)
      
      if (!phoneVerified) {
        setError('Invalid verification code')
        return
      }
      
      setFormData({ ...formData, phoneVerified: true })
      setCurrentStep(currentStep + 1)
    } else if (stepTitle === 'Verify Your Work Location') {
      // Work address verification (for existing customers)
      if (!formData.workAddress.trim()) {
        setError('Please enter your work address')
        return
      }
      
      if (!workAddressCoordinates) {
        setError('Please select a valid address from the dropdown')
        return
      }
      
      if (!workAddressVerified) {
        setError('Please confirm this is your service location')
        return
      }
      
      setCurrentStep(currentStep + 1)
    } else if (stepTitle === 'ID Verification') {
      // ID verification
      if (!formData.idVerified) {
        setError('')
        setIsLoading(true)
        await processIdVerification()
        setIsLoading(false)
        return // Don't advance yet
      }
      setCurrentStep(currentStep + 1)
    } else if (stepTitle === 'Washlee Pro Introduction') {
      // Just advance
      setCurrentStep(currentStep + 1)
    } else if (stepTitle === 'Your Availability & Contact Info') {
      // Validate and move forward
      if (isStepValid()) {
        setCurrentStep(currentStep + 1)
      } else {
        setError('Please complete this step')
      }
    } else if (stepTitle === 'Australian Workplace Verification') {
      // Validate and move forward
      if (isStepValid()) {
        setCurrentStep(currentStep + 1)
      } else {
        setError('Please complete this step')
      }
    } else if (stepTitle === 'Skills & Experience Assessment') {
      // Validate and submit
      if (isStepValid()) {
        await handleSubmitInquiry()
      } else {
        setError('Please complete this step')
      }
    } else {
      setError('Please complete this step')
    }
  }

  const handleSubmitInquiry = async () => {
    setError('')
    setIsLoading(true)

    try {
      const getFileBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

      console.log('[Form] Current user:', authUser?.id)
      
      // For signup (not logged in), use form data directly
      // For logged-in users, try to prefill from customer profile
      let firstName = formData.firstName
      let lastName = formData.lastName
      let email = formData.email
      let phone = formData.phone
      let state = formData.state

      if (authUser && (!firstName || !lastName || !email || !phone || !state)) {
        console.log('[Form] Form data incomplete, fetching from customer profile...')
        try {
          const customerData = await getCustomerProfile(authUser.id)
          if (customerData) {
            const data = customerData as any
            firstName = firstName || data.firstName || ''
            lastName = lastName || data.lastName || ''
            email = email || data.email || authUser.email || ''
            phone = phone || data.phone || ''
            state = state || data.state || ''
            console.log('[Form] Loaded customer data:', { firstName, lastName, email, phone, state })
          }
        } catch (err) {
          console.log('[Form] Could not fetch customer profile:', err)
        }
      }

      // Validate that all required fields are populated
      const missingFields = []
      if (!firstName?.trim()) missingFields.push('firstName')
      if (!lastName?.trim()) missingFields.push('lastName')
      if (!email?.trim()) missingFields.push('email')
      if (!phone?.trim()) missingFields.push('phone')
      if (!state?.trim()) missingFields.push('state')

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}. Please go back to step 1 and fill in your information.`)
      }

      // For signup: use email-based ID if not logged in, otherwise use authUser.id
      const userId = authUser?.id || `employee_${email}_${Date.now()}`

      const inquiryPayload = {
        userId,
        firstName,
        lastName,
        email,
        phone,
        state,
        idVerification: formData.idFile
          ? {
              fileName: formData.idFile.name,
              fileType: formData.idFile.type,
              base64: await getFileBase64(formData.idFile),
            }
          : null,
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

      // Send confirmation email to employee
      try {
        await fetch('/api/email/send-employee-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeEmail: email,
            employeeData: {
              firstName,
              lastName,
              email,
              phone,
              employeeId: responseData.inquiryId,
            },
          }),
        })
        console.log('[Form] Employee confirmation email sent')
      } catch (emailErr) {
        console.error('[Form] Error sending employee confirmation email:', emailErr)
      }

      // Send employer notification with all application details
      try {
        await fetch('/api/email/send-employer-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeData: {
              firstName,
              lastName,
              email,
              phone,
              state,
              employeeId: responseData.inquiryId,
              applicationType: 'pro',
              workVerification: {
                hasWorkRight: formData.hasWorkRight,
                hasValidLicense: formData.hasValidLicense,
                hasTransport: formData.hasTransport,
                hasEquipment: formData.hasEquipment,
                ageVerified: formData.ageVerified,
              },
              availability: formData.availability,
              skillsAssessment: formData.skillsAssessment,
              comments: formData.comments,
            },
          }),
        })
        console.log('[Form] Employer notification email sent')
      } catch (emailErr) {
        console.error('[Form] Error sending employer notification email:', emailErr)
      }

      // Move to success screen
      setCurrentStep(steps.length)
    } catch (err: any) {
      console.error('Inquiry submission error:', err.message)
      setError(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAccount = async (): Promise<{ success: boolean, skipEmailVerification: boolean }> => {
    setError('')
    setIsLoading(true)

    const signupStartTime = performance.now()
    console.log('[Signup] Starting account creation at', new Date().toISOString())

    try {
      // Check if user is already logged in
      if (isLoggedInUser && authUser) {
        // Check if user has customer data
        const customerData = await getCustomerProfile(authUser.id)
        const data = customerData as any
        if (customerData && data.state) {
          console.log('[Signup] User already logged in with complete profile, skipping email verification')
          // Already logged in with complete data - auto-verify email
          setFormData(prev => ({ ...prev, emailConfirmed: true }))
          setIsLoading(false)
          return { success: true, skipEmailVerification: true }
        } else {
          console.log('[Signup] User logged in but needs to complete profile - creating customer profile')
          // User is logged in but needs customer profile - create it using existing auth user
          try {
            await createEmployeeProfile(authUser.id, {
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              state: formData.state,
              workAddress: formData.workAddress,
              employmentType: 'contractor',
              status: 'pending',
              availability: formData.availability,
              applicationStep: 1,
            } as any)
            console.log('[Signup] Customer profile created for existing user')
            
            // Auto-accept terms and email for logged-in users
            setFormData(prev => ({ ...prev, termsAccepted: true, emailConfirmed: true }))
            
            // Send verification codes automatically for logged-in users too
            const adminStatus = await isAdminUser(authUser.id)
            setIsAdmin(adminStatus)
            if (!adminStatus) {
              // Send codes in background (development uses test code / logs)
              sendEmailVerification().catch((err: any) => {
                console.error('[ProSignup] Error sending email verification:', err)
              })
              sendPhoneVerification().catch((err: any) => {
                console.error('[ProSignup] Error sending phone verification:', err)
              })
            }
            
            // Skip email verification for existing customers - their email is already verified
            setIsLoading(false)
            return { success: true, skipEmailVerification: true }
          } catch (profileErr: any) {
            console.error('[Signup] Error creating profile for existing user:', profileErr)
            setError('Failed to complete profile setup')
            setIsLoading(false)
            return { success: false, skipEmailVerification: false }
          }
        }
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return { success: false, skipEmailVerification: false }
      }

      if (!isPasswordValid) {
        setError('Password does not meet requirements')
        setIsLoading(false)
        return { success: false, skipEmailVerification: false }
      }

      let authResult

      // Log Auth creation start
      const authStartTime = performance.now()
      console.log('[Signup] Creating account via admin API (bypasses rate limits)...')

      try {
        // Use admin API endpoint to bypass rate limits
        const signupRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            state: formData.state,
            userType: 'pro',
            personalUse: false,
            address: formData.workAddress || null,
            city: formData.workSuburb || null,
            postcode: formData.workPostcode || null,
            country: formData.workCountry || 'Australia',
          })
        })

        const signupJson = await signupRes.json()

        if (!signupRes.ok) {
          throw new Error(signupJson.error || 'Signup failed')
        }

        authResult = { user: { uid: signupJson.userId || '' } }

        const authDuration = performance.now() - authStartTime
        console.log('[Signup] Auth created in', Math.round(authDuration) + 'ms', 'UID:', authResult.user.uid)
        console.log('[Signup] Both customer and employee profiles created by API')

      } catch (createErr: any) {
        const authDuration = performance.now() - authStartTime
        console.log('[Signup] Error after', Math.round(authDuration) + 'ms:', createErr.message)

        if (createErr.message && createErr.message.includes('already registered')) {
          // Email already exists - customer account found
          setError(
            'This email is already registered as a Washlee customer. ' +
            'Click "Already have a customer account? Sign in here" to sign in and upgrade to Pro.'
          )
          setIsLoading(false)
          return { success: false, skipEmailVerification: false }
        } else if (createErr.message && createErr.message.includes('weak password')) {
          setError('Password is too weak.')
          setIsLoading(false)
          return { success: false, skipEmailVerification: false }
        } else {
          setError(createErr.message || 'Failed to create account')
          setIsLoading(false)
          return { success: false, skipEmailVerification: false }
        }
      }
      if (!authResult) {
        setError('Failed to process account')
        setIsLoading(false)
        return { success: false, skipEmailVerification: false }
      }

      // Check if admin and set state
      const adminStatus = await isAdminUser(authResult.user.uid)
      setIsAdmin(adminStatus)
      
      // Don't send codes here - they're sent explicitly at Step 1 in handleNext()
      
      const totalTime = performance.now() - signupStartTime
      console.log('[Signup] ✅ Account creation completed in', Math.round(totalTime), 'ms')
      
      return { success: true, skipEmailVerification: false }
    } catch (err: any) {
      const totalTime = performance.now() - signupStartTime
      console.error('[Signup] ❌ Error after', Math.round(totalTime), 'ms:', err)
      setError(err.message || 'Failed to process signup')
      return { success: false, skipEmailVerification: false }
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
          {/* Work address field - hidden for existing customers (they'll set it in dedicated step) */}
          {!isLoggedInUser && (
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Work Address*</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="text"
                name="workAddress"
                value={formData.workAddress}
                onChange={(e) => {
                  handleChange(e)
                  fetchWorkAddressPredictions(e.target.value)
                }}
                placeholder="Enter your work location or main service area"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="off"
                required
              />
              {isValidatingWorkAddress && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Spinner />
                </div>
              )}
              {showWorkAddressPredictions && workAddressPredictions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {workAddressPredictions.map((prediction, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectWorkAddress(prediction)}
                      className="w-full text-left px-4 py-2 hover:bg-light transition border-b border-light last:border-b-0"
                    >
                      <div className="font-semibold text-dark text-sm">{prediction.main_text}</div>
                      <div className="text-gray text-xs">{prediction.secondary_text}</div>
                    </button>
                  ))}
                </div>
              )}
              {workAddressError && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{workAddressError}</span>
                </div>
              )}
            </div>
          </div>
          )}
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
          {/* Terms and Conditions Acceptance */}
          <div className="bg-mint/20 rounded-lg p-4 border-2 border-primary/30 mb-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={(e) => {
                  const checked = e.target.checked
                  if (checked) {
                    // Open modal when trying to check
                    setShowTermsModal(true)
                    setTermsScrolled(false)
                  } else {
                    // Allow unchecking without modal
                    setFormData({ ...formData, termsAccepted: false })
                  }
                }}
                className="w-5 h-5 rounded border-2 border-gray mt-0.5 cursor-pointer accent-primary flex-shrink-0"
                required
              />
              <div className="flex-1">
                <label className="text-sm font-semibold text-dark cursor-pointer block mb-1">
                  I agree to the Terms & Conditions
                </label>
                <p className="text-xs text-gray mb-2">
                  Please review and accept our{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setShowTermsModal(true)
                      setTermsScrolled(false)
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    Terms & Conditions
                  </button>
                  {' '}and{' '}
                  <Link href="/privacy-policy" className="text-primary font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                </p>
                {formData.termsAccepted && (
                  <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                    <CheckCircle size={16} />
                    <span>✓ Terms accepted</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="py-4 border-t border-gray/20 border-b border-gray/20">
            <p className="text-xs text-gray text-center">
              Already have a customer account?{' '}
              <button
                type="button"
                onClick={() => {
                  if (isLoggedInUser) {
                    // If already logged in as a customer, show terms modal and prepare to advance
                    setFormData({ ...formData, termsAccepted: true })
                    setRedirectToProSignin(true)
                    setShowTermsModal(true)
                    setTermsScrolled(true)
                  } else {
                    // If not logged in, save form data and redirect to login
                    sessionStorage.setItem('proSignupFormData', JSON.stringify(formData))
                    router.push('/auth/login?redirect=/pro?step=0')
                  }
                }}
                className="text-primary font-semibold hover:underline"
              >
                Click here to sign in
              </button>
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Verify Your Email',
      description: 'Enter the verification code we sent to your email',
      content: (
        <div className="space-y-4">
          {isAdmin ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
              <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-dark mb-2">✓ Email Verification Bypassed</h3>
              <p className="text-gray text-sm">
                Admin account detected. Email verification has been bypassed.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Email Verification Code</label>
                <p className="text-sm text-gray mb-3">
                  We sent a verification code to <strong>{formData.email}</strong>
                </p>
                <input
                  type="text"
                  name="emailVerificationCode"
                  value={formData.emailVerificationCode}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => sendEmailVerification()}
                    disabled={emailCodeSent || isLoading}
                    className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Check your spam folder if you don't see the email. The verification code will expire in 15 minutes.
                </p>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Verify Your Phone',
      description: 'Enter the verification code we sent to your phone',
      content: (
        <div className="space-y-4">
          {isAdmin ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
              <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-dark mb-2">✓ Phone Verification Bypassed</h3>
              <p className="text-gray text-sm">
                Admin account detected. Phone verification has been bypassed.
              </p>
            </div>
          ) : (
            <>
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
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => sendPhoneVerification()}
                    disabled={phoneCodeSent || isLoading}
                    className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {phoneCodeSent ? 'Code Sent' : 'Send Code'}
                  </button>
                  <div className="text-xs text-gray">
                    <strong>🔧 Development Mode:</strong> Test code: <code className="bg-white px-2 py-1 rounded font-bold">
                      {formData.email && formData.phone ? (testVerificationCode || 'Loading...') : 'Enter email/phone first'}
                    </code>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Check your SMS messages for the 6-digit verification code. The code will expire in 15 minutes.
                </p>
              </div>
            </>
          )}
        </div>
      ),
    },
    // Work address verification step (only for existing customers)
    ...(isLoggedInUser ? [{
      title: 'Verify Your Work Location',
      description: 'Confirm where you\'ll be providing services',
      content: (
        <div className="space-y-4">
          <div className="bg-mint/20 border-2 border-primary/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-dark mb-1">Service Area Verification</h4>
                <p className="text-sm text-gray">
                  We need to confirm your work location is within our service area. You can pick any address where you'll primarily be providing laundry services.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Work/Service Location*</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="text"
                name="workAddress"
                value={formData.workAddress}
                onChange={(e) => {
                  handleChange(e)
                  fetchWorkAddressPredictions(e.target.value)
                }}
                placeholder="Enter your service area address"
                className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="off"
                required
              />
              {isValidatingWorkAddress && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Spinner />
                </div>
              )}
              {showWorkAddressPredictions && workAddressPredictions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {workAddressPredictions.map((prediction, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectWorkAddress(prediction)}
                      className="w-full text-left px-4 py-2 hover:bg-light transition border-b border-light last:border-b-0"
                    >
                      <div className="font-semibold text-dark text-sm">{prediction.main_text}</div>
                      <div className="text-gray text-xs">{prediction.secondary_text}</div>
                    </button>
                  ))}
                </div>
              )}
              {workAddressError && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{workAddressError}</span>
                </div>
              )}
            </div>
            {workAddressCoordinates && (
              <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold mb-2">
                  <CheckCircle size={18} />
                  <span>Location confirmed</span>
                </div>
                <p className="text-sm text-green-600">{formData.workAddress}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-3">
              I confirm this address is where I'll provide laundry services
            </label>
            <div className="flex items-center gap-3 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
              onClick={() => setWorkAddressVerified(!workAddressVerified)}
            >
              <input
                type="checkbox"
                checked={workAddressVerified}
                onChange={() => {}}
                className="w-5 h-5 rounded border-2 border-gray accent-primary"
              />
              <span className="text-dark font-medium">Yes, this is my service location</span>
            </div>
          </div>

          {!workAddressCoordinates && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Start typing an address and select from suggestions to verify your work location.
              </p>
            </div>
          )}
        </div>
      ),
    }] : []),
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
            <h1 className="text-3xl font-bold text-dark mb-3">Application Submitted!</h1>
            <p className="text-gray mb-2">Thank you for applying to become a Washlee Pro.</p>
            
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 my-6">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Clock size={20} className="text-yellow-600" />
                <span className="font-semibold text-yellow-900">Application Status: Pending Review</span>
              </div>
              <p className="text-sm text-yellow-800">
                Our team is reviewing your application. You'll hear from us within 24-48 hours.
              </p>
            </div>
            
            <p className="text-sm text-gray mb-6">
              In the meantime, check out our Pro Support Help Center to learn more about being a Washlee Pro.
            </p>
            
            <Link href="/pro-support/help-center" className="inline-block">
              <Button>View Help Center</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  // Safety check: if step doesn't exist, redirect to home
  if (!step) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

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

          {/* Info for Existing Customers */}
          {currentStep === 0 && isLoggedInUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm">
              <div className="flex gap-2">
                <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-blue-900">
                  <p className="font-semibold mb-1">Welcome back!</p>
                  <p>We found your existing account. We just need a few more details (phone and state) to complete your Pro profile.</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mb-8">
            {step.content}
          </div>

          {/* Step 0 Validation Helper */}
          {currentStep === 0 && !isStepValid() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm">
              <div className="flex gap-2">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-amber-900">
                  <p className="font-semibold mb-2">Complete the form to continue:</p>
                  <ul className="space-y-1 text-xs ml-2">
                    {!formData.firstName.trim() && <li>✗ First name required</li>}
                    {!formData.lastName.trim() && <li>✗ Last name required</li>}
                    {!formData.email && <li>✗ Valid email required</li>}
                    {!formData.phone && <li>✗ Phone number required</li>}
                    {!formData.state && <li>✗ State required</li>}
                    {!formData.termsAccepted && (
                      <li className="text-amber-700 font-medium">
                        ✗{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setShowTermsModal(true)
                            setTermsScrolled(false)
                          }}
                          className="text-primary font-semibold hover:underline"
                        >
                          Accept Terms & Conditions
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

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
              title={!isStepValid() && currentStep === 0 ? 'Please complete all fields and accept the terms' : ''}
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray/20 bg-gradient-to-r from-mint/10 to-primary/5">
              <div>
                <h2 className="text-3xl font-bold text-dark">Terms & Conditions</h2>
                <p className="text-sm text-gray mt-1">Please read and scroll to accept</p>
              </div>
              <button
                onClick={() => {
                  setShowTermsModal(false)
                }}
                className="p-2 hover:bg-light rounded-full transition"
                title="Close"
              >
                <X size={28} className="text-dark" />
              </button>
            </div>

            {/* Scroll Progress Indicator */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray">Scroll Progress</span>
                <span className="text-xs font-semibold text-primary">{termsScrolled ? '✓ Complete' : 'Scroll to bottom'}</span>
              </div>
              <div className="h-1 bg-gray/20 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${termsScrolled ? 'bg-primary w-full' : 'bg-primary'}`}
                  style={{
                    width: termsScrolled ? '100%' : '0%',
                  }}
                />
              </div>
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
              <div className="prose prose-sm max-w-none text-gray whitespace-pre-wrap font-normal leading-relaxed">
                {WASHLEE_TERMS}
              </div>
              
              {/* Sticky bottom hint */}
              {!termsScrolled && (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <p className="text-xs text-yellow-900 font-medium">
                    👇 Please scroll down to the bottom to accept the terms
                  </p>
                </div>
              )}
            </div>

            {/* Footer - Sticky */}
            <div className="border-t-2 border-gray/20 p-6 bg-gradient-to-r from-light/50 to-white flex gap-3">
              <button
                onClick={() => {
                  setShowTermsModal(false)
                  // Don't change formData, user can try again
                }}
                className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition active:scale-95"
                title="Decline and close"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  setFormData({ ...formData, termsAccepted: true })
                  setShowTermsModal(false)
                  
                  // If user clicked "Already have account" link, advance to Step 1
                  if (redirectToProSignin && isLoggedInUser) {
                    setRedirectToProSignin(false)
                    console.log('[ProSignup] Logged-in user accepted terms, advancing to Step 1')
                    setTimeout(() => {
                      setCurrentStep(1)
                    }, 100)
                  }
                }}
                disabled={!termsScrolled}
                className={`flex-1 py-3 rounded-lg font-bold transition transform active:scale-95 flex items-center justify-center gap-2 ${
                  termsScrolled
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl cursor-pointer'
                    : 'bg-gray/20 text-gray cursor-not-allowed opacity-50'
                }`}
                title={termsScrolled ? 'Accept and continue' : 'Scroll down to unlock'}
              >
                {termsScrolled ? (
                  <>
                    <CheckCircle size={20} />
                    <span>I Accept & Agree</span>
                  </>
                ) : (
                  'Scroll to Bottom to Accept'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProSignupForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProSignupFormContent />
    </Suspense>
  )
}
