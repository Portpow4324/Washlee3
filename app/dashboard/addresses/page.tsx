'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { MapPin, Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { AUSTRALIAN_STATES, searchAddresses, AustralianAddress } from '@/lib/australianValidation'

interface Address {
  id: string
  label: string
  address: string
  suburb: string
  state: string
  postcode: string
  isDefault: boolean
}

export default function Addresses() {
  const { user, loading } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<AustralianAddress[]>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: '',
    address: '',
    suburb: '',
    state: '',
    postcode: '',
  })


  // Fetch addresses from Firebase
  useEffect(() => {
    if (!user || loading) return

    setAddressesLoading(true)
    const addressesRef = collection(db, 'addresses')
    const q = query(addressesRef, where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Address))
      setAddresses(data.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)))
      setAddressesLoading(false)
    })

    return () => unsubscribe()
  }, [user, loading])

  const handleAddAddress = async () => {
    if (newAddress.label && newAddress.address && newAddress.suburb && newAddress.state && newAddress.postcode) {
      if (!user) return

      try {
        // If this is the first address, set it as default
        const isFirst = addresses.length === 0

        await addDoc(collection(db, 'addresses'), {
          userId: user.uid,
          ...newAddress,
          isDefault: isFirst,
          createdAt: serverTimestamp(),
        })

        setNewAddress({ label: '', address: '', suburb: '', state: '', postcode: '' })
        setShowAddForm(false)
        setShowAddressSuggestions(false)
      } catch (error) {
        console.error('Error adding address:', error)
      }
    }
  }

  const handleAddressSuggestionClick = (suggestion: AustralianAddress) => {
    setNewAddress({
      label: newAddress.label,
      address: suggestion.streetAddress,
      suburb: suggestion.suburb,
      state: suggestion.state,
      postcode: suggestion.postcode,
    })
    setShowAddressSuggestions(false)
  }

  const handleAddressInputChange = (value: string) => {
    setNewAddress({ ...newAddress, address: value })
    if (value.length >= 2) {
      const suggestions = searchAddresses(value)
      setAddressSuggestions(suggestions)
      setShowAddressSuggestions(suggestions.length > 0)
    } else {
      setShowAddressSuggestions(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'addresses', id))
    } catch (error) {
      console.error('Error deleting address:', error)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      // Set all addresses to non-default
      for (const addr of addresses) {
        if (addr.isDefault) {
          await updateDoc(doc(db, 'addresses', addr.id), { isDefault: false })
        }
      }
      // Set the selected one as default
      await updateDoc(doc(db, 'addresses', id), { isDefault: true })
    } catch (error) {
      console.error('Error setting default address:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">Addresses</h1>
          <p className="text-gray">Manage your delivery addresses</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
          <Plus size={20} />
          Add Address
        </Button>
      </div>

      {/* Add Address Form */}
      {showAddForm && (
        <Card className="p-6 bg-mint/10">
          <h3 className="text-lg font-bold text-dark mb-4">Add New Address</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Label (e.g., Home, Work)"
              value={newAddress.label}
              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="relative">
              <input
                type="text"
                placeholder="Start typing address (e.g., Malcolm Street, Sydney)"
                value={newAddress.address}
                onChange={(e) => handleAddressInputChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {addressSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddressSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-light transition text-sm border-b border-gray/20 last:border-b-0"
                    >
                      <div className="font-semibold text-dark">{suggestion.streetAddress}</div>
                      <div className="text-gray text-xs">{suggestion.suburb}, {suggestion.state} {suggestion.postcode}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Suburb"
                value={newAddress.suburb}
                onChange={(e) => setNewAddress({ ...newAddress, suburb: e.target.value })}
                className="px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select State</option>
                {AUSTRALIAN_STATES.map(state => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Postcode"
              value={newAddress.postcode}
              onChange={(e) => setNewAddress({ ...newAddress, postcode: e.target.value })}
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-3">
              <Button onClick={handleAddAddress} size="sm">
                Save Address
              </Button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setShowAddressSuggestions(false)
                }}
                className="px-4 py-2 border-2 border-gray rounded-lg text-dark font-semibold hover:bg-light transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Address List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((addr) => (
          <Card key={addr.id} hoverable>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-dark">{addr.label}</p>
                  {addr.isDefault && (
                    <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteAddress(addr.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <p className="text-gray mb-1">{addr.address}</p>
            <p className="text-gray mb-4">{addr.suburb}, {addr.state} {addr.postcode}</p>

            <div className="flex gap-2">
              {!addr.isDefault && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-mint transition"
                >
                  <Check size={18} />
                  Set Default
                </button>
              )}
              <button className="flex-1 px-4 py-2 border-2 border-gray rounded-lg text-dark font-semibold hover:bg-light transition flex items-center justify-center gap-2">
                <Edit2 size={18} />
                Edit
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
