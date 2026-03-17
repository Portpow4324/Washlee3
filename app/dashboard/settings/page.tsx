'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AlertCircle, CheckCircle, Settings, Lock, Bell, MapPin, FileText, Shield } from 'lucide-react'

interface CustomerSettings {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
}

export default function CustomerSettings() {
  const { user, userData } = useAuth()
  const [settings, setSettings] = useState<CustomerSettings>({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: user?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [tab, setTab] = useState<'profile' | 'notifications' | 'legal'>('profile')

  useEffect(() => {
    if (!user) return

    const fetchSettings = async () => {
      try {
        setLoading(true)
        const userRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(userRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSettings(prev => ({
            ...prev,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            phone: data.phone || prev.phone,
            address: data.address || prev.address,
            acceptNotifications: data.acceptNotifications !== false,
            acceptPromotions: data.acceptPromotions !== false,
          }))
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [user])

  const handleSaveSettings = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        firstName: settings.firstName,
        lastName: settings.lastName,
        phone: settings.phone,
        address: settings.address,
      })
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof CustomerSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-dark">Settings</h1>
            <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-dark mb-2">Account Settings</h1>
            <p className="text-gray">Manage your profile and preferences</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'profile', label: 'Profile', icon: Settings },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'legal', label: 'Legal', icon: FileText }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-4 py-3 font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  tab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray hover:text-dark'
                }`}
              >
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <Card className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">First Name</label>
                    <input
                      type="text"
                      value={settings.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      placeholder="First name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">Last Name</label>
                    <input
                      type="text"
                      value={settings.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray cursor-not-allowed"
                  />
                  <p className="text-xs text-gray mt-2">Email cannot be changed here. Contact support to change email.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                    placeholder="Your delivery address"
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </Card>
            )}

            {/* Notifications Tab */}
            {tab === 'notifications' && (
              <Card className="p-6 space-y-6">
                <div className="space-y-4">
                  <p className="text-gray">Notification preferences are currently managed through your email account. Check your email settings for order updates and promotional notifications.</p>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-900 mb-2">Email Notifications</p>
                    <p className="text-sm text-blue-800">
                      We'll send you important updates about your orders to {settings.email}. To manage email preferences, check your email account settings or contact our support team.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Legal Tab */}
            {tab === 'legal' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <FileText size={24} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-dark mb-1">Legal Documents</h3>
                      <p className="text-sm text-gray">Review our terms, policies, and other legal information</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-primary/5 transition"
                    >
                      <div>
                        <p className="font-semibold text-dark">Terms of Service</p>
                        <p className="text-sm text-gray mt-1">Conditions and rules for using Washlee</p>
                      </div>
                      <span className="text-primary">→</span>
                    </a>

                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-primary/5 transition"
                    >
                      <div>
                        <p className="font-semibold text-dark">Privacy Policy</p>
                        <p className="text-sm text-gray mt-1">How we collect and protect your data</p>
                      </div>
                      <span className="text-primary">→</span>
                    </a>

                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-primary/5 transition"
                    >
                      <div>
                        <p className="font-semibold text-dark">Cookie Policy</p>
                        <p className="text-sm text-gray mt-1">Information about cookies we use</p>
                      </div>
                      <span className="text-primary">→</span>
                    </a>

                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-primary/5 transition"
                    >
                      <div>
                        <p className="font-semibold text-dark">Accessibility</p>
                        <p className="text-sm text-gray mt-1">Our commitment to accessibility</p>
                      </div>
                      <span className="text-primary">→</span>
                    </a>

                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-primary/5 transition"
                    >
                      <div>
                        <p className="font-semibold text-dark">Liability Waiver</p>
                        <p className="text-sm text-gray mt-1">Service disclaimers and limitations</p>
                      </div>
                      <span className="text-primary">→</span>
                    </a>
                  </div>
                </Card>

                <Card className="p-6 bg-blue-50 border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <Shield size={20} className="text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-blue-900 mb-2">Your Privacy Matters</p>
                      <p className="text-sm text-blue-800">
                        We take your privacy and data security seriously. All personal information is encrypted and protected according to industry standards. For questions about your data, please contact our privacy team.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Security Section */}
          <Card className="p-6 border-2 border-primary/30">
            <div className="flex items-start gap-4">
              <Lock size={24} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-dark mb-2">Password & Security</h3>
                <p className="text-sm text-gray mb-4">
                  Manage your password and two-factor authentication settings
                </p>
                <button className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition">
                  Change Password
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
