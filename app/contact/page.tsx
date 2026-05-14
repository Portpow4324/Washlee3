'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState } from 'react'
import { MessageSquare, Mail, Phone, MapPin, Clock, AlertCircle, CheckCircle, ArrowRight, HelpCircle } from 'lucide-react'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState('submitting')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data: { success?: boolean; error?: string } = await res
        .json()
        .catch(() => ({ success: false, error: `Request failed (${res.status})` }))
      if (!res.ok || data.success === false) {
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      setState('success')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <MessageSquare size={14} /> We&rsquo;re here to help
            </span>
            <h1 className="h1 text-dark text-balance mb-4">Get in touch</h1>
            <p className="text-lg text-gray leading-relaxed">
              Questions about pricing, an order, or becoming a Pro? Send us a message and our Melbourne team will reply within one business day.
            </p>
          </div>
        </div>
      </section>

      {/* Quick channels */}
      <section className="container-page pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="surface-card p-6">
            <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-3">
              <Mail size={18} className="text-primary-deep" />
            </div>
            <h3 className="font-bold text-dark mb-1">Email us</h3>
            <p className="text-sm text-gray mb-2">Replies within one business day.</p>
            <a href="mailto:support@washlee.com.au" className="text-primary-deep font-semibold text-sm hover:underline">
              support@washlee.com.au
            </a>
          </div>
          <div className="surface-card p-6">
            <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-3">
              <HelpCircle size={18} className="text-primary-deep" />
            </div>
            <h3 className="font-bold text-dark mb-1">Help centre</h3>
            <p className="text-sm text-gray mb-2">Common questions, answered.</p>
            <Link href="/help-center" className="text-primary-deep font-semibold text-sm hover:underline">
              Browse articles
            </Link>
          </div>
          <div className="surface-card p-6">
            <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-3">
              <MapPin size={18} className="text-primary-deep" />
            </div>
            <h3 className="font-bold text-dark mb-1">Service area</h3>
            <p className="text-sm text-gray mb-2">Currently across Greater Melbourne.</p>
            <Link href="/booking" className="text-primary-deep font-semibold text-sm hover:underline">
              Check your suburb
            </Link>
          </div>
        </div>
      </section>

      {/* Form + info */}
      <section className="container-page pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 surface-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-dark mb-6">Send a message</h2>

            {state === 'success' && (
              <div className="mb-5 p-4 rounded-xl bg-mint border border-primary/20 flex gap-3">
                <CheckCircle size={20} className="text-primary-deep flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-dark">Thanks — we got it.</p>
                  <p className="text-sm text-gray">A team member will reply by email shortly.</p>
                </div>
              </div>
            )}

            {state === 'error' && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Couldn&rsquo;t send right now</p>
                  <p className="text-sm text-red-700">{errorMsg ?? 'Please email support@washlee.com.au instead.'}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="label-field">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="label-field">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="label-field">Phone <span className="text-gray-soft font-normal">(optional)</span></label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="04xx xxx xxx"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="label-field">Topic</label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select a topic</option>
                    <option value="booking">Booking help</option>
                    <option value="order">An existing order</option>
                    <option value="pro">Becoming a Pro</option>
                    <option value="billing">Billing</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Something else</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="label-field">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Tell us what&rsquo;s going on…"
                />
              </div>

              <button
                type="submit"
                disabled={state === 'submitting'}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {state === 'submitting' ? 'Sending…' : 'Send message'}
                {state !== 'submitting' && <ArrowRight size={16} />}
              </button>
            </form>
          </div>

          {/* Info column */}
          <aside className="lg:col-span-2 space-y-6">
            <div className="surface-card p-6">
              <h3 className="font-bold text-dark mb-4">Reach us directly</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <Mail size={18} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-dark">Customer support</p>
                    <a href="mailto:support@washlee.com.au" className="text-gray hover:text-primary-deep">support@washlee.com.au</a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Mail size={18} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-dark">Pros &amp; partners</p>
                    <a href="mailto:pros@washlee.com.au" className="text-gray hover:text-primary-deep">pros@washlee.com.au</a>
                  </div>
                </li>
                <li className="flex gap-3">
                  <MapPin size={18} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-dark">Service area</p>
                    <p className="text-gray">Greater Melbourne, VIC, Australia</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Clock size={18} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-dark">Support hours</p>
                    <p className="text-gray">Mon–Sun, 7am–8pm AEST</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="surface-card p-6 bg-gradient-to-br from-mint to-white">
              <Phone size={24} className="text-primary-deep mb-3" />
              <h3 className="font-bold text-dark mb-1">Need help with an active order?</h3>
              <p className="text-sm text-gray mb-4">In-app chat is the fastest path — your Pro and our support team can both jump in.</p>
              <Link href="/dashboard/support" className="btn-outline text-sm">Open in-app support</Link>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </>
  )
}
