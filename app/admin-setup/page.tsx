'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AdminSetupPage() {
  const { user, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleMakeAdmin = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in first!' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Get session token from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session found')
      }

      // Call the setup API to grant admin claims
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          name: userData?.name || user.email?.split('@')[0],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set admin privileges')
      }

      setMessage({
        type: 'success',
        text: `Admin privileges granted! Please log out and log back in to see the admin panel.`,
      })
    } catch (error) {
      console.error('Error:', error)
      setMessage({
        type: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-2">Admin Setup</h1>
          <p className="text-gray-600 mb-6">Grant yourself admin privileges</p>

          {user ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Logged in as:</strong> {user.email}
                </p>
              </div>

              <Button
                onClick={handleMakeAdmin}
                disabled={loading}
                variant="primary"
                className="w-full"
              >
                {loading ? 'Setting up...' : 'Make Me Admin'}
              </Button>

              {message && (
                <div
                  className={`p-4 rounded ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-900 border border-green-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded text-sm text-gray-600">
                <p className="font-semibold mb-2">What happens:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Admin custom claims will be set in Firebase</li>
                  <li>Your user document will be marked as admin</li>
                  <li>Log out and log back in to activate admin access</li>
                  <li>Then visit /admin to see the admin dashboard</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-900">
              <p>Please log in first to set up admin access.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
