'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ShoppingBag, Zap, DollarSign, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'

export default function Pricing() {
  const { user, loading, userData } = useAuth()
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [bagCount, setBagCount] = useState(2)
  const [weight, setWeight] = useState(5)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [deliverySpeed, setDeliverySpeed] = useState('standard')
  const [protectionPlan, setProtectionPlan] = useState('basic')
  const [userPlan, setUserPlan] = useState('payPerOrder')
  const [showSubscriptionNotice, setShowSubscriptionNotice] = useState(false)
  const [showWholesaleModal, setShowWholesaleModal] = useState(false)

  // Check if it's past 4pm for same-day delivery cutoff
  const now = new Date()
  const isPastCutoff = now.getHours() >= 12

  const handleGetStarted = () => {
    if (loading) return
    if (user) {
      router.push('/booking')
    } else {
      router.push('/auth/signup')
    }
  }

  // Check if user has a specific plan
  const isCurrentPlan = (planId: string): boolean => {
    // userData currentPlan check - set default to none if not available
    const userCurrentPlan = (userData as any)?.currentPlan || 'none'
    return userCurrentPlan === planId
  }

  // Get button text based on plan
  const getPlanButtonText = (planId: string): string => {
    if (isCurrentPlan(planId)) {
      return 'Current Plan'
    }
    return 'Choose'
  }

  // Bag to weight conversion: 1 bag ≈ 2.5kg
  // Both weight and bagCount are now synced through their setters
  // If user changes weight, bags update; if user changes bags, weight updates

  // Calculate pricing
  const standardPrice = weight * 5.0
  const expressPrice = weight * 10.0
  const basePrice = deliverySpeed === 'express' ? expressPrice : standardPrice
  const minOrder = 50
  
  let addonsPrice = 0
  selectedAddons.forEach(addon => {
    switch (addon) {
      case 'hang-dry':
        addonsPrice += 16.50
        break
      case 'delicates':
        addonsPrice += 22.00
        break
      case 'comforter':
        addonsPrice += 25.00
        break
      case 'stain':
        addonsPrice += 0.50
        break
      case 'ironing':
        addonsPrice += 0
        break
    }
  })
  
  // Protection plan pricing
  let protectionPrice = 0
  if (protectionPlan === 'premium') protectionPrice = 3.50
  if (protectionPlan === 'premium-plus') protectionPrice = 8.50
  
  const totalWithAddons = basePrice + addonsPrice + protectionPrice
  const minOrderApplied = totalWithAddons < minOrder ? minOrder - basePrice : 0
  const totalPrice = totalWithAddons + minOrderApplied

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-mint to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">Pricing That Makes Sense</h1>
          <p className="text-xl text-gray max-w-2xl">
            Pay only for what you send. No hidden fees, no surprises. The cleaner your laundry, the simpler your bill.
          </p>
        </div>
      </section>

      {/* How Bags Work */}
      <section className="section bg-white">
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-dark mb-12 text-center">How Laundry Bags Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark mb-3">Pick Your Bags</h3>
              <p className="text-gray mb-4">Minimum 4 bags (10kg) per order</p>
              <div className="bg-mint rounded-lg p-4">
                <p className="text-sm text-gray">Minimum load:</p>
                <p className="text-xs text-gray mt-1">• 4 bags = 10kg minimum ($50)</p>
                <p className="text-xs text-gray">• 6 bags = 15kg</p>
                <p className="text-xs text-gray">• 8 bags = 20kg</p>
              </div>
            </Card>

            <Card className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark mb-3">Simple Pricing</h3>
              <p className="text-gray mb-4">Minimum order $50 (10kg)</p>
              <div className="bg-mint rounded-lg p-4">
                <p className="text-3xl font-bold text-primary mb-1">$5.00/kg</p>
                <p className="text-xs text-gray">Standard delivery (by 5pm next day)</p>
                <p className="text-3xl font-bold text-primary mt-3">$10.00/kg</p>
                <p className="text-xs text-gray">Express delivery (same-day by 7pm)</p>
              </div>
            </Card>

            <Card className="p-8 text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark mb-3">Flexible Add-ons</h3>
              <p className="text-gray mb-4">Enhance your service</p>
              <div className="bg-mint rounded-lg p-4 text-left">
                <p className="text-xs font-semibold text-dark mb-2">Popular add-ons:</p>
                <p className="text-xs text-gray">✓ Hang Dry ($16.50)</p>
                <p className="text-xs text-gray">✓ Delicates Care ($22.00)</p>
                <p className="text-xs text-gray">✓ Comforter Service ($25.00)</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Price Calculator */}
      <section className="section bg-light">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-dark mb-12 text-center">Price Calculator</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Delivery Speed & Add-ons */}
            <div className="space-y-6">

              {/* Delivery Speed */}
              <Card className="p-6">
                <p className="text-gray text-sm font-semibold mb-4">DELIVERY SPEED</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border-2 border-gray rounded-lg cursor-pointer hover:border-primary transition"
                    onClick={() => setDeliverySpeed('standard')}
                  >
                    <input
                      type="radio"
                      checked={deliverySpeed === 'standard'}
                      onChange={() => {}}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-dark">Standard</p>
                      <p className="text-xs text-gray">Delivered by 5pm next business day</p>
                    </div>
                    <span className="text-sm font-bold text-primary">$3.00/kg</span>
                  </label>

                  <label 
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg transition ${
                      weight > 25 || (isPastCutoff && weight > 0)
                        ? 'border-gray/30 opacity-50 cursor-not-allowed bg-gray/5'
                        : 'border-gray cursor-pointer hover:border-primary'
                    }`}
                    onClick={() => {
                      if (weight > 25) return
                      if (isPastCutoff) return
                      setDeliverySpeed('express')
                    }}
                  >
                    <input
                      type="radio"
                      checked={deliverySpeed === 'express'}
                      onChange={() => {}}
                      disabled={weight > 25 || isPastCutoff}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-dark">Express</p>
                      <p className="text-xs text-gray">
                        {weight > 25 ? '✕ Not available (max 25kg)' : isPastCutoff ? `✕ Unavailable (cutoff 12pm) - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` : 'Same-day by 7pm'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">$7.50/kg</span>
                  </label>
                </div>
              </Card>

              {/* Add-ons */}
              <Card className="p-6">
                <p className="text-gray text-sm font-semibold mb-4">ADD-ONS (OPTIONAL)</p>
                <div className="space-y-3">
                  {[
                    { id: 'hang-dry', name: 'Hang Dry', price: '$16.50' },
                    { id: 'delicates', name: 'Delicates Care', price: '$22.00' },
                    { id: 'comforter', name: 'Comforter Service', price: '$25.00' },
                    { id: 'stain', name: 'Stain Treatment', price: '$0.50/item' },
                    { id: 'ironing', name: 'Ironing', price: 'Included' },
                  ].map(addon => (
                    <label key={addon.id} className="flex items-center gap-3 p-3 border border-light rounded-lg cursor-pointer hover:bg-light transition">
                      <input
                        type="checkbox"
                        checked={selectedAddons.includes(addon.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAddons([...selectedAddons, addon.id])
                          } else {
                            setSelectedAddons(selectedAddons.filter(a => a !== addon.id))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-dark text-sm">{addon.name}</p>
                      </div>
                      <p className="text-xs font-bold text-primary">{addon.price}</p>
                    </label>
                  ))}
                </div>
              </Card>

              {/* Protection Plan */}
              <Card className="p-6 border-2 border-primary bg-gradient-to-br from-yellow-50 to-white">
                <p className="text-gray text-sm font-semibold mb-3">PROTECTION PLAN</p>
                <p className="text-xs text-gray mb-4">Covers damage & loss up to $1,000</p>
                <div className="space-y-2">
                  {[
                    { id: 'basic', name: 'Basic Coverage', price: 'Free', desc: 'Standard protection' },
                    { id: 'premium', name: 'Premium Plan', price: '$3.50', desc: 'Enhanced coverage' },
                    { id: 'premium-plus', name: 'Premium Plus', price: '$8.50', desc: 'Maximum coverage' },
                  ].map(plan => (
                    <label key={plan.id} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                      protectionPlan === plan.id
                        ? 'border-primary bg-mint'
                        : 'border-light hover:border-primary'
                    }`}>
                      <input
                        type="radio"
                        name="protection"
                        checked={protectionPlan === plan.id}
                        onChange={() => setProtectionPlan(plan.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-dark text-sm">{plan.name}</p>
                        <p className="text-xs text-gray">{plan.desc}</p>
                      </div>
                      <p className="text-xs font-bold text-primary">{plan.price}</p>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Weight Control & Price Breakdown */}
            <div className="flex flex-col gap-6">
              {/* Weight & Bag Control - Top */}
              <Card className="p-6 border-2 border-primary bg-gradient-to-br from-mint to-white">
                <p className="text-gray text-sm font-semibold mb-4">LAUNDRY WEIGHT</p>
                
                {/* Weight Presets - Full Range */}
                <div className="mb-4">
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[
                      { kg: 10, bags: 4, label: '10kg', price: '$50.00' },
                      { kg: 15, bags: 6, label: '15kg', price: '$75.00' },
                      { kg: 20, bags: 8, label: '20kg', price: '$100.00' },
                      { kg: 25, bags: 10, label: '25kg', price: '$125.00' },
                    ].map(preset => (
                      <button
                        key={preset.kg}
                        onClick={() => {
                          setWeight(preset.kg)
                          setBagCount(preset.bags)
                        }}
                        className={`py-1.5 px-2 rounded text-xs font-semibold transition flex flex-col items-center gap-0.5 ${
                          weight === preset.kg
                            ? 'bg-primary text-white'
                            : 'bg-white text-dark hover:bg-primary/10 border border-gray'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className={`text-xs ${weight === preset.kg ? 'text-white/90' : 'text-primary'}`}>{preset.price}</span>
                      </button>
                    ))}
                  </div>

                  {/* 30kg+ Locked Options - Compact */}
                  <div className="mb-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { kg: 32, bags: 13, label: '32kg', price: '$96.00' },
                        { kg: 38, bags: 16, label: '38kg', price: '$114.00' },
                        { kg: 45, bags: 18, label: '45kg', price: '$135.00' },
                      ].map(preset => (
                        <div key={preset.kg} className="relative group">
                          <button
                            onClick={() => {
                              if (userPlan === 'payPerOrder') {
                                setShowSubscriptionNotice(true)
                                return
                              }
                              setWeight(preset.kg)
                              setBagCount(preset.bags)
                              // Force standard delivery for 30kg+
                              setDeliverySpeed('standard')
                            }}
                            className={`w-full py-1.5 px-2 rounded text-xs font-semibold transition flex flex-col items-center gap-0.5 ${
                              weight === preset.kg
                                ? 'bg-primary text-white'
                                : 'bg-white text-dark hover:bg-primary/10 border border-gray'
                            } ${userPlan === 'payPerOrder' ? 'opacity-50' : ''}`}
                          >
                            <span>{preset.label}</span>
                            <span className={`text-xs ${weight === preset.kg ? 'text-white/90' : 'text-primary'}`}>{preset.price}</span>
                          </button>
                          
                          {/* Hover Upgrade Overlay for Locked Options */}
                          {userPlan === 'basic' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowSubscriptionNotice(true)
                              }}
                              className="absolute inset-0 bg-black/70 rounded opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-2 text-white text-xs font-semibold cursor-pointer hover:bg-black/80"
                            >
                              <span>You don't have</span>
                              <span>the account plan</span>
                              <span className="mt-1 text-primary underline">See our plans</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {userPlan === 'basic' && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3">
                      💡 <strong>Min order $30</strong> (10kg @ $3/kg or with add-ons). Loads up to 25kg available.
                    </p>
                  )}

                  {/* Subscription Notice Modal */}
                  {showSubscriptionNotice && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg p-6 max-w-sm">
                        <h3 className="text-lg font-bold text-dark mb-3">🔒 Premium Feature</h3>
                        <p className="text-sm text-gray mb-4">
                          Loads over 25kg are only available with a Professional or Washlee Premium subscription.
                        </p>
                        <p className="text-sm text-gray mb-6">
                          <strong>Your current limit:</strong> Up to 25kg per load
                        </p>
                        <p className="text-xs text-gray bg-amber-50 border border-amber-200 rounded p-3 mb-6">
                          💡 Need larger loads? Unlock 30kg-45kg with Premium plans for 3-5 business day delivery.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowSubscriptionNotice(false)}
                            className="flex-1 px-4 py-2 border border-gray rounded-lg text-dark font-semibold hover:bg-light transition"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => router.push('/pricing#plans')}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
                          >
                            View Plans
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wholesale Modal */}
                  {showWholesaleModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg p-6 max-w-sm">
                        <h3 className="text-lg font-bold text-dark mb-3">📦 Wholesale Orders</h3>
                        <p className="text-sm text-gray mb-4">
                          Orders over 45kg require pre-booking and 24 hours notice.
                        </p>
                        <p className="text-sm text-gray mb-6">
                          <strong>Perfect for:</strong> Bulk laundry, corporate uniforms, hotel linens, and more
                        </p>
                        <p className="text-xs text-gray bg-blue-50 border border-blue-200 rounded p-3 mb-6">
                          ✨ Get a personalized quote and flexible scheduling for your wholesale needs.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowWholesaleModal(false)}
                            className="flex-1 px-4 py-2 border border-gray rounded-lg text-dark font-semibold hover:bg-light transition"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => router.push('/wholesale')}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
                          >
                            Pre-book
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0.5"
                  max="45"
                  step="0.5"
                  value={weight}
                  onChange={(e) => {
                    const newWeight = parseFloat(e.target.value)
                    if (newWeight > 25 && userPlan === 'payPerOrder') {
                      setShowSubscriptionNotice(true)
                      return
                    }
                    // Cap at 45kg and show wholesale modal
                    if (newWeight > 45) {
                      setShowWholesaleModal(true)
                      return
                    }
                    setWeight(newWeight)
                    setBagCount(Math.ceil(newWeight / 2.5))
                    // Force standard delivery for weights > 27.5kg
                    if (newWeight > 27.5) {
                      setDeliverySpeed('standard')
                    }
                  }}
                  className="w-full h-2 bg-light rounded-lg appearance-none cursor-pointer accent-primary mb-3"
                />

                {/* Weight Display */}
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-primary">{weight.toFixed(1)} kg</p>
                  <p className="text-xs text-gray mt-1">= {Math.ceil(weight / 2.5)} bag{Math.ceil(weight / 2.5) !== 1 ? 's' : ''}</p>
                </div>

                {/* Bag Counter - Compact */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      const newBags = Math.max(1, bagCount - 1)
                      setBagCount(newBags)
                      setWeight(newBags * 2.5)
                    }}
                    className="w-8 h-8 rounded-full bg-dark text-white font-bold hover:bg-dark/90 text-sm"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-dark w-8 text-center">{bagCount}</span>
                  <button
                    onClick={() => {
                      const newBags = bagCount + 1
                      setBagCount(newBags)
                      setWeight(newBags * 2.5)
                    }}
                    className="w-8 h-8 rounded-full bg-dark text-white font-bold hover:bg-dark/90 text-sm"
                  >
                    +
                  </button>
                </div>
              </Card>

              {/* Order Summary - Below Weight Control */}
              <Card className="p-8 bg-gradient-to-br from-mint to-light sticky top-8">
                <h3 className="text-2xl font-bold text-dark mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6 pb-6 border-b border-primary">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray">Weight:</span>
                    <span className="font-semibold text-dark">{weight.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray">Bags:</span>
                    <span className="font-semibold text-dark">{bagCount} bag{bagCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray">Delivery Speed:</span>
                    <span className="font-semibold text-dark capitalize">{deliverySpeed}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray">{weight.toFixed(1)} kg @ ${deliverySpeed === 'express' ? '6.00' : '3.00'}/kg:</span>
                    <span className="font-semibold text-dark">${basePrice.toFixed(2)}</span>
                  </div>
                  
                  {selectedAddons.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray">Add-ons</span>
                      <span className="font-semibold text-dark">+${addonsPrice.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {protectionPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray">Protection Plan</span>
                      <span className="font-semibold text-dark">+${protectionPrice.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {minOrderApplied > 0 && (
                    <div className="flex justify-between text-amber-600 text-sm">
                      <span>Minimum Order Applied</span>
                      <span>+${minOrderApplied.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-primary pt-4 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-dark">Estimated Total:</span>
                    <span className="text-4xl font-bold text-primary">${totalPrice.toFixed(2)} (inc. GST)</span>
                  </div>
                  <p className="text-xs text-gray mb-6">*Final price based on actual weight after washing</p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleGetStarted}
                >
                  Book Now
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="section bg-gradient-to-br from-white to-mint/10" id="plans">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-dark mb-4 text-center">Choose a Plan</h2>
          <p className="text-gray text-center mb-12 max-w-2xl mx-auto">
            Select the plan that works best for your laundry needs. Upgrade anytime—no long-term commitment required.
          </p>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Pay Per Order */}
            <Card className="p-6 flex flex-col hover:shadow-lg transition relative">
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <CheckCircle size={18} className="text-primary" />
                <span className="text-xs font-semibold text-primary">Current plan</span>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-dark mb-2">Pay Per Order</h3>
                <p className="text-gray text-sm">Perfect for occasional users</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-dark">$0</span>
                <span className="text-gray text-sm">/month</span>
              </div>
              <div className="mb-6 pb-6 border-b border-gray-200 flex-1">
                <p className="text-sm font-medium text-dark mb-2">Up to 10 orders/month</p>
                <p className="text-xs text-gray">Pay only for what you use</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Max 25kg per load</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Standard delivery only</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Standard pricing</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </Card>

            {/* Starter */}
            <Card className="p-6 flex flex-col hover:shadow-lg transition border-2 border-primary">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-dark mb-2">Starter</h3>
                <p className="text-gray text-sm">Most popular</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-dark">$4.99</span>
                <span className="text-gray text-sm">/month</span>
              </div>
              <div className="mb-6 pb-6 border-b border-gray-200 flex-1">
                <p className="text-sm font-medium text-dark mb-2">Unlimited orders</p>
                <p className="text-xs text-gray">Max 25kg per load</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Express delivery</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Add-on discounts</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Save up to 15%</span>
                </li>
              </ul>
              <Button className="w-full" disabled={isCurrentPlan('starter')} onClick={() => !isCurrentPlan('starter') && router.push('/subscriptions')}>
                {getPlanButtonText('starter')}
              </Button>
            </Card>

            {/* Pro */}
            <Card className="p-6 flex flex-col hover:shadow-lg transition">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-dark mb-2">Pro</h3>
                <p className="text-gray text-sm">Heavy duty users</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-dark">$9.99</span>
                <span className="text-gray text-sm">/month</span>
              </div>
              <div className="mb-6 pb-6 border-b border-gray-200 flex-1">
                <p className="text-sm font-medium text-dark mb-2">Unlimited orders</p>
                <p className="text-xs text-gray">Max 45kg per load</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Express delivery</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Add-on discounts</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Save up to 20%</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled={isCurrentPlan('pro')} onClick={() => !isCurrentPlan('pro') && router.push('/subscriptions')}>
                {getPlanButtonText('pro')}
              </Button>
            </Card>

            {/* Premium+ */}
            <Card className="p-6 flex flex-col hover:shadow-lg transition lg:col-span-2 md:col-span-2">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-dark mb-2">Premium+</h3>
                <p className="text-gray text-sm">Everything included</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-dark">$24.99</span>
                <span className="text-gray text-sm">/month</span>
              </div>
              <div className="mb-6 pb-6 border-b border-gray-200 flex-1">
                <p className="text-sm font-medium text-dark mb-2">Unlimited orders</p>
                <p className="text-xs text-gray">Max 45kg per load</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Express delivery</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>All add-ons discounted</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-dark">
                  <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Priority support & dedicated account</span>
                </li>
              </ul>
              <Button className="w-full" disabled={isCurrentPlan('premium+')} onClick={() => !isCurrentPlan('premium+') && router.push('/subscriptions')}>
                {getPlanButtonText('premium+')}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-white">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Pricing FAQ</h2>

        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              q: 'How are bags converted to kilograms?',
              a: 'One laundry bag ≈ 2.5kg. We use this estimate for your initial quote, but you\'re charged based on the actual weight after washing.',
            },
            {
              q: 'What\'s the difference between standard and express?',
              a: 'Standard delivery is next day at $3.00/kg. Express is same-day or overnight at $6.00/kg with delivery by 8pm.',
            },
            {
              q: 'Is there a minimum order?',
              a: 'Yes, we have a $30 minimum order to ensure profitability of your service. This includes the base service and any add-ons.',
            },
            {
              q: 'Are delivery fees included?',
              a: 'Yes! Free pickup and delivery are included in the per-kilogram price. No hidden fees ever.',
            },
            {
              q: 'How do add-ons work with pricing?',
              a: 'Add-ons are optional enhancements like Hang Dry ($16.50) or Delicates Care ($22.00). They\'re added to your total along with the base per-kg charge.',
            },
            {
              q: 'What if my order weighs less than the minimum?',
              a: 'If your order costs less than $30, we\'ll charge the $30 minimum to ensure we can provide quality service.',
            },
          ].map((faq, i) => (
            <div
              key={i}
              className="border border-gray rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-6 hover:bg-light transition text-left"
              >
                <span className="font-bold text-dark">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-primary transition ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 text-gray">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-accent py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white mb-8 opacity-90">
            Send your first load and experience the Washlee difference.
          </p>
          <div className="flex justify-center">
            <Link href="/booking">
              <Button size="lg" className="bg-white text-primary hover:bg-light">
                Book Your First Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
