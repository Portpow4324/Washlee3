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
      console.error('[PROMOS] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

/**
 * POST /api/promos/validate
 * Validates promo code and returns discount info
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, userId } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code required' },
        { status: 400 }
      )
    }

    // Query for promo code
    const promoSnapshot = await db
      .collection('promos')
      .where('code', '==', code.toUpperCase())
      .get()

    if (promoSnapshot.empty) {
      return NextResponse.json({
        valid: false,
        message: 'Promo code not found'
      }, { status: 400 })
    }

    const promoDoc = promoSnapshot.docs[0]
    const promo = promoDoc.data()

    // Check expiration
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        message: 'Promo code has expired'
      }, { status: 400 })
    }

    // Check usage limits
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({
        valid: false,
        message: 'Promo code usage limit exceeded'
      }, { status: 400 })
    }

    // Check user eligibility
    if (promo.firstTimeOnly && userId) {
      const userDoc = await db.collection('users').doc(userId).get()
      if (userDoc.data()?.ordersCount > 0) {
        return NextResponse.json({
          valid: false,
          message: 'This promo is for first-time customers only'
        }, { status: 400 })
      }
    }

    // Check per-user usage if specified
    if (promo.maxUsesPerUser && userId) {
      const userPromoSnapshot = await db
        .collection('promo_usage')
        .where('userId', '==', userId)
        .where('promoId', '==', promoDoc.id)
        .get()

      if (userPromoSnapshot.size >= promo.maxUsesPerUser) {
        return NextResponse.json({
          valid: false,
          message: `You've already used this promo code ${promo.maxUsesPerUser} time(s)`
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discountType: promo.discountType, // 'percentage' or 'fixed'
      discountAmount: promo.discountAmount,
      maxUses: promo.maxUses,
      usesRemaining: (promo.maxUses || 0) - (promo.usedCount || 0),
      minOrderAmount: promo.minOrderAmount,
      applicableServiceTypes: promo.applicableServiceTypes || ['all']
    })
  } catch (error) {
    console.error('[PROMOS-ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to validate promo' },
      { status: 500 }
    )
  }
}
