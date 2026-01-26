import admin from 'firebase-admin';

// Initialize primary Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
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
export const adminRealtimeDb = admin.database();

export const secondaryAuth = () => getSecondaryAdmin().auth();
export const secondaryDb = () => getSecondaryAdmin().firestore();
export const secondaryRealtimeDb = () => getSecondaryAdmin().database();

export default admin;

