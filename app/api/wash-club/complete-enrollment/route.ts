/**
 * POST /api/wash-club/complete-enrollment
 * Complete Wash Club enrollment and create membership
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'

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

// Generate unique card number in format: WASH-XXXX-XXXX-XXXX
function generateCardNumber(): string {
  const randomPart1 = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const randomPart2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const randomPart3 = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `WASH-${randomPart1}-${randomPart2}-${randomPart3}`
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
    const userEmail = decodedToken.email

    const { termsAccepted, privacyAccepted } = await request.json()

    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json(
        { error: 'Must accept terms and privacy policy' },
        { status: 400 }
      )
    }

    // Create initial membership
    const cardNumber = generateCardNumber()
    const membership = {
      userId,
      email: userEmail,
      cardNumber, // Add card number
      tier: 1, // Start as Bronze
      totalSpend: 0,
      creditsBalance: 25, // Signup bonus
      creditsEarned: 25,
      creditsRedeemed: 0,
      joinDate: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      status: 'active',
      emailVerified: true,
      termsAccepted: true,
      privacyAccepted: true,
      signupSource: 'web',
    }

    // Create membership document
    await db.collection('wash_clubs').doc(userId).set(membership)

    // Log enrollment transaction
    await db
      .collection('wash_clubs')
      .doc(userId)
      .collection('transactions')
      .add({
        type: 'signup_bonus',
        amount: 25,
        description: 'Welcome bonus - Wash Club signup',
        timestamp: Timestamp.now(),
        balanceBefore: 0,
        balanceAfter: 25,
      })

    // Update user profile with wash club info
    await db.collection('users').doc(userId).update({
      washClubMember: true,
      washClubJoinDate: Timestamp.now(),
    })

    // Delete verification record
    await db.collection('wash_club_verification').doc(userId).delete()

    return NextResponse.json({
      success: true,
      message: 'Enrollment completed successfully',
      membership: {
        tier: 1,
        tierName: 'Bronze',
        creditsBalance: 25,
        cardNumber, // Include card number in response
      },
    })
  } catch (error) {
    console.error('Complete enrollment error:', error)
    return NextResponse.json(
      { error: 'Failed to complete enrollment' },
      { status: 500 }
    )
  }
}
