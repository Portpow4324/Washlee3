'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Toast from '@/components/Toast'
import { Settings, User, Bell, FileText, MapPin, Clock, CheckCircle, Upload } from 'lucide-react'

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

const loadAvailability = async (
  userId: string,
  setAvailabilityData: Dispatch<SetStateAction<AvailabilityData>>,
  setServiceRadiusKm: (value: number) => void
) => {
  try {
    const response = await fetch(`/api/employee/availability?employeeId=${userId}`)
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
  setFormData: Dispatch<SetStateAction<{
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
  }>>,
  setServiceRadiusKm: (value: number) => void
) => {
  try {
    const response = await fetch(`/api/employee/profile?employeeId=${userId}`)
    const result = await response.json()
    const profile = result.data as EmployeeProfileData | null
    if (!profile) return

    const serviceArea = Array.isArray(profile.service_areas) ? profile.service_areas[0] : null
    const [fallbackFirstName, ...fallbackLastName] = (profile.name || '').split(' ')

    setFormData(prev => ({
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

export default function EmployeeSettings() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
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
    sunday: { available: false, start: '00:00', end: '00:00' }
  })
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15)

  useEffect(() => {
    if (hasCheckedAuth) return
    if (loading === true) return
    
    setHasCheckedAuth(true)
    
    if (!user) {
      router.push('/auth/employee-signin')
      return
    }

    // Pre-fill form with user data
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

      // Load availability
      loadAvailability(user.id, setAvailabilityData, setServiceRadiusKm)
      loadEmployeeProfile(user.id, setFormData, setServiceRadiusKm)
    }
  }, [user, loading, userData, hasCheckedAuth, router])

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-dark font-semibold">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvailabilityChange = (day: string, field: string, value: boolean | string) => {
    setAvailabilityData(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof AvailabilityData],
        [field]: value
      }
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

      setFormData(prev => ({
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
      const profileResponse = await fetch('/api/employee/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
        })
      })

      const response = await fetch('/api/employee/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user?.id,
          availability: availability,
          serviceRadiusKm,
        })
      })
      
      if (response.ok && profileResponse.ok) {
        setToastMessage('Settings saved successfully!')
        setToastType('success')
      } else {
        setToastMessage('Failed to save settings')
        setToastType('error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setToastMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setToastType('error')
    }
  }

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/employee/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user?.id,
          availability: availability,
          serviceRadiusKm,
        })
      })
      
      if (response.ok) {
        setToastMessage('Availability saved successfully!')
        setToastType('success')
      } else {
        setToastMessage('Failed to save availability')
        setToastType('error')
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      setToastMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setToastType('error')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-light flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-dark flex items-center gap-3">
            <Settings size={36} className="text-primary" />
            Settings
          </h1>
        <p className="text-gray text-lg">Manage your profile, availability, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-gray border-transparent hover:text-dark'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Profile Picture */}
            <Card className="bg-white border border-gray-200">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-bold text-white">
                    {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-lg font-bold text-dark">Profile Picture</h3>
                  <p className="text-gray text-sm">Upload a professional photo for your customer-facing profile</p>
                  <Button className="gap-2 bg-gradient-to-r from-primary to-accent" size="sm">
                    <Upload size={16} />
                    Upload Photo
                  </Button>
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card className="bg-white border border-gray-200 space-y-6">
              <h3 className="text-lg font-bold text-dark">Personal Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-dark font-semibold text-sm mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-light border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-dark font-semibold text-sm mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-light border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-dark font-semibold text-sm mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-light border border-gray-200 text-gray rounded-lg opacity-50 cursor-not-allowed"
                />
                <p className="text-gray text-xs mt-2">Email cannot be changed. Contact support for changes.</p>
              </div>

              <div>
                <label className="block text-dark font-semibold text-sm mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-light border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
                />
              </div>
            </Card>

            {/* Address Information */}
            <Card className="bg-white border border-gray-200 space-y-6">
              <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                Service Address
              </h3>
              
              <div>
                <label className="block text-dark font-semibold text-sm mb-2">Street Address</label>
                <div className="relative">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={(e) => {
                      handleInputChange(e)
                      setFormData(prev => ({ ...prev, latitude: null, longitude: null }))
                      fetchAddressPredictions(e.target.value)
                    }}
                    className="w-full px-4 py-2.5 bg-light border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                  {showAddressPredictions && addressPredictions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      {addressPredictions.map((prediction, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectServiceAddress(prediction)}
                          className="w-full text-left px-4 py-3 hover:bg-light border-b border-gray-100 last:border-b-0 transition"
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
                  <p className="text-primary text-sm mt-2">Service address verified for radius matching.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-dark font-semibold text-sm mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-light border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-dark font-semibold text-sm mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-light border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-dark font-semibold text-sm mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-light border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex gap-3">
              <Button className="bg-gradient-to-r from-primary to-accent" size="lg">
                <CheckCircle size={20} />
                Save Changes
              </Button>
              <Button variant="outline" size="lg">
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <form onSubmit={handleSaveAvailability} className="space-y-6">
            <Card className="bg-white border border-gray-200 space-y-6">
              <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                <Clock size={20} className="text-primary" />
                Work Hours & Availability
              </h3>

              <div className="space-y-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(dayKey => {
                  const dayDisplay = dayKey.charAt(0).toUpperCase() + dayKey.slice(1)
                  const dayData = availability[dayKey as keyof AvailabilityData]
                  
                  return (
                    <div key={dayKey} className="flex items-center justify-between p-4 bg-light rounded-lg border border-gray-200">
                      <p className="font-semibold text-dark">{dayDisplay}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-gray hover:text-dark transition cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4" 
                              checked={dayData.available}
                              onChange={(e) => handleAvailabilityChange(dayKey, 'available', e.target.checked)}
                            />
                            <span className="text-sm">Available</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="time" 
                            value={dayData.start}
                            onChange={(e) => handleAvailabilityChange(dayKey, 'start', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-gray-200 text-dark text-sm rounded" 
                            disabled={!dayData.available}
                          />
                          <span className="text-gray">to</span>
                          <input 
                            type="time" 
                            value={dayData.end}
                            onChange={(e) => handleAvailabilityChange(dayKey, 'end', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-gray-200 text-dark text-sm rounded"
                            disabled={!dayData.available}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-3">
                <h4 className="font-semibold text-dark">Service Radius</h4>
                <div className="space-y-2">
                  <p className="text-gray text-sm">How far are you willing to travel for orders? (in km)</p>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={serviceRadiusKm}
                    onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray">
                    <span>1 km</span>
                    <span className="text-primary font-semibold">{serviceRadiusKm} km</span>
                    <span>50 km</span>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent mt-4" size="lg">
                Save Availability
              </Button>
            </Card>
          </form>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 space-y-6">
              <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Required Documents
              </h3>

              <div className="space-y-4">
                {[
                  { name: 'Background Check', status: 'verified', date: 'Jan 15, 2026' },
                  { name: 'ID Verification', status: 'verified', date: 'Jan 15, 2026' },
                  { name: 'Insurance Certificate', status: 'pending', date: 'Awaiting upload' },
                  { name: 'Tax Document (W9)', status: 'verified', date: 'Jan 10, 2026' }
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-4 bg-light rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-dark">{doc.name}</p>
                      <p className="text-gray text-sm">{doc.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {doc.status === 'verified' ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded border border-green-500/30 flex items-center gap-1">
                          <CheckCircle size={14} />
                          Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded border border-yellow-500/30">
                          Pending
                        </span>
                      )}
                      {doc.status === 'pending' && (
                        <Button variant="outline" size="sm">
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 space-y-6">
              <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                <Bell size={20} className="text-primary" />
                Notification Preferences
              </h3>

              <div className="space-y-4">
                {[
                  { name: 'New Jobs Available', description: 'Get notified when matching jobs are posted' },
                  { name: 'Order Reminders', description: 'Pickup and delivery reminders' },
                  { name: 'Payment Updates', description: 'Earnings and payout notifications' },
                  { name: 'Messages', description: 'Customer messages and support' },
                  { name: 'Marketing', description: 'Promotions and special offers' }
                ].map((notif) => (
                  <div key={notif.name} className="flex items-center justify-between p-4 bg-light rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-dark">{notif.name}</p>
                      <p className="text-gray text-sm">{notif.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-accent mt-4" size="lg">
                Save Preferences
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <Card className="bg-gradient-to-br from-red-900/30 to-red-900/20 border-red-500/40 space-y-4">
        <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
        <p className="text-gray text-sm">
          These actions cannot be undone. Please be careful.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="text-red-400 hover:bg-red-500/20 hover:border-red-500/50" size="lg">
            Deactivate Account
          </Button>
        </div>
      </Card>
      </main>
      <Footer />
    </div>
  )
}
