import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp, getDoc } from 'firebase/firestore'
import { ProVerification } from '@/lib/proVerificationUtils'

// Middleware to check admin role
async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const adminRef = doc(db, 'admins', userId)
    const adminSnap = await getDoc(adminRef)
    return adminSnap.exists() && adminSnap.data().role === 'admin'
  } catch {
    return false
  }
}

// GET /api/admin/pro-approvals - List pending pro applications
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user || !(await checkAdminRole(user.uid))) {
      return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 403 })
    }

    const params = new URL(request.url).searchParams
    const status = params.get('status') || 'in-review'
    const limit = parseInt(params.get('limit') || '50')

    // Query verifications by status
    const verificationQuery = query(
      collection(db, 'pro-verifications'),
      where('status', '==', status)
    )

    const snapshot = await getDocs(verificationQuery)
    const verifications = snapshot.docs.map(doc => doc.data()).slice(0, limit)

    // Enrich with pro details
    const enriched = await Promise.all(
      verifications.map(async (v: any) => {
        try {
          const proRef = doc(db, 'pros', v.proId)
          const proSnap = await getDoc(proRef)
          return {
            ...v,
            pro: proSnap.exists() ? proSnap.data() : null,
          }
        } catch {
          return v
        }
      })
    )

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error('Pro approvals fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch applications' }, { status: 500 })
  }
}

// PATCH /api/admin/pro-approvals - Approve, reject, or request more docs
export async function PATCH(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user || !(await checkAdminRole(user.uid))) {
      return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 403 })
    }

    const { proId, action, rejectionReason, requestedDocuments, notes } = await request.json()

    if (!proId || !action) {
      return NextResponse.json({ error: 'Pro ID and action required' }, { status: 400 })
    }

    const verificationRef = doc(db, 'pro-verifications', proId)
    const verificationSnap = await getDoc(verificationRef)

    if (!verificationSnap.exists()) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    const verification = verificationSnap.data() as ProVerification

    switch (action) {
      case 'approve':
        verification.status = 'approved'
        verification.verifiedAt = Timestamp.now()

        // Update pro profile with verified badge
        const proRef = doc(db, 'pros', proId)
        await updateDoc(proRef, {
          verified: true,
          verifiedAt: Timestamp.now(),
        })

        // Create approval audit log
        await addDoc(collection(db, 'pro-verifications', proId, 'audit-log'), {
          action: 'approved_by_admin',
          adminId: user.uid,
          timestamp: Timestamp.now(),
          notes,
        })
        break

      case 'reject':
        if (!rejectionReason) {
          return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })
        }
        verification.status = 'rejected'
        verification.rejectionReason = rejectionReason

        // Create rejection audit log
        await addDoc(collection(db, 'pro-verifications', proId, 'audit-log'), {
          action: 'rejected_by_admin',
          adminId: user.uid,
          reason: rejectionReason,
          timestamp: Timestamp.now(),
          notes,
        })
        break

      case 'request_more_docs':
        if (!requestedDocuments || !Array.isArray(requestedDocuments)) {
          return NextResponse.json({ error: 'Requested documents array required' }, { status: 400 })
        }
        verification.status = 'pending'
        verification.notes = `Requested documents: ${requestedDocuments.join(', ')}`

        // Create request audit log
        await addDoc(collection(db, 'pro-verifications', proId, 'audit-log'), {
          action: 'more_docs_requested',
          adminId: user.uid,
          requestedDocuments,
          timestamp: Timestamp.now(),
          notes,
        })
        break

      case 'flag':
        // Flag for manual review
        verification.notes = `[FLAGGED] ${notes || 'Requires manual review'}`

        // Create flag audit log
        await addDoc(collection(db, 'pro-verifications', proId, 'audit-log'), {
          action: 'flagged_for_review',
          adminId: user.uid,
          timestamp: Timestamp.now(),
          notes,
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    verification.updatedAt = Timestamp.now()
    await updateDoc(verificationRef, { ...verification } as any)

    // Fetch pro for response
    const proRef = doc(db, 'pros', proId)
    const proSnap = await getDoc(proRef)

    return NextResponse.json({
      ...verification,
      pro: proSnap.exists() ? proSnap.data() : null,
    })
  } catch (error: any) {
    console.error('Pro approval update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update application' }, { status: 500 })
  }
}

// DELETE /api/admin/pro-approvals - Remove application
export async function DELETE(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user || !(await checkAdminRole(user.uid))) {
      return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 403 })
    }

    const params = new URL(request.url).searchParams
    const proId = params.get('proId')

    if (!proId) {
      return NextResponse.json({ error: 'Pro ID required' }, { status: 400 })
    }

    const verificationRef = doc(db, 'pro-verifications', proId)
    const verificationSnap = await getDoc(verificationRef)

    if (!verificationSnap.exists()) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    // Soft delete by marking as rejected
    const verification = verificationSnap.data() as ProVerification
    verification.status = 'rejected'
    verification.rejectionReason = 'Application removed by admin'

    await updateDoc(verificationRef, { ...verification } as any)

    // Create deletion audit log
    await addDoc(collection(db, 'pro-verifications', proId, 'audit-log'), {
      action: 'removed_by_admin',
      adminId: user.uid,
      timestamp: Timestamp.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Pro approval deletion error:', error)
    return NextResponse.json({ error: error.message || 'Failed to remove application' }, { status: 500 })
  }
}
