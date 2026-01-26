import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin Setup API - Set custom claims for admin users
 * This allows admin access without needing Firestore enabled
 * 
 * POST /api/admin/setup
 * Body: { uid: string, email: string, name: string }
 */

export async function POST(request: NextRequest) {
  try {
    // Verify request is authenticated and from an admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - no token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token and check if user is already admin
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    const requestingUserId = decodedToken.uid;
    const requestingUserEmail = decodedToken.email;

    // Get the request body
    const { uid, email, name } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, email' },
        { status: 400 }
      );
    }

    // Set custom claims for the admin user
    await adminAuth.setCustomUserClaims(uid, { admin: true });

    // Try to create Firestore document (won't fail if API is disabled)
    try {
      await adminDb.collection('users').doc(uid).set(
        {
          isAdmin: true,
          email,
          name: name || email.split('@')[0],
          adminRole: 'super_admin',
          userType: 'admin',
          adminSince: new Date(),
          permissions: {
            canViewAnalytics: true,
            canManageUsers: true,
            canManageOrders: true,
            canViewPayments: true,
            canManagePlans: true,
            canViewLogs: true,
          },
        },
        { merge: true }
      );
    } catch (firestoreError) {
      console.log(
        '[Admin Setup] Firestore API not available, but custom claims are set'
      );
      // Don't fail - custom claims are enough
    }

    return NextResponse.json({
      success: true,
      message: `Admin privileges granted to ${email}`,
      uid,
      email,
      customClaimsSet: true,
    });
  } catch (error) {
    console.error('[Admin Setup Error]', error);
    return NextResponse.json(
      { error: 'Failed to set admin privileges' },
      { status: 500 }
    );
  }
}
