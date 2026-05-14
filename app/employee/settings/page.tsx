'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'
import { supabase } from '@/lib/supabaseClient'
import {
  Settings,
  User,
  Bell,
  FileText,
  MapPin,
  Clock,
  CheckCircle,
  Upload,
  AlertCircle,
  Mail,
  Loader2,
} from 'lucide-react'

interface AvailabilityData {
  [day: string]: {
    available: boolean
    start: string
    end: string
  }
}

type EmployeeProfileData = {
  first_name?: string
  last_name?: string
  name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
  latitude?: number | null
  longitude?: number | null
  service_areas?: Array<{
    address?: string
    suburb?: string
    state?: string
    postcode?: string
    lat?: number | null
    lng?: number | null
    radiusKm?: number
  }>
}

type AddressPrediction = {
  placeId: string
  main_text?: string
  secondary_text?: string
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

async function getSupabaseAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

const loadAvailability = async (
  userId: string,
  setAvailabilityData: Dispatch<SetStateAction<AvailabilityData>>,
  setServiceRadiusKm: (value: number) => void
) => {
  try {
    const response = await fetch(`/api/employee/availability?employeeId=${userId}`, {
      headers: await getSupabaseAuthHeaders(),
    })
    const result = await response.json()
    if (result.data) {
      setAvailabilityData(result.data)
    }
    if (result.serviceRadiusKm) {
      setServiceRadiusKm(result.serviceRadiusKm)
    }
  } catch (error) {
    console.error('Error loading availability:', error)
  }
}

const loadEmployeeProfile = async (
  userId: string,
  setFormData: Dispatch<
    SetStateAction<{
      firstName: string
      lastName: string
      email: string
      phone: string
      address: string
      city: string
      state: string
      postcode: string
      latitude: number | null
      longitude: number | null
    }>
  >,
  setServiceRadiusKm: (value: number) => void
) => {
  try {
    const response = await fetch(`/api/employee/profile?employeeId=${userId}`)
    const result = await response.json()
    const profile = result.data as EmployeeProfileData | null
    if (!profile) return

    const serviceArea = Array.isArray(profile.service_areas) ? profile.service_areas[0] : null
    const [fallbackFirstName, ...fallbackLastName] = (profile.name || '').split(' ')

    setFormData((prev) => ({
      ...prev,
      firstName: profile.first_name || fallbackFirstName || prev.firstName,
      lastName: profile.last_name || fallbackLastName.join(' ') || prev.lastName,
      phone: profile.phone || prev.phone,
      address: profile.address || serviceArea?.address || prev.address,
      city: profile.city || serviceArea?.suburb || prev.city,
      state: profile.state || serviceArea?.state || prev.state,
      postcode: profile.postcode || serviceArea?.postcode || prev.postcode,
      latitude: profile.latitude ?? serviceArea?.lat ?? prev.latitude,
      longitude: profile.longitude ?? serviceArea?.lng ?? prev.longitude,
    }))

    if (serviceArea?.radiusKm) {
      setServiceRadiusKm(serviceArea.radiusKm)
    }
  } catch (error) {
    console.error('Error loading employee profile:', error)
  }
}

export default function EmployeeSettingsPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'availability' | 'documents' | 'notifications'>('profile')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [addressPredictions, setAddressPredictions] = useState<AddressPrediction[]>([])
  const [showAddressPredictions, setShowAddressPredictions] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [availability, setAvailabilityData] = useState<AvailabilityData>({
    monday: { available: true, start: '09:00', end: '17:00' },
    tuesday: { available: true, start: '09:00', end: '17:00' },
    wednesday: { available: true, start: '09:00', end: '17:00' },
    thursday: { available: true, start: '09:00', end: '17:00' },
    friday: { available: true, start: '09:00', end: '17:00' },
    saturday: { available: true, start: '10:00', end: '14:00' },
    sunday: { available: false, start: '00:00', end: '00:00' },
  })
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    new_jobs: true,
    order_reminders: true,
    earnings_payouts: true,
    customer_messages: true,
    marketing: false,
  })
  const [notifLoading, setNotifLoading] = useState(true)
  const [savingNotif, setSavingNotif] = useState<string | null>(null)
  const [notifBackendReady, setNotifBackendReady] = useState<boolean | null>(null)
  const [notifError, setNotifError] = useState<string | null>(null)

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return

    setHasCheckedAuth(true)

    if (!user) {
      router.push('/auth/employee-signin')
      return
    }

    if (userData) {
      setFormData({
        firstName: userData.name?.split(' ')[0] || '',
        lastName: userData.name?.split(' ')[1] || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: '',
        city: '',
        state: 'state' in userData ? String(userData.state || '') : '',
        postcode: '',
        latitude: null,
        longitude: null,
      })

      loadAvailability(user.id, setAvailabilityData, setServiceRadiusKm)
      loadEmployeeProfile(user.id, setFormData, setServiceRadiusKm)
    }
  }, [user, loading, userData, hasCheckedAuth, router])

  // Load notification preferences from /api/notifications/preferences.
  useEffect(() => {
    if (!user?.id) return

    const loadPrefs = async () => {
      try {
        setNotifLoading(true)
        setNotifError(null)
        const response = await fetch(
          `/api/notifications/preferences?userId=${encodeURIComponent(user.id)}`,
          {
            cache: 'no-store',
            headers: await getSupabaseAuthHeaders(),
          }
        )
        if (response.status === 503) {
          setNotifBackendReady(false)
          return
        }
        if (!response.ok) {
          throw new Error('Could not load notification preferences')
        }
        const data = await response.json()
        if (data?.preferences && typeof data.preferences === 'object') {
          setNotifPrefs((prev) => ({ ...prev, ...data.preferences }))
        }
        setNotifBackendReady(!data?.warning)
        if (data?.warning) setNotifError(String(data.warning))
      } catch (err) {
        setNotifError(err instanceof Error ? err.message : 'Could not load preferences')
        setNotifBackendReady(false)
      } finally {
        setNotifLoading(false)
      }
    }

    loadPrefs()
  }, [user?.id])

  const toggleNotifPref = async (key: string, nextValue: boolean) => {
    if (!user?.id) return
    setSavingNotif(key)
    setNotifError(null)
    setNotifPrefs((prev) => ({ ...prev, [key]: nextValue }))

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(await getSupabaseAuthHeaders()),
        },
        body: JSON.stringify({
          userId: user.id,
          preferences: { ...notifPrefs, [key]: nextValue },
        }),
      })
      if (response.status === 503) {
        setNotifBackendReady(false)
        setNotifError(
          'Notification preferences need the latest Supabase migration before they can persist. Your toggle is local-only for now.'
        )
        return
      }
      if (!response.ok) {
        throw new Error('Could not save preference')
      }
      setNotifBackendReady(true)
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : 'Could not save preference')
      setNotifPrefs((prev) => ({ ...prev, [key]: !nextValue }))
    } finally {
      setSavingNotif(null)
    }
  }

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-soft-mint flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading settings…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvailabilityChange = (day: string, field: string, value: boolean | string) => {
    setAvailabilityData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof AvailabilityData],
        [field]: value,
      },
    }))
  }

  const fetchAddressPredictions = async (input: string) => {
    if (!input || input.length < 3) {
      setAddressPredictions([])
      setShowAddressPredictions(false)
      return
    }

    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          componentRestrictions: { country: 'au' },
        }),
      })
      if (!response.ok) throw new Error('Failed to fetch address predictions')
      const data = await response.json()
      setAddressPredictions(data.predictions || [])
      setShowAddressPredictions((data.predictions || []).length > 0)
    } catch (error) {
      console.error('Error fetching address predictions:', error)
      setAddressPredictions([])
      setShowAddressPredictions(false)
    }
  }

  const selectServiceAddress = async (prediction: AddressPrediction) => {
    try {
      setAddressError('')
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: prediction.placeId }),
      })
      if (!response.ok) throw new Error('Failed to validate address')
      const data = await response.json()
      const addressParts = data.addressParts

      if (addressParts?.country?.toLowerCase() !== 'australia') {
        setAddressError('Please select an Australian service address.')
        return
      }

      setFormData((prev) => ({
        ...prev,
        address: addressParts.formattedAddress || '',
        city: addressParts.suburb || '',
        state: addressParts.state || prev.state,
        postcode: addressParts.postcode || '',
        latitude: addressParts.latitude ?? null,
        longitude: addressParts.longitude ?? null,
      }))
      setShowAddressPredictions(false)
      setAddressPredictions([])
    } catch (error) {
      console.error('Error selecting service address:', error)
      setAddressError('Failed to validate address. Please try again.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSavingProfile(true)
      const profileResponse = await fetch('/api/employee/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(await getSupabaseAuthHeaders()),
        },
        body: JSON.stringify({
          employeeId: user?.id,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          country: 'Australia',
          latitude: formData.latitude,
          longitude: formData.longitude,
          serviceRadiusKm,
        }),
      })

      const response = await fetch('/api/employee/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(await getSupabaseAuthHeaders()),
        },
        body: JSON.stringify({
          employeeId: user?.id,
          availability,
          serviceRadiusKm,
        }),
      })

      if (response.ok && profileResponse.ok) {
        setToastMessage('Settings saved.')
        setToastType('success')
      } else {
        setToastMessage('Could not save settings.')
        setToastType('error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setToastMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setToastType('error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSavingAvailability(true)
      const response = await fetch('/api/employee/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(await getSupabaseAuthHeaders()),
        },
        body: JSON.stringify({
          employeeId: user?.id,
          availability,
          serviceRadiusKm,
        }),
      })

      if (response.ok) {
        setToastMessage('Availability saved.')
        setToastType('success')
      } else {
        setToastMessage('Could not save availability.')
        setToastType('error')
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      setToastMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setToastType('error')
    } finally {
      setIsSavingAvailability(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const

  return (
    <div className="min-h-screen bg-soft-mint flex flex-col">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}

      <main className="flex-1 container-page py-10 space-y-6">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark inline-flex items-center gap-2">
            <Settings size={28} className="text-primary-deep" />
            Settings
          </h1>
          <p className="text-gray text-sm mt-1">
            Update your profile, availability, documents, and notification preferences.
          </p>
        </header>

        {/* Tabs */}
        <div role="tablist" className="surface-card p-1 inline-flex flex-wrap gap-1 max-w-full overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                  active
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-gray hover:bg-mint hover:text-primary-deep'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="surface-card p-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">
                    {formData.firstName.charAt(0)}
                    {formData.lastName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-dark">Profile picture</h3>
                  <p className="text-sm text-gray mb-3">
                    Upload a clear, friendly photo for your customer-facing profile.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-line text-dark hover:border-primary hover:text-primary-deep transition"
                  >
                    <Upload size={14} />
                    Upload photo
                  </button>
                </div>
              </div>
            </div>

            <div className="surface-card p-6 space-y-5">
              <h3 className="font-bold text-dark">Personal information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="label-field">First name</label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="label-field">Last name</label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="label-field">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="input-field bg-light text-gray cursor-not-allowed"
                />
                <p className="text-xs text-gray-soft mt-1.5">
                  Email is the login for your account. Contact{' '}
                  <a href="mailto:pros@washlee.com.au" className="text-primary-deep font-semibold hover:underline">
                    pros@washlee.com.au
                  </a>{' '}
                  to change it.
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="label-field">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="04xx xxx xxx"
                  className="input-field"
                />
              </div>
            </div>

            <div className="surface-card p-6 space-y-5">
              <h3 className="font-bold text-dark flex items-center gap-2">
                <MapPin size={18} className="text-primary-deep" />
                Service address
              </h3>

              <div>
                <label htmlFor="address" className="label-field">Street address</label>
                <div className="relative">
                  <input
                    id="address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={(e) => {
                      handleInputChange(e)
                      setFormData((prev) => ({ ...prev, latitude: null, longitude: null }))
                      fetchAddressPredictions(e.target.value)
                    }}
                    placeholder="Start typing your suburb…"
                    className="input-field"
                  />
                  {showAddressPredictions && addressPredictions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-line rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                      {addressPredictions.map((prediction, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectServiceAddress(prediction)}
                          className="w-full text-left px-4 py-3 hover:bg-mint/40 border-b border-line last:border-b-0 transition"
                        >
                          <p className="font-semibold text-dark text-sm">{prediction.main_text}</p>
                          <p className="text-xs text-gray">{prediction.secondary_text}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {addressError && <p className="text-red-600 text-sm mt-2">{addressError}</p>}
                {formData.latitude && formData.longitude && (
                  <p className="text-primary-deep text-xs font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle size={12} /> Service address verified for radius matching.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="label-field">Suburb</label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="label-field">State</label>
                  <input
                    id="state"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="VIC"
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="postcode" className="label-field">Postcode</label>
                  <input
                    id="postcode"
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    placeholder="3000"
                    inputMode="numeric"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="btn-primary flex-1 sm:flex-initial disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} />
                {isSavingProfile ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="btn-outline flex-1 sm:flex-initial"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Availability */}
        {activeTab === 'availability' && (
          <form onSubmit={handleSaveAvailability} className="surface-card p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-bold text-dark flex items-center gap-2">
                <Clock size={18} className="text-primary-deep" />
                Working hours
              </h3>
              <p className="text-sm text-gray mt-1">
                Choose the days and time windows you want to receive jobs in.
              </p>
            </div>

            <div className="space-y-3">
              {DAYS.map((dayKey) => {
                const dayDisplay = dayKey.charAt(0).toUpperCase() + dayKey.slice(1)
                const dayData = availability[dayKey]
                return (
                  <div
                    key={dayKey}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-mint/40 border border-primary/10"
                  >
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-primary"
                          checked={dayData.available}
                          onChange={(e) =>
                            handleAvailabilityChange(dayKey, 'available', e.target.checked)
                          }
                        />
                        <span className="font-semibold text-dark">{dayDisplay}</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={dayData.start}
                        onChange={(e) => handleAvailabilityChange(dayKey, 'start', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-line text-dark text-sm rounded-lg focus:border-primary focus:outline-none transition"
                        disabled={!dayData.available}
                      />
                      <span className="text-gray text-sm">to</span>
                      <input
                        type="time"
                        value={dayData.end}
                        onChange={(e) => handleAvailabilityChange(dayKey, 'end', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-line text-dark text-sm rounded-lg focus:border-primary focus:outline-none transition"
                        disabled={!dayData.available}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-line pt-5">
              <h4 className="font-semibold text-dark mb-1">Service radius</h4>
              <p className="text-sm text-gray mb-3">
                How far you&rsquo;ll travel from your service address for pickups.
              </p>
              <input
                type="range"
                min={1}
                max={50}
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                className="w-full h-2 bg-line rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-sm text-gray mt-2">
                <span>1 km</span>
                <span className="text-primary-deep font-bold">{serviceRadiusKm} km</span>
                <span>50 km</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingAvailability}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingAvailability ? 'Saving…' : 'Save availability'}
            </button>
          </form>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="surface-card p-6 sm:p-8 space-y-5">
            <h3 className="font-bold text-dark flex items-center gap-2">
              <FileText size={18} className="text-primary-deep" />
              Required documents
            </h3>

            <div className="rounded-2xl bg-mint/40 border border-primary/15 p-5">
              <div className="flex gap-3">
                <AlertCircle size={18} className="text-primary-deep flex-shrink-0 mt-0.5" />
                <div className="text-sm text-dark space-y-2">
                  <p>
                    Document verification (ID, ABN, national police check) happens during onboarding and is managed by our Pro team.
                  </p>
                  <p className="text-gray">
                    Need to upload an updated document or ask about your verification status? Email{' '}
                    <a
                      href="mailto:pros@washlee.com.au"
                      className="text-primary-deep font-semibold hover:underline"
                    >
                      pros@washlee.com.au
                    </a>{' '}
                    and we&rsquo;ll take care of it.
                  </p>
                </div>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-dark">
              {[
                'Identity verification (driver licence or passport)',
                'National police check',
                'Active Australian Business Number (ABN)',
                'Public liability / vehicle insurance details',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a
              href="mailto:pros@washlee.com.au?subject=Document%20update"
              className="btn-outline inline-flex"
            >
              <Mail size={14} />
              Contact Pro support
            </a>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="surface-card p-6 sm:p-8 space-y-5">
            <h3 className="font-bold text-dark flex items-center gap-2">
              <Bell size={18} className="text-primary-deep" />
              Notification preferences
            </h3>
            <p className="text-sm text-gray">
              Choose which categories you want to hear about. Toggles save as soon as you flip them.
            </p>

            {notifBackendReady === false && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Database migration needed</p>
                  <p>
                    The <code className="px-1 py-0.5 bg-white rounded font-mono">/api/notifications/preferences</code> endpoint needs the latest Supabase migration before it can persist.
                    Toggles below stay local until the database table is available.
                  </p>
                </div>
              </div>
            )}

            {notifError && notifBackendReady !== false && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 flex gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{notifError}</span>
              </div>
            )}

            {notifLoading ? (
              <div className="rounded-xl bg-mint/40 border border-primary/10 p-5 text-sm text-gray flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Loading your preferences…
              </div>
            ) : (
              <ul className="space-y-3">
                {[
                  {
                    key: 'new_jobs',
                    name: 'New jobs available',
                    description: 'Get a ping when matching jobs are posted in your area.',
                  },
                  {
                    key: 'order_reminders',
                    name: 'Order reminders',
                    description: 'Pickup and delivery reminders for orders you&rsquo;ve accepted.',
                  },
                  {
                    key: 'earnings_payouts',
                    name: 'Earnings &amp; payouts',
                    description: 'Weekly payout confirmations and earnings updates.',
                  },
                  {
                    key: 'customer_messages',
                    name: 'Customer messages',
                    description: 'Replies in active order threads from customers.',
                  },
                  {
                    key: 'marketing',
                    name: 'Marketing',
                    description: 'Occasional updates about new Pro features. Off by default.',
                  },
                ].map((notif) => {
                  const isOn = !!notifPrefs[notif.key]
                  const saving = savingNotif === notif.key
                  return (
                    <li
                      key={notif.key}
                      className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-mint/40 border border-primary/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-dark"
                          dangerouslySetInnerHTML={{ __html: notif.name }}
                        />
                        <p
                          className="text-sm text-gray"
                          dangerouslySetInnerHTML={{ __html: notif.description }}
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {saving && <Loader2 size={14} className="animate-spin text-primary-deep" />}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isOn}
                            onChange={(e) => toggleNotifPref(notif.key, e.target.checked)}
                            disabled={saving}
                            aria-label={`Toggle ${notif.name}`}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-line rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-60" />
                        </label>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <p className="text-xs text-gray-soft">
              Marketing is off by default. You can turn other categories off any time — order-critical messages still send.
            </p>
          </div>
        )}

        {/* Danger zone */}
        <div className="surface-card p-6 border-red-200 bg-red-50">
          <h3 className="font-bold text-red-900 mb-1">Danger zone</h3>
          <p className="text-sm text-red-800 mb-4">
            Deactivating your Pro account stops new jobs from reaching you. Existing accepted orders still need to be completed. Contact Pro support to reactivate.
          </p>
          <a
            href="mailto:pros@washlee.com.au?subject=Account%20deactivation%20request"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-red-700 border border-red-200 hover:bg-red-100 transition"
          >
            Request deactivation
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
