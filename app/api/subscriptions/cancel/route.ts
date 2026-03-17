import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, App } from 'firebase-admin/app'
import { cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import Stripe from 'stripe'

// Parse Firebase service account key from environment
let adminApp: App | null = null

function getAdminApp() {
  if (adminApp) return adminApp
  
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount as any),
    projectId: process.env.FIREBASE_PROJECT_ID,
  })

  return adminApp
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
})

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const admin = getAdminApp()
    const auth = getAuth(admin)
    const db = getFirestore(admin)

    // Verify the token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      console.error('Token verification error:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decodedToken.uid
    const { reason, feedback } = await request.json()

    // Get user from Firestore
    const userRef = db.collection('users').doc(userId)
    const userSnapshot = await userRef.get()

    if (!userSnapshot.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userSnapshot.data()
    const stripeSubscriptionId = userData?.stripeSubscriptionId

    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Cancel the Stripe subscription
    try {
      await stripe.subscriptions.cancel(stripeSubscriptionId)
    } catch (stripeError) {
      console.error('Stripe cancellation error:', stripeError)
      return NextResponse.json(
        { error: 'Failed to cancel subscription with payment provider' },
        { status: 500 }
      )
    }

    // Update user in Firestore to sync back to Pay Per Order
    await userRef.update({
      currentPlan: 'none', // Pay Per Order plan
      stripeSubscriptionId: null,
      subscriptionStatus: 'cancelled',
      cancellationReason: reason,
      cancellationFeedback: feedback,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
