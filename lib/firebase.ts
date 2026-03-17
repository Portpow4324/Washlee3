import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Set auth persistence IMMEDIATELY without async operations
if (typeof window !== 'undefined') {
  // Try IndexedDB first for better performance
  setPersistence(auth, indexedDBLocalPersistence)
    .catch((error) => {
      // Fallback to localStorage
      console.log('[Firebase] IndexedDB unavailable, using localStorage')
      return setPersistence(auth, browserLocalPersistence)
    })
    .catch((error) => {
      console.warn('[Firebase] Persistence setup failed:', error.code)
    })
}

// Initialize Firestore
export const db = getFirestore(app)

export const storage = getStorage(app)

export default app
