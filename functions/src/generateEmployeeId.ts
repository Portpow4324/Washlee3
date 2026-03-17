/**
 * FIREBASE CLOUD FUNCTION - Auto-generate Employee IDs
 * 
 * Deploy to Google Cloud Functions for Firebase:
 * 
 * 1. Set up Firebase Functions:
 *    npm install -g firebase-tools
 *    firebase init functions
 * 
 * 2. Copy this code to functions/src/index.ts
 * 
 * 3. Deploy:
 *    firebase deploy --only functions
 * 
 * This function automatically generates employee IDs when new employee
 * profiles are created (i.e., when employeeIdPending = true)
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
admin.initializeApp()
const db = getFirestore('washleeemployeeid')

// ============================================
// CLOUD FUNCTION: Auto-generate Employee ID
// ============================================

/**
 * Triggered when: New employee profile created (onCreate)
 * 
 * Generates unique 6-digit employee ID asynchronously
 * 
 * Performance:
 * - Signup returns immediately (no waiting)
 * - Cloud Function runs in background (100-500ms)
 * - User never sees the delay
 */
export const generateEmployeeId = functions.firestore
  .document('employees/{uid}')
  .onCreate(async (snap: admin.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const uid = context.params.uid
    const employeeData = snap.data()

    // Only generate ID if not already set and flag is true
    if (!employeeData || employeeData.employeeId || !employeeData.employeeIdPending) {
      console.log(`[CloudFunction] Employee ${uid} already has ID, skipping generation`)
      return
    }

    try {
      // Generate unique 6-digit ID
      const employeeId = await generateUniqueEmployeeId()

      console.log(`[CloudFunction] Generated ID ${employeeId} for employee ${uid}`)

      // Update document with generated ID
      await db.collection('employees').doc(uid).update({
        employeeId: employeeId,
        employeeIdPending: false,
        employeeIdGeneratedAt: admin.firestore.Timestamp.now(),
      })

      console.log(`[CloudFunction] Successfully updated employee ${uid} with ID ${employeeId}`)
    } catch (error) {
      console.error(`[CloudFunction] Error generating ID for ${uid}:`, error)
      
      // Mark as failed (optional - for debugging)
      await db.collection('employees').doc(uid).update({
        employeeIdPending: false,
        employeeIdError: true,
        employeeIdErrorAt: admin.firestore.Timestamp.now(),
      })
    }
  })

// ============================================
// HELPER: Generate Unique Employee ID
// ============================================

/**
 * Generate a unique 6-digit employee ID
 * 
 * Strategy:
 * 1. Generate random 6-digit number (100000-999999)
 * 2. Check if already exists in Firestore
 * 3. If exists, retry (max 10 attempts)
 * 4. Return unique ID
 * 
 * Probability of collision: ~0.001% even with 1000s of employees
 */
async function generateUniqueEmployeeId(maxRetries = 10): Promise<string> {
  let attempts = 0

  while (attempts < maxRetries) {
    const candidateId = String(Math.floor(Math.random() * 900000) + 100000)

    // Check if this ID already exists
    const snapshot = await db
      .collection('employees')
      .where('employeeId', '==', candidateId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      // ID is unique, return it
      return candidateId
    }

    attempts++
    console.log(`[CloudFunction] ID ${candidateId} exists, retrying (attempt ${attempts}/${maxRetries})`)
  }

  throw new Error(`Failed to generate unique employee ID after ${maxRetries} attempts`)
}

// ============================================
// ALTERNATIVE: Callable Function (Optional)
// ============================================

/**
 * If you want to manually trigger ID generation:
 * 
 * Client-side call:
 * const generateId = httpsCallable(functions, 'manualGenerateEmployeeId')
 * await generateId({ uid: user.uid })
 */
export const manualGenerateEmployeeId = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
    }

    const uid = data.uid || context.auth.uid

    try {
      // Generate ID
      const employeeId = await generateUniqueEmployeeId()

      // Update document
      await db.collection('employees').doc(uid).update({
        employeeId: employeeId,
        employeeIdPending: false,
      })

      return {
        success: true,
        employeeId: employeeId,
      }
    } catch (error) {
      console.error('[CloudFunction] Error:', error)
      throw new functions.https.HttpsError('internal', 'Failed to generate employee ID')
    }
  }
)
