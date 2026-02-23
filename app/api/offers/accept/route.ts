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

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json()

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Missing employee ID' },
        { status: 400 }
      )
    }

    const db = admin.firestore()

    // Find user by employee ID
    const usersSnapshot = await db
      .collection('users')
      .where('employeeId', '==', employeeId)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    // Check if offer was already accepted
    if (userData.offerAcceptedAt) {
      return NextResponse.json({
        success: true,
        message: 'Offer was already accepted',
        employeeId,
      })
    }

    // Update user record
    await userDoc.ref.update({
      offerAcceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      employeeDashboardAccess: true,
      status: 'active',
    })

    // Optionally create an employee record
    await db.collection('employees').doc(employeeId).set({
      userId: userDoc.id,
      employeeId,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      state: userData.state || '',
      onboardedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      approvedAt: userData.approvalDate || admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log('[API] Offer accepted successfully:', employeeId)

    return NextResponse.json({
      success: true,
      employeeId,
      userId: userDoc.id,
      message: 'Offer accepted successfully',
    })
  } catch (error: any) {
    console.error('[API] Error accepting offer:', {
      message: error.message,
      code: error.code,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to accept offer' },
      { status: 500 }
    )
  }
}
