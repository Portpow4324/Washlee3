import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * Verify that a user is an admin
 * Called from API routes and server actions
 */
export async function verifyAdmin(idToken: string): Promise<{ isAdmin: boolean; uid: string | null }> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check Firestore for admin flag
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const isAdmin = userDoc.data()?.isAdmin === true;

    return { isAdmin, uid };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { isAdmin: false, uid: null };
  }
}

/**
 * Middleware to protect admin API routes
 */
export async function adminMiddleware(req: NextRequest) {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.substring(7);

    // Verify admin status
    const { isAdmin, uid } = await verifyAdmin(idToken);

    if (!isAdmin || !uid) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Pass admin info to the route via headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-admin-uid', uid);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Simple function to set a user as admin in Firestore
 * Run this once manually to make your first admin
 */
export async function makeUserAdmin(uid: string): Promise<boolean> {
  try {
    await adminDb.collection('users').doc(uid).update({
      isAdmin: true,
      adminSince: new Date(),
    });
    console.log(`User ${uid} made admin`);
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
}
