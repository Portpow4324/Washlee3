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

// Enable persistent login - tries IndexedDB first, falls back to localStorage
if (typeof window !== 'undefined') {
  // Use IndexedDB for better persistence on modern browsers
  setPersistence(auth, indexedDBLocalPersistence)
    .then(() => {
      console.log('[Firebase] IndexedDB persistence enabled')
    })
    .catch((error) => {
      console.log('[Firebase] IndexedDB failed, trying localStorage:', error.code)
      // Fallback to localStorage
      return setPersistence(auth, browserLocalPersistence)
        .then(() => {
          console.log('[Firebase] localStorage persistence enabled')
        })
        .catch((fallbackError) => {
          console.error('[Firebase] Both persistence methods failed:', fallbackError)
        })
    })
}

export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
