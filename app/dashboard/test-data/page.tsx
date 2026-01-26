'use client'

import { useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'

export default function TestDataSetup() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const setupAdmin = async () => {
    setLoading(true)
    try {
      // Sign in as the test user
      await signInWithEmailAndPassword(auth, 'lukaverde6@gmail.com', 'Washlee@123')

      const user = auth.currentUser
      if (!user) throw new Error('No user logged in')

      // Update user with admin privileges
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        await updateDoc(userRef, {
          isAdmin: true,
          userType: 'pro',
          subscription: {
            plan: 'washly',
            status: 'active',
            startDate: new Date().toISOString(),
            renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          },
        })
        setStatus('✓ Admin privileges granted! Washly subscription active.')
      } else {
        setStatus('✗ User profile not found. Please sign up first.')
      }
    } catch (error) {
      console.error('Error:', error)
      setStatus(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const addTestSubscription = async () => {
    setLoading(true)
    try {
      // Sign in as the test user
      await signInWithEmailAndPassword(auth, 'lukaverde6@gmail.com', 'Washlee@123')

      const user = auth.currentUser
      if (!user) throw new Error('No user logged in')

      // Check if subscription already exists
      const subscriptionsRef = collection(db, 'subscriptions')
      const q = query(subscriptionsRef, where('userId', '==', user.uid))
      const existing = await getDocs(q)

      if (!existing.empty) {
        setStatus('✓ Subscription already exists for this user')
        setLoading(false)
        return
      }

      // Add Washly subscription for admin
      await addDoc(subscriptionsRef, {
        userId: user.uid,
        planId: 'washly',
        planName: 'Washly',
        price: 49.99,
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: serverTimestamp(),
      })

      setStatus('✓ Test subscription added for Washly plan')

      // Add test billing history
      const billingRef = collection(db, 'billingHistory')
      const today = new Date()

      for (let i = 0; i < 4; i++) {
        const date = new Date(today)
        date.setMonth(date.getMonth() - i)

        await addDoc(billingRef, {
          userId: user.uid,
          date: date,
          amount: 49.99,
          plan: 'Washly Plan',
          status: 'paid',
          createdAt: serverTimestamp(),
        })
      }

      setStatus('✓ Test billing history added (4 months)')
    } catch (error) {
      console.error('Error:', error)
      setStatus(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-bold text-dark mb-4">Test Data Setup</h1>
        <p className="text-gray mb-6">Admin controls and sample data for testing</p>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-dark mb-3">Admin Setup</h2>
            <p className="text-sm text-gray mb-3">Grant lukaverde6@gmail.com admin privileges with Washly subscription</p>
            <Button onClick={setupAdmin} disabled={loading} className="w-full">
              {loading ? 'Setting up...' : '🔐 Make Admin + Grant Washly'}
            </Button>
          </div>

          <hr className="my-6" />

          <div>
            <h2 className="text-lg font-bold text-dark mb-3">Test Data</h2>
            <p className="text-sm text-gray mb-3">Add sample subscription and billing data</p>
            <Button onClick={addTestSubscription} disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Washly Subscription for Admin'}
            </Button>
          </div>
        </div>

        {status && (
          <div className={`mt-6 p-4 rounded-lg ${status.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {status}
          </div>
        )}
      </Card>
    </div>
  )
}
