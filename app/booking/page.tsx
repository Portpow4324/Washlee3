'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { syncBookingAddresses } from '@/lib/addressSync'
import { getCustomerPresets, trackPresetUsage, createDefaultPresetFromFirstOrder } from '@/lib/orderPresets'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Clock, MapPin, Droplet, Wind, Truck, CheckCircle, ChevronRight, AlertCircle, Mail, Phone, X } from 'lucide-react'
import Spinner from '@/components/Spinner'
import { AddressParts } from '@/lib/googlePlaces'

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function BookingHybrid() {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [presets, setPresets] = useState<any[]>([])
  const [showPresetsModal, setShowPresetsModal] = useState(false)

  // Modal states
  const [showPickupSpotModal, setShowPickupSpotModal] = useState(false)
  const [showDetergentModal, setShowDetergentModal] = useState(false)
  const [showPickupInstructionsInfo, setShowPickupInstructionsInfo] = useState(false)
  const [showDetergentInfo, setShowDetergentInfo] = useState(false)
  const [showSpecialCareInfo, setShowSpecialCareInfo] = useState(false)
  const [showAddOnsInfo, setShowAddOnsInfo] = useState(false)
  const [showWeightInfo, setShowWeightInfo] = useState(false)
  const [showDeliverySpeedInfo, setShowDeliverySpeedInfo] = useState(false)
  const [showProtectionPlanInfo, setShowProtectionPlanInfo] = useState(false)
  const [showStepInfo, setShowStepInfo] = useState(false)
  
  // Address autocomplete states
  const [addressInput, setAddressInput] = useState('')
  const [addressPredictions, setAddressPredictions] = useState<any[]>([])
  const [isValidatingAddress, setIsValidatingAddress] = useState(false)
  const [showAddressPredictions, setShowAddressPredictions] = useState(false)
  const [addressError, setAddressError] = useState('')

  const [bookingData, setBookingData] = useState({
    // Step 1: Select Service
    selectedService: 'standard',

    // Step 2: Pickup Location
    pickupAddress: userData?.address || '',
    pickupAddressDetails: null as AddressParts | null,
    pickupSpot: 'front-door',
    pickupInstructions: '',
    addPickupInstructions: false,

    // Step 3: Laundry Care
    detergent: 'classic-scented',
    delicateCycle: false,
    hangDry: false,
    returnsOnHangers: false,
    delicatesCare: false,
    comforterService: false,
    stainTreatment: false,
    ironing: false,
    additionalRequests: false,
    additionalRequestsText: '',

    // Step 4: Bag Count
    bagCount: 4,
    oversizedItems: 0,

    // Step 5: Delivery Speed
    deliverySpeed: 'standard',

    // Step 6: Protection Plan
    protectionPlan: 'basic',

    // Step 7: Delivery Address
    deliveryAddress: userData?.address || '',
    deliveryAddressDetails: null as AddressParts | null,
  })

  const steps = [
    { number: 1, title: 'Select Service', description: 'Choose your laundry service type' },
    { number: 2, title: 'Pickup Location', description: 'Where should we pick up your laundry?' },
    { number: 3, title: 'Laundry Care', description: 'Detergent & special care instructions' },
    { number: 4, title: 'Bag Count', description: 'How many bags are you sending?' },
    { number: 5, title: 'Delivery Speed', description: 'Choose your desired delivery speed' },
    { number: 6, title: 'Protection Plan', description: 'Washlee\'s Protection Plan covers damage & loss' },
    { number: 7, title: 'Review & Confirm', description: 'Review your order and complete checkout' },
  ]

  const services = [
    { id: 'standard', name: 'Standard Wash', price: '$5.00/kg', icon: '👕', desc: 'Regular washing for everyday clothes' },
    { id: 'delicate', name: 'Delicate Fabrics', price: '$5.00/kg', icon: '✨', desc: 'Gentle care for silk, satin & linen' },
    { id: 'express', name: 'Express Service', price: '$10.00/kg', icon: '⚡', desc: 'Same-day turnaround available' },
    { id: 'comforter', name: 'Comforter & Bedding', price: '$6.00/item', icon: '☁️', desc: 'For large items like comforters' },
    { id: 'handwash', name: 'Hand Wash Premium', price: '$5.00/kg', icon: '🧤', desc: 'Ultimate care for precious items' },
    { id: 'stain', name: 'Stain Treatment', price: '+$2.00/item', icon: '🧼', desc: 'Expert stain removal service' },
  ]

  const pickupSpots = [
    { id: 'front-door', label: 'Front Door' },
    { id: 'back-door', label: 'Back Door' },
    { id: 'side-door', label: 'Side Door' },
    { id: 'custom', label: 'Custom' },
  ]

  const detergents = [
    { id: 'classic-scented', label: 'Classic Scented' },
    { id: 'hypoallergenic', label: 'Unscented Hypoallergenic' },
    { id: 'i-will-provide', label: 'I Will Provide' },
  ]

  const protectionPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'FREE',
      coverage: 'Covers $50/garment',
      max: 'Maximum $300/order',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$3.50',
      coverage: 'Covers $100/garment',
      max: 'Maximum $500/order',
    },
    {
      id: 'premium-plus',
      name: 'Premium+',
      price: '$8.50',
      coverage: 'Covers $150/garment',
      max: 'Maximum $1000/order',
    },
  ]

  // Fetch address predictions from Google Places (Australia only)
  const fetchAddressPredictions = async (input: string) => {
    try {
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
      console.log('Received predictions:', data.predictions)
      setAddressPredictions(data.predictions || [])
    } catch (err) {
      console.error('Error fetching predictions:', err)
      setAddressPredictions([])
    }
  }

  // Select an address from predictions and validate it
  const selectAddress = async (prediction: any) => {
    try {
      setIsValidatingAddress(true)
      setAddressError('')
      
      // Get detailed address information
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: prediction.placeId }),
      })
      
      if (!response.ok) throw new Error('Failed to validate address')
      const data = await response.json()
      
      // Validate that it's an Australian address
      if (data.addressParts?.country?.toLowerCase() !== 'australia') {
        setAddressError('❌ Address must be in Australia. Please select an Australian address.')
        setIsValidatingAddress(false)
        return
      }
      
      // Update booking data with validated address
      const formattedAddress = data.addressParts.formattedAddress
      console.log('Setting address:', formattedAddress)
      setAddressInput(formattedAddress)
      setBookingData({
        ...bookingData,
        pickupAddress: formattedAddress,
        pickupAddressDetails: data.addressParts,
      })
      setShowAddressPredictions(false)
      setAddressPredictions([])
    } catch (err: any) {
      console.error('Error selecting address:', err)
      setAddressError('Failed to validate address. Please try again.')
    } finally {
      setIsValidatingAddress(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Initialize addressInput from userData when it loads
    if (userData?.address && addressInput === '') {
      setAddressInput(userData.address)
    }
  }, [userData?.address])

  // Load customer presets
  useEffect(() => {
    if (!user) return
    
    const loadPresets = async () => {
      try {
        const customerPresets = await getCustomerPresets(user.id)
        setPresets(customerPresets)
        console.log('[BOOKING] Loaded presets:', customerPresets.length)
      } catch (err) {
        console.error('[BOOKING] Error loading presets:', err)
      }
    }

    loadPresets()
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  const calculateTotal = () => {
    let total = 0
    const estimatedWeight = bookingData.bagCount * 2.5 // ~2.5kg per bag
    
    // Base laundry cost: $5/kg standard, $10/kg express
    const baseRate = bookingData.deliverySpeed === 'express' ? 10.0 : 5.0
    total += estimatedWeight * baseRate
    
    // Add-ons
    if (bookingData.hangDry) total += 16.50
    if (bookingData.delicatesCare) total += 22.00
    if (bookingData.comforterService) total += 25.00
    if (bookingData.stainTreatment) total += 0.50 // Note: per item, but simplified here
    // Ironing is included in delicates care
    
    // Protection plan
    if (bookingData.protectionPlan === 'premium') total += 3.50
    if (bookingData.protectionPlan === 'premium-plus') total += 8.50
    
    // Oversized items ($8 each)
    total += bookingData.oversizedItems * 8.0
    
    // Enforce minimum $50 AUD
    return Math.max(total, 50.0)
  }

  const applyPreset = async (preset: any) => {
    try {
      // Apply preset data to booking
      setBookingData({
        ...bookingData,
        selectedService: preset.selectedService || bookingData.selectedService,
        detergent: preset.detergent || bookingData.detergent,
        bagCount: preset.bagCount || bookingData.bagCount,
        deliverySpeed: preset.deliverySpeed || bookingData.deliverySpeed,
        protectionPlan: preset.protectionPlan || bookingData.protectionPlan,
        delicateCycle: preset.delicateCycle || false,
        hangDry: preset.hangDry || false,
        returnsOnHangers: preset.returnsOnHangers || false,
        delicatesCare: preset.delicatesCare || false,
        comforterService: preset.comforterService || false,
        stainTreatment: preset.stainTreatment || false,
        ironing: preset.ironing || false,
      })

      // Track usage
      if (preset.id) {
        await trackPresetUsage(preset.id)
      }

      // Close modal and show success
      setShowPresetsModal(false)
      console.log('[BOOKING] Preset applied:', preset.label)
    } catch (err) {
      console.error('[BOOKING] Error applying preset:', err)
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 7) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmitOrder()
      }
      setError('')
    }
  }

  const validateStep = (step: number) => {
    const estimatedWeight = bookingData.bagCount * 2.5
    const userPlan = userData?.subscription?.plan || 'free'
    
    switch (step) {
      case 1:
        if (!bookingData.selectedService) {
          setError('Please select a service')
          return false
        }
        return true
      case 2:
        if (!bookingData.pickupAddress) {
          setError('Please provide a pickup address')
          return false
        }
        return true
      case 3:
        return true
      case 4:
        if (bookingData.bagCount < 4) {
          setError('Minimum order is 4 bags (10kg) for $50')
          return false
        }
        // Check weight restrictions for free plan (max 25kg per load)
        if (estimatedWeight > 25 && userPlan === 'free') {
          setError('Loads over 25kg require a Professional or Washlee Premium plan. Upgrade to unlock larger loads.')
          return false
        }
        return true
      case 5:
        return true
      case 6:
        return true
      case 7:
        if (!agreedToTerms) {
          setError('Please agree to the Terms of Service')
          return false
        }
        return true
      default:
        return false
    }
  }

  const handleSubmitOrder = async () => {
    setIsLoading(true)
    setError('')

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
      setError('Request timed out. Please check your internet connection and try again.')
    }, 30000) // 30 seconds

    try {
      if (!user) throw new Error('User not found')

      const orderTotal = calculateTotal()
      const estimatedWeight = bookingData.bagCount * 2.5

      // Extract delivery address components from AddressParts object
      const deliveryAddressLine1 = bookingData.deliveryAddressDetails?.streetAddress || ''
      const deliveryCity = bookingData.deliveryAddressDetails?.suburb || ''
      const deliveryState = bookingData.deliveryAddressDetails?.state || ''
      const deliveryPostcode = bookingData.deliveryAddressDetails?.postcode || ''
      const deliveryCountry = bookingData.deliveryAddressDetails?.country || 'Australia'

      const orderPayload = {
        uid: user.id,
        customerName: userData?.name || 'Customer',
        customerEmail: user.email,
        customerPhone: userData?.phone || '',
        bookingData: {
          ...bookingData,
          estimatedWeight,
          deliveryAddressLine1,
          deliveryAddressLine2: '',
          deliveryCity,
          deliveryState,
          deliveryPostcode,
          deliveryCountry,
        },
        orderTotal,
      }

      console.log('[BOOKING] Step 1: Submitting order payload:', {
        uid: orderPayload.uid,
        customerEmail: orderPayload.customerEmail,
        customerName: orderPayload.customerName,
        orderTotal,
      })

      console.log('[BOOKING] Step 2: Calling /api/orders-simple (no auth)...')
      const orderResponse = await fetch('/api/orders-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })
      console.log('[BOOKING] Step 3: Got response from /api/orders-simple:', orderResponse.status)

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        console.error('[BOOKING] API Error Response:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          errorData
        })
        throw new Error(errorData?.error || `Failed to create order (${orderResponse.status})`)
      }

      const orderResult = await orderResponse.json()
      // The response wraps data in a 'data' property from ApiResponse
      const orderData = orderResult.data || orderResult
      const createdOrderId = orderData.orderId || ''
      
      console.log('[BOOKING] Order Response:', orderResult)
      console.log('[BOOKING] Order Data:', orderData)
      console.log('[BOOKING] Extracted Order ID:', createdOrderId)
      
      if (!createdOrderId) {
        console.error('[BOOKING] Order creation response missing orderId:', {
          responseKeys: Object.keys(orderResult),
          dataKeys: Object.keys(orderData),
          fullResponse: orderResult,
          fullData: orderData
        })
      }
      
      setOrderId(createdOrderId)
      
      // Sync pickup and delivery addresses to customer_addresses table
      console.log('[BOOKING] Syncing addresses to customer_addresses table...')
      const syncResult = await syncBookingAddresses(
        user.id,
        bookingData.pickupAddressDetails,
        bookingData.deliveryAddressDetails
      )
      console.log('[BOOKING] Address sync result:', syncResult)
      
      // Now create Stripe checkout session
      console.log('[BOOKING] Creating Stripe checkout session for order:', createdOrderId)
      
      const checkoutPayload = {
        amount: orderTotal,
        email: user.email,
        name: userData?.name || 'Customer',
        orderId: createdOrderId,
        bookingDetails: {
          ...bookingData,
          estimatedWeight,
          deliveryAddressLine1,
          deliveryAddressLine2: '',
          deliveryCity,
          deliveryState,
          deliveryPostcode,
          deliveryCountry,
        },
      }

      console.log('[BOOKING] Checkout Payload:', {
        amount: checkoutPayload.amount,
        email: checkoutPayload.email,
        name: checkoutPayload.name,
        orderId: checkoutPayload.orderId,
        hasBookingDetails: !!checkoutPayload.bookingDetails,
      })

      console.log('[BOOKING] Step 4: Calling /api/checkout-simple (no auth)...')
      const checkoutResponse = await fetch('/api/checkout-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutPayload),
      })

      console.log('[BOOKING] Step 5: Got response from /api/checkout-simple:', checkoutResponse.status)
      console.log('[BOOKING] Checkout Response OK:', checkoutResponse.ok)

      if (!checkoutResponse.ok) {
        let errorData: any = {}
        let errorText = ''
        
        try {
          // Try to get response text first
          errorText = await checkoutResponse.text()
          console.error('[BOOKING] Raw error response text:', errorText)
          
          // Then try to parse as JSON
          if (errorText) {
            errorData = JSON.parse(errorText)
          }
          
          console.error('[BOOKING] Parsed error data:', errorData)
          console.error('[BOOKING] Error message from response:', errorData.error)
        } catch (parseError) {
          console.error('[BOOKING] Failed to parse error response:', parseError)
          console.error('[BOOKING] Raw text was:', errorText)
        }
        
        console.error('[BOOKING] Checkout Error:', {
          status: checkoutResponse.status,
          statusText: checkoutResponse.statusText,
          errorMessage: errorData?.error,
          fullError: errorData
        })
        
        // Order was created but checkout failed - still show confirmation
        setOrderConfirmed(true)
        const errorMsg = errorData?.error || errorText || `Failed to create checkout session (${checkoutResponse.status})`
        throw new Error(errorMsg)
      }

      const checkoutResult = await checkoutResponse.json()
      console.log('[BOOKING] Checkout Result:', checkoutResult)
      
      // Extract checkout data from response wrapper
      const checkoutData = checkoutResult.data || checkoutResult
      console.log('[BOOKING] Checkout Data extracted:', checkoutData)
      
      // Redirect to Stripe checkout in a new tab
      if (checkoutData.url) {
        console.log('[BOOKING] Opening Stripe checkout in new tab:', checkoutData.url)
        // Save orderId to session storage so success page can access it
        sessionStorage.setItem('lastOrderId', orderId || createdOrderId)
        sessionStorage.setItem('lastOrderTotal', orderTotal.toString())
        // Open Stripe checkout in a new tab
        window.open(checkoutData.url, '_blank')
      } else if (checkoutData.sessionId) {
        console.log('[BOOKING] Got session ID, opening in new tab:', checkoutData.sessionId)
        const stripeUrl = `https://checkout.stripe.com/pay/${checkoutData.sessionId}`
        sessionStorage.setItem('lastOrderId', orderId || createdOrderId)
        sessionStorage.setItem('lastOrderTotal', orderTotal.toString())
        window.open(stripeUrl, '_blank')
      } else {
        // Fallback: show order confirmed if no session
        console.warn('[BOOKING] No checkout URL or sessionId found in response')
        console.log('[BOOKING] Full checkout response:', checkoutResult)
        setOrderConfirmed(true)
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('[BOOKING] Order error:', err)
      setError(err.message || 'Failed to create order')
      setIsLoading(false)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
          <Card className="text-center p-12">
            <div className="mb-6">
              <CheckCircle size={60} className="mx-auto text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-dark mb-3">Payment Processing...</h1>
            <p className="text-gray mb-2">Order ID: {orderId}</p>
            <p className="text-gray mb-8">A payment page has opened in a new tab. Complete your payment there to confirm your booking.</p>
            <div className="bg-mint p-4 rounded-lg mb-8">
              <p className="text-sm text-dark font-semibold mb-2">📋 Payment Tab Instructions:</p>
              <p className="text-xs text-gray mb-3">✓ Complete payment in the new tab that opened</p>
              <p className="text-xs text-gray mb-3">✓ You will see a success message in that tab after payment</p>
              <p className="text-xs text-gray">✓ You can safely close the payment tab after confirming success</p>
            </div>
            <Button onClick={() => router.push('/')} className="mx-auto">Return to Home</Button>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg text-center">
            <Spinner />
            <p className="mt-4 text-dark font-semibold">Processing your order...</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Top Navigation - Back to Home */}
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="absolute top-6 left-6 p-2 hover:bg-mint rounded-full transition"
            title="Go back to home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left text-primary" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
          </button>
          <div className="text-right ml-auto">
            <p className="text-sm text-gray">Step {currentStep} of {steps.length}</p>
          </div>
        </div>

        {/* Progress Indicator - Poplin Style Dots */}
        <div className="mb-16">
          <div className="flex justify-end mb-8">
            <button onClick={() => setShowStepInfo(true)} className="w-10 h-10 rounded-full border-2 border-gray flex items-center justify-center hover:bg-light transition">?</button>
          </div>

          {/* Dot Progress Indicator */}
          <div className="flex justify-center gap-2 mb-12">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => {
                  if (step.number < currentStep) {
                    setCurrentStep(step.number)
                    setError('')
                  }
                }}
                className={`w-3 h-3 rounded-full transition ${
                  step.number <= currentStep ? 'bg-primary' : 'bg-gray opacity-30'
                } ${step.number > currentStep ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              />
            ))}
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-dark mb-2">{steps[currentStep - 1].title}</h2>
            <p className="text-gray">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{error}</p>
                {error.includes('Professional or Washlee Premium plan') && (
                  <Link href="/pricing" className="text-red-700 underline hover:text-red-800 font-semibold mt-2 inline-block">
                    View plans →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Select Service */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-dark">STANDARD LAUNDRY SERVICE</h3>
                {presets.length > 0 && (
                  <button
                    onClick={() => setShowPresetsModal(true)}
                    className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-semibold hover:bg-primary/20 transition"
                  >
                    ⚡ Quick Reorder ({presets.length})
                  </button>
                )}
              </div>
              <p className="text-sm text-gray mb-6">Washlee provides professional wash, dry, and fold service. Pick up tomorrow or get express same-day service.</p>
              
              <div className="space-y-4">
                <div className="border-2 border-primary bg-mint rounded-lg p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-2xl font-bold text-dark">👕 Professional Laundry</p>
                      <p className="text-sm text-gray mt-2">Wash • Dry • Fold • Deliver</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-primary mt-4">$5.00/kg (Standard)</p>
                  <p className="text-sm text-gray mt-1">$10.00/kg (Express same-day)</p>
                  
                  <div className="mt-4 pt-4 border-t border-primary/30 space-y-2">
                    <p className="text-sm text-dark">✓ Professional washing & folding</p>
                    <p className="text-sm text-dark">✓ Free pickup & delivery (next day or express)</p>
                    <p className="text-sm text-dark">✓ Choice of detergent & care options</p>
                    <p className="text-sm text-dark">✓ Poplin's Protection Plan available</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: Pickup Location */}
        {currentStep === 2 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-dark mb-2">Pickup Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => {
                      const val = e.target.value
                      setAddressInput(val)
                      setAddressError('')
                      setShowAddressPredictions(val.length > 0)
                      if (val.length >= 3) {
                        fetchAddressPredictions(val)
                      } else {
                        setAddressPredictions([])
                      }
                    }}
                    placeholder="Enter your address (e.g., 123 Main St, Sydney NSW)"
                    className="w-full px-4 py-3 border-2 border-gray rounded-lg focus:border-primary outline-none"
                  />
                  
                  {showAddressPredictions && addressPredictions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-primary rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto mt-1">
                      {addressPredictions.map((prediction, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectAddress(prediction)}
                          className="w-full text-left px-4 py-3 hover:bg-mint border-b border-light last:border-b-0 transition"
                        >
                          <p className="font-semibold text-dark text-sm">{prediction.main_text}</p>
                          <p className="text-xs text-gray">{prediction.secondary_text}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {isValidatingAddress && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-mint rounded-lg">
                    <Spinner />
                    <p className="text-sm text-dark font-semibold">Validating address...</p>
                  </div>
                )}
                
                {addressError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{addressError}</p>
                  </div>
                )}
                
                {bookingData.pickupAddressDetails && (
                  <div className="mt-3 p-3 bg-mint rounded-lg">
                    <p className="text-sm text-dark font-semibold">✓ Address confirmed: {bookingData.pickupAddress}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-dark mb-2">Select Pickup Spot</label>
                <button
                  onClick={() => setShowPickupSpotModal(true)}
                  className="w-full border-2 border-gray rounded-lg p-4 text-left hover:border-primary transition"
                >
                  <p className="text-dark font-semibold">{pickupSpots.find(s => s.id === bookingData.pickupSpot)?.label}</p>
                </button>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingData.addPickupInstructions}
                  onChange={(e) => setBookingData({ ...bookingData, addPickupInstructions: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-dark font-semibold">Add pickup instructions</span>
                <button onClick={() => setShowPickupInstructionsInfo(true)} className="text-primary text-sm">ℹ️</button>
              </label>

              {bookingData.addPickupInstructions && (
                <textarea
                  value={bookingData.pickupInstructions}
                  onChange={(e) => setBookingData({ ...bookingData, pickupInstructions: e.target.value })}
                  placeholder="Building access details, gate codes, etc..."
                  className="w-full mt-4 p-3 border-2 border-gray rounded-lg focus:border-primary outline-none"
                  rows={3}
                />
              )}
            </Card>
          </div>
        )}

        {/* STEP 3: Laundry Care */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h3 className="font-bold text-dark mb-6">LAUNDRY CARE & PREFERENCES</h3>
              
              {/* Detergent Selection */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <label className="block text-sm font-semibold text-dark">Select Detergent</label>
                  <button onClick={() => setShowDetergentInfo(true)} className="text-primary hover:text-primary/80">ℹ️</button>
                </div>
                <button
                  onClick={() => setShowDetergentModal(true)}
                  className="w-full border-2 border-gray rounded-lg p-4 text-left hover:border-primary transition"
                >
                  <p className="text-dark font-semibold">{detergents.find(d => d.id === bookingData.detergent)?.label}</p>
                </button>
              </div>

              {/* Care Instructions */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-sm font-semibold text-dark">Special Care Instructions</h4>
                  <button onClick={() => setShowSpecialCareInfo(true)} className="text-primary hover:text-primary/80">ℹ️</button>
                </div>
                <p className="text-sm font-semibold text-dark mb-4">Special Care Instructions</p>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-gray rounded-lg hover:border-primary transition"
                    onClick={() => setBookingData({ ...bookingData, delicateCycle: !bookingData.delicateCycle })}
                  >
                    <input type="checkbox" checked={bookingData.delicateCycle} onChange={() => {}} className="w-5 h-5 mt-1" />
                    <div>
                      <p className="font-semibold text-dark">Delicate Cycle</p>
                      <p className="text-xs text-gray">Place your delicates in a separate bag clearly labeled 'delicates'.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-gray rounded-lg hover:border-primary transition"
                    onClick={() => setBookingData({ ...bookingData, returnsOnHangers: !bookingData.returnsOnHangers })}
                  >
                    <input type="checkbox" checked={bookingData.returnsOnHangers} onChange={() => {}} className="w-5 h-5 mt-1" />
                    <div>
                      <p className="font-semibold text-dark">Return Items on Hangers</p>
                      <p className="text-xs text-gray">Your items will be returned on hangers (must provide hangers).</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Add-ons (Optional) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-sm font-semibold text-dark">ADD-ONS (OPTIONAL)</p>
                  <button onClick={() => setShowAddOnsInfo(true)} className="text-primary hover:text-primary/80">ℹ️</button>
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-gray rounded-lg hover:border-primary transition"
                    onClick={() => setBookingData({ ...bookingData, hangDry: !bookingData.hangDry })}
                  >
                    <input type="checkbox" checked={bookingData.hangDry} onChange={() => {}} className="w-5 h-5 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-dark">Hang Dry</p>
                      <p className="text-xs text-gray">Your items will be air-dried instead of machine dried.</p>
                    </div>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">+$16.50</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-gray rounded-lg hover:border-primary transition"
                    onClick={() => setBookingData({ ...bookingData, delicatesCare: !bookingData.delicatesCare })}
                  >
                    <input type="checkbox" checked={bookingData.delicatesCare} onChange={() => {}} className="w-5 h-5 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-dark">Delicates Care</p>
                      <p className="text-xs text-gray">Premium care for silk, satin, and delicate fabrics.</p>
                    </div>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">+$22.00</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-gray rounded-lg hover:border-primary transition"
                    onClick={() => setBookingData({ ...bookingData, comforterService: !bookingData.comforterService })}
                  >
                    <input type="checkbox" checked={bookingData.comforterService} onChange={() => {}} className="w-5 h-5 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-dark">Comforter Service</p>
                      <p className="text-xs text-gray">For comforters, quilts, and large bedding items.</p>
                    </div>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">+$25.00</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-gray rounded-lg hover:border-primary transition"
                    onClick={() => setBookingData({ ...bookingData, stainTreatment: !bookingData.stainTreatment })}
                  >
                    <input type="checkbox" checked={bookingData.stainTreatment} onChange={() => {}} className="w-5 h-5 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-dark">Stain Treatment</p>
                      <p className="text-xs text-gray">Expert stain removal service.</p>
                    </div>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">+$0.50/item</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-gray rounded-lg hover:border-primary transition"
                    onClick={() => setBookingData({ ...bookingData, ironing: !bookingData.ironing })}
                  >
                    <input type="checkbox" checked={bookingData.ironing} onChange={() => {}} className="w-5 h-5 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-dark">Ironing</p>
                      <p className="text-xs text-gray">Professional ironing service.</p>
                    </div>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">Included</span>
                  </label>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 4: Bag Count */}
        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="font-bold text-dark">LAUNDRY WEIGHT</h3>
                <button onClick={() => setShowWeightInfo(true)} className="text-primary hover:text-primary/80">ℹ️</button>
              </div>
              <p className="text-sm text-gray mb-6">Select the number of bags/hampers. Each bag ≈ 2.5kg. Charged at $5/kg (standard) or $10/kg (express).</p>

              <div className="space-y-6">
                <div>
                  <p className="font-semibold text-dark mb-2">How many bags?</p>
                  <p className="text-xs text-gray mb-3">Minimum 4 bags (10kg) | Each bag ≈ 2.5kg</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setBookingData({ ...bookingData, bagCount: Math.max(4, bookingData.bagCount - 1) })}
                      className="w-10 h-10 rounded-full bg-dark text-white font-bold hover:bg-dark/90"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold text-dark w-8 text-center">{bookingData.bagCount}</span>
                    <button
                      onClick={() => {
                        const newCount = bookingData.bagCount + 1
                        const newWeight = newCount * 2.5
                        if (newWeight > 25 && (userData?.subscription?.plan || 'free') === 'free') {
                          setError('Loads over 25kg require a Professional or Washlee Premium plan. Upgrade to unlock larger loads.')
                        } else {
                          setBookingData({ ...bookingData, bagCount: newCount })
                          setError('')
                        }
                      }}
                      className="w-10 h-10 rounded-full bg-dark text-white font-bold hover:bg-dark/90"
                    >
                      +
                    </button>
                  </div>
                  <p className={`text-sm font-semibold mt-2 ${(bookingData.bagCount * 2.5) > 25 && (userData?.subscription?.plan || 'free') === 'free' ? 'text-red-600' : 'text-primary'}`}>
                    ≈ {(bookingData.bagCount * 2.5).toFixed(1)} kg {(userData?.subscription?.plan || 'free') === 'free' && '(max 25kg)'}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-dark mb-4">Oversized Items</p>
                  <p className="text-xs text-gray mb-3">Comforters, bedding, etc. (+$8 each)</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setBookingData({ ...bookingData, oversizedItems: Math.max(0, bookingData.oversizedItems - 1) })}
                      className="w-10 h-10 rounded-full bg-dark text-white font-bold hover:bg-dark/90"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold text-dark w-8 text-center">{bookingData.oversizedItems}</span>
                    <button
                      onClick={() => setBookingData({ ...bookingData, oversizedItems: bookingData.oversizedItems + 1 })}
                      className="w-10 h-10 rounded-full bg-dark text-white font-bold hover:bg-dark/90"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {calculateTotal() < 30 && (
                <div className="mt-6 bg-blue-100 border border-blue-300 text-blue-700 p-4 rounded-lg text-sm">
                  💰 $50 MINIMUM ORDER - Add more laundry to meet minimum!
                </div>
              )}

              {(bookingData.bagCount * 2.5) > 25 && (userData?.subscription?.plan || 'free') === 'free' && (
                <div className="mt-6 bg-amber-100 border border-amber-300 text-amber-700 p-4 rounded-lg text-sm">
                  ⚠️ <strong>Weight limit reached:</strong> Loads over 25kg require a Professional or Washlee Premium plan.
                  <Link href="/pricing" className="block mt-2 text-amber-700 underline hover:text-amber-800 font-semibold">
                    Upgrade your plan →
                  </Link>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 5: Delivery Speed */}
        {currentStep === 5 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-dark">DELIVERY SPEED</h3>
                <button onClick={() => setShowDeliverySpeedInfo(true)} className="text-primary hover:text-primary/80">ℹ️</button>
              </div>
              <p className="text-sm text-gray mb-8">Choose when you'd like your laundry back.</p>

              <div className="space-y-4">
                {/* Standard Delivery Box */}
                <div
                  onClick={() => setBookingData({ ...bookingData, deliverySpeed: 'standard' })}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition ${
                    bookingData.deliverySpeed === 'standard'
                      ? 'border-primary bg-mint'
                      : 'border-gray hover:border-primary bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-dark">Standard Delivery</p>
                      <p className="text-sm text-gray">Next-day delivery (by 5pm)</p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap">$5.00/kg</span>
                  </div>
                  {bookingData.deliverySpeed === 'standard' && (
                    <div className="mt-4 pt-4 border-t border-primary space-y-2">
                      <p className="text-xs text-primary font-semibold">✓ Selected</p>
                      <p className="text-xs text-primary">⏰ Orders accepted until 11:00pm</p>
                      <p className="text-xs text-primary">🚚 Delivered by 5:00pm next business day</p>
                      <p className="text-xs text-primary">📦 No weight limit</p>
                      <p className="text-xs text-primary">👕 All wash types included</p>
                      <p className="text-xs text-primary">🔄 Turnaround: 18-24 hours</p>
                      <p className="text-xs text-primary">💵 No minimum order</p>
                    </div>
                  )}
                </div>

                {/* Express Delivery Box */}
                <div
                  onClick={() => setBookingData({ ...bookingData, deliverySpeed: 'express' })}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition ${
                    bookingData.deliverySpeed === 'express'
                      ? 'border-primary bg-mint'
                      : 'border-gray hover:border-primary bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-dark">Express Delivery</p>
                      <p className="text-sm text-gray">Same-day delivery (by 7pm)</p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap">$10.00/kg</span>
                  </div>
                  {bookingData.deliverySpeed === 'express' && (
                    <div className="mt-4 pt-4 border-t border-primary space-y-2">
                      <p className="text-xs text-primary font-semibold">✓ Selected</p>
                      <p className="text-xs text-primary">⏰ Orders accepted until 12:00pm</p>
                      <p className="text-xs text-primary">🚚 Guaranteed delivery by 7:00pm same day</p>
                      <p className="text-xs text-primary">📦 Maximum 25kg per order</p>
                      <p className="text-xs text-primary">👕 Standard wash only (no dry cleaning)</p>
                      <p className="text-xs text-primary">🔄 Turnaround: 6-7 hours</p>
                      <p className="text-xs text-primary">💵 Minimum order: $50</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 6: Protection Plan */}
        {currentStep === 6 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-dark">COVERAGE</h3>
                <button onClick={() => setShowProtectionPlanInfo(true)} className="text-primary hover:text-primary/80">ℹ️</button>
              </div>
              <p className="text-xs text-gray mb-4">Washlee's Protection Plan covers you in the rare instance of damage or loss.</p>

              <div className="space-y-2">
                {protectionPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setBookingData({ ...bookingData, protectionPlan: plan.id })}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      bookingData.protectionPlan === plan.id
                        ? 'border-primary bg-mint'
                        : 'border-gray hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-dark text-sm">{plan.name}</p>
                        <p className="text-xs text-gray">{plan.coverage}</p>
                        <p className="text-xs text-gray">{plan.max}</p>
                      </div>
                      <p className="text-sm font-bold text-primary whitespace-nowrap">{plan.price}</p>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-xs text-blue-600 mt-3">
                <a href="/protection-plan" className="underline">Learn more</a> about Washlee's Protection Plan.
              </p>
            </Card>
          </div>
        )}

        {/* STEP 7: Review & Confirm */}
        {currentStep === 7 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h3 className="font-bold text-dark mb-6">Order Summary</h3>

              <div className="space-y-4 border-b border-gray pb-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray">Service:</span>
                  <span className="font-semibold text-dark">{services.find(s => s.id === bookingData.selectedService)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray">Bags:</span>
                  <span className="font-semibold text-dark">{bookingData.bagCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray">Delivery:</span>
                  <span className="font-semibold text-dark">{bookingData.deliverySpeed === 'standard' ? 'Standard' : 'Express'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray">Protection:</span>
                  <span className="font-semibold text-dark">{protectionPlans.find(p => p.id === bookingData.protectionPlan)?.name}</span>
                </div>
              </div>

              <div className="mb-6 pt-4 border-t border-gray">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-dark">Total:</span>
                  <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)} (inc. GST)</span>
                </div>
              </div>

              <label className="flex items-start gap-3 mb-6 p-4 border border-gray rounded-lg hover:bg-light transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 rounded mt-1 cursor-pointer"
                />
                <span className="text-sm text-gray">
                  I agree to the <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a> and understand the pricing
                </span>
              </label>
            </Card>
          </div>
        )}

        {/* Modals */}
        {/* Pickup Spot Modal */}
        {showPickupSpotModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Select Pickup Spot</h3>
                <button onClick={() => setShowPickupSpotModal(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {pickupSpots.map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => {
                      setBookingData({ ...bookingData, pickupSpot: spot.id })
                      setShowPickupSpotModal(false)
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      bookingData.pickupSpot === spot.id
                        ? 'border-primary bg-mint'
                        : 'border-gray hover:border-primary'
                    }`}
                  >
                    {spot.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPickupSpotModal(false)}
                  className="flex-1 py-2 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPickupSpotModal(false)}
                  className="flex-1 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detergent Modal */}
        {showDetergentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Select Detergent</h3>
                <button onClick={() => setShowDetergentModal(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {detergents.map((detergent) => (
                  <button
                    key={detergent.id}
                    onClick={() => {
                      setBookingData({ ...bookingData, detergent: detergent.id })
                      setShowDetergentModal(false)
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      bookingData.detergent === detergent.id
                        ? 'border-primary bg-mint'
                        : 'border-gray hover:border-primary'
                    }`}
                  >
                    {detergent.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetergentModal(false)}
                  className="flex-1 py-2 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowDetergentModal(false)}
                  className="flex-1 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pickup Instructions Info Modal */}
        {showPickupInstructionsInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Pickup Instructions</h3>
                <button onClick={() => setShowPickupInstructionsInfo(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray mb-6">
                <p className="font-semibold text-dark">Your Laundry Pro will ONLY see these details when they are in route to pickup your order.</p>
                <p>Customers often share:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Building access details</li>
                  <li>Gate codes</li>
                  <li>How laundry can be found</li>
                </ul>
                <p>For requests related to pickup or delivery timing, please message your Laundry Pro as soon as they accept your order.</p>
              </div>

              <button
                onClick={() => setShowPickupInstructionsInfo(false)}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Detergent Info Modal */}
        {showDetergentInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Detergent Types</h3>
                <button onClick={() => setShowDetergentInfo(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p><strong className="text-dark">Classic Scented:</strong> Our signature fresh scent that your customers love.</p>
                <p><strong className="text-dark">Hypoallergenic:</strong> Gentle, fragrance-free formula ideal for sensitive skin.</p>
                <p><strong className="text-dark">Eco-Friendly:</strong> Plant-based, biodegradable detergent for the environmentally conscious.</p>
                <p className="text-xs italic">All detergents are professional-grade and included in your service.</p>
              </div>
              <button
                onClick={() => setShowDetergentInfo(false)}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Special Care Info Modal */}
        {showSpecialCareInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Special Care Instructions</h3>
                <button onClick={() => setShowSpecialCareInfo(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p><strong className="text-dark">Delicate Cycle:</strong> Uses a gentle wash cycle with reduced agitation for fragile fabrics.</p>
                <p><strong className="text-dark">Return Items on Hangers:</strong> Your items will be returned on hangers to maintain freshness. Please provide hangers.</p>
                <p className="text-xs">These options help protect your most delicate items during washing and handling.</p>
              </div>
              <button
                onClick={() => setShowSpecialCareInfo(false)}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Add-ons Info Modal */}
        {showAddOnsInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Premium Add-ons</h3>
                <button onClick={() => setShowAddOnsInfo(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p>Enhance your laundry service with premium add-ons:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Hang Dry:</strong> Air-dry your clothes instead of machine drying</li>
                  <li><strong>Delicates Care:</strong> Premium care for silk, satin, and delicate fabrics</li>
                  <li><strong>Comforter Service:</strong> Specialized cleaning for large bedding items</li>
                  <li><strong>Stain Treatment:</strong> Expert stain removal service</li>
                  <li><strong>Ironing:</strong> Professional pressing and folding</li>
                </ul>
              </div>
              <button
                onClick={() => setShowAddOnsInfo(false)}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Weight Info Modal */}
        {showWeightInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Measuring Your Laundry</h3>
                <button onClick={() => setShowWeightInfo(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p className="font-semibold text-dark">Quick reference:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>1 bag ≈ 2.5kg (small laundry hamper)</li>
                  <li>2 bags ≈ 5kg (medium load)</li>
                  <li>4 bags ≈ 10kg (large load)</li>
                </ul>
                <p className="text-xs">Pricing: <strong>$5.00/kg</strong> (Standard) or <strong>$10.00/kg</strong> (Express)</p>
              </div>
              <button
                onClick={() => setShowWeightInfo(false)}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Delivery Speed Info Modal */}
        {showDeliverySpeedInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Delivery Options</h3>
                <button onClick={() => setShowDeliverySpeedInfo(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p><strong className="text-dark">Standard Delivery:</strong> Next-day delivery at $5.00/kg. Perfect for regular weekly laundry.</p>
                <p><strong className="text-dark">Express Delivery:</strong> Same-day or overnight service at $10.00/kg. Ideal for urgent needs.</p>
                <p className="text-xs">Choose based on your schedule and budget.</p>
              </div>
              <button
                onClick={() => setShowDeliverySpeedInfo(false)}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Protection Plan Info Modal */}
        {showProtectionPlanInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Protection Plans</h3>
                <button onClick={() => setShowProtectionPlanInfo(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p className="font-semibold text-dark">Choose your coverage level:</p>
                <ul className="space-y-3 ml-2">
                  <li><strong>Basic (FREE):</strong> $50/item, $300/order max</li>
                  <li><strong>Premium ($2.50):</strong> $100/item, $500/order max</li>
                  <li><strong>Premium+ ($5.75):</strong> $150/item, $1000/order max</li>
                </ul>
                <p className="text-xs">All plans cover loss or damage during the laundry process with a 14-day claim window.</p>
              </div>
              <button
                onClick={() => setShowProtectionPlanInfo(false)}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Step Info Modal */}
        {showStepInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">{steps[currentStep - 1].title}</h3>
                <button onClick={() => setShowStepInfo(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray mb-6">
                {currentStep === 1 && (
                  <>
                    <p className="font-semibold text-dark">Why choose Washlee?</p>
                    <p>We provide professional wash, dry, and fold service with flexible pickup and delivery options.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Professional washing & folding</li>
                      <li>Free pickup & delivery (next day or express)</li>
                      <li>Choice of detergent & care options</li>
                      <li>Washlee's Protection Plan available</li>
                    </ul>
                    <p className="text-xs italic">Pricing starts at $5.00/kg for standard service.</p>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <p className="font-semibold text-dark">How pickup works:</p>
                    <p>Tell us where to pick up your laundry and any special instructions for our Laundry Pro.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Confirm your pickup address</li>
                      <li>Choose your pickup spot (front door, back door, etc.)</li>
                      <li>Add pickup instructions if needed</li>
                      <li>Your Laundry Pro will see instructions en route</li>
                    </ul>
                    <p className="text-xs italic">Provide building codes, gate access, or location details to help your Laundry Pro.</p>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <p className="font-semibold text-dark">Customize your care:</p>
                    <p>Select your preferred detergent and add special care options to protect your clothes.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Choose detergent type (scented, hypoallergenic, eco-friendly)</li>
                      <li>Add special care instructions for delicates</li>
                      <li>Select premium add-ons (stain treatment, hang dry, etc.)</li>
                    </ul>
                    <p className="text-xs italic">Washlee treats your clothes with the same care you would at home.</p>
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <p className="font-semibold text-dark">Estimate your laundry weight:</p>
                    <p>Select how many bags or hampers you're sending. We'll charge by actual weight.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>1 bag ≈ 2.5kg (small hamper)</li>
                      <li>2 bags ≈ 5kg (medium load)</li>
                      <li>4 bags ≈ 10kg (large load)</li>
                    </ul>
                    <p className="text-xs italic">Price is calculated at $5/kg (Standard) or $10/kg (Express).</p>
                  </>
                )}

                {currentStep === 5 && (
                  <>
                    <p className="font-semibold text-dark">Choose your delivery speed:</p>
                    <p>Pick the timing that works best for you.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Standard:</strong> Next-day delivery at $5.00/kg</li>
                      <li><strong>Express:</strong> Same-day/overnight at $10.00/kg</li>
                    </ul>
                    <p className="text-xs italic">Express orders are delivered by 8pm the next day.</p>
                  </>
                )}

                {currentStep === 6 && (
                  <>
                    <p className="font-semibold text-dark">Protect your items:</p>
                    <p>Choose a protection plan to cover your laundry in the rare event of loss or damage.</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><strong>Basic (FREE):</strong> Up to $50/item, $300/order max</li>
                      <li><strong>Premium ($2.50):</strong> Up to $100/item, $500/order max</li>
                      <li><strong>Premium+ ($5.75):</strong> Up to $150/item, $1000/order max</li>
                    </ul>
                    <p className="text-xs italic">All claims are processed within 14 days.</p>
                  </>
                )}

                {currentStep === 7 && (
                  <>
                    <p className="font-semibold text-dark">Secure payment with Stripe:</p>
                    <p>We use Stripe to securely process your payment. Your order is confirmed once payment is complete.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Secure SSL encryption</li>
                      <li>Multiple payment methods accepted</li>
                      <li>Order confirmation sent to your email</li>
                      <li>Track your order in real-time</li>
                    </ul>
                    <p className="text-xs italic">Your payment information is never shared with Washlee staff.</p>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowStepInfo(false)}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Presets Modal */}
        {showPresetsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">⚡ Quick Reorder</h3>
                <button onClick={() => setShowPresetsModal(false)} className="text-gray hover:text-dark">
                  <X size={24} />
                </button>
              </div>

              {presets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray">No saved presets yet. Complete your first order to create a quick reorder preset!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className="w-full text-left p-4 border-2 border-gray rounded-lg hover:border-primary hover:bg-mint/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-dark">{preset.label}</p>
                          <p className="text-xs text-gray mt-1">
                            {preset.bagCount} bags • {preset.deliverySpeed === 'express' ? 'Express' : 'Standard'} • {preset.detergent}
                          </p>
                          {preset.usageCount && (
                            <p className="text-xs text-primary mt-1">Used {preset.usageCount} time(s)</p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-primary flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowPresetsModal(false)}
                className="w-full mt-6 py-2 border-2 border-gray text-dark rounded-lg font-semibold hover:bg-light transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="max-w-2xl mx-auto mt-12">
          {currentStep === 1 ? (
            // Step 1: Only Continue button, full width and bigger
            <Button
              onClick={handleNext}
              size="lg"
              className="w-full py-4 flex items-center justify-center gap-2 text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Processing...
                </>
              ) : (
                <>
                  Continue <ChevronRight size={20} />
                </>
              )}
            </Button>
          ) : currentStep === 7 ? (
            // Step 7: Back and Confirm & Pay button
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
              >
                Back
              </button>
              <Button
                onClick={handleNext}
                size="lg"
                className="flex-1 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm & Pay <CheckCircle size={20} />
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Other steps: Back and Continue buttons
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
              >
                Back
              </button>
              <Button
                onClick={handleNext}
                size="lg"
                className="flex-1 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue <ChevronRight size={20} />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
