'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import EmployeeHeader from '@/components/EmployeeHeader'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Settings, User, Lock, Bell, FileText, MapPin, Clock, CheckCircle, Upload } from 'lucide-react'

export default function EmployeeSettings() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: ''
  })

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
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        postcode: userData.postcode || ''
      })
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Saving settings:', formData)
    // Mock save
    alert('Settings saved successfully!')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <EmployeeHeader />
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
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-light border border-gray-200 text-dark rounded-lg placeholder-gray-400 focus:outline-none focus:border-primary transition"
                />
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
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 space-y-6">
              <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                <Clock size={20} className="text-primary" />
                Work Hours & Availability
              </h3>

              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <div key={day} className="flex items-center justify-between p-4 bg-light rounded-lg border border-gray-200">
                    <p className="font-semibold text-dark">{day}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-gray hover:text-dark transition cursor-pointer">
                          <input type="checkbox" className="w-4 h-4" defaultChecked />
                          <span className="text-sm">Available</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <input type="time" defaultValue="09:00" className="px-3 py-1.5 bg-white border border-gray-200 text-dark text-sm rounded" />
                        <span className="text-gray">to</span>
                        <input type="time" defaultValue="17:00" className="px-3 py-1.5 bg-white border border-gray-200 text-dark text-sm rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-3">
                <h4 className="font-semibold text-dark">Service Radius</h4>
                <div className="space-y-2">
                  <p className="text-gray text-sm">How far are you willing to travel for orders? (in km)</p>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    defaultValue="15"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray">
                    <span>1 km</span>
                    <span className="text-primary font-semibold">15 km</span>
                    <span>50 km</span>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-accent mt-4" size="lg">
                Save Availability
              </Button>
            </Card>
          </div>
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
