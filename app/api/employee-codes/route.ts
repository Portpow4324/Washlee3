import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'

// Initialize Firebase Admin if not already done
try {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error('Missing Firebase Admin SDK credentials in environment variables')
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      } as any),
    })
  }
} catch (initError: any) {
  console.error('[API] Firebase Admin initialization failed:', initError.message)
}

/**
 * Generates unique employee/payslip codes
 * Format: EMP-{TIMESTAMP}-{RANDOM_STRING}
 * Example: EMP-1709567890123-A7K9Q
 */
export async function POST(request: NextRequest) {
  try {
    const { count = 1, format = 'standard' } = await request.json()

    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      )
    }

    const codes = []

    for (let i = 0; i < count; i++) {
      let code: string

      if (format === 'payslip') {
        // Format: PS-{DATE}-{RANDOM}
        // Example: PS-20240304-X9K2L
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
        const random = Math.random().toString(36).substring(2, 7).toUpperCase()
        code = `PS-${dateStr}-${random}`
      } else {
        // Default format: EMP-{TIMESTAMP}-{RANDOM}
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 7).toUpperCase()
        code = `EMP-${timestamp}-${random}`
      }

      codes.push({
        code,
        createdAt: new Date().toISOString(),
        used: false,
        format: format,
      })
    }

    // Store codes in Firestore if needed
    const db = admin.firestore()
    const codesRef = db.collection('employeeCodes')

    for (const codeData of codes) {
      await codesRef.doc(codeData.code).set(codeData)
    }

    return NextResponse.json({
      success: true,
      codes: codes.map(c => c.code),
      count: codes.length,
      format: format,
    })
  } catch (error: any) {
    console.error('[API] Error generating codes:', {
      message: error.message,
      code: error.code,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to generate codes' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/employee-codes
 * Retrieve unused codes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const format = searchParams.get('format') || 'standard'

    const db = admin.firestore()
    const query = await db
      .collection('employeeCodes')
      .where('used', '==', false)
      .where('format', '==', format)
      .limit(limit)
      .get()

    const codes = query.docs.map(doc => ({
      code: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({
      success: true,
      codes: codes,
      count: codes.length,
    })
  } catch (error: any) {
    console.error('[API] Error fetching codes:', {
      message: error.message,
      code: error.code,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch codes' },
      { status: 500 }
    )
  }
}
