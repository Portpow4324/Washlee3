'use client'

import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle,
  MapPin,
  Search,
  AlertCircle,
  Loader2,
  Building2,
  Mail,
} from 'lucide-react'
import {
  BUSINESS_TYPES,
  LAUNDRY_ITEMS,
  FREQUENCIES,
  PICKUP_WINDOWS,
  checkBusinessArea,
  type AreaCheckResult,
} from '@/lib/businessLaundry'

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

type SubmitState = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Business Laundry lead funnel.
 *
 * Flow: area check → serviced (full quote form) or not-yet (waitlist form).
 * Submissions post to the existing open /api/contact endpoint with a
 * structured subject + message — no new backend, no schema change, no auth.
 * A dedicated business-lead endpoint is the recommended future backend.
 */
export default function BusinessQuoteFunnel() {
  const [areaInput, setAreaInput] = useState('')
  const [areaResult, setAreaResult] = useState<AreaCheckResult>({ status: 'empty' })

  // Shared contact + business fields
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0].id)
  const [addressLine, setAddressLine] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [frequency, setFrequency] = useState(FREQUENCIES[0].id)
  const [estimatedVolume, setEstimatedVolume] = useState('')
  const [pickupWindow, setPickupWindow] = useState(PICKUP_WINDOWS[0])
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [formError, setFormError] = useState('')

  const handleAreaCheck = (e: React.FormEvent) => {
    e.preventDefault()
    setAreaResult(checkBusinessArea(areaInput))
    setSubmitState('idle')
    setFormError('')
  }

  const toggleItem = (id: string) => {
    setItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const submitLead = async (mode: 'quote' | 'waitlist') => {
    setFormError('')

    if (!contactName.trim() || !businessName.trim() || !email.trim()) {
      setFormError('Please add your name, business name, and email.')
      return
    }
    if (!isEmail(email.trim())) {
      setFormError('That email doesn’t look right.')
      return
    }
    if (mode === 'quote' && items.length === 0) {
      setFormError('Pick at least one item type so we can scope your quote.')
      return
    }

    const typeLabel = BUSINESS_TYPES.find((t) => t.id === businessType)?.label ?? businessType
    const freqLabel = FREQUENCIES.find((f) => f.id === frequency)?.label ?? frequency
    const itemLabels = LAUNDRY_ITEMS.filter((i) => items.includes(i.id)).map((i) => i.label)
    const matchedSuburb = areaResult.status === 'serviced' ? areaResult.matchedSuburb : ''

    const subject =
      mode === 'quote'
        ? `Business Laundry quote — ${businessName.trim()}`
        : `Business Laundry waitlist — ${areaInput.trim() || 'area TBC'}`

    const lines =
      mode === 'quote'
        ? [
            'NEW BUSINESS LAUNDRY QUOTE REQUEST',
            '',
            `Business name: ${businessName.trim()}`,
            `Business type: ${typeLabel}`,
            `Area checked: ${areaInput.trim()}${matchedSuburb ? ` (matched ${matchedSuburb})` : ''}`,
            `Pickup address: ${addressLine.trim() || '(not provided)'}`,
            `Items needed: ${itemLabels.join(', ') || '(none selected)'}`,
            `Frequency: ${freqLabel}`,
            `Estimated volume: ${estimatedVolume.trim() || '(not provided)'}`,
            `Preferred pickup window: ${pickupWindow}`,
            '',
            `Contact: ${contactName.trim()}`,
            `Email: ${email.trim()}`,
            `Phone: ${phone.trim() || '(not provided)'}`,
          ]
        : [
            'NEW BUSINESS LAUNDRY WAITLIST SIGN-UP',
            '',
            `Business name: ${businessName.trim()}`,
            `Business type: ${typeLabel}`,
            `Area entered: ${areaInput.trim() || '(not provided)'}`,
            '',
            `Contact: ${contactName.trim()}`,
            `Email: ${email.trim()}`,
            `Phone: ${phone.trim() || '(not provided)'}`,
          ]

    setSubmitState('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject,
          message: lines.join('\n'),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Submission failed')
      }
      setSubmitState('sent')
    } catch (err) {
      console.error('[BusinessQuoteFunnel] submit failed:', err)
      setSubmitState('error')
      setFormError(
        'We couldn’t send that just now. Please try again, or email support@washlee.com.au directly.'
      )
    }
  }

  /* ---------- Success state ---------- */
  if (submitState === 'sent') {
    const isQuote = areaResult.status === 'serviced'
    return (
      <div className="surface-card p-8 sm:p-12 text-center bg-gradient-to-br from-mint to-white">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
          <CheckCircle size={30} />
        </div>
        <h3 className="text-2xl font-bold text-dark mb-2">
          {isQuote ? 'Quote request received' : 'You’re on the business waitlist'}
        </h3>
        <p className="text-gray max-w-md mx-auto mb-6">
          {isQuote
            ? 'Thanks — our business team will review your details and get back to you with a tailored quote, usually within 1–2 business days.'
            : 'Thanks — we’ll let you know as soon as Washlee business pickup reaches your area.'}
        </p>
        <p className="text-xs text-gray-soft">
          Our team picks this up from <span className="font-semibold text-dark">support@washlee.com.au</span>.
        </p>
      </div>
    )
  }

  /* ---------- Funnel ---------- */
  return (
    <div className="space-y-5">
      {/* Step 1 — area check */}
      <div className="surface-card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">1</span>
          <h3 className="text-lg font-bold text-dark">Check if we service your area</h3>
        </div>
        <p className="text-sm text-gray mb-4 pl-9">
          Enter your business suburb or postcode. Washlee is Greater Melbourne first.
        </p>
        <form onSubmit={handleAreaCheck} className="flex flex-col sm:flex-row gap-3 pl-0 sm:pl-9">
          <div className="relative flex-1">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-soft" />
            <input
              type="text"
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              placeholder="e.g. Fitzroy or 3065"
              className="input-field pl-9"
              aria-label="Business suburb or postcode"
            />
          </div>
          <button type="submit" className="btn-primary sm:w-auto">
            <Search size={16} />
            Check your area
          </button>
        </form>

        {areaResult.status === 'serviced' && (
          <div className="mt-4 sm:ml-9 rounded-2xl border border-primary/30 bg-mint p-4 flex items-start gap-3">
            <CheckCircle size={20} className="text-primary-deep flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-dark">Good news, we service your area.</p>
              <p className="text-sm text-gray mt-0.5">
                {areaResult.matchedSuburb} is inside the Washlee service area. Request a business quote below.
              </p>
            </div>
          </div>
        )}

        {areaResult.status === 'waitlist' && (
          <div className="mt-4 sm:ml-9 rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-dark">We’re not there yet.</p>
              <p className="text-sm text-gray mt-0.5">
                Washlee business pickup hasn’t reached that area yet. Join the business waitlist and we’ll
                tell you the moment it does.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — quote form (serviced) */}
      {areaResult.status === 'serviced' && (
        <div className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">2</span>
            <h3 className="text-lg font-bold text-dark">Request a business quote</h3>
          </div>
          <p className="text-sm text-gray mb-6 pl-9">
            Business pricing is quote-based — tell us the shape of your laundry and we’ll scope it.
          </p>

          <div className="space-y-6">
            {/* Business basics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field" htmlFor="bl-business-name">Business name</label>
                <input
                  id="bl-business-name"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Hawthorn Lane Café"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="bl-business-type">Business type</label>
                <select
                  id="bl-business-type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="input-field"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label-field" htmlFor="bl-address">Pickup address (suburb, street)</label>
              <input
                id="bl-address"
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="input-field"
                placeholder="Street, suburb, postcode"
              />
            </div>

            {/* Items */}
            <div>
              <p className="label-field">Items you need washed</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LAUNDRY_ITEMS.map((item) => {
                  const active = items.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      aria-pressed={active}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition text-left ${
                        active
                          ? 'border-primary bg-mint text-dark'
                          : 'border-line bg-white text-gray hover:border-primary/40'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          active ? 'border-primary bg-primary text-white' : 'border-line'
                        }`}
                      >
                        {active && <CheckCircle size={11} />}
                      </span>
                      {item.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-gray-soft">
                Customer-owned laundry. Linen rental and exchange is not offered yet — it may come later.
              </p>
            </div>

            {/* Frequency */}
            <div>
              <p className="label-field">Pickup frequency</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FREQUENCIES.map((f) => (
                  <label
                    key={f.id}
                    className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition ${
                      frequency === f.id ? 'border-primary bg-mint' : 'border-line hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bl-frequency"
                      checked={frequency === f.id}
                      onChange={() => setFrequency(f.id)}
                      className="mt-0.5 w-4 h-4 accent-primary"
                    />
                    <span>
                      <span className="block font-semibold text-dark text-sm">{f.label}</span>
                      <span className="block text-xs text-gray">{f.helper}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Volume + window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field" htmlFor="bl-volume">Estimated volume</label>
                <input
                  id="bl-volume"
                  type="text"
                  value={estimatedVolume}
                  onChange={(e) => setEstimatedVolume(e.target.value)}
                  className="input-field"
                  placeholder="e.g. ~40kg/week, or 6 bins"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="bl-window">Preferred pickup window</label>
                <select
                  id="bl-window"
                  value={pickupWindow}
                  onChange={(e) => setPickupWindow(e.target.value)}
                  className="input-field"
                >
                  {PICKUP_WINDOWS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact */}
            <div className="border-t border-line pt-5">
              <p className="label-field">Your contact details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="input-field"
                  placeholder="Contact name"
                  aria-label="Contact name"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  placeholder="Phone (+61…)"
                  aria-label="Phone"
                />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-4"
                placeholder="Email address"
                aria-label="Email address"
              />
            </div>

            {formError && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => submitLead('quote')}
              disabled={submitState === 'sending'}
              className="btn-primary w-full text-base shadow-glow disabled:opacity-60"
            >
              {submitState === 'sending' ? (
                <><Loader2 size={16} className="animate-spin" /> Sending…</>
              ) : (
                <>Request a quote <ArrowRight size={16} /></>
              )}
            </button>
            <p className="text-xs text-gray-soft text-center">
              No payment now. Business pricing is quoted after we review your needs.
            </p>
          </div>
        </div>
      )}

      {/* Step 2 — waitlist form (not serviced) */}
      {areaResult.status === 'waitlist' && (
        <div className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">2</span>
            <h3 className="text-lg font-bold text-dark">Join the business waitlist</h3>
          </div>
          <p className="text-sm text-gray mb-6 pl-9">
            Leave your details and we’ll be in touch when Washlee business pickup covers your area.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field" htmlFor="bl-wl-name">Business name</label>
                <input
                  id="bl-wl-name"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="input-field"
                  placeholder="Your business"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="bl-wl-type">Business type</label>
                <select
                  id="bl-wl-type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="input-field"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="input-field"
                placeholder="Contact name"
                aria-label="Contact name"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="Phone (+61…)"
                aria-label="Phone"
              />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Email address"
              aria-label="Email address"
            />

            {formError && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => submitLead('waitlist')}
              disabled={submitState === 'sending'}
              className="btn-primary w-full text-base disabled:opacity-60"
            >
              {submitState === 'sending' ? (
                <><Loader2 size={16} className="animate-spin" /> Sending…</>
              ) : (
                <>Join the business waitlist <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Idle helper */}
      {areaResult.status === 'empty' && (
        <div className="surface-card p-6 bg-soft-mint flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint flex-shrink-0">
            <Building2 size={18} className="text-primary-deep" />
          </div>
          <p className="text-sm text-gray leading-relaxed">
            Run the area check above to get started. If we cover you, you’ll get the full quote form.
            If not, you can join the waitlist. Prefer email? Reach the team at{' '}
            <a href="mailto:support@washlee.com.au?subject=Business%20Laundry%20enquiry" className="text-primary-deep font-semibold hover:underline inline-flex items-center gap-1">
              <Mail size={13} /> support@washlee.com.au
            </a>.
          </p>
        </div>
      )}
    </div>
  )
}
