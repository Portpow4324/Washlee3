'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Button from '@/components/Button'
import Link from 'next/link'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldAlert, Smartphone, Key, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SecurityPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadSessionInfo()
    }
  }, [user, authLoading])

  const loadSessionInfo = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      setSessionData(data.session)
    } catch (err) {
      console.error('Error loading session:', err)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwords.new !== passwords.confirm) {
      setError('New passwords do not match')
      return
    }

    if (passwords.new.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new,
      })

      if (updateError) throw updateError

      setSuccess('Password changed successfully')
      setPasswords({ current: '', new: '', confirm: '' })
      setShowChangePassword(false)
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (err: any) {
      setError(err.message || 'Failed to logout')
    }
  }

  const handleLogoutAllDevices = async () => {
    if (!confirm('This will log you out from all devices. Continue?')) return
    
    try {
      setIsLoading(true)
      // Sign out from current session
      await supabase.auth.signOut({ scope: 'global' })
      router.push('/auth/login')
    } catch (err: any) {
      setError(err.message || 'Failed to logout from all devices')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-white flex flex-col">
      
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Security & Privacy</h1>
          <p className="text-gray">Manage your account security and sensitive information</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Account Information */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-dark">Account Information</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-light p-4 rounded-lg">
              <label className="text-sm font-semibold text-gray block mb-1">Email Address</label>
              <p className="text-dark font-medium">{user.email}</p>
              <p className="text-xs text-gray mt-1">
                {user.email_confirmed_at ? '✓ Verified' : '⚠ Not verified'}
              </p>
            </div>

            <div className="bg-light p-4 rounded-lg">
              <label className="text-sm font-semibold text-gray block mb-1">Account Created</label>
              <p className="text-dark font-medium">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="bg-light p-4 rounded-lg">
              <label className="text-sm font-semibold text-gray block mb-1">Last Sign In</label>
              <p className="text-dark font-medium">
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Never'}
              </p>
            </div>

            <div className="bg-light p-4 rounded-lg">
              <label className="text-sm font-semibold text-gray block mb-1">User ID</label>
              <p className="text-dark font-mono text-sm break-all">{user.id}</p>
              <p className="text-xs text-gray mt-2">
                This ID is used to link your account data across our services
              </p>
            </div>
          </div>
        </Card>

        {/* Password & Authentication */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Key size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-dark">Password & Authentication</h2>
          </div>

          {!showChangePassword ? (
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full p-4 border-2 border-gray rounded-lg hover:border-primary hover:bg-light transition text-dark font-semibold flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Lock size={20} />
                Change Password
              </span>
              <span>→</span>
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false)
                    setPasswords({ current: '', new: '', confirm: '' })
                  }}
                  className="flex-1 py-2 border-2 border-gray rounded-lg font-semibold text-dark hover:bg-light transition"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !passwords.new || !passwords.confirm}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Active Sessions */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-dark">Active Sessions</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-light p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-dark">Current Device</p>
                  <p className="text-sm text-gray">This browser</p>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Active
                </span>
              </div>
              {sessionData?.user?.last_sign_in_at && (
                <p className="text-xs text-gray">
                  Last activity: {new Date(sessionData.user.last_sign_in_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full p-4 border-2 border-red-200 hover:bg-red-50 rounded-lg text-red-700 font-semibold flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <LogOut size={20} />
                Sign Out This Device
              </span>
              <span>→</span>
            </button>

            <button
              onClick={handleLogoutAllDevices}
              disabled={isLoading}
              className="w-full p-4 border-2 border-red-400 hover:bg-red-50 bg-red-50 rounded-lg text-red-700 font-semibold flex items-center justify-between transition disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert size={20} />
                Sign Out All Devices
              </span>
              <span>→</span>
            </button>
          </div>
        </Card>

        {/* Security Tips */}
        <Card>
          <h3 className="font-bold text-dark mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-primary" />
            Security Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray">
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Use a strong, unique password with a mix of uppercase, lowercase, numbers, and symbols</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Don't share your password with anyone, including Washlee support staff</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Regularly review your active sessions and sign out unused devices</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              <span>If you suspect your account is compromised, change your password immediately</span>
            </li>
          </ul>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
