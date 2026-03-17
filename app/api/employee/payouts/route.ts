import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'

interface PayoutRequest {
  uid: string
  amount: number
  accountHolder: string
  accountNumber: string
  bsb: string
  bankName: string
  accountType: string
}

// POST /api/employee/payouts - Request a payout
export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uid, amount, accountHolder, accountNumber, bsb, bankName, accountType } = (await request.json()) as PayoutRequest

    if (uid !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized - UID mismatch' }, { status: 403 })
    }

    // Validate inputs
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (amount < 50) {
      return NextResponse.json({ error: 'Minimum payout is $50' }, { status: 400 })
    }

    if (!accountHolder || !accountNumber || !bsb || !bankName) {
      return NextResponse.json({ error: 'Missing bank details' }, { status: 400 })
    }

    // Get employee profile to verify earnings
    const employeesRef = collection(db, 'employees')
    const employeeQuery = query(employeesRef, where('uid', '==', user.uid))
    const employeeSnapshot = await getDocs(employeeQuery)

    if (employeeSnapshot.empty) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 })
    }

    const employeeData = employeeSnapshot.docs[0].data()
    const totalEarnings = employeeData.totalEarnings || 0

    // Get pending payouts
    const payoutsRef = collection(db, 'employee-payouts')
    const pendingQuery = query(
      payoutsRef,
      where('uid', '==', user.uid),
      where('status', 'in', ['pending', 'processing'])
    )
    const pendingSnapshot = await getDocs(pendingQuery)
    const totalPending = pendingSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)

    const availableBalance = totalEarnings - totalPending

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Create payout request
    const payoutRequest = {
      uid: user.uid,
      email: user.email,
      amount,
      status: 'pending' as const,
      bankDetails: {
        accountHolder,
        accountNumber,
        bsb,
        bankName,
        accountType,
      },
      requestedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      processedAt: null,
      completedAt: null,
      failureReason: null,
      notes: '',
    }

    const payoutDoc = await addDoc(payoutsRef, payoutRequest)

    // Create audit log
    const auditRef = collection(db, 'employee-payouts', payoutDoc.id, 'audit-log')
    await addDoc(auditRef, {
      action: 'payout_requested',
      userId: user.uid,
      amount,
      timestamp: Timestamp.now(),
      details: {
        bankName: bankName,
        accountHolder: accountHolder,
      },
    })

    // Trigger automated payout processing (optional: via Cloud Function)
    // For now, we'll send notification to admin panel
    await addDoc(collection(db, 'admin-notifications'), {
      type: 'new_payout_request',
      payoutId: payoutDoc.id,
      uid: user.uid,
      amount,
      createdAt: Timestamp.now(),
      read: false,
    })

    return NextResponse.json(
      {
        success: true,
        payoutId: payoutDoc.id,
        message: 'Payout request submitted successfully',
        data: {
          id: payoutDoc.id,
          ...payoutRequest,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Payout request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to request payout' },
      { status: 500 }
    )
  }
}

// GET /api/employee/payouts - Get payout history
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payoutsRef = collection(db, 'employee-payouts')
    const payoutQuery = query(payoutsRef, where('uid', '==', user.uid))
    const payoutSnapshot = await getDocs(payoutQuery)

    const payouts = payoutSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ payouts }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payouts' },
      { status: 500 }
    )
  }
}
