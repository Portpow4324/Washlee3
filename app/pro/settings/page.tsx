'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { AlertCircle, CheckCircle, Settings, Lock, Bell, MapPin } from 'lucide-react'

interface ProSettings {
  serviceName?: string
  bio?: string
  location?: string
  phoneNumber?: string
  bankAccount?: string
  acceptNotifications?: boolean
  autoAccept?: boolean
  maxDistance?: number
}

export default function ProSettings() {
  const { user, userData } = useAuth()
  const [settings, setSettings] = useState<ProSettings>({
    serviceName: userData?.firstName || '',
    bio: 'Professional laundry service',
    location: 'Downtown',
    phoneNumber: '+1 (555) 123-4567',
    bankAccount: '****1234',
    acceptNotifications: true,
    autoAccept: false,
    maxDistance: 10
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [tab, setTab] = useState<'profile' | 'notifications' | 'services'>('profile')

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
            serviceName: data.firstName || prev.serviceName,
            bio: data.bio || prev.bio,
            location: data.location || prev.location,
            phoneNumber: data.phoneNumber || prev.phoneNumber,
            acceptNotifications: data.acceptNotifications !== false,
            autoAccept: data.autoAccept || false,
            maxDistance: data.maxDistance || 10
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
        firstName: settings.serviceName,
        bio: settings.bio,
        location: settings.location,
        phoneNumber: settings.phoneNumber,
        acceptNotifications: settings.acceptNotifications,
        autoAccept: settings.autoAccept,
        maxDistance: settings.maxDistance
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

  const handleInputChange = (field: keyof ProSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-dark">Settings</h1>
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark mb-2">Pro Settings</h1>
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
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'profile', label: 'Profile', icon: Settings },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'services', label: 'Service Preferences', icon: MapPin }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-3 font-semibold flex items-center gap-2 border-b-2 transition ${
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
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Service Name</label>
              <input
                type="text"
                value={settings.serviceName}
                onChange={(e) => handleInputChange('serviceName', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                placeholder="Your service name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Bio</label>
              <textarea
                value={settings.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none h-24 resize-none"
                placeholder="Tell customers about your service"
              />
              <p className="text-xs text-gray mt-2">{settings.bio?.length || 0}/200 characters</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Location</label>
              <input
                type="text"
                value={settings.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                placeholder="City or neighborhood"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-dark mb-2">Phone Number</label>
              <input
                type="tel"
                value={settings.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </Card>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-semibold text-dark">New Order Notifications</p>
                  <p className="text-sm text-gray mt-1">Get notified when new orders are available</p>
                </div>
                <button
                  onClick={() => handleInputChange('acceptNotifications', !settings.acceptNotifications)}
                  className={`w-12 h-7 rounded-full transition ${
                    settings.acceptNotifications ? 'bg-primary' : 'bg-gray-300'
                  } flex items-center ${settings.acceptNotifications ? 'justify-end' : 'justify-start'} p-1`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-semibold text-dark">Order Status Updates</p>
                  <p className="text-sm text-gray mt-1">Get notified about customer order status</p>
                </div>
                <button
                  onClick={() => handleInputChange('autoAccept', !settings.autoAccept)}
                  className={`w-12 h-7 rounded-full transition ${
                    settings.autoAccept ? 'bg-primary' : 'bg-gray-300'
                  } flex items-center ${settings.autoAccept ? 'justify-end' : 'justify-start'} p-1`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Card>
        )}

        {/* Service Preferences Tab */}
        {tab === 'services' && (
          <Card className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Max Service Distance</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={settings.maxDistance}
                  onChange={(e) => handleInputChange('maxDistance', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-primary w-16">{settings.maxDistance} mi</span>
              </div>
              <p className="text-sm text-gray mt-2">Only accept jobs within this distance</p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Service Area Tip</p>
              <p className="text-sm text-blue-800">
                Setting a smaller service area helps you complete orders faster and earn more per order. 
                Currently, you'll receive orders within {settings.maxDistance} miles of your location.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Card>
        )}
      </div>

      {/* Account Security Section */}
      <Card className="p-6 border-2 border-primary/30">
        <div className="flex items-start gap-4">
          <Lock size={24} className="text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-dark mb-2">Password & Security</h3>
            <p className="text-sm text-gray mb-4">
              Manage your password and security settings
            </p>
            <button className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition">
              Change Password
            </button>
          </div>
        </div>
      </Card>

      {/* Bank Account Section */}
      <Card className="p-6 border-2 border-accent/30">
        <h3 className="font-bold text-dark mb-4">Payment Method</h3>
        <div className="p-4 bg-light rounded-lg mb-4">
          <p className="text-sm text-gray mb-1">Connected Bank Account</p>
          <p className="font-semibold text-dark">{settings.bankAccount}</p>
        </div>
        <button className="px-4 py-2 border-2 border-accent text-accent rounded-lg font-semibold hover:bg-accent/10 transition">
          Update Payment Method
        </button>
      </Card>

      {/* Legal Section */}
      <Card className="p-6 border-2 border-gray-300">
        <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
          <Lock size={20} className="text-gray" />
          Legal & Compliance
        </h3>
        <p className="text-sm text-gray mb-6">
          Review our legal documents and policies to understand your rights and responsibilities as a Washlee Pro partner.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Terms of Service', description: 'Legal terms and conditions', href: '/terms-of-service' },
            { title: 'Privacy Policy', description: 'How we protect your data', href: '/privacy-policy' },
            { title: 'Pro Agreement', description: 'Washlee Pro partner agreement', href: '/pro-agreement' },
            { title: 'Cancellation Policy', description: 'Service cancellation terms', href: '/cancellation-policy' },
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border border-gray-200 rounded-lg hover:bg-light hover:border-primary transition"
            >
              <p className="font-semibold text-dark mb-1">{item.title}</p>
              <p className="text-xs text-gray">{item.description}</p>
            </a>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray">
            <span className="font-semibold">Last Updated:</span> March 12, 2026
          </p>
          <p className="text-xs text-gray mt-2">
            By using Washlee Pro, you agree to our terms and policies. Questions? Contact us at legal@washlee.com
          </p>
        </div>
      </Card>
    </div>
  )
}
