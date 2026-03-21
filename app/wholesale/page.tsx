'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, Package, Calendar, Zap, Lock, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'

export default function Wholesale() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [businessAccount, setBusinessAccount] = useState<any>(null)
  const [accountLoading, setAccountLoading] = useState(true)
  
  useEffect(() => {
    if (user) {
      loadBusinessAccount()
    }
  }, [user])

  const loadBusinessAccount = async () => {
    try {
      const response = await fetch(`/api/business-accounts?customerId=${user?.id}`)
      const result = await response.json()
      setBusinessAccount(result.data || null)
    } catch (error) {
      console.error('Failed to load business account:', error)
    } finally {
      setAccountLoading(false)
    }
  }

  const hasBusinessAccount = businessAccount !== null
  
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: user?.email || '',
    phone: userData?.phone || '',
    company: '',
    orderType: 'bulk-laundry',
    estimatedWeight: '',
    frequency: 'one-time',
    preferredDates: '',
    notes: '',
    agreedToTerms: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const orderTypes = [
    { id: 'bulk-laundry', name: '🧺 Bulk Laundry', desc: 'General bulk laundry needs' },
    { id: 'corporate-uniforms', name: '👔 Corporate Uniforms', desc: 'Staff uniform cleaning' },
    { id: 'hotel-linens', name: '🛏️ Hotel/Hospitality Linens', desc: 'Sheets, towels, tablecloths' },
    { id: 'restaurant', name: '🍽️ Restaurant Linens', desc: 'Napkins, aprons, uniforms' },
    { id: 'gym-fitness', name: '💪 Gym/Fitness Towels', desc: 'Towel cleaning service' },
    { id: 'other', name: '📦 Other', desc: 'Custom wholesale needs' },
  ]

  const frequencies = [
    { id: 'one-time', name: 'One-time Order', desc: '45kg+' },
    { id: 'weekly', name: 'Weekly Pickup', desc: 'Recurring service' },
    { id: 'bi-weekly', name: 'Bi-weekly', desc: 'Every 2 weeks' },
    { id: 'monthly', name: 'Monthly', desc: 'Monthly pickup' },
  ]

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!hasBusinessAccount) {
      alert('You need a business account to submit wholesale inquiries.')
      return
    }
    
    setIsLoading(true)

    try {
      // Create business inquiry in Supabase
      const { error } = await supabase
        .from('wholesale_inquiries')
        .insert({
          customer_id: user?.id,
          company_name: formData.company,
          contact_name: formData.name,
          contact_email: formData.email,
          contact_phone: formData.phone,
          order_type: formData.orderType,
          estimated_weight: formData.estimatedWeight,
          frequency: formData.frequency,
          preferred_dates: formData.preferredDates,
          notes: formData.notes,
          status: 'pending',
          created_at: new Date().toISOString(),
        })

      if (error) throw error

      setSubmitted(true)
      setTimeout(() => {
        router.push('/')
      }, 5000)
    } catch (error) {
      console.error('Wholesale form error:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-light flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
          <Card className="text-center p-12">
            <div className="mb-6">
              <CheckCircle size={60} className="mx-auto text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-dark mb-3">Thank You!</h1>
            <p className="text-gray mb-6">
              Your wholesale inquiry has been submitted. Our team will contact you within 24 hours with a personalized quote.
            </p>
            <p className="text-sm text-gray mb-8">
              Look for an email from <strong>wholesale@washlee.com.au</strong>
            </p>
            <Button onClick={() => router.push('/')} className="mx-auto">
              Return Home
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />

      {/* Business Only Banner */}
      <div className="w-full bg-gradient-to-r from-primary to-accent py-6 px-4 border-b-4 border-dark/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-3">
            <span className="text-white font-bold text-lg">🏢 BUSINESS ONLY</span>
          </div>
          <p className="text-white text-xl font-semibold mb-2">This Service is for Registered Businesses</p>
          <p className="text-white/90 max-w-2xl mx-auto">
            Wholesale laundry services are available exclusively for businesses, corporations, hospitality venues, and organizations. Personal use customers should use our standard booking service.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Content Wrapper with Barrier Effect */}
        <div className={`relative ${!hasBusinessAccount ? 'opacity-50' : ''}`}>
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-dark mb-4">Wholesale Pre-booking</h1>
            <p className="text-lg text-gray">
              Orders over 45kg require 24 hours notice. Tell us about your needs and we'll provide a custom quote.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card className="p-6 bg-mint">
              <Package size={32} className="text-primary mb-3" />
              <h3 className="font-bold text-dark mb-2">No Weight Limit</h3>
              <p className="text-sm text-gray">
                We handle orders of any size with dedicated support
              </p>
            </Card>

            <Card className="p-6 bg-mint">
              <Calendar size={32} className="text-primary mb-3" />
              <h3 className="font-bold text-dark mb-2">24-Hour Notice</h3>
              <p className="text-sm text-gray">
                Schedule pickups at your convenience
              </p>
            </Card>

            <Card className="p-6 bg-mint">
              <Zap size={32} className="text-primary mb-3" />
              <h3 className="font-bold text-dark mb-2">Custom Pricing</h3>
              <p className="text-sm text-gray">
                Volume discounts available for recurring orders
              </p>
            </Card>
          </div>

          {/* Form */}
          <Card className="p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-bold text-dark mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!hasBusinessAccount}
                        required
                        className="w-full px-4 py-2 border border-gray rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">Company Name *</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        disabled={!hasBusinessAccount}
                        required
                        className="w-full px-4 py-2 border border-gray rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Your company"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!hasBusinessAccount}
                        required
                        className="w-full px-4 py-2 border border-gray rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="you@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!hasBusinessAccount}
                        required
                        className="w-full px-4 py-2 border border-gray rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="+61 2 1234 5678"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="border-t border-gray pt-6">
                <h3 className="font-bold text-dark mb-4">Order Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-3">What type of laundry service do you need? *</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {orderTypes.map((type) => (
                        <label
                          key={type.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                            formData.orderType === type.id
                              ? 'border-primary bg-mint'
                              : 'border-gray hover:border-primary'
                          } ${!hasBusinessAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="radio"
                            name="orderType"
                            value={type.id}
                            checked={formData.orderType === type.id}
                            onChange={handleChange}
                            disabled={!hasBusinessAccount}
                            className="mr-2"
                          />
                          <span className="font-medium text-dark">{type.name}</span>
                          <p className="text-xs text-gray mt-1">{type.desc}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Estimated Weight (kg) *</label>
                    <input
                      type="number"
                      name="estimatedWeight"
                      value={formData.estimatedWeight}
                      onChange={handleChange}
                      disabled={!hasBusinessAccount}
                      required
                      min="45"
                      className="w-full px-4 py-2 border border-gray rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., 100"
                    />
                    <p className="text-xs text-gray mt-1">Minimum 45kg for wholesale orders</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-3">Frequency *</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {frequencies.map((freq) => (
                        <label
                          key={freq.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                            formData.frequency === freq.id
                              ? 'border-primary bg-mint'
                              : 'border-gray hover:border-primary'
                          } ${!hasBusinessAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="radio"
                            name="frequency"
                            value={freq.id}
                            checked={formData.frequency === freq.id}
                            onChange={handleChange}
                            disabled={!hasBusinessAccount}
                            className="mr-2"
                          />
                          <span className="font-medium text-dark">{freq.name}</span>
                          <p className="text-xs text-gray mt-1">{freq.desc}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Preferred Pickup Dates/Times</label>
                    <textarea
                      name="preferredDates"
                      value={formData.preferredDates}
                      onChange={handleChange}
                      disabled={!hasBusinessAccount}
                      className="w-full px-4 py-2 border border-gray rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., Every Monday and Thursday 9-11am"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">Special Requests or Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      disabled={!hasBusinessAccount}
                      className="w-full px-4 py-2 border border-gray rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Tell us anything we should know about your needs..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="border-t border-gray pt-6">
                <label className="flex items-start gap-3 p-4 border border-gray rounded-lg hover:bg-light transition cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleChange}
                    disabled={!hasBusinessAccount}
                    required
                    className="w-5 h-5 rounded mt-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray">
                    I agree to the <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a> and understand that wholesale orders require 24 hours advance notice
                  </span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 py-3 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!hasBusinessAccount}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.agreedToTerms || !hasBusinessAccount}
                  className="flex-1"
                >
                  {isLoading ? 'Submitting...' : 'Submit Inquiry'}
                </Button>
              </div>
            </form>
          </Card>

          {/* FAQ */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-dark mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-bold text-dark mb-2">What is the minimum order size?</h3>
                <p className="text-sm text-gray">
                  Our wholesale service is for orders 45kg and above. For smaller orders, please use our standard booking system.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-dark mb-2">How much notice do you need?</h3>
                <p className="text-sm text-gray">
                  We require a minimum of 24 hours notice for all wholesale orders. This allows us to schedule dedicated pickups and ensure quality service.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-dark mb-2">Do you offer volume discounts?</h3>
                <p className="text-sm text-gray">
                  Yes! For recurring orders and large volumes, we provide custom pricing. Our team will discuss discount options when they contact you with your quote.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-dark mb-2">How will I be contacted?</h3>
                <p className="text-sm text-gray">
                  A member of our wholesale team will contact you via email and phone within 24 hours with a personalized quote and to confirm your requirements.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-dark mb-2">What about special care requirements?</h3>
                <p className="text-sm text-gray">
                  Please mention any special care requirements in the notes section, and our team will discuss options with you.
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Barrier Overlay - Only show if no business account */}
        {!hasBusinessAccount && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 pointer-events-none">
            {/* Visual barrier effect */}
          </div>
        )}

        {/* Access Denied Message - Only show if no business account */}
        {!hasBusinessAccount && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <Card className="max-w-md mx-4 p-8 bg-white shadow-2xl pointer-events-auto">
              <div className="text-center">
                <div className="mb-4 inline-block p-4 bg-primary/10 rounded-full">
                  <Lock size={48} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-dark mb-3">Business Account Required</h2>
                <p className="text-gray mb-6">
                  Wholesale services are exclusively for registered business accounts. Please create a business account to access wholesale ordering.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/auth/signup?type=business')}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Briefcase size={18} />
                    Create Business Account
                  </Button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full py-2 px-4 border-2 border-primary text-primary rounded-full font-semibold hover:bg-mint transition"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
