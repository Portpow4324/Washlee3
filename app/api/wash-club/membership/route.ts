/**
 * GET /api/wash-club/membership
 * Get current user's Wash Club membership status
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'

// Initialize Firebase Admin
const apps = getApps()
if (apps.length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
  initializeApp({
    credential: cert(serviceAccount as any),
  })
}

const auth = getAuth()
const db = getFirestore()

export async function GET(request: NextRequest) {
  try {
    // Get user from auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get membership from Firestore
    const membershipRef = db.collection('wash_clubs').doc(userId)
    const membershipDoc = await membershipRef.get()

    if (!membershipDoc.exists) {
      // Create default Bronze membership
      const defaultMembership = {
        userId,
        tier: 1,
        totalSpend: 0,
        creditsBalance: 0,
        creditsEarned: 0,
        creditsRedeemed: 0,
        joinDate: new Date(),
        lastUpdated: new Date(),
        status: 'active',
      }
      await membershipRef.set(defaultMembership)
      return NextResponse.json({ membership: defaultMembership })
    }

    return NextResponse.json({ membership: membershipDoc.data() })
  } catch (error) {
    console.error('Get membership error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership' },
      { status: 500 }
    )
  }
}
