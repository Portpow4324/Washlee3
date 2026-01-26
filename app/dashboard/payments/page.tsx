'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { CreditCard, Plus, Trash2, Check } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'

interface Transaction {
  id: string
  date: Timestamp
  amount: number
  status: 'completed' | 'pending' | 'failed'
  orderId: string
}

export default function Payments() {
  const { user, loading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)

  // Fetch transactions from Firebase
  useEffect(() => {
    if (!user || loading) return

    setTransactionsLoading(true)
    const transactionsRef = collection(db, 'transactions')
    const q = query(transactionsRef, where('userId', '==', user.uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Transaction))
      // Sort by date, most recent first
      setTransactions(data.sort((a, b) => b.date?.toMillis() - a.date?.toMillis()))
      setTransactionsLoading(false)
    })

    return () => unsubscribe()
  }, [user, loading])

  const [cards] = useState([
    {
      id: 1,
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25',
      isDefault: true,
    },
    {
      id: 2,
      last4: '5555',
      brand: 'Mastercard',
      expiry: '08/26',
      isDefault: false,
    },
  ])

  const [showAddForm, setShowAddForm] = useState(false)

  const handleDeleteCard = (id: number) => {
    // Placeholder for card deletion
  }

  const handleSetDefault = (id: number) => {
    // Placeholder for setting default card
  }

  return (
    <div className="space-y-8">
      {/* Saved Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-dark">Saved Cards</h2>
            <p className="text-gray text-sm">Manage your payment methods</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
            <Plus size={20} />
            Add Card
          </Button>
        </div>

        {showAddForm && (
          <Card className="p-6 bg-mint/10 mb-6">
            <h3 className="font-bold text-dark mb-4">Add Payment Method</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Cardholder Name"
                className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Card Number"
                className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="CVC"
                  className="px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3">
                <Button size="sm">Add Card</Button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border-2 border-gray rounded-lg text-dark font-semibold hover:bg-light transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Card key={card.id} hoverable>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CreditCard size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-dark">{card.brand}</p>
                    <p className="text-gray text-sm">•••• {card.last4}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <p className="text-gray text-sm mb-4">Expires {card.expiry}</p>

              <div className="flex gap-2">
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-mint transition text-sm"
                  >
                    <Check size={16} />
                    Set Default
                  </button>
                )}
                {card.isDefault && (
                  <div className="flex-1 flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm">
                    Default Payment
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">Transaction History</h2>
        <Card>
          {transactionsLoading ? (
            <div className="p-8 text-center text-gray">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray">No transactions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray">
                    <th className="text-left p-4 font-bold text-dark text-sm">Date</th>
                    <th className="text-left p-4 font-bold text-dark text-sm">Order</th>
                    <th className="text-right p-4 font-bold text-dark text-sm">Amount</th>
                    <th className="text-right p-4 font-bold text-dark text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray/30 hover:bg-light transition">
                      <td className="p-4 text-gray text-sm">
                        {new Date(tx.date?.toMillis()).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-4 font-semibold text-dark">{tx.orderId || 'N/A'}</td>
                      <td className="p-4 font-bold text-dark text-right">${tx.amount.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : tx.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
