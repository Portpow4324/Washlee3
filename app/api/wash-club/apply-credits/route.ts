/**
 * POST /api/wash-club/apply-credits
 * Apply Wash Club credits to an order
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'
import { calculateOrderTotal, WASH_CLUB_TIERS } from '@/lib/washClub'

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

interface ApplyCreditsRequest {
  subtotal: number
  creditsToRedeem: number
  creditValue: number
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body: ApplyCreditsRequest = await request.json()
    const { subtotal, creditsToRedeem, creditValue = 0.01 } = body

    // Get membership
    const membershipDoc = await db.collection('wash_clubs').doc(userId).get()
    if (!membershipDoc.exists) {
      return NextResponse.json({ error: 'No membership found' }, { status: 404 })
    }

    const membership = membershipDoc.data()
    if (!membership) {
      return NextResponse.json({ error: 'No membership found' }, { status: 404 })
    }

    const tierLevel = membership.tier || 1

    // Validate credits to redeem
    const creditsAvailable = membership.creditsBalance || 0
    if (creditsToRedeem > creditsAvailable) {
      return NextResponse.json(
        { error: `Only ${creditsAvailable.toFixed(2)} credits available` },
        { status: 400 }
      )
    }

    // Calculate order totals
    const calculation = calculateOrderTotal(
      subtotal,
      tierLevel,
      creditsToRedeem,
      creditValue
    )

    return NextResponse.json({
      success: true,
      calculation,
      membership: {
        tier: tierLevel,
        tierName: WASH_CLUB_TIERS[tierLevel].name,
        creditsAvailable: creditsAvailable,
        creditsToApply: creditsToRedeem,
      },
    })
  } catch (error) {
    console.error('Apply credits error:', error)
    return NextResponse.json(
      { error: 'Failed to apply credits' },
      { status: 500 }
    )
  }
}
