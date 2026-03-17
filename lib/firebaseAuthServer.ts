import { NextRequest } from 'next/server'
import admin from 'firebase-admin'

/**
 * Verify Firebase ID token from Authorization header
 * Returns the decoded token or null if invalid
 */
export async function verifyToken(request: NextRequest): Promise<{ uid: string; email?: string } | null> {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('[AUTH] Authorization header value:', authHeader ? `${authHeader.substring(0, 20)}...` : 'MISSING')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[AUTH] No Bearer token in Authorization header')
      console.warn('[AUTH] Auth header present:', !!authHeader)
      console.warn('[AUTH] Auth header starts with Bearer:', authHeader?.startsWith('Bearer '))
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    console.log('[AUTH] Extracted token:', token.substring(0, 20) + '...')
    
    // Initialize Firebase Admin if needed
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
      if (!privateKey) {
        console.error('[AUTH] FIREBASE_PRIVATE_KEY not set')
        return null
      }
      
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }

      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          projectId: serviceAccount.projectId,
        })
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error('[AUTH] Firebase init error:', error.message)
        }
      }
    }

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token)
    console.log('[AUTH] Token verified for user:', decodedToken.uid)
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    }
  } catch (error: any) {
    console.error('[AUTH] Token verification failed:', error.message)
    return null
  }
}
