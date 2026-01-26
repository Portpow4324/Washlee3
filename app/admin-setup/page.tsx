'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'

export default function AdminSetupPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSetAdmin = async () => {
    if (!user) {
      setMessage({
        type: 'error',
        text: 'You must be logged in to set admin privileges',
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Get ID token from user
      const idToken = await user.getIdToken(true)

      console.log('[Admin Setup] Calling /api/admin/setup with token...')

      // Call admin setup API
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'Admin',
        }),
      })

      console.log('[Admin Setup] Response status:', response.status)
      console.log('[Admin Setup] Response type:', response.headers.get('content-type'))

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error(
          `Invalid response type: ${contentType}. Expected JSON. Status: ${response.status}`
        )
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set admin privileges')
      }

      setMessage({
        type: 'success',
        text: `✅ Admin privileges granted! Please log out and log back in to see the admin dashboard.`,
      })

      // Refresh token after a short delay
      setTimeout(() => {
        user.getIdTokenResult(true)
      }, 1000)
    } catch (error) {
      console.error('[Admin Setup Error]', error)
      setMessage({
        type: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-light">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-dark mb-2">Admin Setup</h1>
            <p className="text-gray">Set up admin privileges for your account</p>
          </div>

          {/* Login Status */}
          <Card>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">
                  Login Status
                </label>
                {user ? (
                  <div className="bg-mint p-3 rounded-lg">
                    <p className="text-dark font-medium">✅ Logged In</p>
                    <p className="text-gray text-sm mt-1">{user.email}</p>
                  </div>
                ) : (
                  <div className="bg-red-100 p-3 rounded-lg">
                    <p className="text-red-700 font-medium">
                      ❌ Not Logged In
                    </p>
                    <p className="text-red-600 text-sm mt-1">
                      Please log in first at the Login page
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Admin Setup Card */}
          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-dark">
                Grant Admin Privileges
              </h2>

              <p className="text-gray text-sm">
                Click the button below to set admin privileges for your account.
                After this, log out completely and log back in to see the Admin
                Dashboard in your user menu.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">How it works:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• This sets custom claims in Firebase Auth</li>
                    <li>• Your admin status is verified on every login</li>
                    <li>• No Firestore API required</li>
                  </ul>
                </div>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={`text-sm ${
                      message.type === 'success'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              <Button
                onClick={handleSetAdmin}
                disabled={!user || loading}
                className="w-full flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Setting up...' : 'Set Admin Privileges'}
              </Button>
            </div>
          </Card>

          {/* Next Steps */}
          <Card>
            <div className="space-y-3">
              <h3 className="font-semibold text-dark">Next Steps</h3>
              <ol className="space-y-2 text-sm text-gray">
                <li>
                  <span className="font-medium text-dark">1.</span> Click
                  "Set Admin Privileges" above
                </li>
                <li>
                  <span className="font-medium text-dark">2.</span> Wait for
                  success message
                </li>
                <li>
                  <span className="font-medium text-dark">3.</span> Log out
                  completely (close browser or clear session)
                </li>
                <li>
                  <span className="font-medium text-dark">4.</span> Log back
                  in with your email
                </li>
                <li>
                  <span className="font-medium text-dark">5.</span> Check your
                  user menu - you should see "Admin Dashboard" link
                </li>
                <li>
                  <span className="font-medium text-dark">6.</span> Click to
                  access the admin dashboard
                </li>
              </ol>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
