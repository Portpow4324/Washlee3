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
import * as functions from 'firebase-functions';
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
export declare const generateEmployeeId: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
/**
 * If you want to manually trigger ID generation:
 *
 * Client-side call:
 * const generateId = httpsCallable(functions, 'manualGenerateEmployeeId')
 * await generateId({ uid: user.uid })
 */
export declare const manualGenerateEmployeeId: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=generateEmployeeId.d.ts.map