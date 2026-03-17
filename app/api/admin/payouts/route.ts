import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, Timestamp } from 'firebase/firestore'

interface PayoutApproval {
  payoutId: string
  action: 'approve' | 'reject' | 'process' | 'complete'
  notes?: string
  bankTransactionId?: string
}

// Helper: Check if user is admin
async function isAdmin(uid: string): Promise<boolean> {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid))
    return adminDoc.exists()
  } catch (error) {
    return false
  }
}

// GET /api/admin/payouts - Get all pending payouts
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user || !(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const status = request.nextUrl.searchParams.get('status') || 'pending'

    const payoutsRef = collection(db, 'employee-payouts')
    const payoutQuery = query(payoutsRef, where('status', '==', status))
    const payoutSnapshot = await getDocs(payoutQuery)

    const payouts = payoutSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ payouts, count: payouts.length }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

// PATCH /api/admin/payouts - Approve/reject/process payouts
export async function PATCH(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user || !(await isAdmin(user.uid))) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { payoutId, action, notes, bankTransactionId } = (await request.json()) as PayoutApproval

    if (!payoutId || !action) {
      return NextResponse.json({ error: 'Payout ID and action required' }, { status: 400 })
    }

    const payoutRef = doc(db, 'employee-payouts', payoutId)
    const payoutDoc = await getDoc(payoutRef)

    if (!payoutDoc.exists()) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    const payoutData = payoutDoc.data()

    // Handle different actions
    let updateData: any = {
      updatedAt: Timestamp.now(),
    }

    switch (action) {
      case 'approve':
        updateData.status = 'processing'
        updateData.approvedAt = Timestamp.now()
        updateData.approvedBy = user.uid
        updateData.notes = notes || ''
        break

      case 'reject':
        updateData.status = 'rejected'
        updateData.rejectedAt = Timestamp.now()
        updateData.rejectedBy = user.uid
        updateData.notes = notes || 'Payout request rejected'
        break

      case 'process':
        updateData.status = 'processing'
        updateData.processedAt = Timestamp.now()
        updateData.processedBy = user.uid
        break

      case 'complete':
        updateData.status = 'completed'
        updateData.completedAt = Timestamp.now()
        updateData.bankTransactionId = bankTransactionId || null
        if (notes) updateData.notes = notes
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await updateDoc(payoutRef, updateData)

    // Create audit log
    const auditRef = collection(db, 'employee-payouts', payoutId, 'audit-log')
    await addDoc(auditRef, {
      action: `payout_${action}`,
      adminId: user.uid,
      adminEmail: user.email,
      amount: payoutData.amount,
      timestamp: Timestamp.now(),
      notes: notes || '',
      bankTransactionId: bankTransactionId || null,
    })

    // If approved, trigger automatic bank transfer (via Cloud Function)
    if (action === 'approve') {
      // Send to queue for processing
      await addDoc(collection(db, 'payout-processing-queue'), {
        payoutId,
        uid: payoutData.uid,
        amount: payoutData.amount,
        bankDetails: payoutData.bankDetails,
        status: 'queued',
        createdAt: Timestamp.now(),
      })

      // Send notification to employee
      await addDoc(collection(db, 'employee-notifications'), {
        uid: payoutData.uid,
        type: 'payout_approved',
        title: 'Payout Approved',
        message: `Your payout of $${payoutData.amount.toFixed(2)} has been approved and will be processed shortly.`,
        read: false,
        createdAt: Timestamp.now(),
      })
    }

    // If rejected, send notification
    if (action === 'reject') {
      await addDoc(collection(db, 'employee-notifications'), {
        uid: payoutData.uid,
        type: 'payout_rejected',
        title: 'Payout Request Rejected',
        message: `Your payout request has been rejected. Reason: ${notes || 'See details in your account'}`,
        read: false,
        createdAt: Timestamp.now(),
      })
    }

    // If completed, update employee earnings
    if (action === 'complete') {
      const employeesRef = collection(db, 'employees')
      const empQuery = query(employeesRef, where('uid', '==', payoutData.uid))
      const empSnapshot = await getDocs(empQuery)

      if (!empSnapshot.empty) {
        const empRef = doc(db, 'employees', empSnapshot.docs[0].id)
        const empData = empSnapshot.docs[0].data()
        const newEarnings = (empData.totalEarnings || 0) - payoutData.amount
        const totalPaidOut = (empData.totalPaidOut || 0) + payoutData.amount

        await updateDoc(empRef, {
          totalEarnings: newEarnings,
          totalPaidOut: totalPaidOut,
          lastPayoutDate: Timestamp.now(),
        })
      }

      // Send confirmation to employee
      await addDoc(collection(db, 'employee-notifications'), {
        uid: payoutData.uid,
        type: 'payout_completed',
        title: 'Payout Completed',
        message: `Your payout of $${payoutData.amount.toFixed(2)} has been transferred to ${payoutData.bankDetails.bankName}. Bank Reference: ${bankTransactionId}`,
        read: false,
        createdAt: Timestamp.now(),
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: `Payout ${action} successful`,
        payout: {
          id: payoutId,
          ...updateData,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Payout update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update payout' }, { status: 500 })
  }
}
