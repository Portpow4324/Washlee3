import { db } from '@/lib/firebase'
import { query, collection, where, getDocs } from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, excludeUserId } = await request.json()

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Normalize phone number for comparison (remove spaces, dashes, etc)
    const normalizedPhone = phone.replace(/[\s\-()]/g, '')

    // Query Firestore for users with this phone number
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('phone', '==', phone))
    
    const querySnapshot = await getDocs(q)
    
    // Check if any user with this phone exists (excluding current user if provided)
    let phoneExists = false
    querySnapshot.forEach((doc) => {
      if (excludeUserId && doc.id === excludeUserId) {
        // This is the current user, don't count as duplicate
        return
      }
      phoneExists = true
    })

    // Also try normalized format in case phone numbers are stored differently
    if (!phoneExists && normalizedPhone !== phone) {
      const q2 = query(usersRef, where('phone', '==', normalizedPhone))
      const snapshot2 = await getDocs(q2)
      
      snapshot2.forEach((doc) => {
        if (excludeUserId && doc.id === excludeUserId) {
          return
        }
        phoneExists = true
      })
    }

    return NextResponse.json({ exists: phoneExists }, { status: 200 })
  } catch (error: any) {
    console.error('Phone check error:', error)
    return NextResponse.json(
      { error: 'Failed to check phone number' },
      { status: 500 }
    )
  }
}
