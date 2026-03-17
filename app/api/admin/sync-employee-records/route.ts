/**
 * Admin Endpoint: Sync Employee Records
 * 
 * This endpoint backfills the 'employees' collection for users
 * who were approved before the database sync fix.
 * 
 * Usage: POST /api/admin/sync-employee-records
 * Body: { adminId: string }
 * 
 * Finds all approved users and creates their employee records if missing.
 */

import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'

try {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error('Missing Firebase Admin SDK credentials')
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
  console.error('[Sync] Firebase Admin init failed:', initError.message)
}

export async function POST(request: NextRequest) {
  try {
    const { adminId } = await request.json()

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID required' },
        { status: 400 }
      )
    }

    const db = admin.firestore()
    let synced = 0
    let errors = 0
    const syncedUsers: any[] = []

    // Find all users with isEmployee: true
    const usersSnapshot = await db.collection('users')
      .where('isEmployee', '==', true)
      .get()

    console.log(`[Sync] Found ${usersSnapshot.docs.length} approved employees`)

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data()
        const userId = userDoc.id
        const employeeId = userData.employeeId

        if (!employeeId) {
          console.warn(`[Sync] User ${userId} missing employeeId`)
          errors++
          continue
        }

        // Check if employee record already exists
        const employeeDoc = await db.collection('employees').doc(userId).get()

        if (employeeDoc.exists) {
          console.log(`[Sync] Employee record already exists for ${userId}`)
          synced++
          continue
        }

        // Create employee record from user data
        await db.collection('employees').doc(userId).set({
          uid: userId,
          employeeId: employeeId,
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          state: userData.state || '',
          status: userData.employeeStatus || 'active',
          approvalDate: userData.approvalDate || admin.firestore.FieldValue.serverTimestamp(),
          approvedBy: userData.approvedBy || adminId,
          verificationChecklist: userData.verificationChecklist || {},
          rating: 0,
          totalJobs: 0,
          totalEarnings: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        syncedUsers.push({
          uid: userId,
          employeeId: employeeId,
          email: userData.email,
        })

        console.log(`[Sync] ✓ Created employee record for ${userId} (ID: ${employeeId})`)
        synced++
      } catch (err: any) {
        console.error(`[Sync] Error syncing user:`, err.message)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} employee records${errors > 0 ? `, ${errors} errors` : ''}`,
      synced,
      errors,
      syncedUsers,
    })
  } catch (error: any) {
    console.error('[Sync] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}
