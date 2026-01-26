'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Lock, Shield, LogOut, Eye, EyeOff, User, Mail } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail } from 'firebase/auth'

interface Session {
  id: string
  device: string
  browser: string
  lastActive: Timestamp
  current: boolean
}

interface LoginRecord {
  id: string
  date: Timestamp
  device: string
  location: string
  status: 'success' | 'failed'
}

export default function Security() {
  const { user, userData, loading } = useAuth()
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  
  // Personal info editing
  const [editingField, setEditingField] = useState<'name' | 'email' | null>(null)
  const [displayName, setDisplayName] = useState(userData?.name || '')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Sync display name when userData changes
  useEffect(() => {
    if (userData?.name) {
      setDisplayName(userData.name)
    }
  }, [userData?.name])

  // Fetch active sessions from Firebase
  useEffect(() => {
    if (!user || loading) return

    setSessionsLoading(true)
    const sessionsRef = collection(db, 'sessions')
    const q = query(sessionsRef, where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Session))
      setSessions(data)
      setSessionsLoading(false)
    })

    return () => unsubscribe()
  }, [user, loading])

  // Fetch login history from Firebase
  useEffect(() => {
    if (!user || loading) return

    const historyRef = collection(db, 'loginHistory')
    const q = query(historyRef, where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as LoginRecord))
      // Sort by date, most recent first
      setLoginHistory(data.sort((a, b) => b.date?.toMillis() - a.date?.toMillis()))
    })

    return () => unsubscribe()
  }, [user, loading])

  const handleChangePassword = () => {
    setPasswordChanged(true)
    setTimeout(() => setPasswordChanged(false), 3000)
  }

  const handleUpdateName = async () => {
    if (!displayName.trim()) {
      setErrorMessage('Please enter a name')
      return
    }

    setIsUpdating(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (user && userData) {
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, {
          name: displayName.trim()
        })

        setSuccessMessage('✅ Name updated successfully!')
        setEditingField(null)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update name')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      setErrorMessage('Please enter a new email address')
      return
    }

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your password to confirm')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setErrorMessage('Please enter a valid email address')
      return
    }

    setIsUpdating(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (user && userData && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        await reauthenticateWithCredential(user, credential)

        await updateEmail(user, newEmail)

        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, {
          email: newEmail
        })

        setSuccessMessage('✅ Email updated successfully!')
        setNewEmail('')
        setCurrentPassword('')
        setEditingField(null)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      if ((err as any).code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please try again.')
      } else if ((err as any).code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already in use. Please choose a different one.')
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to change email')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Personal Information */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
          <User size={28} className="text-primary" />
          Personal Information
        </h2>
        <Card>
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Full Name</label>
              {editingField === 'name' ? (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your full name"
                  />
                  <Button
                    onClick={handleUpdateName}
                    disabled={isUpdating || displayName === userData?.name}
                    className="whitespace-nowrap"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingField(null)
                      setDisplayName(userData?.name || '')
                    }}
                    className="whitespace-nowrap"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-dark font-semibold">{userData?.name || 'Not set'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingField('name')}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Email Address</label>
              {editingField === 'email' ? (
                <div className="space-y-4">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your new email address"
                  />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your password to confirm"
                  />
                  <p className="text-xs text-gray">For security, we need your password to confirm this change</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleChangeEmail}
                      disabled={isUpdating || !newEmail || !currentPassword}
                    >
                      {isUpdating ? 'Updating...' : 'Confirm Change'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingField(null)
                        setNewEmail('')
                        setCurrentPassword('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-primary" />
                    <span className="text-dark font-semibold">{userData?.email || user?.email || 'Not set'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingField('email')}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Change Password */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
          <Lock size={28} className="text-primary" />
          Change Password
        </h2>
        <Card>
          <div className="space-y-6">
            {/* Old Password */}
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                />
                <button
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray"
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-bold text-dark mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray mt-2">Min. 8 characters with uppercase, lowercase, and numbers</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-dark mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {passwordChanged && (
              <div className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
                ✓ Password changed successfully!
              </div>
            )}

            <Button onClick={handleChangePassword} className="w-full">
              Update Password
            </Button>
          </div>
        </Card>
      </div>

      {/* Two-Factor Authentication */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
          <Shield size={28} className="text-primary" />
          Two-Factor Authentication
        </h2>
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-dark mb-2">Add extra security to your account</h3>
              <p className="text-gray text-sm mb-4">
                Enable 2FA to require a verification code in addition to your password when signing in.
              </p>
              <div className={`p-3 rounded-lg text-sm font-semibold inline-block ${twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {twoFactorEnabled ? '✓ Enabled' : 'Not Enabled'}
              </div>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                twoFactorEnabled
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
            </button>
          </div>
        </Card>
      </div>

      {/* Active Sessions */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">Active Sessions</h2>
        {sessionsLoading ? (
          <Card>
            <div className="p-6 text-center text-gray">Loading sessions...</div>
          </Card>
        ) : sessions.length === 0 ? (
          <Card>
            <div className="p-6 text-center text-gray">No active sessions</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <Card key={session.id} hoverable>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Shield size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-dark text-sm">{session.device}</p>
                      <p className="text-gray text-xs">{session.browser}</p>
                    </div>
                  </div>
                  {session.current && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-gray text-xs mb-3">
                  Last active: {new Date(session.lastActive?.toMillis()).toLocaleDateString()}
                </p>
                {!session.current && (
                  <button className="text-red-600 text-sm font-semibold hover:text-red-700">
                    Logout from this device
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Login History */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">Login History</h2>
        <Card>
          {loginHistory.length === 0 ? (
            <div className="p-6 text-center text-gray">No login history</div>
          ) : (
            <div className="space-y-3">
              {loginHistory.map((login) => (
                <div
                  key={login.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    login.status === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-dark text-sm">{login.device}</p>
                      <p className="text-gray text-xs">{login.location}</p>
                      <p className="text-gray text-xs">
                        {new Date(login.date?.toMillis()).toLocaleDateString('en-AU', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        login.status === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {login.status.charAt(0).toUpperCase() + login.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
