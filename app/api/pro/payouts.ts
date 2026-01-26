import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, Timestamp } from 'firebase/firestore'
import { validatePayout, calculatePayoutMinimum, isPayoutEligible } from '@/lib/earningsUtils'

// GET /api/pro/payouts - Get payout history
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = new URL(request.url).searchParams
    const limit = parseInt(params.get('limit') || '50')

    // Get pro profile
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id

    // Get payouts
    const payoutsQuery = query(collection(db, 'pro-payouts'), where('proId', '==', proId))
    const payoutsSnap = await getDocs(payoutsQuery)
    const payouts = payoutsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const timeA = a.requestedAt?.toMillis?.() || 0
        const timeB = b.requestedAt?.toMillis?.() || 0
        return timeB - timeA
      })
      .slice(0, limit)

    return NextResponse.json(payouts)
  } catch (error: any) {
    console.error('Payouts fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payouts' }, { status: 500 })
  }
}

// POST /api/pro/payouts - Request a payout
export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, paymentMethod, bankAccount } = await request.json()

    if (!amount || !paymentMethod) {
      return NextResponse.json({ error: 'Amount and payment method required' }, { status: 400 })
    }

    // Get pro profile
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id

    // Validate payout
    const payoutData = { proId, amount, paymentMethod, bankAccount }
    const validation = validatePayout(payoutData)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check minimum payout
    if (amount < calculatePayoutMinimum()) {
      return NextResponse.json(
        { error: `Minimum payout is $${calculatePayoutMinimum()}` },
        { status: 400 }
      )
    }

    // Get earnings to verify sufficient balance
    const earningsQuery = query(collection(db, 'earnings-transactions'), where('proId', '==', proId))
    const earningsSnap = await getDocs(earningsQuery)
    const totalEarnings = earningsSnap.docs
      .map(d => d.data())
      .filter((t: any) => t.status !== 'refund')
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    // Get pending payouts
    const pendingPayoutsQuery = query(
      collection(db, 'pro-payouts'),
      where('proId', '==', proId),
      where('status', 'in', ['pending', 'processing'])
    )
    const pendingPayoutsSnap = await getDocs(pendingPayoutsQuery)
    const totalPending = pendingPayoutsSnap.docs.reduce((sum, doc) => sum + (doc.data() as any).amount, 0)

    const availableBalance = totalEarnings - totalPending

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Create payout request
    const payout = {
      proId,
      amount,
      status: 'pending',
      paymentMethod,
      bankAccount: paymentMethod === 'bank_transfer' ? bankAccount : undefined,
      requestedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const payoutRef = await addDoc(collection(db, 'pro-payouts'), payout)

    // Create audit log
    await addDoc(collection(db, 'pro-payouts', payoutRef.id, 'audit-log'), {
      action: 'payout_requested',
      userId: user.uid,
      amount,
      paymentMethod,
      timestamp: Timestamp.now(),
    })

    return NextResponse.json(
      { id: payoutRef.id, ...payout },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Payout request error:', error)
    return NextResponse.json({ error: error.message || 'Failed to request payout' }, { status: 500 })
  }
}

// PATCH /api/pro/payouts/[payoutId] - Update payout (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const adminRef = doc(db, 'admins', user.uid)
    const adminSnap = await getDoc(adminRef)

    if (!adminSnap.exists()) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { payoutId, action, notes } = await request.json()

    if (!payoutId || !action) {
      return NextResponse.json({ error: 'Payout ID and action required' }, { status: 400 })
    }

    const payoutRef = doc(db, 'pro-payouts', payoutId)
    const payoutSnap = await getDoc(payoutRef)

    if (!payoutSnap.exists()) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    const payout = payoutSnap.data()

    switch (action) {
      case 'approve':
        await updateDoc(payoutRef, {
          status: 'processing',
          updatedAt: Timestamp.now(),
        })

        // Create audit log
        await addDoc(collection(db, 'pro-payouts', payoutId, 'audit-log'), {
          action: 'approved',
          adminId: user.uid,
          notes,
          timestamp: Timestamp.now(),
        })
        break

      case 'complete':
        await updateDoc(payoutRef, {
          status: 'completed',
          completedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })

        // Create audit log
        await addDoc(collection(db, 'pro-payouts', payoutId, 'audit-log'), {
          action: 'completed',
          adminId: user.uid,
          timestamp: Timestamp.now(),
        })
        break

      case 'reject':
        await updateDoc(payoutRef, {
          status: 'failed',
          failureReason: notes || 'Rejected by admin',
          updatedAt: Timestamp.now(),
        })

        // Create audit log
        await addDoc(collection(db, 'pro-payouts', payoutId, 'audit-log'), {
          action: 'rejected',
          adminId: user.uid,
          reason: notes,
          timestamp: Timestamp.now(),
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payout update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update payout' }, { status: 500 })
  }
}

// DELETE /api/pro/payouts/[payoutId] - Cancel pending payout
export async function DELETE(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = new URL(request.url).searchParams
    const payoutId = params.get('payoutId')

    if (!payoutId) {
      return NextResponse.json({ error: 'Payout ID required' }, { status: 400 })
    }

    const payoutRef = doc(db, 'pro-payouts', payoutId)
    const payoutSnap = await getDoc(payoutRef)

    if (!payoutSnap.exists()) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    const payout = payoutSnap.data()

    // Only allow cancelling pending payouts
    if (payout.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending payouts' },
        { status: 400 }
      )
    }

    // Verify ownership
    if (payout.proId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await updateDoc(payoutRef, {
      status: 'cancelled',
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payout cancellation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to cancel payout' }, { status: 500 })
  }
}
