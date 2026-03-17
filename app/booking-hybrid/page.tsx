'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
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

  // Modal states
  const [showPickupSpotModal, setShowPickupSpotModal] = useState(false)
  const [showDetergentModal, setShowDetergentModal] = useState(false)
  const [showPickupInstructionsInfo, setShowPickupInstructionsInfo] = useState(false)
  
  // Address autocomplete states
  const [addressInput, setAddressInput] = useState(userData?.address || '')
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
    bagCount: 1,
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
    { id: 'standard', name: 'Standard Wash', price: '$3.00/kg', icon: '👕', desc: 'Regular washing for everyday clothes' },
    { id: 'delicate', name: 'Delicate Fabrics', price: '$3.90/kg', icon: '✨', desc: 'Gentle care for silk, satin & linen' },
    { id: 'express', name: 'Express Service', price: '$4.50/kg', icon: '⚡', desc: 'Same-day turnaround available' },
    { id: 'comforter', name: 'Comforter & Bedding', price: '$6.00/item', icon: '☁️', desc: 'For large items like comforters' },
    { id: 'handwash', name: 'Hand Wash Premium', price: '$5.50/kg', icon: '🧤', desc: 'Ultimate care for precious items' },
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
      price: '$2.50',
      coverage: 'Covers $100/garment',
      max: 'Maximum $500/order',
    },
    {
      id: 'premium-plus',
      name: 'Premium+',
      price: '$5.75',
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
      setAddressInput(data.addressParts.formattedAddress)
      setBookingData({
        ...bookingData,
        pickupAddress: data.addressParts.formattedAddress,
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
    
    // Base laundry cost: $3/kg standard, $6/kg express
    const baseRate = bookingData.deliverySpeed === 'express' ? 6.0 : 3.0
    total += estimatedWeight * baseRate
    
    // Add-ons
    if (bookingData.hangDry) total += 16.50
    if (bookingData.delicatesCare) total += 22.00
    if (bookingData.comforterService) total += 25.00
    if (bookingData.stainTreatment) total += 0.50 // Note: per item, but simplified here
    // Ironing is included in delicates care
    
    // Protection plan
    if (bookingData.protectionPlan === 'premium') total += 2.50
    if (bookingData.protectionPlan === 'premium-plus') total += 5.75
    
    // Oversized items ($8 each)
    total += bookingData.oversizedItems * 8.0
    
    // Enforce minimum $30 AUD
    return Math.max(total, 30.0)
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
        if (bookingData.bagCount < 1) {
          setError('Please select at least 1 bag')
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

    try {
      if (!user) throw new Error('User not found')

      const orderTotal = calculateTotal()

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

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const orderResult = await orderResponse.json()
      setOrderId(orderResult.orderId || '')
      setOrderConfirmed(true)
    } catch (err: any) {
      console.error('Order error:', err)
      setError(err.message || 'Failed to create order')
      setIsLoading(false)
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
            <h1 className="text-3xl font-bold text-dark mb-3">Order Confirmed!</h1>
            <p className="text-gray mb-6">Order ID: {orderId}</p>
            <p className="text-gray mb-8">Your laundry pickup is scheduled. You'll receive updates via email and SMS.</p>
            <Button onClick={() => router.push('/')} className="mx-auto">Return Home</Button>
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
        {/* Progress Indicator - Poplin Style Dots */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-dark">Place an order</h1>
            <button className="w-10 h-10 rounded-full border-2 border-gray flex items-center justify-center hover:bg-light transition">?</button>
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
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Select Service */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h3 className="font-bold text-dark mb-6">STANDARD LAUNDRY SERVICE</h3>
              <p className="text-sm text-gray mb-6">Washlee provides professional wash, dry, and fold service. Pick up tomorrow or get express same-day service.</p>
              
              <div className="space-y-4">
                <div className="border-2 border-primary bg-mint rounded-lg p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-2xl font-bold text-dark">👕 Professional Laundry</p>
                      <p className="text-sm text-gray mt-2">Wash • Dry • Fold • Deliver</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-primary mt-4">$3.00/kg (Standard)</p>
                  <p className="text-sm text-gray mt-1">$6.00/kg (Express same-day)</p>
                  
                  <div className="mt-4 pt-4 border-t border-primary/30 space-y-2">
                    <p className="text-sm text-dark">✓ Professional washing & folding</p>
                    <p className="text-sm text-dark">✓ Free pickup & delivery (next day or express)</p>
                    <p className="text-sm text-dark">✓ Choice of detergent & care options</p>
                    <p className="text-sm text-dark">✓ Poplin's Protection Plan available</p>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-8" onClick={handleNext}>
                Continue
              </Button>
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
                    value={addressInput || bookingData.pickupAddress}
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
                <label className="block text-sm font-semibold text-dark mb-3">Select Detergent</label>
                <button
                  onClick={() => setShowDetergentModal(true)}
                  className="w-full border-2 border-gray rounded-lg p-4 text-left hover:border-primary transition"
                >
                  <p className="text-dark font-semibold">{detergents.find(d => d.id === bookingData.detergent)?.label}</p>
                </button>
              </div>

              {/* Care Instructions */}
              <div className="mb-8">
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
                <p className="text-sm font-semibold text-dark mb-4">ADD-ONS (OPTIONAL)</p>
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
              <h3 className="font-bold text-dark mb-4">LAUNDRY WEIGHT</h3>
              <p className="text-sm text-gray mb-6">Select the number of bags/hampers. Each bag ≈ 2.5kg. Charged at $3/kg (standard) or $6/kg (express).</p>

              <div className="space-y-6">
                <div>
                  <p className="font-semibold text-dark mb-2">How many bags?</p>
                  <p className="text-xs text-gray mb-3">1 bag ≈ 2.5kg | 2 bags ≈ 5kg | 4 bags ≈ 10kg</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setBookingData({ ...bookingData, bagCount: Math.max(1, bookingData.bagCount - 1) })}
                      className="w-10 h-10 rounded-full bg-dark text-white font-bold hover:bg-dark/90"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold text-dark w-8 text-center">{bookingData.bagCount}</span>
                    <button
                      onClick={() => setBookingData({ ...bookingData, bagCount: bookingData.bagCount + 1 })}
                      className="w-10 h-10 rounded-full bg-dark text-white font-bold hover:bg-dark/90"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-primary font-semibold mt-2">≈ {(bookingData.bagCount * 2.5).toFixed(1)} kg</p>
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
                  💰 $30 MINIMUM ORDER - Add more laundry to meet minimum!
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 5: Delivery Speed */}
        {currentStep === 5 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h3 className="font-bold text-dark mb-6">DELIVERY SPEED</h3>
              <p className="text-sm text-gray mb-6">Choose when you'd like your laundry back.</p>

              <div className="space-y-4">
                <label
                  onClick={() => setBookingData({ ...bookingData, deliverySpeed: 'standard' })}
                  className={`border rounded-lg p-6 cursor-pointer transition ${
                    bookingData.deliverySpeed === 'standard'
                      ? 'border-primary border-2'
                      : 'border-gray hover:border-primary'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-dark">Standard Delivery</p>
                      <p className="text-sm text-gray">Next-day delivery (Friday evening)</p>
                    </div>
                    <span className="bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-bold whitespace-nowrap">$3.00/kg</span>
                  </div>
                </label>

                <label
                  onClick={() => setBookingData({ ...bookingData, deliverySpeed: 'express' })}
                  className={`border rounded-lg p-6 cursor-pointer transition ${
                    bookingData.deliverySpeed === 'express'
                      ? 'border-primary border-2 bg-mint'
                      : 'border-gray hover:border-primary'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <p className="font-semibold text-dark">Express Delivery</p>
                      <p className="text-sm text-gray">Same-day/overnight (Thursday evening)</p>
                    </div>
                    <span className="bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-bold whitespace-nowrap">$6.00/kg</span>
                  </div>

                  {bookingData.deliverySpeed === 'express' && (
                    <div className="mt-4 space-y-2 text-sm text-gray">
                      <p className="flex items-center gap-2">🚚 Delivered by 8pm tomorrow</p>
                      <p className="flex items-center gap-2">⏰ Available for urgent laundry</p>
                      <p className="flex items-center gap-2">📦 60kg weight limit</p>
                    </div>
                  )}
                </label>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 6: Protection Plan */}
        {currentStep === 6 && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 mb-8">
              <h3 className="font-bold text-dark mb-2">COVERAGE</h3>
              <p className="text-sm text-gray mb-6">Washlee's Protection Plan covers you in the rare instance of damage or loss.</p>

              <div className="space-y-3">
                {protectionPlans.map((plan) => (
                  <label
                    key={plan.id}
                    onClick={() => setBookingData({ ...bookingData, protectionPlan: plan.id })}
                    className={`border rounded-lg p-6 cursor-pointer transition ${
                      bookingData.protectionPlan === plan.id
                        ? 'border-primary border-2 bg-mint'
                        : 'border-gray hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="font-semibold text-dark flex-1">{plan.name}</p>
                      <span className="bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-bold whitespace-nowrap">{plan.price}</span>
                    </div>
                    <p className="text-sm text-gray">{plan.coverage}</p>
                    <p className="text-xs text-gray">{plan.max}</p>
                  </label>
                ))}
              </div>

              <p className="text-xs text-blue-600 mt-4">
                <a href="/protection-plan" className="underline">Tap here</a> for more information about Washlee's Protection Plan.
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

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-dark">Total:</span>
                  <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
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

        {/* Navigation */}
        <div className="max-w-2xl mx-auto flex gap-4 mt-12">
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
            ) : currentStep === 7 ? (
              <>
                Confirm & Pay <CheckCircle size={20} />
              </>
            ) : (
              <>
                Continue <ChevronRight size={20} />
              </>
            )}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
