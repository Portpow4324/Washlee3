/**
 * Admin Endpoint: Sync Employee Flags
 * 
 * Updates all existing employee user documents to have isEmployee=true and userType='pro'
 * This ensures legacy employee accounts work with the new authentication system
 * 
 * Usage: POST /api/admin/sync-employee-flags
 * Body: { adminId: string }
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
  console.error('[SyncFlags] Firebase Admin init failed:', initError.message)
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
    let updated = 0
    let errors = 0
    const updatedUsers: any[] = []

    // Get all users in the 'employees' collection
    const employeesSnapshot = await db.collection('employees').get()
    console.log(`[SyncFlags] Found ${employeesSnapshot.docs.length} employee records`)

    // For each employee, update their user document
    for (const employeeDoc of employeesSnapshot.docs) {
      try {
        const employee = employeeDoc.data()
        const uid = employee.uid

        if (!uid) {
          console.log(`[SyncFlags] Skipping employee without uid: ${employee.employeeId}`)
          continue
        }

        // Update the user document with isEmployee and userType flags
        const userRef = db.collection('users').doc(uid)
        await userRef.update({
          userType: 'pro',
          isEmployee: true,
          employeeId: employee.employeeId,
        })

        updated++
        updatedUsers.push({
          uid,
          employeeId: employee.employeeId,
          email: employee.email,
        })

        console.log(`[SyncFlags] ✓ Updated user ${uid} with isEmployee=true`)
      } catch (updateError: any) {
        errors++
        console.error(`[SyncFlags] ❌ Error updating employee:`, updateError.message)
      }
    }

    console.log(`[SyncFlags] Sync complete: ${updated} updated, ${errors} errors`)

    return NextResponse.json(
      {
        success: true,
        message: `Updated ${updated} employee accounts`,
        updated,
        errors,
        updatedUsers,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[SyncFlags] Endpoint error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync employee flags' },
      { status: 500 }
    )
  }
}
