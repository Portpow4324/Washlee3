'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getCustomerAddresses, setDefaultAddress } from '@/lib/addressSync'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Button from '@/components/Button'
import Link from 'next/link'
import { MapPin, Plus, Trash2, Check } from 'lucide-react'

interface Address {
  id: string
  label: string
  address: string
  city: string
  postcode: string
  state: string
  is_default: boolean
}

export default function ManageAddresses() {
  const { user, loading: authLoading } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: '',
    address: '',
    city: '',
    postcode: '',
    state: '',
  })

  useEffect(() => {
    if (authLoading || !user) return

    const loadAddresses = async () => {
      try {
        setIsLoading(true)
        const data = await getCustomerAddresses(user.id)
        setAddresses(data as Address[])
      } catch (err: any) {
        console.error('Error loading addresses:', err)
        setError(err.message || 'Failed to load addresses')
      } finally {
        setIsLoading(false)
      }
    }

    loadAddresses()
  }, [user, authLoading])

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setError('')
      // TODO: Implement once customer_addresses table is created
      // For now, just show success message
      setAddresses([...addresses, {
        id: Math.random().toString(36).substring(7),
        label: newAddress.label,
        address: newAddress.address,
        city: newAddress.city,
        postcode: newAddress.postcode,
        state: newAddress.state,
        is_default: addresses.length === 0,
      }])
      
      setNewAddress({ label: '', address: '', city: '', postcode: '', state: '' })
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.message || 'Failed to add address')
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return

    try {
      // TODO: Implement once customer_addresses table is created
      setAddresses(addresses.filter(a => a.id !== addressId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete address')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    if (!user) return

    try {
      // Set all to false
      await supabase
        .from('business_accounts')
        .update({ is_primary: false })
        .eq('owner_id', user.id)

      // Set selected to true
      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({ is_primary: true })
        .eq('id', addressId)

      if (updateError) throw updateError

      // Reload
      const { data } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('owner_id', user.id)

      const formattedAddresses = (data || []).map((acc: any) => ({
        id: acc.id,
        label: acc.business_name,
        address: acc.address,
        city: acc.city || '',
        postcode: acc.postcode || '',
        state: acc.state || '',
        is_default: acc.is_primary,
      }))

      setAddresses(formattedAddresses)
    } catch (err: any) {
      setError(err.message || 'Failed to set default address')
    }
  }

  if (authLoading || isLoading) {
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#1f2d2b] mb-2">Manage Addresses</h1>
              <p className="text-[#6b7b78]">Add, edit, and manage your pickup and delivery addresses</p>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
              <Plus size={20} />
              Add Address
            </Button>
          </div>

          {error && (
            <Card className="p-6 mb-8 bg-red-50 border border-red-200">
              <p className="text-red-700">{error}</p>
            </Card>
          )}

          {/* Add New Address Form */}
          {showAddForm && (
            <Card className="p-6 mb-8">
              <h3 className="font-semibold text-[#1f2d2b] mb-4">New Address</h3>
              <form onSubmit={handleAddAddress} className="space-y-4">
                <input
                  type="text"
                  placeholder="Label (e.g., Home, Office)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Postcode"
                    value={newAddress.postcode}
                    onChange={(e) => setNewAddress({ ...newAddress, postcode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <select
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select State</option>
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="WA">WA</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="NT">NT</option>
                  <option value="ACT">ACT</option>
                </select>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Save Address</Button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-[#1f2d2b] hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Card>
          )}

          {/* Addresses List */}
          {addresses.length === 0 ? (
            <Card className="p-12 text-center">
              <MapPin size={48} className="mx-auto mb-4 text-[#6b7b78]" />
              <h2 className="text-xl font-semibold text-[#1f2d2b] mb-2">No Addresses</h2>
              <p className="text-[#6b7b78] mb-6">Add your first address to get started</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <Card key={address.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-[#1f2d2b]">{address.label}</h3>
                        {address.is_default && (
                          <span className="bg-[#48C9B0] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Check size={14} />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[#6b7b78]">{address.address}</p>
                      <p className="text-sm text-[#6b7b78]">
                        {address.city}, {address.state} {address.postcode}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="px-3 py-1 text-sm border border-gray-200 text-[#1f2d2b] rounded-lg hover:bg-gray-50"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
