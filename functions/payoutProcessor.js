/**
 * FIREBASE CLOUD FUNCTION - AUTOMATIC PAYOUT PROCESSOR
 * 
 * Deploy to Firebase Cloud Functions:
 * firebase deploy --only functions:processEmployeePayouts
 * 
 * This function:
 * 1. Watches for approved payouts in the processing queue
 * 2. Processes bank transfers automatically
 * 3. Updates payout status to completed
 * 4. Handles failures and retries
 * 
 * For production, integrate with a real banking API (e.g., Open Banking, PayFast)
 */

// npm install firebase-admin firebase-functions cors

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Firestore reference
const db = admin.firestore();

/**
 * HTTP Endpoint - Manual payout trigger (for testing)
 * POST /processEmployeePayouts
 */
exports.processEmployeePayouts = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Verify authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      // Check if user is admin
      const adminDoc = await db.collection('admins').doc(decodedToken.uid).get();
      if (!adminDoc.exists()) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      // Get queued payouts
      const queueSnapshot = await db
        .collection('payout-processing-queue')
        .where('status', '==', 'queued')
        .limit(10)
        .get();

      if (queueSnapshot.empty) {
        res.json({ message: 'No payouts to process', count: 0 });
        return;
      }

      const results = [];

      for (const doc of queueSnapshot.docs) {
        const queueItem = doc.data();
        const payoutId = queueItem.payoutId;

        try {
          // Simulate bank transfer (in production, use real banking API)
          const transferResult = await simulateBankTransfer(
            queueItem.amount,
            queueItem.bankDetails
          );

          if (transferResult.success) {
            // Update payout status to completed
            const payoutRef = db.collection('employee-payouts').doc(payoutId);
            await payoutRef.update({
              status: 'completed',
              completedAt: admin.firestore.Timestamp.now(),
              bankTransactionId: transferResult.transactionId,
              processingStatus: 'success',
            });

            // Update queue item
            await doc.ref.update({
              status: 'completed',
              transactionId: transferResult.transactionId,
              completedAt: admin.firestore.Timestamp.now(),
            });

            // Update employee earnings
            const empQuery = await db
              .collection('employees')
              .where('uid', '==', queueItem.uid)
              .limit(1)
              .get();

            if (!empQuery.empty) {
              const empDoc = empQuery.docs[0];
              const empData = empDoc.data();
              await empDoc.ref.update({
                totalEarnings: (empData.totalEarnings || 0) - queueItem.amount,
                totalPaidOut: (empData.totalPaidOut || 0) + queueItem.amount,
                lastPayoutDate: admin.firestore.Timestamp.now(),
              });
            }

            // Send completion notification
            await db.collection('employee-notifications').add({
              uid: queueItem.uid,
              type: 'payout_completed',
              title: 'Payout Completed',
              message: `Your payout of $${queueItem.amount.toFixed(2)} has been transferred to ${queueItem.bankDetails.bankName}. Reference: ${transferResult.transactionId}`,
              read: false,
              createdAt: admin.firestore.Timestamp.now(),
            });

            results.push({
              payoutId,
              status: 'completed',
              transactionId: transferResult.transactionId,
            });
          } else {
            // Handle failure
            const payoutRef = db.collection('employee-payouts').doc(payoutId);
            await payoutRef.update({
              processingStatus: 'failed',
              failureReason: transferResult.error,
              failureAttempts: (admin.firestore.FieldValue.increment(1)),
              lastFailureTime: admin.firestore.Timestamp.now(),
            });

            // Retry up to 3 times
            const payout = (await payoutRef.get()).data();
            if ((payout.failureAttempts || 0) >= 3) {
              // Max retries reached, notify admin
              await db.collection('admin-notifications').add({
                type: 'payout_failed',
                payoutId,
                message: `Payout ${payoutId} failed after 3 attempts. Manual intervention required.`,
                severity: 'high',
                read: false,
                createdAt: admin.firestore.Timestamp.now(),
              });
            }

            results.push({
              payoutId,
              status: 'failed',
              reason: transferResult.error,
            });
          }
        } catch (error) {
          console.error(`Error processing payout ${payoutId}:`, error);
          results.push({
            payoutId,
            status: 'error',
            reason: error.message,
          });
        }
      }

      res.json({
        message: 'Payout processing completed',
        processedCount: results.length,
        results,
      });
    } catch (error) {
      console.error('Payout processor error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * Simulates bank transfer - Replace with real banking API in production
 * Real options:
 * - Open Banking API (UK/EU)
 * - Plaid (US/EU)
 * - PayFast (AU/ZA)
 * - Stripe Connect
 * - Direct bank API integration
 */
async function simulateBankTransfer(amount, bankDetails) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));

  // Simulate success/failure ratio (95% success)
  if (Math.random() > 0.95) {
    return {
      success: false,
      error: 'Bank transfer failed - Please try again',
    };
  }

  // Generate transaction ID
  const transactionId = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  console.log(`Bank transfer processed:
    Amount: $${amount}
    Account: ${bankDetails.accountNumber}
    Bank: ${bankDetails.bankName}
    Reference: ${transactionId}
  `);

  return {
    success: true,
    transactionId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Scheduled function - Process payouts every 4 hours
 * Enable in Firebase console and uncomment for production
 */
// exports.schedulePayoutProcessing = functions.pubsub
//   .schedule('every 4 hours')
//   .onRun(async (context) => {
//     try {
//       const queueSnapshot = await db
//         .collection('payout-processing-queue')
//         .where('status', '==', 'queued')
//         .get();
//
//       if (queueSnapshot.empty) {
//         console.log('No payouts to process');
//         return;
//       }
//
//       for (const doc of queueSnapshot.docs) {
//         // Process each payout
//       }
//     } catch (error) {
//       console.error('Scheduled payout processing error:', error);
//     }
//   });

/**
 * Firestore trigger - Process when payout is added to queue
 * Uncomment for production
 */
// exports.onPayoutQueued = functions.firestore
//   .document('payout-processing-queue/{docId}')
//   .onCreate(async (snap, context) => {
//     const queueItem = snap.data();
//     // Process payout
//   });
