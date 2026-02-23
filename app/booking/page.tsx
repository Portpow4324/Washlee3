'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Clock, MapPin, Droplet, Wind, Truck, CheckCircle, ChevronRight, AlertCircle, Mail, Phone } from 'lucide-react'
import Spinner from '@/components/Spinner'
import { AddressParts } from '@/lib/googlePlaces'

// Australian postcode validation helper
const validateAustralianPostcode = (postcode: string): boolean => {
  const ausPostcodeRegex = /^[0-9]{4}$/
  return ausPostcodeRegex.test(postcode)
}

// Australian phone validation
const validateAustralianPhone = (phone: string): boolean => {
  // Remove spaces and hyphens
  const cleaned = phone.replace(/[\s-]/g, '')
  // Australian phone: starts with +61, 02-08, or 04, and is 10 digits without +61
  const phoneRegex = /^(\+61|0)[0-9]{9,10}$/
  return phoneRegex.test(cleaned)
}

// Email validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Check if address appears to be in Australia
const validateAustralianAddress = (address: string): boolean => {
  const australianStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory', 'Australia']
  const upperAddress = address.toUpperCase()
  return australianStates.some(state => upperAddress.includes(state))
}

export default function Booking() {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [bookingData, setBookingData] = useState({
    // Step 1: Pickup Time
    pickupTime: 'soon', // 'soon' or 'later'
    scheduleDate: '',
    scheduleTime: '',
    
    // Step 2: Preferences
    detergent: 'eco-friendly', // 'hypoallergenic', 'eco-friendly', 'scented'
    waterTemp: 'warm', // 'cold', 'warm', 'hot'
    specialCare: '',
    foldingPreference: 'folded', // 'folded' or 'hanging'
    
    // Step 3: Weight & Add-ons
    estimatedWeight: '5', // kg
    addOns: {
      hangDry: false,
      delicatesCare: false,
      comforterService: false,
      stainTreatment: 0, // number of items
      ironing: false,
    },
    
    // Step 4: Delivery
    deliverySpeed: 'standard', // 'standard' or 'same-day'
    deliveryAddress: userData?.address || '',
    deliveryAddressDetails: null as AddressParts | null,
    // Essential address fields
    deliveryAddressLine1: '', // Street address
    deliveryAddressLine2: '', // Unit/Apartment
    deliveryCity: '', // City/Suburb
    deliveryState: '', // State/Province
    deliveryPostcode: '', // Postcode/ZIP
    deliveryCountry: 'Australia', // Country
    deliveryNotes: '',
  })

  // Validation feedback states
  const [addressValidation, setAddressValidation] = useState<'valid' | 'invalid' | 'empty'>('empty')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  const steps = [
    {
      number: 1,
      title: 'Schedule Pickup',
      description: 'Choose your pickup time and preferences',
    },
    {
      number: 2,
      title: 'Laundry Preferences',
      description: 'Select detergent, temperature, and care instructions',
    },
    {
      number: 3,
      title: 'Weight & Add-ons',
      description: 'Choose weight and select add-on services',
    },
    {
      number: 4,
      title: 'Delivery Options',
      description: 'Choose delivery speed and location',
    },
    {
      number: 5,
      title: 'Review & Confirm',
      description: 'Review your order and confirm',
    },
  ]

  // Helper function to calculate total order cost
  const calculateOrderTotal = (data = bookingData) => {
    let total = parseFloat(data.estimatedWeight) * 3.0
    if (data.addOns.hangDry) total += parseFloat(data.estimatedWeight) * 3.30
    if (data.addOns.delicatesCare) total += parseFloat(data.estimatedWeight) * 4.40
    if (data.addOns.comforterService) total += 25.0
    if (data.addOns.stainTreatment > 0) total += data.addOns.stainTreatment * 0.50
    if (data.addOns.ironing) total += parseFloat(data.estimatedWeight) * 6.60
    if (data.deliverySpeed === 'same-day') total += 5.0
    return total
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmitOrder()
      }
      setError('')
    }
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (bookingData.pickupTime === 'later') {
          if (!bookingData.scheduleDate || !bookingData.scheduleTime) {
            setError('Please select a date and time')
            return false
          }
        }
        return true
      case 2:
        return true
      case 3:
        const orderTotal = calculateOrderTotal()
        if (orderTotal < 24) {
          setError('Minimum order is $24.00. Please increase weight or add premium services.')
          return false
        }
        return true
      case 4:
        if (!bookingData.deliveryAddress) {
          setError('Please provide a delivery address')
          return false
        }
        if (!bookingData.deliveryAddressDetails) {
          setError('❌ Please select a valid Australian address from the suggestions')
          return false
        }
        // Use email from userData OR firebase user - fallback to prevent false negatives
        const email = userData?.email || user?.email || ''
        if (!email || !validateEmail(email)) {
          setError('❌ Email address is missing or invalid. Please update your profile.')
          return false
        }
        if (userData?.phone && !validateAustralianPhone(userData.phone)) {
          setError('❌ Invalid Australian phone number. Please update your profile with a valid Australian phone number.')
          return false
        }
        return true
      case 5:
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

    try {
      if (!user) throw new Error('User not found')

      // Calculate base laundry cost
      let orderTotal = parseFloat(bookingData.estimatedWeight) * 3.0
      
      // Add premium services
      if (bookingData.addOns.hangDry) orderTotal += parseFloat(bookingData.estimatedWeight) * 3.30
      if (bookingData.addOns.delicatesCare) orderTotal += parseFloat(bookingData.estimatedWeight) * 4.40
      if (bookingData.addOns.comforterService) orderTotal += 25.0
      if (bookingData.addOns.stainTreatment > 0) orderTotal += bookingData.addOns.stainTreatment * 0.50
      if (bookingData.addOns.ironing) orderTotal += parseFloat(bookingData.estimatedWeight) * 6.60
      
      // Add delivery
      if (bookingData.deliverySpeed === 'same-day') orderTotal += 5.0

      // Validate minimum purchase amount
      if (orderTotal < 24) {
        setIsLoading(false);
        return;
      }

      console.log('[BOOKING] Creating order via API...')
      
      // Create order in Firestore via API (server-side, bypasses client offline issues)
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          customerName: userData?.name || 'Customer',
          customerEmail: user.email,
          customerPhone: userData?.phone || '',
          bookingData,
          orderTotal,
        }),
      })

      let firestoreOrderId = null
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json()
        firestoreOrderId = orderData.orderId
        console.log('[BOOKING] ✓ Order created in Firestore:', firestoreOrderId)
      } else {
        const errorData = await orderResponse.json()
        console.warn('[BOOKING] Failed to create order in Firestore:', errorData.error)
        // Continue anyway - order can be created after payment
      }

      // Generate order ID for Stripe (use Firestore ID if available, otherwise temp ID)
      const orderId = firestoreOrderId || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log('[BOOKING] Proceeding with order ID:', orderId)
      console.log('[BOOKING] Creating Stripe checkout session...')
      console.log('[BOOKING] Order total:', orderTotal)
      
      // Create Stripe checkout session
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderTotal,
          customerEmail: user.email,
          customerName: userData?.name || 'Customer',
          uid: user.uid, // Add Firebase user ID for webhook
          bookingData,
        }),
      })

      console.log('[BOOKING] Checkout response status:', checkoutResponse.status)

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        console.error('[BOOKING] Checkout error:', errorData)
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { sessionId, url, success } = await checkoutResponse.json()
      
      console.log('[BOOKING] Checkout session created:', { sessionId, success })
      console.log('[BOOKING] Stripe URL present:', !!url)
      
      // Redirect to Stripe checkout
      if (url) {
        console.log('[BOOKING] ✅ Redirecting to Stripe checkout...')
        window.location.href = url
      } else {
        throw new Error('No checkout URL received from server')
      }
    } catch (err: any) {
      console.error('[BOOKING] Order error:', err)
      setError(err.message || 'Failed to create order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Success screen
  if (orderConfirmed) {
    // Calculate total cost
    let totalCost = parseFloat(bookingData.estimatedWeight) * 3.0
    if (bookingData.addOns.hangDry) totalCost += parseFloat(bookingData.estimatedWeight) * 3.30
    if (bookingData.addOns.delicatesCare) totalCost += parseFloat(bookingData.estimatedWeight) * 4.40
    if (bookingData.addOns.comforterService) totalCost += 25.0
    if (bookingData.addOns.stainTreatment > 0) totalCost += bookingData.addOns.stainTreatment * 0.50
    if (bookingData.addOns.ironing) totalCost += parseFloat(bookingData.estimatedWeight) * 6.60
    if (bookingData.deliverySpeed === 'same-day') totalCost += 5.0
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint to-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle size={64} className="text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-dark mb-3">Order Confirmed!</h1>
              <p className="text-gray mb-6">Your laundry pickup is scheduled</p>
              
              <div className="bg-light rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray mb-1">Order ID</p>
                <p className="font-mono text-dark font-semibold mb-4">{orderId}</p>
                
                <div className="space-y-3 border-t border-gray pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray">Pickup Time:</span>
                    <span className="font-semibold text-dark">
                      {bookingData.pickupTime === 'soon' ? 'ASAP' : `${bookingData.scheduleDate}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Estimated Weight:</span>
                    <span className="font-semibold text-dark">{bookingData.estimatedWeight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Base Cost:</span>
                    <span className="font-semibold text-dark">${(parseFloat(bookingData.estimatedWeight) * 3.0).toFixed(2)}</span>
                  </div>
                  {bookingData.deliverySpeed === 'same-day' && (
                    <div className="flex justify-between">
                      <span className="text-gray">Same-Day Delivery:</span>
                      <span className="font-semibold text-dark">+$5.00</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray pt-3">
                    <span className="font-bold text-dark">Total:</span>
                    <span className="text-xl font-bold text-primary">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 text-sm text-gray">
                <div className="flex gap-2">
                  <Truck size={16} className="flex-shrink-0 text-primary mt-1" />
                  <span>Your Washlee Pro will arrive at your scheduled time</span>
                </div>
                <div className="flex gap-2">
                  <Clock size={16} className="flex-shrink-0 text-primary mt-1" />
                  <span>Track your Pro's arrival in real-time in the app</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle size={16} className="flex-shrink-0 text-primary mt-1" />
                  <span>Next-day delivery included in standard pricing</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => router.push('/dashboard/customer')}
                >
                  View Order in Dashboard
                </Button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                >
                  Back to Home
                </button>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg text-center">
            <Spinner />
            <p className="mt-4 text-dark font-semibold">Processing your order...</p>
            <p className="mt-2 text-sm text-gray">Please wait while we set up your payment</p>
          </div>
        </div>
      )}
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        {/* Progress Indicator with Clickable Steps */}
        <div className="mb-16">
          {/* Continuous Background Line */}
          <div className="flex justify-between items-center mb-12 relative">
            {/* Full width line behind everything */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray opacity-30 z-0" />
            
            {/* Progress line (filled portion) */}
            {currentStep > 1 && (
              <div 
                className="absolute top-6 left-0 h-1 bg-primary z-0 transition-all duration-300"
                style={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
                }}
              />
            )}

            {/* Step Circles */}
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center relative z-10">
                {/* Step Button */}
                <button
                  onClick={() => {
                    if (step.number < currentStep) {
                      setCurrentStep(step.number)
                      setError('')
                    }
                  }}
                  disabled={step.number > currentStep}
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition mb-3 border-4 border-light ${
                    step.number <= currentStep
                      ? 'bg-primary text-white cursor-pointer hover:shadow-lg'
                      : 'bg-gray text-white opacity-50 cursor-not-allowed'
                  }`}
                >
                  {step.number <= currentStep ? step.number : step.number}
                </button>
                
                {/* Step Name Label */}
                <p className={`text-sm font-semibold text-center whitespace-nowrap ${
                  step.number === currentStep ? 'text-primary' : 'text-gray'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark mb-2">
              {steps[currentStep - 1].title}
            </h1>
            <p className="text-gray">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Pickup Time */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold text-dark mb-6">When should we pick up your laundry?</h2>

              <div className="space-y-4 mb-8">
                <label className="flex items-center gap-4 p-6 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setBookingData({ ...bookingData, pickupTime: 'soon' })}
                >
                  <input
                    type="radio"
                    checked={bookingData.pickupTime === 'soon'}
                    onChange={() => {}}
                    className="w-5 h-5"
                  />
                  <div>
                    <p className="font-semibold text-dark">ASAP - Within 2 hours</p>
                    <p className="text-sm text-gray">Our Pro will arrive as soon as possible</p>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-6 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                  onClick={() => setBookingData({ ...bookingData, pickupTime: 'later' })}
                >
                  <input
                    type="radio"
                    checked={bookingData.pickupTime === 'later'}
                    onChange={() => {}}
                    className="w-5 h-5"
                  />
                  <div>
                    <p className="font-semibold text-dark">Schedule for later</p>
                    <p className="text-sm text-gray">Choose your preferred date and time</p>
                  </div>
                </label>
              </div>

              {bookingData.pickupTime === 'later' && (
                <div className="space-y-4 p-6 bg-light rounded-lg">
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2">Date</label>
                    <input
                      type="date"
                      value={bookingData.scheduleDate}
                      onChange={(e) => setBookingData({ ...bookingData, scheduleDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2">Time</label>
                    <input
                      type="time"
                      value={bookingData.scheduleTime}
                      onChange={(e) => setBookingData({ ...bookingData, scheduleTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 2: Preferences */}
        {currentStep === 2 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold text-dark mb-6">Laundry Preferences</h2>

              <div className="space-y-6">
                {/* Detergent */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-3">Detergent Type</label>
                  <div className="space-y-2">
                    {['hypoallergenic', 'eco-friendly', 'scented'].map((type) => (
                      <label key={type} className="flex items-center gap-3 p-3 border border-gray rounded-lg cursor-pointer hover:border-primary transition"
                        onClick={() => setBookingData({ ...bookingData, detergent: type })}
                      >
                        <input
                          type="radio"
                          checked={bookingData.detergent === type}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <span className="capitalize text-dark font-medium">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Water Temperature */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-3">Water Temperature</label>
                  <div className="space-y-2">
                    {['cold', 'warm', 'hot'].map((temp) => (
                      <label key={temp} className="flex items-center gap-3 p-3 border border-gray rounded-lg cursor-pointer hover:border-primary transition"
                        onClick={() => setBookingData({ ...bookingData, waterTemp: temp })}
                      >
                        <input
                          type="radio"
                          checked={bookingData.waterTemp === temp}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <span className="capitalize text-dark font-medium">{temp}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Folding Preference */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-3">Folding Preference</label>
                  <div className="space-y-2">
                    {[
                      { id: 'folded', label: 'Professionally Folded' },
                      { id: 'hanging', label: 'Hung on Hangers' },
                    ].map((pref) => (
                      <label key={pref.id} className="flex items-center gap-3 p-3 border border-gray rounded-lg cursor-pointer hover:border-primary transition"
                        onClick={() => setBookingData({ ...bookingData, foldingPreference: pref.id })}
                      >
                        <input
                          type="radio"
                          checked={bookingData.foldingPreference === pref.id}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <span className="text-dark font-medium">{pref.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Special Care */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Special Care Instructions</label>
                  <textarea
                    value={bookingData.specialCare}
                    onChange={(e) => setBookingData({ ...bookingData, specialCare: e.target.value })}
                    placeholder="e.g., Delicates only, no bleach, dry clean only items..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Weight & Add-ons */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold text-dark mb-2">Laundry Weight & Add-ons</h2>
              {calculateOrderTotal() < 24 && (
                <p className="text-gray mb-8">Minimum order: <span className="font-semibold text-primary">$24.00</span> (8 kg base service)</p>
              )}

              <div className="space-y-8">
                {/* Weight Selection */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-4">Laundry Weight (kg)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {['5', '8', '11', '15', '20', '23', '30', '34'].map((weight) => (
                      <button
                        key={weight}
                        onClick={() => setBookingData({ ...bookingData, estimatedWeight: weight })}
                        className={`py-3 px-4 rounded-lg font-semibold transition border-2 ${
                          bookingData.estimatedWeight === weight
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray text-dark hover:border-primary bg-white'
                        }`}
                      >
                        {weight} kg
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={bookingData.estimatedWeight}
                    onChange={(e) => setBookingData({ ...bookingData, estimatedWeight: e.target.value || '5' })}
                    placeholder="Custom weight"
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Base Service Cost */}
                <div className="bg-light rounded-lg p-6 border border-gray">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-dark font-semibold">Base Service ({bookingData.estimatedWeight} kg @ $3.00/kg)</span>
                    <span className="text-xl font-bold text-primary">${(parseFloat(bookingData.estimatedWeight) * 3.0).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray">Professional washing, drying, folding & next-day delivery</p>
                </div>

                {/* Add-ons Section */}
                <div>
                  <h3 className="text-lg font-semibold text-dark mb-4">Premium Add-ons (Optional)</h3>
                  <div className="space-y-3">
                    {/* Hang Dry */}
                    <label className="flex items-center justify-between p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                      onClick={() => setBookingData({ 
                        ...bookingData, 
                        addOns: { ...bookingData.addOns, hangDry: !bookingData.addOns.hangDry }
                      })}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={bookingData.addOns.hangDry}
                          onChange={() => {}}
                          className="w-5 h-5"
                        />
                        <div>
                          <p className="font-semibold text-dark">Hang Dry</p>
                          <p className="text-sm text-gray">Preserve fabric quality</p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">+${(parseFloat(bookingData.estimatedWeight) * 3.30).toFixed(2)}</span>
                    </label>

                    {/* Delicates Care */}
                    <label className="flex items-center justify-between p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                      onClick={() => setBookingData({ 
                        ...bookingData, 
                        addOns: { ...bookingData.addOns, delicatesCare: !bookingData.addOns.delicatesCare }
                      })}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={bookingData.addOns.delicatesCare}
                          onChange={() => {}}
                          className="w-5 h-5"
                        />
                        <div>
                          <p className="font-semibold text-dark">Delicates Care</p>
                          <p className="text-sm text-gray">Gentle wash for silk, lace & fine fabrics</p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">+${(parseFloat(bookingData.estimatedWeight) * 4.40).toFixed(2)}</span>
                    </label>

                    {/* Comforter Service */}
                    <label className="flex items-center justify-between p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                      onClick={() => setBookingData({ 
                        ...bookingData, 
                        addOns: { ...bookingData.addOns, comforterService: !bookingData.addOns.comforterService }
                      })}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={bookingData.addOns.comforterService}
                          onChange={() => {}}
                          className="w-5 h-5"
                        />
                        <div>
                          <p className="font-semibold text-dark">Comforter Service</p>
                          <p className="text-sm text-gray">Dedicated washing for large items</p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">+$25.00</span>
                    </label>

                    {/* Stain Treatment */}
                    <div className="flex items-center justify-between p-4 border-2 border-gray rounded-lg hover:border-primary transition">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={bookingData.addOns.stainTreatment > 0}
                          onChange={(e) => setBookingData({
                            ...bookingData,
                            addOns: { ...bookingData.addOns, stainTreatment: e.target.checked ? 1 : 0 }
                          })}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <div>
                          <p className="font-semibold text-dark">Stain Treatment</p>
                          <p className="text-sm text-gray">Professional pre-treatment per item</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {bookingData.addOns.stainTreatment > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setBookingData({
                                ...bookingData,
                                addOns: { ...bookingData.addOns, stainTreatment: Math.max(0, bookingData.addOns.stainTreatment - 1) }
                              })}
                              className="w-8 h-8 rounded border border-gray hover:bg-light"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-bold">{bookingData.addOns.stainTreatment}</span>
                            <button
                              onClick={() => setBookingData({
                                ...bookingData,
                                addOns: { ...bookingData.addOns, stainTreatment: bookingData.addOns.stainTreatment + 1 }
                              })}
                              className="w-8 h-8 rounded border border-gray hover:bg-light"
                            >
                              +
                            </button>
                          </div>
                        )}
                        <span className="font-bold text-primary min-w-16 text-right">{bookingData.addOns.stainTreatment > 0 ? `+$${(bookingData.addOns.stainTreatment * 0.50).toFixed(2)}` : '+$0.50'}</span>
                      </div>
                    </div>

                    {/* Ironing */}
                    <label className="flex items-center justify-between p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                      onClick={() => setBookingData({ 
                        ...bookingData, 
                        addOns: { ...bookingData.addOns, ironing: !bookingData.addOns.ironing }
                      })}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={bookingData.addOns.ironing}
                          onChange={() => {}}
                          className="w-5 h-5"
                        />
                        <div>
                          <p className="font-semibold text-dark">Ironing</p>
                          <p className="text-sm text-gray">Professional ironing service</p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">+${(parseFloat(bookingData.estimatedWeight) * 6.60).toFixed(2)}</span>
                    </label>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-light rounded-lg p-6 border-2 border-primary">
                  <h3 className="font-semibold text-dark mb-4">Price Breakdown</h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray">Base Service:</span>
                      <span className="font-semibold">${(parseFloat(bookingData.estimatedWeight) * 3.0).toFixed(2)}</span>
                    </div>
                    {bookingData.addOns.hangDry && (
                      <div className="flex justify-between">
                        <span className="text-gray">Hang Dry:</span>
                        <span className="font-semibold">+${(parseFloat(bookingData.estimatedWeight) * 3.30).toFixed(2)}</span>
                      </div>
                    )}
                    {bookingData.addOns.delicatesCare && (
                      <div className="flex justify-between">
                        <span className="text-gray">Delicates Care:</span>
                        <span className="font-semibold">+${(parseFloat(bookingData.estimatedWeight) * 4.40).toFixed(2)}</span>
                      </div>
                    )}
                    {bookingData.addOns.comforterService && (
                      <div className="flex justify-between">
                        <span className="text-gray">Comforter Service:</span>
                        <span className="font-semibold">+$25.00</span>
                      </div>
                    )}
                    {bookingData.addOns.stainTreatment > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray">Stain Treatment ({bookingData.addOns.stainTreatment} items):</span>
                        <span className="font-semibold">+${(bookingData.addOns.stainTreatment * 0.50).toFixed(2)}</span>
                      </div>
                    )}
                    {bookingData.addOns.ironing && (
                      <div className="flex justify-between">
                        <span className="text-gray">Ironing:</span>
                        <span className="font-semibold">+${(parseFloat(bookingData.estimatedWeight) * 6.60).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray pt-3">
                      <span className="font-bold text-dark">Subtotal:</span>
                      <span className="text-xl font-bold text-primary">
                        ${(
                          parseFloat(bookingData.estimatedWeight) * 3.0 +
                          (bookingData.addOns.hangDry ? parseFloat(bookingData.estimatedWeight) * 3.30 : 0) +
                          (bookingData.addOns.delicatesCare ? parseFloat(bookingData.estimatedWeight) * 4.40 : 0) +
                          (bookingData.addOns.comforterService ? 25.0 : 0) +
                          (bookingData.addOns.stainTreatment * 0.50) +
                          (bookingData.addOns.ironing ? parseFloat(bookingData.estimatedWeight) * 6.60 : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray">Same-day delivery (+$5.00) can be added in the next step</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 4: Delivery */}
        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold text-dark mb-6">Delivery Options</h2>

              <div className="space-y-6">
                {/* Delivery Speed */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-3">Delivery Speed</label>
                  <div className="space-y-3">
                    <label className="flex items-start gap-4 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                      onClick={() => setBookingData({ ...bookingData, deliverySpeed: 'standard' })}
                    >
                      <input
                        type="radio"
                        checked={bookingData.deliverySpeed === 'standard'}
                        onChange={() => {}}
                        className="w-5 h-5 mt-1"
                      />
                      <div>
                        <p className="font-semibold text-dark">Standard Delivery - 24 hours</p>
                        <p className="text-sm text-gray">Included in your order</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                      onClick={() => setBookingData({ ...bookingData, deliverySpeed: 'same-day' })}
                    >
                      <input
                        type="radio"
                        checked={bookingData.deliverySpeed === 'same-day'}
                        onChange={() => {}}
                        className="w-5 h-5 mt-1"
                      />
                      <div>
                        <p className="font-semibold text-dark">Same-Day Delivery</p>
                        <p className="text-sm text-gray">+$5.00</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Delivery Address Fields - Separate Boxes */}
                <div className="bg-light rounded-lg p-6 border border-gray">
                  <h3 className="font-semibold text-dark mb-4">Delivery Address Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Address Line 1 */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-dark mb-2">Address Line 1 (Street Address)</label>
                      <input
                        type="text"
                        value={bookingData.deliveryAddressLine1}
                        onChange={(e) => setBookingData({ ...bookingData, deliveryAddressLine1: e.target.value })}
                        placeholder="24 Balmain Street"
                        className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Address Line 2 - Unit/Apartment */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-dark mb-2">Address Line 2 (Unit/Apartment - Optional)</label>
                      <input
                        type="text"
                        value={bookingData.deliveryAddressLine2}
                        onChange={(e) => setBookingData({ ...bookingData, deliveryAddressLine2: e.target.value })}
                        placeholder="e.g., Apt 10, Unit 4B"
                        className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* City/Suburb */}
                    <div>
                      <label className="block text-sm font-semibold text-dark mb-2">City/Suburb</label>
                      <input
                        type="text"
                        value={bookingData.deliveryCity}
                        onChange={(e) => setBookingData({ ...bookingData, deliveryCity: e.target.value })}
                        placeholder="Sydney"
                        className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* State/Province */}
                    <div>
                      <label className="block text-sm font-semibold text-dark mb-2">State/Province</label>
                      <input
                        type="text"
                        value={bookingData.deliveryState}
                        onChange={(e) => setBookingData({ ...bookingData, deliveryState: e.target.value })}
                        placeholder="NSW"
                        className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Postcode/ZIP */}
                    <div>
                      <label className="block text-sm font-semibold text-dark mb-2">Postcode/ZIP</label>
                      <input
                        type="text"
                        value={bookingData.deliveryPostcode}
                        onChange={(e) => setBookingData({ ...bookingData, deliveryPostcode: e.target.value })}
                        placeholder="2000"
                        className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-semibold text-dark mb-2">Country</label>
                      <input
                        type="text"
                        value={bookingData.deliveryCountry}
                        onChange={(e) => setBookingData({ ...bookingData, deliveryCountry: e.target.value })}
                        placeholder="Australia"
                        className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Verify Address Button */}
                  <div className="mt-6">
                    <Button
                      onClick={async () => {
                        // Construct full address for verification
                        // Format: Unit/Apt + Street Address, Suburb, State Postcode
                        let streetPart = bookingData.deliveryAddressLine1
                        if (bookingData.deliveryAddressLine2) {
                          streetPart = `${bookingData.deliveryAddressLine2}/${bookingData.deliveryAddressLine1}`
                        }
                        const fullAddress = `${streetPart}, ${bookingData.deliveryCity}, ${bookingData.deliveryState} ${bookingData.deliveryPostcode}, ${bookingData.deliveryCountry}`
                        
                        console.log('Verifying address:', fullAddress)
                        
                        try {
                          setIsLoading(true)
                          const response = await fetch('/api/places/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ address: fullAddress })
                          })
                          
                          const data = await response.json()
                          console.log('Verification response:', data)
                          
                          if (data.success) {
                            setAddressValidation('valid')
                            setError('')
                            setBookingData({
                              ...bookingData,
                              deliveryAddressDetails: data.details || null,
                              deliveryAddress: data.formattedAddress || fullAddress,
                            })
                          } else {
                            setAddressValidation('invalid')
                            setError(data.message || 'Address could not be verified. Please check and try again.')
                          }
                        } catch (err) {
                          setAddressValidation('invalid')
                          setError('Error verifying address. Please try again.')
                          console.error('Address verification error:', err)
                        } finally {
                          setIsLoading(false)
                        }
                      }}
                      className="w-full"
                      disabled={!bookingData.deliveryAddressLine1 || !bookingData.deliveryCity || !bookingData.deliveryPostcode}
                    >
                      {isLoading ? 'Verifying Address...' : 'Verify Address with Google Maps'}
                    </Button>
                    {addressValidation === 'valid' && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                        <CheckCircle size={16} /> Address verified successfully
                      </p>
                    )}
                    {addressValidation === 'invalid' && error && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Notes */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Delivery Notes (Optional)</label>
                  <textarea
                    value={bookingData.deliveryNotes}
                    onChange={(e) => setBookingData({ ...bookingData, deliveryNotes: e.target.value })}
                    placeholder="e.g., Leave in front porch, gate code is 1234..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-bold text-dark mb-6">Review Your Order</h2>

              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-light rounded-lg p-6">
                  <h3 className="font-bold text-dark mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray">Pickup Time:</span>
                      <span className="font-semibold text-dark">
                        {bookingData.pickupTime === 'soon' ? 'ASAP (within 2 hours)' : bookingData.scheduleDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray">Detergent:</span>
                      <span className="font-semibold text-dark capitalize">{bookingData.detergent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray">Water Temp:</span>
                      <span className="font-semibold text-dark capitalize">{bookingData.waterTemp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray">Folding:</span>
                      <span className="font-semibold text-dark capitalize">{bookingData.foldingPreference}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray pt-3">
                      <span className="text-gray">Delivery:</span>
                      <span className="font-semibold text-dark">
                        {bookingData.deliverySpeed === 'standard' ? '24 hours' : 'Same-day'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address - Essential Fields */}
                <div>
                  <h3 className="font-bold text-dark mb-4">Essential Delivery Address Fields</h3>
                  
                  <div className="space-y-3">
                    {/* Address Line 1 */}
                    <div className="bg-white border-2 border-primary rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase text-primary tracking-wider mb-1">Address Line 1</p>
                      <p className="text-lg font-bold text-dark">{bookingData.deliveryAddressLine1 || '—'}</p>
                      <p className="text-xs text-gray mt-1">(Street Address)</p>
                    </div>

                    {/* Address Line 2 */}
                    <div className="bg-white border-2 border-accent rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase text-accent tracking-wider mb-1">Address Line 2</p>
                      <p className="text-lg font-bold text-dark">{bookingData.deliveryAddressLine2 || '—'}</p>
                      <p className="text-xs text-gray mt-1">(Unit/Apartment - Optional)</p>
                    </div>

                    {/* City/Suburb */}
                    <div className="bg-white border-2 border-primary rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase text-primary tracking-wider mb-1">City/Suburb</p>
                      <p className="text-lg font-bold text-dark">{bookingData.deliveryCity || '—'}</p>
                    </div>

                    {/* State/Province */}
                    <div className="bg-white border-2 border-primary rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase text-primary tracking-wider mb-1">State/Province</p>
                      <p className="text-lg font-bold text-dark">{bookingData.deliveryState || '—'}</p>
                    </div>

                    {/* Postcode/ZIP */}
                    <div className="bg-white border-2 border-primary rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase text-primary tracking-wider mb-1">Postcode/ZIP</p>
                      <p className="text-lg font-bold text-dark">{bookingData.deliveryPostcode || '—'}</p>
                    </div>

                    {/* Country */}
                    <div className="bg-white border-2 border-primary rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase text-primary tracking-wider mb-1">Country</p>
                      <p className="text-lg font-bold text-dark">{bookingData.deliveryCountry || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-mint rounded-lg p-6">
                  <h3 className="font-bold text-dark mb-4">Pricing Breakdown</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray">Base Service ({bookingData.estimatedWeight} kg @ $3.00/kg):</span>
                      <span className="font-semibold text-dark">${(parseFloat(bookingData.estimatedWeight) * 3.0).toFixed(2)}</span>
                    </div>
                    {bookingData.addOns.hangDry && (
                      <div className="flex justify-between">
                        <span className="text-gray">Hang Dry:</span>
                        <span className="font-semibold text-dark">+${(parseFloat(bookingData.estimatedWeight) * 3.30).toFixed(2)}</span>
                      </div>
                    )}
                    {bookingData.addOns.delicatesCare && (
                      <div className="flex justify-between">
                        <span className="text-gray">Delicates Care:</span>
                        <span className="font-semibold text-dark">+${(parseFloat(bookingData.estimatedWeight) * 4.40).toFixed(2)}</span>
                      </div>
                    )}
                    {bookingData.addOns.comforterService && (
                      <div className="flex justify-between">
                        <span className="text-gray">Comforter Service:</span>
                        <span className="font-semibold text-dark">+$25.00</span>
                      </div>
                    )}
                    {bookingData.addOns.stainTreatment > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray">Stain Treatment ({bookingData.addOns.stainTreatment} items):</span>
                        <span className="font-semibold text-dark">+${(bookingData.addOns.stainTreatment * 0.50).toFixed(2)}</span>
                      </div>
                    )}
                    {bookingData.addOns.ironing && (
                      <div className="flex justify-between">
                        <span className="text-gray">Ironing:</span>
                        <span className="font-semibold text-dark">+${(parseFloat(bookingData.estimatedWeight) * 6.60).toFixed(2)}</span>
                      </div>
                    )}
                    {bookingData.deliverySpeed === 'same-day' && (
                      <div className="flex justify-between">
                        <span className="text-gray">Same-day Delivery:</span>
                        <span className="font-semibold text-dark">+$5.00</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-primary pt-2">
                      <span className="font-bold text-dark">Total:</span>
                      <span className="text-xl font-bold text-primary">
                        ${(
                          parseFloat(bookingData.estimatedWeight) * 3.0 +
                          (bookingData.addOns.hangDry ? parseFloat(bookingData.estimatedWeight) * 3.30 : 0) +
                          (bookingData.addOns.delicatesCare ? parseFloat(bookingData.estimatedWeight) * 4.40 : 0) +
                          (bookingData.addOns.comforterService ? 25.0 : 0) +
                          (bookingData.addOns.stainTreatment * 0.50) +
                          (bookingData.addOns.ironing ? parseFloat(bookingData.estimatedWeight) * 6.60 : 0) +
                          (bookingData.deliverySpeed === 'same-day' ? 5.0 : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <h3 className="font-bold text-dark mb-4">What Happens Next</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                      <div>
                        <p className="font-semibold text-dark">Pickup Confirmation</p>
                        <p className="text-sm text-gray">Your Pro arrives at the scheduled time</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                      <div>
                        <p className="font-semibold text-dark">Professional Cleaning</p>
                        <p className="text-sm text-gray">Your laundry is cleaned to perfection</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                      <div>
                        <p className="font-semibold text-dark">Delivery</p>
                        <p className="text-sm text-gray">Fresh laundry delivered to your door</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div>
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
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="max-w-2xl mx-auto flex gap-4">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            ) : currentStep === 4 ? (
              <>
                Confirm & Pay <CheckCircle size={20} />
              </>
            ) : (
              <>
                Next <ChevronRight size={20} />
              </>
            )}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
