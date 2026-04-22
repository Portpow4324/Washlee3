'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Button from '@/components/Button'
import Link from 'next/link'
import { Bell, Lock, Eye, EyeOff, LogOut, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [preferences, setPreferences] = useState({
    marketingEmails: false,
    orderUpdates: true,
    promoNotifications: false,
  })
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!authLoading && userData) {
      setFormData({
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: user?.email || '',
        phone: userData.phone || '',
      })
    }
  }, [userData, user, authLoading])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (passwords.new !== passwords.confirm) {
      setError('Passwords do not match')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new,
      })

      if (updateError) throw updateError

      setSuccess('Password changed successfully')
      setPasswords({ current: '', new: '', confirm: '' })
      setShowChangePassword(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to logout')
    }
  }

  if (authLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1f2d2b] mb-4">Sign In Required</h1>
            <Link href="/auth/login" className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium">
              Sign In →
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1f2d2b] mb-2">Settings</h1>
            <p className="text-[#6b7b78]">Manage your account and preferences</p>
          </div>

          {error && (
            <Card className="p-4 mb-8 bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700">{error}</p>
            </Card>
          )}

          {success && (
            <Card className="p-4 mb-8 bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-green-700">{success}</p>
            </Card>
          )}

          {/* Profile Section */}
          <Card className="p-8 mb-6">
            <h2 className="text-2xl font-bold text-[#1f2d2b] mb-6">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-[#6b7b78] cursor-not-allowed"
                />
                <p className="text-xs text-[#6b7b78] mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0]"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                Save Changes
              </Button>
            </form>
          </Card>

          {/* Password Section */}
          <Card className="p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lock className="text-[#48C9B0]" size={24} />
                <h2 className="text-2xl font-bold text-[#1f2d2b]\">Password</h2>
              </div>
              {!showChangePassword && (
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="text-[#48C9B0] hover:text-[#7FE3D3] font-medium"
                >
                  Change
                </button>
              )}
            </div>

            {showChangePassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7b78]"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f2d2b] mb-2">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48C9B0]"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    Update Password
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-[#1f2d2b] hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-[#6b7b78]">Update your password to keep your account secure</p>
            )}
          </Card>

          {/* Logout Section */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-[#1f2d2b] mb-4">Account</h2>
            <p className="text-[#6b7b78] mb-6">Sign out of your account on this device</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 border border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
