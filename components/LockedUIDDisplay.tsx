'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface LockedUIDDisplayProps {
  uid: string
  firstName?: string
}

export default function LockedUIDDisplay({ uid, firstName }: LockedUIDDisplayProps) {
  const [revealed, setRevealed] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const handleRevealClick = async () => {
    if (revealed) {
      // Just hide it
      setRevealed(false)
      setPassword('')
      setError('')
      return
    }

    // Show password prompt
    setShowPasswordPrompt(true)
  }

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    try {
      setVerifying(true)
      setError('')

      const user = auth.currentUser
      if (!user || !user.email) {
        setError('User not authenticated')
        return
      }

      // Reauthenticate with password
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)

      // Password is correct - reveal the UID
      setRevealed(true)
      setShowPasswordPrompt(false)
      setPassword('')

      // Auto-hide after 5 minutes
      setTimeout(() => {
        setRevealed(false)
      }, 5 * 60 * 1000)
    } catch (err: any) {
      console.error('[LockedUID] Auth error:', err)
      setError('Incorrect password. Please try again.')
      setPassword('')
    } finally {
      setVerifying(false)
    }
  }

  const maskUID = (uid: string) => {
    if (uid.length < 8) return '•'.repeat(uid.length)
    return uid.substring(0, 3) + '•'.repeat(uid.length - 6) + uid.substring(uid.length - 3)
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={18} className="text-gray" />
            <h3 className="font-semibold text-dark">Your Account ID</h3>
          </div>
          <p className="text-sm text-gray mb-3">
            Your unique identifier for account verification and support
          </p>

          {/* UID Display */}
          <div className="relative">
            {showPasswordPrompt ? (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Please re-enter your password to view your account ID
                  </p>
                </div>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPassword()
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray/20 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={verifying}
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-2">
                  <Button
                    onClick={handleVerifyPassword}
                    variant="primary"
                    size="sm"
                    disabled={verifying}
                  >
                    {verifying ? 'Verifying...' : 'Verify & Show'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordPrompt(false)
                      setPassword('')
                      setError('')
                    }}
                    variant="outline"
                    size="sm"
                    disabled={verifying}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-mono text-lg font-semibold text-dark tracking-widest bg-light px-4 py-3 rounded-lg border border-gray/10">
                    {revealed ? uid : maskUID(uid)}
                  </div>
                  {revealed && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle size={14} />
                      This ID will be hidden in 5 minutes
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleRevealClick}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 h-fit"
                >
                  {revealed ? (
                    <>
                      <EyeOff size={16} />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      Show
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray/10">
        <p className="text-xs text-gray">
          <strong>Use this ID for:</strong> Support tickets, account verification, refund requests
        </p>
      </div>
    </Card>
  )
}
