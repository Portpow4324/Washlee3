'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { syncBookingAddresses } from '@/lib/addressSync'
import { getCustomerPresets, trackPresetUsage, createDefaultPresetFromFirstOrder } from '@/lib/orderPresets'
import { getDeliveryMetrics, calculateDeliveryWindows, suggestDeliverySpeed, type DeliveryMetrics, type DeliveryWindow } from '@/lib/deliveryService'
import { getAttributionMetadata, trackWashleeEvent } from '@/lib/analytics/client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Clock, MapPin, Droplet, Wind, Truck, CheckCircle, ChevronRight, ChevronLeft, AlertCircle, X, Info, Zap, FileText, Check, AlertTriangle, ListTodo, DollarSign, ArrowLeft, Package, Sparkles, ShieldCheck, Shirt, Calendar, Home as HomeIcon } from 'lucide-react'
import Spinner from '@/components/Spinner'
import PhotoSlot from '@/components/marketing/PhotoSlot'
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
  const [paymentWindowClosed, setPaymentWindowClosed] = useState(false)
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null)
  const [orderId, setOrderId] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [presets, setPresets] = useState<any[]>([])
  const [showPresetsModal, setShowPresetsModal] = useState(false)

  // Delivery metrics states
  const [deliveryMetrics, setDeliveryMetrics] = useState<DeliveryMetrics | null>(null)
  const [deliveryWindows, setDeliveryWindows] = useState<{ standard: DeliveryWindow; express: DeliveryWindow } | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [suggestedDeliverySpeed, setSuggestedDeliverySpeed] = useState<'standard' | 'express'>('standard')

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
  const [showExpressWarning, setShowExpressWarning] = useState(false)
  const [sameAsPickup, setSameAsPickup] = useState(true) // Delivery address same as pickup
  
  // Scheduling states
  const [availableDeliverySlots, setAvailableDeliverySlots] = useState<any[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [selectedPickupDate, setSelectedPickupDate] = useState<string>('')
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string>('')
  
  // Address autocomplete states
  const [addressInput, setAddressInput] = useState('')
  const [addressPredictions, setAddressPredictions] = useState<any[]>([])
  const [isValidatingAddress, setIsValidatingAddress] = useState(false)
  const [showAddressPredictions, setShowAddressPredictions] = useState(false)
  const [addressPredictionTarget, setAddressPredictionTarget] = useState<'pickup' | 'delivery' | null>(null)
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
    detergentCustom: '',
    delicateCycle: false,
    hangDry: false,
    returnsOnHangers: false,
    additionalRequests: false,
    additionalRequestsText: '',

    // Step 4: Bag Count & Custom Weight
    bagCount: 1,
    customWeight: 10,

    // Step 5: Delivery Speed
    deliverySpeed: 'standard',

    // Step 6: Protection Plan
    protectionPlan: 'basic',

    // Step 7: Delivery Address
    deliveryAddress: userData?.address || '',
    deliveryAddressDetails: null as AddressParts | null,

    // Step 8: Scheduling
    pickupDate: '',
    deliveryDate: '',
    deliveryTimeSlot: '',
  })

  const steps = [
    { number: 1, title: 'Select Service', description: 'Choose your laundry service type' },
    { number: 2, title: 'Pickup & Delivery', description: 'Where should we pick up and deliver?' },
    { number: 3, title: 'Delivery Speed', description: 'Choose your desired delivery speed' },
    { number: 4, title: 'Laundry Care', description: 'Detergent & special care instructions' },
    { number: 5, title: 'Bag Count', description: 'How many bags are you sending?' },
    { number: 6, title: 'Protection Plan', description: 'Washlee\'s Protection Plan covers damage & loss' },
    { number: 7, title: 'Schedule Times', description: 'Choose pickup date and delivery time' },
    { number: 8, title: 'Review & Confirm', description: 'Review your order and complete checkout' },
  ]

  const services = [
    { id: 'standard', name: 'Standard Wash', price: '$7.50/kg', icon: '👕', desc: 'Regular washing for everyday clothes' },
    { id: 'delicate', name: 'Delicates / Special Care', price: '$7.50/kg', icon: '✨', desc: 'Gentle handling for care-note items' },
    { id: 'express', name: 'Express Service', price: '$12.50/kg', icon: '⚡', desc: 'Same-day turnaround available' },
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
  const fetchAddressPredictions = async (input: string, target: 'pickup' | 'delivery') => {
    const query = input.trim()
    setAddressPredictionTarget(target)

    if (query.length < 3) {
      setAddressPredictions([])
      setShowAddressPredictions(false)
      return
    }

    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: query,
          componentRestrictions: { country: 'au' } // Restrict to Australia
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Address search is unavailable right now')
      }

      const predictions = data.predictions || []
      setAddressPredictions(predictions)
      setShowAddressPredictions(predictions.length > 0)
      setAddressPredictionTarget(target)
      setAddressError(
        predictions.length === 0
          ? 'No matching Australian addresses found. Try adding the suburb and state.'
          : ''
      )
    } catch (err) {
      console.error('Error fetching predictions:', err)
      setAddressPredictions([])
      setShowAddressPredictions(false)
      setAddressPredictionTarget(target)
      setAddressError(
        err instanceof Error
          ? err.message
          : 'Address search is unavailable right now'
      )
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
        ...(prediction.isDelivery
          ? { deliveryAddress: formattedAddress, deliveryAddressDetails: data.addressParts }
          : { pickupAddress: formattedAddress, pickupAddressDetails: data.addressParts }),
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

  // Load delivery metrics and calculate windows
  useEffect(() => {
    const loadDeliveryMetrics = async () => {
      try {
        setMetricsLoading(true)
        const metrics = await getDeliveryMetrics()
        
        if (metrics) {
          setDeliveryMetrics(metrics)
          
          // Calculate delivery windows based on current weight
          const estimatedWeight = bookingData.customWeight || bookingData.bagCount * 10
          const windows = calculateDeliveryWindows(metrics, estimatedWeight)
          setDeliveryWindows(windows)
          
          // Suggest delivery speed
          const suggested = suggestDeliverySpeed(metrics, estimatedWeight)
          setSuggestedDeliverySpeed(suggested)
          
          console.log('[BOOKING] Delivery metrics loaded:', {
            activeMembers: metrics.activeMembers,
            capacityUsage: metrics.capacityUsage,
            suggested,
          })
        }
      } catch (err) {
        console.error('[BOOKING] Error loading delivery metrics:', err)
      } finally {
        setMetricsLoading(false)
      }
    }

    loadDeliveryMetrics()
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(loadDeliveryMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Monitor if payment window is closed
  useEffect(() => {
    if (!paymentWindow || paymentWindowClosed) return

    const checkInterval = setInterval(() => {
      if (paymentWindow.closed) {
        setPaymentWindowClosed(true)
        setOrderConfirmed(false)
        clearInterval(checkInterval)
      }
    }, 500)

    return () => clearInterval(checkInterval)
  }, [paymentWindow, paymentWindowClosed])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-soft-hero flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center animate-slide-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-line">
            <Spinner />
          </div>
          <p className="text-sm font-semibold text-gray">Getting your booking ready…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const calculateTotal = () => {
    let total = 0
    // Use custom weight if provided, otherwise calculate from bag count (10kg per bag)
    const estimatedWeight = (bookingData as any).customWeight || bookingData.bagCount * 10
    
    // Base laundry cost: $7.50/kg standard, $12.50/kg express
    const baseRate = bookingData.deliverySpeed === 'express' ? 12.5 : 7.5
    total += estimatedWeight * baseRate
    
    // Add-ons
    if (bookingData.hangDry) total += 16.50
    
    // Protection plan
    if (bookingData.protectionPlan === 'premium') total += 3.50
    if (bookingData.protectionPlan === 'premium-plus') total += 8.50
    
    // Enforce minimum $75 AUD
    return Math.max(total, 75.0)
  }

  // Detailed pricing breakdown for display
  const getDetailedPricing = () => {
    const estimatedWeight = (bookingData as any).customWeight || bookingData.bagCount * 10
    const baseRate = bookingData.deliverySpeed === 'express' ? 12.5 : 7.5
    
    const breakdown = {
      weight: estimatedWeight,
      baseRate: baseRate,
      laundryBase: estimatedWeight * baseRate,
      hangDry: bookingData.hangDry ? 16.50 : 0,
      protectionPlan: 0,
      protectionPlanName: 'None',
      subtotal: 0,
      total: 0,
    }

    // Add protection plan cost
    if (bookingData.protectionPlan === 'premium') {
      breakdown.protectionPlan = 3.50
      breakdown.protectionPlanName = 'Premium'
    } else if (bookingData.protectionPlan === 'premium-plus') {
      breakdown.protectionPlan = 8.50
      breakdown.protectionPlanName = 'Premium Plus'
    }

    // Calculate subtotal
    breakdown.subtotal = breakdown.laundryBase + breakdown.hangDry + breakdown.protectionPlan
    
    // Apply minimum
    breakdown.total = Math.max(breakdown.subtotal, 75.0)

    // Debug logging
    if (currentStep === 7) {
      console.log('[Booking] Pricing Breakdown on Review Step:', {
        weight: estimatedWeight,
        deliverySpeed: bookingData.deliverySpeed,
        baseRate: baseRate,
        laundryBase: breakdown.laundryBase,
        protectionPlan: bookingData.protectionPlan,
        protectionPlanCost: breakdown.protectionPlan,
        protectionPlanName: breakdown.protectionPlanName,
        hangDry: breakdown.hangDry,
        subtotal: breakdown.subtotal,
        total: breakdown.total,
      })
    }

    return breakdown
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

  const fetchAvailableSlots = async (pickupDate: string) => {
    try {
      setSlotsLoading(true)
      setSlotsError('')
      
      // Use pickup address if delivery address not set yet
      const addressToUse = bookingData.deliveryAddress || bookingData.pickupAddress
      const addressDetailsToUse = bookingData.deliveryAddressDetails || bookingData.pickupAddressDetails
      
      if (!addressToUse) {
        setSlotsError('No address found. Please go back and set your pickup address.')
        setSlotsLoading(false)
        return
      }
      
      console.log('[Booking] Fetching delivery slots for:', { pickupDate, address: addressToUse })
      
      // Calculate delivery date based on delivery speed
      const pickupDateObj = new Date(pickupDate)
      let deliveryDateObj = new Date(pickupDateObj)
      
      if (bookingData.deliverySpeed === 'standard') {
        deliveryDateObj.setDate(deliveryDateObj.getDate() + 2)
      } else {
        deliveryDateObj.setDate(deliveryDateObj.getDate())
      }
      
      const deliveryDateStr = deliveryDateObj.toISOString().split('T')[0]
      setSelectedDeliveryDate(deliveryDateStr)
      setBookingData(prev => ({ ...prev, deliveryDate: deliveryDateStr }))
      
      // Fetch delivery slots - use same address
      const deliveryRes = await fetch('/api/scheduling/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: deliveryDateStr, address: addressToUse, addressDetails: addressDetailsToUse }),
      })
      
      if (!deliveryRes.ok) {
        const errorData = await deliveryRes.json()
        throw new Error(errorData.error || 'Failed to fetch delivery slots')
      }
      const deliveryData = await deliveryRes.json()
      setAvailableDeliverySlots(deliveryData.slots || [])
      
    } catch (err: any) {
      setSlotsError(err.message || 'Failed to load available times')
      console.error('Error fetching slots:', err)
    } finally {
      setSlotsLoading(false)
    }
  }

  const getDisplayedDeliverySlots = () => {
    return availableDeliverySlots
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      trackWashleeEvent('booking_step_completed', {
        metadata: {
          step: currentStep,
          step_title: steps[currentStep - 1]?.title || `Step ${currentStep}`,
        },
      })

      // Show express warning before proceeding from step 3 with express delivery
      if (currentStep === 3 && bookingData.deliverySpeed === 'express') {
        setShowExpressWarning(true)
        return
      }
      
      if (currentStep < 8) {
        setCurrentStep(currentStep + 1)
      } else {
        trackWashleeEvent('checkout_started', {
          metadata: { step: currentStep, source: 'booking_review' },
        })
        handleSubmitOrder()
      }
      setError('')
    }
  }

  const validateStep = (step: number) => {
    const estimatedWeight = (bookingData as any).customWeight || bookingData.bagCount * 10
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
          setError('Minimum order is 1 bag (10kg) for $75')
          return false
        }
        // Loads over 45kg need pre-booking
        if (estimatedWeight > 45) {
          setError('Loads over 45kg need to be pre-booked — please contact support to arrange a pickup.')
          return false
        }
        return true
      case 5:
        return true
      case 6:
        return true
      case 7:
        if (!bookingData.pickupDate) {
          setError('Please select a pickup date')
          return false
        }
        if (!bookingData.deliveryDate) {
          setError('Please select a delivery date')
          return false
        }
        if (!bookingData.deliveryTimeSlot) {
          setError('Please select a delivery time')
          return false
        }
        return true
      case 8:
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
      const estimatedWeight = (bookingData as any).customWeight || bookingData.bagCount * 10
      
      // Get detailed pricing to extract subtotal
      const pricing = getDetailedPricing()
      const subtotal = pricing.subtotal

      // Extract delivery address components from AddressParts object
      const deliveryAddressLine1 = bookingData.deliveryAddressDetails?.streetAddress || ''
      const deliveryCity = bookingData.deliveryAddressDetails?.suburb || ''
      const deliveryState = bookingData.deliveryAddressDetails?.state || ''
      const deliveryPostcode = bookingData.deliveryAddressDetails?.postcode || ''
      const deliveryCountry = bookingData.deliveryAddressDetails?.country || 'Australia'
      const marketingAttribution = getAttributionMetadata()

      const orderPayload = {
        uid: user.id,
        customerName: userData?.name || 'Customer',
        customerEmail: user.email,
        customerPhone: userData?.phone || '',
        marketingAttribution,
        bookingData: {
          ...bookingData,
          // Use custom detergent if selected, otherwise use the preset choice
          detergent: bookingData.detergent === 'i-will-provide' 
            ? bookingData.detergentCustom || 'I Will Provide' 
            : bookingData.detergent,
          estimatedWeight,
          deliveryAddressLine1,
          deliveryAddressLine2: '',
          deliveryCity,
          deliveryState,
          deliveryPostcode,
          deliveryCountry,
          marketingAttribution,
        },
        orderTotal,
      }

      console.log('[BOOKING] Step 1: Submitting order payload:', {
        uid: orderPayload.uid,
        customerEmail: orderPayload.customerEmail,
        customerName: orderPayload.customerName,
        orderTotal,
      })

      console.log('[BOOKING] Step 2: Calling /api/orders to create real order...')
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })
      console.log('[BOOKING] Step 3: Got response from /api/orders:', orderResponse.status)

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
      if (createdOrderId) {
        trackWashleeEvent('order_created', {
          metadata: {
            order_id: createdOrderId,
            service_type: bookingData.selectedService,
            delivery_speed: bookingData.deliverySpeed,
          },
        })
      }
      
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
        protectionPlan: bookingData.protectionPlan,
        marketingAttribution,
        bookingDetails: {
          ...bookingData,
          estimatedWeight,
          deliveryAddressLine1,
          deliveryAddressLine2: '',
          deliveryCity,
          deliveryState,
          deliveryPostcode,
          deliveryCountry,
          marketingAttribution,
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
      trackWashleeEvent('payment_started', {
        metadata: {
          order_id: createdOrderId,
          amount: orderTotal,
          payment_provider: 'stripe_checkout',
        },
      })
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
        trackWashleeEvent('payment_failed', {
          metadata: {
            order_id: createdOrderId,
            status: checkoutResponse.status,
            reason: errorMsg.slice(0, 120),
          },
        })
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
        // Save order details to session storage so success page can access it
        sessionStorage.setItem('lastOrderId', orderId || createdOrderId)
        sessionStorage.setItem('lastOrderTotal', orderTotal.toString())
        sessionStorage.setItem('lastOrder', JSON.stringify({
          totalPrice: orderTotal,
          subtotal: subtotal,
          weight: estimatedWeight,
          serviceType: bookingData.selectedService,
          protectionPlan: bookingData.protectionPlan,
          deliveryAddressLine1,
          deliveryAddressLine2: '',
          deliveryCity,
          deliveryState,
          deliveryPostcode,
        }))
        // Open Stripe checkout in a new tab and store reference
        const stripeWindow = window.open(checkoutData.url, '_blank')
        setPaymentWindow(stripeWindow)
      } else if (checkoutData.sessionId) {
        console.log('[BOOKING] Got session ID, opening in new tab:', checkoutData.sessionId)
        const stripeUrl = `https://checkout.stripe.com/pay/${checkoutData.sessionId}`
        sessionStorage.setItem('lastOrderId', orderId || createdOrderId)
        sessionStorage.setItem('lastOrderTotal', orderTotal.toString())
        sessionStorage.setItem('lastOrder', JSON.stringify({
          totalPrice: orderTotal,
          subtotal: subtotal,
          weight: estimatedWeight,
          serviceType: bookingData.selectedService,
          protectionPlan: bookingData.protectionPlan,
          deliveryAddressLine1,
          deliveryAddressLine2: '',
          deliveryCity,
          deliveryState,
          deliveryPostcode,
        }))
        const stripeWindow = window.open(stripeUrl, '_blank')
        setPaymentWindow(stripeWindow)
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

  if (paymentWindowClosed) {
    return (
      <div className="min-h-screen bg-soft-hero flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center w-full px-4 py-12">
          <div className="surface-card relative w-full max-w-md p-8 sm:p-10 text-center animate-slide-up">
            <button
              onClick={() => {
                setPaymentWindowClosed(false)
                setOrderConfirmed(false)
                setError('')
              }}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle size={30} />
            </div>
            <h1 className="text-2xl font-bold text-dark mb-2">Payment not completed</h1>
            <p className="text-gray text-sm mb-2">It looks like the payment window closed before payment finished.</p>
            <p className="text-gray text-sm mb-7">
              Your order{' '}
              {orderId && <span className="font-semibold text-dark">#{orderId.slice(0, 8).toUpperCase()}</span>}
              {' '}has been created, but payment wasn&rsquo;t processed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setPaymentWindowClosed(false)
                  setOrderConfirmed(false)
                  setError('')
                }}
                className="btn-primary flex-1 shadow-glow"
              >
                Try again
              </button>
              <button
                onClick={() => {
                  setPaymentWindowClosed(false)
                  setOrderConfirmed(false)
                  setError('')
                  router.push('/')
                }}
                className="btn-outline flex-1"
              >
                Return home
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-soft-hero flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center w-full px-4 py-12">
          <div className="surface-card w-full max-w-md p-8 sm:p-10 text-center animate-slide-up">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
              <CheckCircle size={30} />
            </div>
            <h1 className="text-2xl font-bold text-dark mb-1">Payment processing…</h1>
            {orderId && (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-deep mb-3">
                Order #{orderId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <p className="text-gray text-sm mb-6">
              A secure payment page has opened in a new tab. Complete payment there to confirm your booking.
            </p>
            <div className="rounded-2xl bg-mint/60 p-4 mb-7 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-deep mb-3 flex items-center gap-2">
                <FileText size={14} /> Next steps
              </p>
              <ul className="space-y-2">
                {[
                  'Complete payment in the new tab that opened',
                  'You’ll see a success message there once it’s done',
                  'You can safely close that tab afterwards',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-xs text-dark">
                    <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => router.push('/')} className="btn-primary w-full shadow-glow">
              Return to home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const displayedDeliverySlots = getDisplayedDeliverySlots()

  // Presentational only — per-step icon for the redesigned step header.
  const stepIcons = [Shirt, MapPin, Truck, Droplet, Package, ShieldCheck, Calendar, CheckCircle]
  const StepIcon = stepIcons[currentStep - 1] || Shirt
  const liveTotal = calculateTotal()

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />

      {/* Booking trust ribbon — visual flavor only, no logic */}
      <section aria-label="What to expect" className="relative overflow-hidden bg-gradient-to-r from-mint via-white to-mint/40 border-b border-line">
        <div aria-hidden className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-10 right-1/3 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md flex-shrink-0">
                <Truck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">You&rsquo;re booking with Washlee</p>
                <p className="text-sm text-dark font-semibold leading-tight truncate">
                  Free pickup &amp; delivery · $7.50/kg standard · $75 minimum
                </p>
              </div>
            </div>
            <ul className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-semibold">
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-primary-deep ring-1 ring-line">
                <CheckCircle size={12} /> Vetted local Pros
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-primary-deep ring-1 ring-line">
                <CheckCircle size={12} /> Damage protection
              </li>
              <li className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-primary-deep ring-1 ring-line">
                <Clock size={12} /> ~ 60s to book
              </li>
            </ul>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12 pb-32">
        {/* Top row — back home + step counter + help */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-dark hover:border-primary hover:text-primary transition min-h-[44px]"
            title="Go back to home"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Home</span>
          </button>
          <span className="rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-primary-deep">
            Step {currentStep} of {steps.length}
          </span>
          <button
            onClick={() => setShowStepInfo(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-gray hover:border-primary hover:text-primary transition"
            aria-label="About this step"
          >
            <Info size={18} />
          </button>
        </div>

        {/* Segmented progress bar */}
        <div className="mb-7 flex items-center gap-1.5" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={steps.length}>
          {steps.map((step) => {
            const done = step.number < currentStep
            const active = step.number === currentStep
            return (
              <button
                key={step.number}
                onClick={() => {
                  if (step.number < currentStep) {
                    setCurrentStep(step.number)
                    setError('')
                  }
                }}
                disabled={step.number >= currentStep}
                aria-label={`Step ${step.number}: ${step.title}`}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  done
                    ? 'bg-primary cursor-pointer hover:bg-primary-deep'
                    : active
                      ? 'bg-primary'
                      : 'bg-line cursor-not-allowed'
                }`}
              />
            )
          })}
        </div>

        {/* Step header */}
        <div key={currentStep} className="mb-6 flex items-start gap-4 animate-slide-up">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
            <StepIcon size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">Step {currentStep}</p>
            <h2 className="text-xl sm:text-2xl font-bold text-dark leading-tight">{steps[currentStep - 1].title}</h2>
            <p className="text-sm text-gray mt-0.5">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 flex gap-3 animate-slide-up">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* STEP 1: Select Service */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-slide-up">
            {presets.length > 0 && (
              <button
                onClick={() => setShowPresetsModal(true)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-mint/50 p-4 text-left transition hover:border-primary hover:bg-mint min-h-[44px]"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                  <Zap size={18} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-dark">Quick reorder</span>
                  <span className="block text-xs text-gray">Reuse a saved order — {presets.length} available</span>
                </span>
                <ChevronRight size={18} className="text-primary-deep transition group-hover:translate-x-0.5" />
              </button>
            )}

            {/* Hero service card */}
            <div className="surface-card overflow-hidden">
              <div className="relative bg-gradient-to-br from-mint to-white p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
                    <Shirt size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-dark">Professional wash &amp; fold</h3>
                    <p className="text-sm text-gray mt-0.5">Sorted, washed, dried, and folded — picked up and delivered to your door.</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-line bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-soft">Standard</p>
                    <p className="text-xl font-bold text-dark">$7.50<span className="text-sm font-medium text-gray">/kg</span></p>
                    <p className="text-[11px] text-gray">Next business day</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-soft">Express</p>
                    <p className="text-xl font-bold text-dark">$12.50<span className="text-sm font-medium text-gray">/kg</span></p>
                    <p className="text-[11px] text-gray">Same-day by 7pm</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-line p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-deep mb-3">What&rsquo;s included</p>
                <ul className="grid sm:grid-cols-2 gap-2.5">
                  {[
                    'Professional washing & folding',
                    'Free pickup & delivery',
                    'Choice of detergent & care options',
                    'Washlee Protection Plan available',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm text-dark">
                      <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Process strip — visual storytelling */}
            <div className="surface-card p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-soft mb-4">How your order flows</p>
              <ol className="grid grid-cols-4 gap-2">
                {[
                  { icon: MapPin, label: 'Pickup' },
                  { icon: Droplet, label: 'Wash' },
                  { icon: Shirt, label: 'Fold' },
                  { icon: Truck, label: 'Deliver' },
                ].map((stage, i) => (
                  <li key={stage.label} className="relative flex flex-col items-center gap-2 text-center">
                    {i < 3 && (
                      <span aria-hidden className="absolute right-[-1rem] top-5 hidden h-px w-8 bg-line sm:block" />
                    )}
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-primary-deep">
                      <stage.icon size={17} />
                    </span>
                    <span className="text-xs font-semibold text-dark">{stage.label}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Visual flavor — pickup photo slot */}
            <PhotoSlot
              src="/marketing/pickup-handoff.jpg"
              alt="A Washlee Pro collecting a laundry bag at a Melbourne doorway"
              aspect="aspect-[16/9]"
              placeholderHint="Replace with a real booking pickup photo — Pro collecting a bag at a Melbourne door."
              caption="Free pickup &amp; delivery across Greater Melbourne"
            />
          </div>
        )}

        {/* STEP 2: Pickup Location */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-slide-up">
            {/* Pickup */}
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <MapPin size={16} />
                </span>
                <h3 className="font-bold text-dark">Pickup address</h3>
              </div>

              <label className="label-field" htmlFor="pickup-address">Where should we collect from?</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-soft pointer-events-none" />
                <input
                  id="pickup-address"
                  type="text"
                  value={addressInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setAddressInput(val)
                    setAddressError('')
                    fetchAddressPredictions(val, 'pickup')
                  }}
                  placeholder="Start typing your address…"
                  className="input-field pl-10"
                />

                {addressPredictionTarget === 'pickup' && showAddressPredictions && addressPredictions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-line rounded-2xl shadow-lg z-50 max-h-64 overflow-y-auto overflow-hidden">
                    {addressPredictions.map((prediction, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectAddress(prediction)}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-mint border-b border-line last:border-b-0 transition"
                      >
                        <MapPin size={16} className="text-primary-deep flex-shrink-0 mt-0.5" />
                        <span className="min-w-0">
                          <span className="block font-semibold text-dark text-sm truncate">{prediction.main_text}</span>
                          <span className="block text-xs text-gray truncate">{prediction.secondary_text}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isValidatingAddress && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-mint/60 rounded-xl">
                  <Spinner />
                  <p className="text-sm text-dark font-semibold">Validating address…</p>
                </div>
              )}

              {addressPredictionTarget === 'pickup' && addressError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{addressError}</p>
                </div>
              )}

              {bookingData.pickupAddressDetails && (
                <div className="mt-3 p-3 bg-mint/70 border border-primary/20 rounded-xl">
                  <p className="text-sm text-dark font-semibold flex items-center gap-2">
                    <CheckCircle size={16} className="text-primary-deep flex-shrink-0" />
                    Confirmed: {bookingData.pickupAddress}
                  </p>
                </div>
              )}

              <div className="mt-5">
                <label className="label-field">Pickup spot</label>
                <button
                  onClick={() => setShowPickupSpotModal(true)}
                  className="w-full flex items-center justify-between gap-3 border border-line rounded-xl p-3.5 text-left hover:border-primary transition min-h-[48px]"
                >
                  <span className="flex items-center gap-2.5">
                    <HomeIcon size={16} className="text-primary-deep" />
                    <span className="text-dark font-semibold">{pickupSpots.find(s => s.id === bookingData.pickupSpot)?.label}</span>
                  </span>
                  <ChevronRight size={16} className="text-gray-soft" />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-line p-3.5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingData.addPickupInstructions}
                    onChange={(e) => setBookingData({ ...bookingData, addPickupInstructions: e.target.checked })}
                    className="w-5 h-5 accent-primary rounded"
                  />
                  <span className="text-dark font-semibold text-sm flex-1">Add pickup instructions</span>
                  <button
                    type="button"
                    onClick={() => setShowPickupInstructionsInfo(true)}
                    className="text-gray-soft hover:text-primary transition"
                    aria-label="About pickup instructions"
                  >
                    <Info size={16} />
                  </button>
                </label>

                {bookingData.addPickupInstructions && (
                  <textarea
                    value={bookingData.pickupInstructions}
                    onChange={(e) => setBookingData({ ...bookingData, pickupInstructions: e.target.value })}
                    placeholder="Building access details, gate codes, etc…"
                    className="input-field mt-3"
                    rows={3}
                  />
                )}
              </div>
            </div>

            {/* Delivery */}
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <Truck size={16} />
                </span>
                <h3 className="font-bold text-dark">Delivery address</h3>
              </div>

              <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-line p-3.5 mb-4 has-[:checked]:border-primary has-[:checked]:bg-mint/40 transition">
                <input
                  type="checkbox"
                  checked={sameAsPickup}
                  onChange={(e) => {
                    setSameAsPickup(e.target.checked)
                    if (e.target.checked) {
                      setBookingData({
                        ...bookingData,
                        deliveryAddress: bookingData.pickupAddress,
                        deliveryAddressDetails: bookingData.pickupAddressDetails,
                      })
                    }
                  }}
                  className="w-5 h-5 accent-primary rounded"
                />
                <span className="text-dark font-semibold text-sm">Deliver to my pickup address</span>
              </label>

              {!sameAsPickup && (
                <div>
                  <label className="label-field" htmlFor="delivery-address">Where should we deliver to?</label>
                  <div className="relative">
                    <Truck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-soft pointer-events-none" />
                    <input
                      id="delivery-address"
                      type="text"
                      placeholder="Start typing the delivery address…"
                      value={bookingData.deliveryAddress}
                      onChange={(e) => {
                        const val = e.target.value
                        setBookingData({
                          ...bookingData,
                          deliveryAddress: val,
                          deliveryAddressDetails: null,
                        })
                        setAddressError('')
                        fetchAddressPredictions(val, 'delivery')
                      }}
                      className="input-field pl-10"
                    />

                    {addressPredictionTarget === 'delivery' && showAddressPredictions && addressPredictions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-line rounded-2xl shadow-lg z-50 max-h-64 overflow-y-auto overflow-hidden">
                        {addressPredictions.map((prediction, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              selectAddress({ ...prediction, isDelivery: true })
                            }}
                            className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-mint border-b border-line last:border-b-0 transition"
                          >
                            <MapPin size={16} className="text-primary-deep flex-shrink-0 mt-0.5" />
                            <span className="min-w-0">
                              <span className="block font-semibold text-dark text-sm truncate">{prediction.main_text}</span>
                              <span className="block text-xs text-gray truncate">{prediction.secondary_text}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {addressPredictionTarget === 'delivery' && addressError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                      <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{addressError}</p>
                    </div>
                  )}

                  {bookingData.deliveryAddressDetails && (
                    <div className="mt-3 p-3 bg-mint/70 border border-primary/20 rounded-xl">
                      <p className="text-sm text-dark font-semibold flex items-center gap-2">
                        <CheckCircle size={16} className="text-primary-deep flex-shrink-0" />
                        Confirmed: {bookingData.deliveryAddress}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {sameAsPickup && bookingData.pickupAddressDetails && (
                <div className="p-3 bg-mint/70 border border-primary/20 rounded-xl">
                  <p className="text-sm text-dark font-semibold flex items-center gap-2">
                    <CheckCircle size={16} className="text-primary-deep flex-shrink-0" />
                    Delivering to: {bookingData.pickupAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Delivery Speed */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-slide-up">
            {/* System Status - Real Data */}
            {deliveryMetrics && !metricsLoading && (
              <div className="surface-card p-4 sm:p-5">
                <div className="grid grid-cols-2 divide-x divide-line">
                  <div className="text-center px-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-soft mb-1">Active team</p>
                    <p className="text-2xl font-bold text-dark">{deliveryMetrics.activeMembers}</p>
                    <p className="text-[11px] text-gray">team members</p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-soft mb-1">Capacity</p>
                    <p className="text-2xl font-bold text-dark">{deliveryMetrics.capacityUsage.toFixed(0)}%</p>
                    <p className="text-[11px] text-gray">utilisation</p>
                  </div>
                </div>
              </div>
            )}

            {metricsLoading ? (
              <div className="surface-card p-10 flex flex-col items-center gap-3">
                <Spinner />
                <p className="text-sm text-gray font-semibold">Checking team availability…</p>
              </div>
            ) : deliveryMetrics && deliveryMetrics.capacityUsage > 85 ? (
              // TEAM IS FULL
              <div className="surface-card p-6 sm:p-8 text-center border-red-200 bg-red-50">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <AlertTriangle size={22} />
                </div>
                <p className="text-red-700 font-bold text-lg mb-1">Our team is at full capacity</p>
                <p className="text-red-600 text-sm mb-3">We&rsquo;re receiving high demand right now. Please try booking again in a few minutes.</p>
                <p className="text-xs text-red-500">Capacity: {deliveryMetrics.capacityUsage.toFixed(0)}% · Active orders: {deliveryMetrics.activeOrders}</p>
              </div>
            ) : (
              // NORMAL - SHOW DELIVERY OPTIONS
              <div className="space-y-3">
                {/* Standard Delivery */}
                <button
                  type="button"
                  onClick={() => setBookingData({ ...bookingData, deliverySpeed: 'standard' })}
                  aria-pressed={bookingData.deliverySpeed === 'standard'}
                  className={`w-full text-left border-2 rounded-2xl p-5 transition-all duration-200 ${
                    bookingData.deliverySpeed === 'standard'
                      ? 'border-primary bg-mint shadow-glow'
                      : 'border-line bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition ${
                      bookingData.deliverySpeed === 'standard' ? 'bg-primary text-white' : 'bg-mint text-primary-deep'
                    }`}>
                      <Truck size={20} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-dark">Standard delivery</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-primary-deep ring-1 ring-line whitespace-nowrap">$7.50/kg</span>
                      </div>
                      <p className="text-sm text-gray mt-0.5">Next business day, delivered by 5pm</p>
                      <p className="text-xs text-gray-soft mt-1.5">
                        {new Date(Date.now() + 86400000).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                      bookingData.deliverySpeed === 'standard' ? 'border-primary bg-primary text-white' : 'border-line'
                    }`}>
                      {bookingData.deliverySpeed === 'standard' && <Check size={12} />}
                    </span>
                  </div>
                </button>

                {/* Express Delivery */}
                <button
                  type="button"
                  onClick={() => setBookingData({ ...bookingData, deliverySpeed: 'express' })}
                  aria-pressed={bookingData.deliverySpeed === 'express'}
                  className={`w-full text-left border-2 rounded-2xl p-5 transition-all duration-200 ${
                    bookingData.deliverySpeed === 'express'
                      ? 'border-amber-400 bg-amber-50 shadow-md'
                      : 'border-line bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition ${
                      bookingData.deliverySpeed === 'express' ? 'bg-amber-400 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <Zap size={20} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-dark flex items-center gap-2">
                          Express delivery
                          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Fast</span>
                        </p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200 whitespace-nowrap">$12.50/kg</span>
                      </div>
                      <p className="text-sm text-gray mt-0.5">Same-day, delivered by 7pm</p>
                      <p className="text-xs text-gray-soft mt-1.5">
                        {new Date().toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })} · max 25kg
                      </p>
                    </div>
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                      bookingData.deliverySpeed === 'express' ? 'border-amber-400 bg-amber-400 text-white' : 'border-line'
                    }`}>
                      {bookingData.deliverySpeed === 'express' && <Check size={12} />}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Laundry Care */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-slide-up">
            {/* Detergent */}
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <Droplet size={16} />
                </span>
                <h3 className="font-bold text-dark flex-1">Detergent</h3>
                <button
                  type="button"
                  onClick={() => setShowDetergentInfo(true)}
                  className="text-gray-soft hover:text-primary transition"
                  aria-label="About detergents"
                >
                  <Info size={16} />
                </button>
              </div>
              <button
                onClick={() => setShowDetergentModal(true)}
                className="w-full flex items-center justify-between gap-3 border border-line rounded-xl p-3.5 text-left hover:border-primary transition min-h-[48px]"
              >
                <span className="text-dark font-semibold">{detergents.find(d => d.id === bookingData.detergent)?.label}</span>
                <ChevronRight size={16} className="text-gray-soft" />
              </button>

              {bookingData.detergent === 'i-will-provide' && (
                <div className="mt-4">
                  <label className="label-field" htmlFor="detergent-custom">Detergent brand &amp; details</label>
                  <textarea
                    id="detergent-custom"
                    value={bookingData.detergentCustom}
                    onChange={(e) => setBookingData({ ...bookingData, detergentCustom: e.target.value })}
                    placeholder="e.g. a specific brand, or any instructions…"
                    className="input-field text-sm"
                    rows={2}
                  />
                </div>
              )}
            </div>

            {/* Special care */}
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <Wind size={16} />
                </span>
                <h3 className="font-bold text-dark flex-1">Special care</h3>
                <button
                  type="button"
                  onClick={() => setShowSpecialCareInfo(true)}
                  className="text-gray-soft hover:text-primary transition"
                  aria-label="About special care"
                >
                  <Info size={16} />
                </button>
              </div>
              <div className="space-y-2.5">
                <label
                  className="flex items-start gap-3 cursor-pointer p-4 border-2 rounded-xl transition has-[:checked]:border-primary has-[:checked]:bg-mint/40 border-line hover:border-primary/50"
                  onClick={() => setBookingData({ ...bookingData, delicateCycle: !bookingData.delicateCycle })}
                >
                  <input type="checkbox" checked={bookingData.delicateCycle} onChange={() => {}} className="w-5 h-5 mt-0.5 accent-primary rounded" />
                  <div>
                    <p className="font-semibold text-dark text-sm">Delicate cycle</p>
                    <p className="text-xs text-gray mt-0.5">Place delicates in a separate bag clearly labelled &lsquo;delicates&rsquo;.</p>
                  </div>
                </label>

                <label
                  className="flex items-start gap-3 cursor-pointer p-4 border-2 rounded-xl transition has-[:checked]:border-primary has-[:checked]:bg-mint/40 border-line hover:border-primary/50"
                  onClick={() => setBookingData({ ...bookingData, returnsOnHangers: !bookingData.returnsOnHangers })}
                >
                  <input type="checkbox" checked={bookingData.returnsOnHangers} onChange={() => {}} className="w-5 h-5 mt-0.5 accent-primary rounded" />
                  <div>
                    <p className="font-semibold text-dark text-sm">Return items on hangers</p>
                    <p className="text-xs text-gray mt-0.5">Items returned on hangers (you provide the hangers).</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Add-ons */}
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <Sparkles size={16} />
                </span>
                <h3 className="font-bold text-dark flex-1">Add-ons <span className="text-xs font-medium text-gray-soft">(optional)</span></h3>
                <button
                  type="button"
                  onClick={() => setShowAddOnsInfo(true)}
                  className="text-gray-soft hover:text-primary transition"
                  aria-label="About add-ons"
                >
                  <Info size={16} />
                </button>
              </div>
              <label
                className="flex items-center gap-3 cursor-pointer p-4 border-2 rounded-xl transition has-[:checked]:border-primary has-[:checked]:bg-mint/40 border-line hover:border-primary/50"
                onClick={() => setBookingData({ ...bookingData, hangDry: !bookingData.hangDry })}
              >
                <input type="checkbox" checked={bookingData.hangDry} onChange={() => {}} className="w-5 h-5 accent-primary rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark text-sm">Hang dry</p>
                  <p className="text-xs text-gray mt-0.5">Items air-dried instead of machine dried.</p>
                </div>
                <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-primary-deep whitespace-nowrap">+$16.50</span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 5: Bag Count */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-slide-up">
            {/* Live weight readout */}
            <div className="surface-card overflow-hidden">
              <div className="bg-gradient-to-br from-mint to-white p-6 sm:p-7 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-deep">Estimated load</p>
                <p className="mt-1 text-5xl font-bold text-dark leading-none">
                  {((bookingData as any).customWeight || bookingData.bagCount * 10).toFixed(1)}
                  <span className="text-xl font-semibold text-gray align-top ml-1">kg</span>
                </p>
                <p className="mt-2 text-sm text-gray">
                  Charged at ${bookingData.deliverySpeed === 'express' ? '12.50' : '7.50'}/kg · $75 minimum order
                </p>
              </div>
            </div>

            {/* Quick pick — bag sizes */}
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <Package size={16} />
                </span>
                <h3 className="font-bold text-dark flex-1">Quick pick a bag size</h3>
                <button
                  type="button"
                  onClick={() => setShowWeightInfo(true)}
                  className="text-gray-soft hover:text-primary transition"
                  aria-label="About measuring laundry"
                >
                  <Info size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Medium bag', kg: 10, helper: 'About a week of clothes' },
                  { label: 'Large bag', kg: 15, helper: 'A full household load' },
                ].map((bag) => {
                  const active = ((bookingData as any).customWeight || bookingData.bagCount * 10) === bag.kg
                  return (
                    <button
                      key={bag.label}
                      type="button"
                      onClick={() => {
                        setBookingData({ ...bookingData, customWeight: bag.kg })
                        setError('')
                      }}
                      aria-pressed={active}
                      className={`rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                        active ? 'border-primary bg-mint shadow-glow' : 'border-line bg-white hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Package size={20} className={active ? 'text-primary-deep' : 'text-gray-soft'} />
                        {active && <Check size={16} className="text-primary-deep" />}
                      </div>
                      <p className="mt-2 font-bold text-dark">{bag.label}</p>
                      <p className="text-xs text-gray">~{bag.kg}kg · {bag.helper}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Fine-tune */}
            <div className="surface-card p-6 sm:p-7">
              <h3 className="font-bold text-dark mb-1">Fine-tune your weight</h3>
              <p className="text-xs text-gray mb-5">Adjust by the bag, drag the slider, or enter an exact figure. Minimum 10kg, maximum 45kg.</p>

              {/* Bag count stepper */}
              <div className="rounded-xl border border-line p-4 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-dark text-sm">Bags</p>
                    <p className="text-xs text-gray">Each bag ≈ 10kg</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBookingData({ ...bookingData, bagCount: Math.max(1, bookingData.bagCount - 1) })}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-dark text-white text-xl font-bold hover:bg-dark-soft transition"
                      aria-label="Fewer bags"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold text-dark w-8 text-center tabular-nums">{bookingData.bagCount}</span>
                    <button
                      onClick={() => {
                        const newCount = bookingData.bagCount + 1
                        const newWeight = newCount * 10
                        if (newWeight > 45) {
                          setError('Loads over 45kg need to be pre-booked. Contact support to arrange.')
                        } else {
                          setBookingData({ ...bookingData, bagCount: newCount })
                          setError('')
                        }
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-dark text-white text-xl font-bold hover:bg-dark-soft transition"
                      aria-label="More bags"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="rounded-xl border border-line p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-dark text-sm">Weight slider</p>
                  <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-primary-deep">
                    {((bookingData as any).customWeight || bookingData.bagCount * 10).toFixed(1)} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="0.5"
                  value={(bookingData as any).customWeight || bookingData.bagCount * 10}
                  onChange={(e) => {
                    const newWeight = parseFloat(e.target.value)
                    setBookingData({ ...bookingData, customWeight: newWeight })
                    if (newWeight > 45) {
                      setError('Loads over 45kg need to be pre-booked. Contact support to arrange.')
                    } else {
                      setError('')
                    }
                  }}
                  className="w-full h-2 bg-line rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-1.5 text-[11px] text-gray-soft font-medium">
                  <span>10kg</span>
                  <span>45kg</span>
                </div>
              </div>

              {/* Custom Weight Input */}
              <div>
                <label className="label-field" htmlFor="custom-weight">Or enter an exact weight (kg)</label>
                <input
                  id="custom-weight"
                  type="number"
                  min="10"
                  max="45"
                  step="0.5"
                  value={(bookingData as any).customWeight || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val) {
                      const newWeight = Math.max(10, Math.min(45, parseFloat(val)))
                      setBookingData({ ...bookingData, customWeight: newWeight })
                      if (newWeight > 45) {
                        setError('Loads over 45kg need to be pre-booked. Contact support to arrange.')
                      } else {
                        setError('')
                      }
                    }
                  }}
                  onBlur={() => {
                    if (!(bookingData as any).customWeight) {
                      setBookingData({ ...bookingData, customWeight: bookingData.bagCount * 10 })
                    }
                  }}
                  className="input-field"
                  placeholder="10"
                />
              </div>
            </div>

            {calculateTotal() < 75 && (
              <div className="rounded-2xl bg-mint/60 border border-primary/20 text-primary-deep p-4 text-sm flex items-center gap-2.5">
                <DollarSign size={18} className="flex-shrink-0" />
                <span className="font-semibold">$75 minimum order — add a little more laundry to meet the minimum.</span>
              </div>
            )}

            {((bookingData as any).customWeight || bookingData.bagCount * 10) > 45 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 p-4 text-sm flex items-start gap-2.5">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <span><strong>Large load:</strong> loads over 45kg need to be pre-booked with support before pickup.</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Protection Plan */}
        {currentStep === 6 && (
          <div className="space-y-5 animate-slide-up">
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <ShieldCheck size={16} />
                </span>
                <h3 className="font-bold text-dark flex-1">Protection plan</h3>
                <button
                  type="button"
                  onClick={() => setShowProtectionPlanInfo(true)}
                  className="text-gray-soft hover:text-primary transition"
                  aria-label="About protection plans"
                >
                  <Info size={16} />
                </button>
              </div>
              <p className="text-sm text-gray mb-5">
                Every order includes Basic cover. Upgrade for a higher cap on delicates or business attire.
              </p>

              <div className="space-y-2.5">
                {protectionPlans.map((plan) => {
                  const active = bookingData.protectionPlan === plan.id
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setBookingData({ ...bookingData, protectionPlan: plan.id })}
                      aria-pressed={active}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                        active ? 'border-primary bg-mint shadow-glow' : 'border-line bg-white hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                          active ? 'border-primary bg-primary text-white' : 'border-line'
                        }`}>
                          {active && <Check size={12} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-dark text-sm">{plan.name}</p>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${
                              plan.price === 'FREE' ? 'bg-mint text-primary-deep' : 'bg-white text-primary-deep ring-1 ring-line'
                            }`}>
                              {plan.price === 'FREE' ? 'Included' : plan.price}
                            </span>
                          </div>
                          <p className="text-xs text-gray mt-0.5">{plan.coverage} · {plan.max}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <a
                href="/protection-plan"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-deep hover:text-primary transition"
              >
                Learn more about the Protection Plan
                <ChevronRight size={14} />
              </a>
            </div>
          </div>
        )}

        {/* STEP 7: Schedule Pickup Date & Delivery Time */}
        {currentStep === 7 && (
          <div className="space-y-5 animate-slide-up">
            {slotsError && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex gap-2.5">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{slotsError}</p>
              </div>
            )}

            {/* Pickup Date */}
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <Calendar size={16} />
                </span>
                <h3 className="font-bold text-dark">Pickup date</h3>
                <span className="text-xs font-semibold text-red-500">Required</span>
              </div>
              <p className="text-sm text-gray mb-4">Choose when a Washlee Pro should collect your laundry.</p>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                value={selectedPickupDate}
                onChange={(e) => {
                  const nextPickupDate = e.target.value
                  setSelectedPickupDate(nextPickupDate)
                  setBookingData({ ...bookingData, pickupDate: nextPickupDate, deliveryDate: '', deliveryTimeSlot: '' })
                  if (nextPickupDate) {
                    fetchAvailableSlots(nextPickupDate)
                  } else {
                    setSelectedDeliveryDate('')
                    setAvailableDeliverySlots([])
                  }
                }}
                className="input-field sm:max-w-xs"
              />
            </div>

            {/* Delivery Date & Time */}
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <Truck size={16} />
                </span>
                <h3 className="font-bold text-dark">Delivery time</h3>
                <span className="text-xs font-semibold text-red-500">Required</span>
              </div>
              <p className="text-sm text-gray mb-4">
                {selectedPickupDate ? 'Pick a delivery window below.' : 'Select a pickup date first to see available windows.'}
              </p>

              {slotsLoading ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Spinner />
                  <p className="text-sm text-gray font-semibold">Finding available windows…</p>
                </div>
              ) : displayedDeliverySlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {displayedDeliverySlots.map((slot: any) => {
                    const active = bookingData.deliveryTimeSlot === slot.timeSlot
                    return (
                      <button
                        key={slot.timeSlot}
                        onClick={() => setBookingData({ ...bookingData, deliveryTimeSlot: slot.timeSlot })}
                        aria-pressed={active}
                        className={`flex items-center justify-center gap-1.5 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 min-h-[48px] ${
                          active
                            ? 'border-primary bg-mint text-dark shadow-glow'
                            : 'border-line bg-white text-gray hover:border-primary/50'
                        }`}
                      >
                        {active && <Check size={14} className="text-primary-deep" />}
                        {slot.timeSlot}
                      </button>
                    )
                  })}
                </div>
              ) : selectedPickupDate && selectedDeliveryDate && !slotsLoading ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-2.5">
                  <AlertCircle size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">No delivery windows are available for this date. Try a different pickup date.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line p-8 text-center">
                  <Clock size={24} className="mx-auto text-gray-soft mb-2" />
                  <p className="text-sm text-gray">Delivery windows appear once you&rsquo;ve picked a pickup date.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 8: Review & Confirm */}
        {currentStep === 8 && (
          <div className="space-y-5 animate-slide-up">
            {/* Order details */}
            <div className="surface-card p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-primary-deep">
                  <ListTodo size={16} />
                </span>
                <h3 className="font-bold text-dark">Order details</h3>
              </div>
              <dl className="divide-y divide-line">
                {[
                  { icon: Shirt, label: 'Service', value: services.find(s => s.id === bookingData.selectedService)?.name },
                  { icon: Package, label: 'Weight', value: `${getDetailedPricing().weight}kg` },
                  { icon: Truck, label: 'Delivery', value: bookingData.deliverySpeed === 'standard' ? 'Standard' : 'Express' },
                  { icon: ShieldCheck, label: 'Protection plan', value: getDetailedPricing().protectionPlanName },
                  { icon: Calendar, label: 'Pickup date', value: bookingData.pickupDate || '—' },
                  { icon: Clock, label: 'Delivery time', value: `${bookingData.deliveryDate} ${bookingData.deliveryTimeSlot}`.trim() || '—' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="flex items-center gap-2 text-sm text-gray">
                      <row.icon size={15} className="text-gray-soft" />
                      {row.label}
                    </dt>
                    <dd className="text-sm font-semibold text-dark text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Pricing breakdown */}
            <div className="surface-card overflow-hidden">
              <div className="p-6 sm:p-7">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-deep mb-3">Pricing breakdown</h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray">{getDetailedPricing().weight}kg @ ${getDetailedPricing().baseRate.toFixed(2)}/kg</span>
                    <span className="font-semibold text-dark">${getDetailedPricing().laundryBase.toFixed(2)}</span>
                  </div>
                  {bookingData.hangDry && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray">Hang dry service</span>
                      <span className="font-semibold text-dark">${getDetailedPricing().hangDry.toFixed(2)}</span>
                    </div>
                  )}
                  {getDetailedPricing().protectionPlan > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray">{getDetailedPricing().protectionPlanName} protection</span>
                      <span className="font-semibold text-dark">${getDetailedPricing().protectionPlan.toFixed(2)}</span>
                    </div>
                  )}
                  {getDetailedPricing().subtotal < 75 && (
                    <div className="flex justify-between items-center text-xs bg-mint/60 text-primary-deep px-3 py-2 rounded-lg">
                      <span className="font-medium">Minimum order amount applied</span>
                      <span className="font-bold">$75.00</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-mint to-white border-t border-line p-6 sm:p-7">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-dark">Total</span>
                  <span className="text-3xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray mt-1">Includes 10% GST · paid securely via Stripe.</p>
              </div>
            </div>

            {/* Terms */}
            <label className="surface-card flex items-start gap-3 p-4 cursor-pointer transition has-[:checked]:border-primary has-[:checked]:bg-mint/30">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 rounded mt-0.5 cursor-pointer accent-primary flex-shrink-0"
              />
              <span className="text-sm text-dark">
                I agree to the{' '}
                <a href="/terms-of-service" className="text-primary-deep font-semibold hover:underline">Terms of Service</a>
                {' '}and understand the pricing.
              </span>
            </label>
          </div>
        )}

        {/* Modals */}
        {/* Pickup Spot Modal */}
        {showPickupSpotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-sm p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Select Pickup Spot</h3>
                <button onClick={() => setShowPickupSpotModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
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
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPickupSpotModal(false)}
                  className="btn-primary flex-1"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detergent Modal */}
        {showDetergentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-sm p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Select Detergent</h3>
                <button onClick={() => setShowDetergentModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
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
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowDetergentModal(false)}
                  className="btn-primary flex-1"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pickup Instructions Info Modal */}
        {showPickupInstructionsInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-sm p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Pickup Instructions</h3>
                <button onClick={() => setShowPickupInstructionsInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
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
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Detergent Info Modal */}
        {showDetergentInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-sm p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Detergent Types</h3>
                <button onClick={() => setShowDetergentInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
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
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Special Care Info Modal */}
        {showSpecialCareInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-sm p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Special Care Instructions</h3>
                <button onClick={() => setShowSpecialCareInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
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
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Add-ons Info Modal */}
        {showAddOnsInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-sm p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Premium Add-ons</h3>
                <button onClick={() => setShowAddOnsInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p>Enhance your laundry service with premium add-ons:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Hang Dry:</strong> Air-dry your clothes instead of machine drying</li>
                </ul>
              </div>
              <button
                onClick={() => setShowAddOnsInfo(false)}
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Weight Info Modal */}
        {showWeightInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-sm p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Measuring Your Laundry</h3>
                <button onClick={() => setShowWeightInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p className="font-semibold text-dark">Quick reference:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>1 bag = 10kg (standard load)</li>
                  <li>2 bags = 20kg (medium load)</li>
                  <li>3 bags = 30kg (large load)</li>
                </ul>
                <p className="text-xs">Pricing: <strong>$7.50/kg</strong> (Standard) or <strong>$12.50/kg</strong> (Express)</p>
              </div>
              <button
                onClick={() => setShowWeightInfo(false)}
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Delivery Speed Info Modal */}
        {showDeliverySpeedInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-sm p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Delivery Options</h3>
                <button onClick={() => setShowDeliverySpeedInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p><strong className="text-dark">Standard Delivery:</strong> Next-day delivery at $7.50/kg. Perfect for regular weekly laundry.</p>
                <p><strong className="text-dark">Express Delivery:</strong> Same-day or overnight service at $12.50/kg. Ideal for urgent needs.</p>
                <p className="text-xs">Choose based on your schedule and budget.</p>
              </div>
              <button
                onClick={() => setShowDeliverySpeedInfo(false)}
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Protection Plan Info Modal */}
        {showProtectionPlanInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-sm p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">Protection Plans</h3>
                <button onClick={() => setShowProtectionPlanInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray mb-6">
                <p className="font-semibold text-dark">Choose your coverage level:</p>
                <ul className="space-y-3 ml-2">
                  <li><strong>Basic (FREE):</strong> $50/item, $300/order max</li>
                  <li><strong>Premium ($3.50):</strong> $100/item, $500/order max</li>
                  <li><strong>Premium+ ($8.50):</strong> $150/item, $1000/order max</li>
                </ul>
                <p className="text-xs">All plans cover loss or damage during the laundry process with a 14-day claim window.</p>
              </div>
              <button
                onClick={() => setShowProtectionPlanInfo(false)}
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Step Info Modal */}
        {showStepInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-md p-6 sm:p-7 max-h-[85vh] overflow-y-auto animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark">{steps[currentStep - 1].title}</h3>
                <button onClick={() => setShowStepInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
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
                    <p className="text-xs italic">Pricing starts at $7.50/kg for standard service.</p>
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
                    <p className="font-semibold text-dark">Choose your delivery speed:</p>
                    <p>Select how quickly you need your laundry back. Standard or Express delivery available.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Standard ($7.50/kg):</strong> Next-day delivery</li>
                      <li><strong>Express ($12.50/kg):</strong> Same-day delivery available</li>
                    </ul>
                    <p className="text-xs italic">Choose the option that works best for your schedule.</p>
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <p className="font-semibold text-dark">Customize your laundry care:</p>
                    <p>Select your preferred detergent, add special care instructions, and choose premium add-ons.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Choose detergent type (classic, hypoallergenic, or provide your own)</li>
                      <li>Add special care instructions for delicates</li>
                      <li>Select add-ons like hang dry ($16.50)</li>
                    </ul>
                    <p className="text-xs italic">Washlee treats your clothes with the same care you would at home.</p>
                  </>
                )}

                {currentStep === 5 && (
                  <>
                    <p className="font-semibold text-dark">Specify your laundry weight:</p>
                    <p>Tell us how much laundry you're sending. We charge by actual weight (minimum 10kg).</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Use the slider for quick selection (10-45kg)</li>
                      <li>Or enter a custom weight in the text box</li>
                      <li>We calculate 10kg per bag for reference</li>
                    </ul>
                    <p className="text-xs italic">Your final price will be based on actual weight measured at our facility.</p>
                  </>
                )}

                {currentStep === 6 && (
                  <>
                    <p className="font-semibold text-dark">Protect your items:</p>
                    <p>Choose a protection plan to cover your laundry in the rare event of loss or damage.</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><strong>Basic (FREE):</strong> Up to $50/item, $300/order max</li>
                      <li><strong>Premium ($3.50):</strong> Up to $100/item, $500/order max</li>
                      <li><strong>Premium+ ($8.50):</strong> Up to $150/item, $1000/order max</li>
                    </ul>
                    <p className="text-xs italic">All claims are processed within 14 days.</p>
                  </>
                )}

                {currentStep === 8 && (
                  <>
                    <p className="font-semibold text-dark">Review & confirm your order:</p>
                    <p>Check all details are correct, then confirm and proceed to secure payment with Stripe. Your order is confirmed once payment is complete.</p>
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
                className="btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Presets Modal */}
        {showPresetsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-md p-6 sm:p-7 max-h-[85vh] overflow-y-auto animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark flex items-center gap-2"><Zap size={20} className="text-orange-500" /> Quick Reorder</h3>
                <button onClick={() => setShowPresetsModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
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

        {/* Sticky bottom bar — running total + navigation */}
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_-12px_rgba(20,32,30,0.18)]">
          <div className="max-w-3xl mx-auto px-4 py-3 sm:py-3.5 flex items-center gap-3 sm:gap-4">
            {/* Live total */}
            <div className="flex-shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-soft leading-none">
                {currentStep === 8 ? 'Total' : 'Estimated total'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-dark leading-tight tabular-nums">
                ${liveTotal.toFixed(2)}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-1 items-center justify-end gap-2.5">
              {currentStep !== 1 && (
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={isLoading}
                  className="btn-outline px-4 sm:px-6 disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isLoading}
                className={`btn-primary shadow-glow disabled:opacity-60 ${currentStep === 1 ? 'flex-1 sm:flex-none sm:px-10' : 'flex-1 sm:flex-none sm:px-8'}`}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Processing…
                  </>
                ) : currentStep === 8 ? (
                  <>
                    Confirm &amp; pay
                    <CheckCircle size={18} />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Express Delivery Warning Modal */}
        {showExpressWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="surface-card w-full max-w-md p-6 sm:p-7 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark flex items-center gap-2"><Zap size={24} className="text-orange-500" /> Express Delivery</h3>
                <button onClick={() => setShowExpressWarning(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray hover:bg-light hover:text-dark transition">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4 mb-8">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                  <p className="font-semibold text-orange-900 mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-600" /> Please Note:</p>
                  <ul className="space-y-2 text-sm text-orange-800">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">•</span>
                      <span><strong>Weight Limit:</strong> Maximum 25kg per order</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">•</span>
                      <span><strong>Pro confirmation:</strong> Your pro will share an estimated pickup time after accepting the job</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-0.5">•</span>
                      <span><strong>Standard Wash Only:</strong> No dry cleaning or special treatments available for express service</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExpressWarning(false)}
                  className="btn-outline flex-1"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setShowExpressWarning(false)
                    setCurrentStep(currentStep + 1)
                  }}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                >
                  Understand & Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
