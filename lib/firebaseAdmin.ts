import admin from 'firebase-admin';

// Initialize primary Firebase Admin SDK
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com';
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  console.log('[Firebase Admin] Initializing with projectId:', projectId);
  console.log('[Firebase Admin] clientEmail:', clientEmail);
  console.log('[Firebase Admin] privateKey present:', !!privateKey);
  console.log('[Firebase Admin] privateKey length:', privateKey?.length);

  if (!privateKey) {
    console.error('[Firebase Admin] FIREBASE_PRIVATE_KEY is not set in environment!');
  }

  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${projectId}.firebaseio.com`,
    });
    console.log('[Firebase Admin] ✓ Primary SDK initialized successfully');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('[Firebase Admin] Initialization error:', error.message);
    } else {
      console.log('[Firebase Admin] ✓ Primary SDK already initialized');
    }
  }
}

// Initialize secondary Firebase Admin SDK (lukaverde service account)
let secondaryAdmin: admin.app.App | null = null;

export function getSecondaryAdmin() {
  if (!secondaryAdmin) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_SECONDARY_PROJECT_ID,
      clientEmail: process.env.FIREBASE_SECONDARY_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_SECONDARY_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    secondaryAdmin = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: `https://${process.env.FIREBASE_SECONDARY_PROJECT_ID}.firebaseio.com`,
      },
      'secondary'
    );
  }

  return secondaryAdmin;
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminRealtimeDb = (() => {
  try {
    return admin.database();
  } catch (error: any) {
    console.warn('[Firebase Admin] Realtime DB not available:', error.message);
    return null;
  }
})();

export const secondaryAuth = () => getSecondaryAdmin().auth();
export const secondaryDb = () => getSecondaryAdmin().firestore();
export const secondaryRealtimeDb = () => {
  try {
    return getSecondaryAdmin().database();
  } catch (error: any) {
    console.warn('[Firebase Admin] Secondary Realtime DB not available:', error.message);
    return null;
  }
};

export default admin;

