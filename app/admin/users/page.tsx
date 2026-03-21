'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, XCircle, Clock, Mail, User, Trash2, Check } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface EmailConfirmation {
  id: string
  user_id: string
  email: string
  user_type: 'customer' | 'pro'
  is_confirmed: boolean
  confirmation_method: string
  confirmed_at: string | null
  email_sent_at: string | null
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const [confirmations, setConfirmations] = useState<EmailConfirmation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchConfirmations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('email_confirmations')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(`Failed to load users: ${fetchError.message}`)
        console.error('Fetch error:', fetchError)
        return
      }

      setConfirmations(data || [])
    } catch (err: any) {
      setError(`Error: ${err.message}`)
      console.error('Error fetching confirmations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfirmations()
  }, [])

  const handleManualConfirm = async (id: string) => {
    try {
      setRefreshing(true)
      const { error: updateError } = await supabase
        .from('email_confirmations')
        .update({
          is_confirmed: true,
          confirmation_method: 'manual_admin',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        alert(`Error: ${updateError.message}`)
        return
      }

      setConfirmations(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                is_confirmed: true,
                confirmation_method: 'manual_admin',
                confirmed_at: new Date().toISOString()
              }
            : c
        )
      )
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return

    try {
      setRefreshing(true)
      const { error: deleteError } = await supabase
        .from('email_confirmations')
        .delete()
        .eq('id', id)

      if (deleteError) {
        alert(`Error: ${deleteError.message}`)
        return
      }

      setConfirmations(prev => prev.filter(c => c.id !== id))
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setRefreshing(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-light p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-dark">Users & Email Confirmations</h1>
          <button
            onClick={fetchConfirmations}
            disabled={refreshing}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray text-lg">Loading users...</p>
          </div>
        ) : confirmations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray text-lg">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-dark">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-dark">Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-dark">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-dark">Confirmed At</th>
                  <th className="px-6 py-3 text-left font-semibold text-dark">Email Sent</th>
                  <th className="px-6 py-3 text-left font-semibold text-dark">Method</th>
                  <th className="px-6 py-3 text-left font-semibold text-dark">Created</th>
                  <th className="px-6 py-3 text-center font-semibold text-dark">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {confirmations.map(confirmation => (
                  <tr key={confirmation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray" />
                        <span className="font-medium text-dark">{confirmation.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {confirmation.user_type === 'customer' ? 'Customer' : 'Pro'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {confirmation.is_confirmed ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-600 font-semibold">Confirmed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <span className="text-yellow-600 font-semibold">Pending</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray text-xs">
                      {formatDate(confirmation.confirmed_at)}
                    </td>
                    <td className="px-6 py-4 text-gray text-xs">
                      {formatDate(confirmation.email_sent_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {confirmation.confirmation_method || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray text-xs">
                      {formatDate(confirmation.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        {!confirmation.is_confirmed && (
                          <button
                            onClick={() => handleManualConfirm(confirmation.id)}
                            disabled={refreshing}
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-semibold disabled:opacity-50"
                            title="Manually confirm this email"
                          >
                            <Check className="w-4 h-4" />
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(confirmation.id)}
                          disabled={refreshing}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-semibold disabled:opacity-50"
                          title="Delete this record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 text-sm">
            <span className="font-semibold">Total Users:</span> {confirmations.length} | 
            <span className="font-semibold ml-3">Confirmed:</span> {confirmations.filter(c => c.is_confirmed).length} | 
            <span className="font-semibold ml-3">Pending:</span> {confirmations.filter(c => !c.is_confirmed).length}
          </p>
        </div>
      </div>
    </div>
  )
}

