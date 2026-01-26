import { NextRequest, NextResponse } from 'next/server'
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ResolutionType, ClaimStatus } from '@/lib/claimsUtils'

// Admin verify - in production, check custom claims for 'admin' role
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  // TODO: Verify admin role via Firebase custom claims
  return authHeader.substring(7)
}

// PATCH /api/claims/resolution - Admin updates claim status and resolution
async function handlePatch(request: NextRequest) {
  const admin = await verifyAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { claimId, status, resolution, reason, compensationAmount } = body

    if (!claimId) {
      return NextResponse.json({ error: 'Claim ID required' }, { status: 400 })
    }

    // Verify claim exists
    const claimRef = doc(db, 'claims', claimId)
    const claimSnap = await getDoc(claimRef)

    if (!claimSnap.exists()) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    const claim = claimSnap.data()

    // Validate status transition
    const validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
      submitted: ['reviewing', 'rejected'],
      reviewing: ['approved', 'rejected', 'resolved'],
      approved: ['resolved'],
      rejected: [],
      resolved: [],
    }

    if (
      status &&
      !validTransitions[claim.status as ClaimStatus]?.includes(status as ClaimStatus)
    ) {
      return NextResponse.json(
        { error: `Cannot transition from ${claim.status} to ${status}` },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: Timestamp.now(),
    }

    if (status) {
      updateData.status = status as ClaimStatus
    }

    if (resolution && ['full_refund', 're_wash', 'replacement', 'partial_refund'].includes(resolution)) {
      updateData.resolution = resolution as ResolutionType
    }

    if (compensationAmount !== undefined && compensationAmount >= 0) {
      updateData.compensation = compensationAmount
    }

    if (status === 'reviewing') {
      updateData.reviewedAt = Timestamp.now()
    }

    if (status === 'resolved') {
      updateData.resolvedAt = Timestamp.now()
    }

    // Update claim
    await updateDoc(claimRef, updateData)

    // Log review if approved/rejected
    if (status === 'approved' || status === 'rejected') {
      await addDoc(collection(db, 'claimReviews'), {
        claimId,
        reviewerId: admin,
        status: status === 'approved' ? 'approved' : 'rejected',
        resolution: resolution || claim.resolution,
        compensationAmount: compensationAmount || claim.compensation || 0,
        reason: reason || '',
        timestamp: Timestamp.now(),
      })
    }

    // Log activity
    await addDoc(collection(db, 'auditLog'), {
      action: `claim_${status || 'updated'}`,
      adminId: admin,
      claimId,
      orderId: claim.orderId,
      resolution,
      compensationAmount,
      reason,
      timestamp: Timestamp.now(),
    })

    // Emit event for customer notification
    if (status === 'approved' || status === 'rejected' || status === 'resolved') {
      await addDoc(collection(db, 'events'), {
        type: `claim_${status}`,
        claimId,
        orderId: claim.orderId,
        customerId: claim.customerId,
        proId: claim.proId,
        resolution: resolution || claim.resolution,
        compensationAmount: compensationAmount || claim.compensation || 0,
        timestamp: Timestamp.now(),
        acknowledged: false,
      })
    }

    return NextResponse.json(
      {
        id: claimId,
        message: `Claim ${status || 'updated'} successfully`,
        claim: {
          ...claim,
          ...updateData,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating claim resolution:', error)
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 })
  }
}

// DELETE /api/claims/resolution - Cancel a pending claim (customer only)
async function handleDelete(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = authHeader.substring(7)

  try {
    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('claimId')

    if (!claimId) {
      return NextResponse.json({ error: 'Claim ID required' }, { status: 400 })
    }

    const claimRef = doc(db, 'claims', claimId)
    const claimSnap = await getDoc(claimRef)

    if (!claimSnap.exists()) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    const claim = claimSnap.data()

    // Only allow customer to withdraw submitted claims
    if (claim.customerId !== user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (claim.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Can only withdraw claims in submitted status' },
        { status: 400 }
      )
    }

    // Mark as withdrawn (soft delete)
    await updateDoc(claimRef, {
      status: 'rejected',
      updatedAt: Timestamp.now(),
    })

    // Log activity
    await addDoc(collection(db, 'auditLog'), {
      action: 'claim_withdrawn',
      userId: user,
      claimId,
      orderId: claim.orderId,
      timestamp: Timestamp.now(),
    })

    return NextResponse.json({ message: 'Claim withdrawn' }, { status: 200 })
  } catch (error) {
    console.error('Error withdrawing claim:', error)
    return NextResponse.json({ error: 'Failed to withdraw claim' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  return handlePatch(request)
}

export async function DELETE(request: NextRequest) {
  return handleDelete(request)
}
