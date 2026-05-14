'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Shield, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Mail } from 'lucide-react'

export default function AdminSetupPage() {
  const { user, userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleMakeAdmin = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be signed in first.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session found.')
      }

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
        text: 'Admin privileges granted. Sign out and sign back in to activate the admin panel.',
      })
    } catch (error) {
      console.error('Error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl shadow-soft mb-4">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-950">Admin setup</h1>
            <p className="text-sm text-gray-600 mt-1">
              Grant your signed-in account admin access. Use only on first-time setup.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            {user ? (
              <div className="space-y-5">
                <div className="rounded-xl bg-mint/40 border border-primary/15 p-4">
                  <p className="text-xs uppercase tracking-wider font-bold text-primary-deep mb-1">
                    Signed in as
                  </p>
                  <p className="font-semibold text-gray-950 break-all">{user.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Grant admin access to ${user.email}? You can revoke it later from the database.`)) {
                      handleMakeAdmin()
                    }
                  }}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-deep disabled:bg-primary/40 text-white font-semibold py-3 rounded-full transition disabled:cursor-not-allowed"
                >
                  {loading ? 'Setting up…' : 'Grant admin access to me'}
                  {!loading && <ArrowRight size={16} />}
                </button>

                {message && (
                  <div
                    className={`rounded-xl p-4 flex gap-2 text-sm ${
                      message.type === 'success'
                        ? 'bg-mint border border-primary/20 text-gray-950'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle size={16} className="text-primary-deep flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-950 mb-2">What this does</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Marks your Supabase user record as admin</li>
                    <li>Grants access to <code className="px-1 py-0.5 bg-white rounded text-[11px] font-mono">/admin/*</code> routes</li>
                    <li>Sign out and back in to refresh your session claims</li>
                    <li>Visit <code className="px-1 py-0.5 bg-white rounded text-[11px] font-mono">/admin</code> to open the control center</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
                <p className="font-semibold mb-2">Sign in first</p>
                <p className="mb-4">
                  You need to be signed in to your Washlee account before you can grant yourself admin access.
                </p>
                <Link
                  href="/auth/login?redirect=/admin-setup"
                  className="inline-flex items-center gap-2 text-primary-deep font-semibold hover:underline"
                >
                  Sign in <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-primary-deep">
              <ArrowLeft size={12} />
              Home
            </Link>
            <a
              href="mailto:support@washlee.com.au"
              className="inline-flex items-center gap-1 hover:text-primary-deep"
            >
              <Mail size={12} /> support@washlee.com.au
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
