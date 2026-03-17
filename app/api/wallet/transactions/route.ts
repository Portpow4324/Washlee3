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
      console.error('[TRANSACTIONS] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

/**
 * GET /api/wallet/transactions?uid={uid}&limit={limit}&offset={offset}&type={type}
 * Returns paginated wallet transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') || 'all'

    if (!uid) {
      return NextResponse.json(
        { error: 'UID required' },
        { status: 400 }
      )
    }

    // Get user document
    const userDoc = await db.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let transactions = userDoc.data()?.creditTransactions || []

    // Filter by type
    if (type !== 'all') {
      transactions = transactions.filter((tx: any) => tx.type === type)
    }

    // Sort by date (newest first)
    transactions.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Paginate
    const total = transactions.length
    const paginatedTransactions = transactions.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      transactions: paginatedTransactions,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('[TRANSACTIONS-ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get transactions' },
      { status: 500 }
    )
  }
}
