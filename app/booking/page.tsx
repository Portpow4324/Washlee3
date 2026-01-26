'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Clock, MapPin, Droplet, Wind, Truck, CheckCircle, ChevronRight, AlertCircle, Mail, Phone } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
    
    // Step 3: Delivery
    deliverySpeed: 'standard', // 'standard' or 'same-day'
    deliveryAddress: userData?.address || '',
    deliveryNotes: '',
    
    // Step 4: Laundry Details
    estimatedWeight: '5', // kg
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
      title: 'Delivery Options',
      description: 'Choose delivery speed and location',
    },
    {
      number: 4,
      title: 'Review & Confirm',
      description: 'Review your order and confirm',
    },
  ]

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmitOrder()
      }
      setError('')
    }
  }

  // Handle delivery address change with real-time validation
  const handleAddressChange = (newAddress: string) => {
    setBookingData({ ...bookingData, deliveryAddress: newAddress })
    
    // Update validation state
    if (!newAddress.trim()) {
      setAddressValidation('empty')
    } else if (validateAustralianAddress(newAddress)) {
      setAddressValidation('valid')
    } else {
      setAddressValidation('invalid')
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
        if (!bookingData.deliveryAddress) {
          setError('Please provide a delivery address')
          return false
        }
        if (!validateAustralianAddress(bookingData.deliveryAddress)) {
          setError('❌ Delivery address must be in Australia. Please enter a valid Australian address (include suburb/state).')
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
      case 4:
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

      const orderTotal = parseFloat(bookingData.estimatedWeight) * 3.0 + (bookingData.deliverySpeed === 'same-day' ? 5.0 : 0)

      const ordersRef = collection(db, 'orders')
      const docRef = await addDoc(ordersRef, {
        userId: user.uid,
        customerName: userData?.name || 'Customer',
        customerEmail: user.email,
        customerPhone: userData?.phone || '',
        
        // Pickup details
        pickupTime: bookingData.pickupTime === 'soon' ? 'ASAP' : `${bookingData.scheduleDate} ${bookingData.scheduleTime}`,
        pickupAddress: userData?.address || 'To be provided',
        
        // Laundry preferences
        detergent: bookingData.detergent,
        waterTemperature: bookingData.waterTemp,
        specialCare: bookingData.specialCare,
        foldingPreference: bookingData.foldingPreference,
        estimatedWeight: parseFloat(bookingData.estimatedWeight),
        
        // Delivery
        deliverySpeed: bookingData.deliverySpeed,
        deliveryAddress: bookingData.deliveryAddress,
        deliveryNotes: bookingData.deliveryNotes,
        
        // Order status
        status: 'pending', // pending, confirmed, picked_up, in_washing, ready_for_delivery, delivered
        createdAt: serverTimestamp(),
        
        // Pricing
        baseCost: parseFloat(bookingData.estimatedWeight) * 3.0, // $3 per kg
        deliveryCost: bookingData.deliverySpeed === 'same-day' ? 5.0 : 0,
        subtotal: orderTotal,
      })

      // Create Stripe checkout session
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: docRef.id,
          orderTotal,
          customerEmail: user.email,
          customerName: userData?.name || 'Customer',
        }),
      })

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId, url } = await checkoutResponse.json()
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url
      }
    } catch (err: any) {
      console.error('Order error:', err)
      setError(err.message || 'Failed to create order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Success screen
  if (orderConfirmed) {
    const totalCost = parseFloat(bookingData.estimatedWeight) * 3.0 + (bookingData.deliverySpeed === 'same-day' ? 5.0 : 0)
    
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
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        {/* Progress Indicator with Clickable Steps */}
        <div className="mb-16">
          <div className="flex justify-between items-end mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1 flex flex-col items-center">
                {/* Step Button */}
                <button
                  onClick={() => {
                    if (step.number < currentStep) {
                      setCurrentStep(step.number)
                      setError('')
                    }
                  }}
                  disabled={step.number > currentStep}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition mb-3 ${
                    step.number <= currentStep
                      ? 'bg-primary text-white cursor-pointer hover:shadow-lg'
                      : 'bg-gray text-white opacity-50 cursor-not-allowed'
                  }`}
                >
                  {step.number <= currentStep ? step.number : step.number}
                </button>
                
                {/* Step Name Label */}
                <p className={`text-sm font-semibold text-center ${
                  step.number === currentStep ? 'text-primary' : 'text-gray'
                }`}>
                  {step.title}
                </p>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute w-12 h-1 mt-6 ml-24 ${
                      step.number < currentStep ? 'bg-primary' : 'bg-gray opacity-30'
                    }`}
                  />
                )}
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

        {/* Step 3: Delivery */}
        {currentStep === 3 && (
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

                {/* Delivery Address */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Delivery Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bookingData.deliveryAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="123 Main St, Apt 4B, Sydney NSW 2000"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                        addressValidation === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : addressValidation === 'invalid'
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray focus:ring-primary'
                      }`}
                    />
                    {/* Validation Icons */}
                    {addressValidation === 'valid' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {addressValidation === 'invalid' && bookingData.deliveryAddress.trim() && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Validation Feedback Messages */}
                  {addressValidation === 'valid' && (
                    <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle size={16} />
                      Valid Australian address
                    </p>
                  )}
                  {addressValidation === 'invalid' && bookingData.deliveryAddress.trim() && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Address must be in Australia (include suburb/state)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray">Include suburb and state (e.g., Sydney NSW, Melbourne VIC)</p>
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

        {/* Step 4: Review */}
        {currentStep === 4 && (
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

                {/* Pricing */}
                <div className="bg-mint rounded-lg p-6">
                  <h3 className="font-bold text-dark mb-4">Pricing</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray">{bookingData.estimatedWeight} kg @ $3.00/kg:</span>
                      <span className="font-semibold text-dark">${(parseFloat(bookingData.estimatedWeight) * 3.0).toFixed(2)}</span>
                    </div>
                    {bookingData.deliverySpeed === 'same-day' && (
                      <div className="flex justify-between">
                        <span className="text-gray">Same-day Delivery:</span>
                        <span className="font-semibold text-dark">+$5.00</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-primary pt-2">
                      <span className="font-bold text-dark">Total:</span>
                      <span className="text-xl font-bold text-primary">
                        ${(parseFloat(bookingData.estimatedWeight) * 3.0 + (bookingData.deliverySpeed === 'same-day' ? 5.0 : 0)).toFixed(2)}
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
            {currentStep === 4 ? (
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
