'use client'

import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import Link from 'next/link'
import { CreditCard, Calendar, CheckCircle, Clock, X } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  created_at: string
  order_id?: string
}

export default function PaymentsPage() {
  const { user, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading || !user) return

    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        const { data, error: queryError } = await supabase
          .from('transactions')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        if (queryError) throw queryError

        setTransactions(data || [])
      } catch (err: any) {
        console.error('Error loading transactions:', err)
        setError(err.message || 'Failed to load payment history')
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <>
        <Header />
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
        <Header />
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />
      case 'failed':
        return <X className="text-red-600" size={20} />
      default:
        return <CreditCard className="text-gray-600" size={20} />
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1f2d2b] mb-2">Payment History</h1>
            <p className="text-[#6b7b78]">View all your past transactions and payments</p>
          </div>

          {error && (
            <Card className="p-6 mb-8 bg-red-50 border border-red-200">
              <p className="text-red-700">{error}</p>
            </Card>
          )}

          {transactions.length === 0 ? (
            <Card className="p-12 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-[#6b7b78]" />
              <h2 className="text-xl font-semibold text-[#1f2d2b] mb-2">No Transactions</h2>
              <p className="text-[#6b7b78]">You don't have any payments yet</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <p className="font-semibold text-[#1f2d2b] capitalize">
                          {transaction.payment_method} Payment
                        </p>
                        <p className="text-sm text-[#6b7b78]">
                          {new Date(transaction.created_at).toLocaleDateString('en-AU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#48C9B0]">
                        ${transaction.amount.toFixed(2)}
                      </p>
                      <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
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
