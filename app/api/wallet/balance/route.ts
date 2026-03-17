import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'

// Initialize Firebase Admin
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
    privateKey: privateKey?.replace(/\\n/g, '\n'),
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.projectId,
    })
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('[WALLET] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

/**
 * GET /api/wallet/balance?uid={uid}
 * Returns user's wallet balance and credit info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!uid) {
      return NextResponse.json(
        { error: 'UID required' },
        { status: 400 }
      )
    }

    const doc = await db.collection('users').doc(uid).get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = doc.data()
    const balance = userData?.walletBalance || 0
    const pendingCredits = userData?.pendingCredits || 0

    // Check for expiring credits (expiring within 7 days)
    let expiringCredits = 0
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 7)

    // In production, query credit transactions for expiration
    const transactions = userData?.creditTransactions || []
    for (const tx of transactions) {
      if (tx.expiresAt && new Date(tx.expiresAt) <= expirationDate) {
        expiringCredits += tx.amount
      }
    }

    return NextResponse.json({
      success: true,
      balance,
      pending: pendingCredits,
      expiringSoon: expiringCredits,
      expiringDate: expirationDate.toISOString().split('T')[0],
      currency: 'USD'
    })
  } catch (error) {
    console.error('[WALLET-BALANCE-ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get wallet balance' },
      { status: 500 }
    )
  }
}
