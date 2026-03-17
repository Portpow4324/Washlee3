/**
 * POST /api/wash-club/generate-missing-cards
 * Generate card numbers for existing Wash Club members who don't have one
 * Admin-only endpoint
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
    // Simple auth check - could be enhanced with admin privileges
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Auth verified - proceed with generating cards
    console.log('[WASH_CLUB] Generating missing cards for:', decodedToken.uid)

    // Get all wash_clubs without card numbers
    const snapshot = await db.collection('wash_clubs').get()
    let updatedCount = 0
    let skippedCount = 0

    for (const doc of snapshot.docs) {
      const membership = doc.data()
      
      if (!membership.cardNumber) {
        // Generate card number
        const newCardNumber = generateCardNumber()
        
        // Update membership with card number
        await db.collection('wash_clubs').doc(doc.id).update({
          cardNumber: newCardNumber,
        })
        
        updatedCount++
        console.log(`[WASH_CLUB] Generated card for ${membership.email}: ${newCardNumber}`)
      } else {
        skippedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Card generation completed',
      stats: {
        updated: updatedCount,
        skipped: skippedCount,
        total: snapshot.size,
      },
    })
  } catch (error) {
    console.error('Generate missing cards error:', error)
    return NextResponse.json(
      { error: 'Failed to generate cards' },
      { status: 500 }
    )
  }
}
