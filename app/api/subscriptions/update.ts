import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, addDoc, Timestamp } from 'firebase/firestore'
import { validateSubscription, planDetails, calculateInvoiceTotal, generateInvoiceNumber, SubscriptionPlan } from '@/lib/subscriptionLogic'

// GET /api/subscriptions - Get user's subscription
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const subQuery = query(collection(db, 'subscriptions'), where('customerId', '==', user.uid))
    const subSnap = await getDocs(subQuery)

    if (subSnap.empty) {
      return NextResponse.json({
        id: null,
        customerId: user.uid,
        plan: 'free',
        status: 'active',
        features: planDetails.free.features,
      })
    }

    return NextResponse.json(subSnap.docs[0].data())
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/subscriptions - Create or upgrade subscription
export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, billingCycle, promoCode } = await request.json()

    const validation = validateSubscription({ customerId: user.uid, plan, billingCycle })
    if (!validation.isValid) return NextResponse.json({ error: validation.error }, { status: 400 })

    // Calculate pricing
    const pricing = calculateInvoiceTotal(plan, billingCycle)

    // TODO: Process payment with Stripe
    // For now, just create subscription record

    const now = new Date()
    const periodEnd = new Date(now.getTime() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000)

    const subscription = {
      customerId: user.uid,
      plan,
      status: 'active',
      billingCycle,
      currentPeriodStart: Timestamp.fromDate(now),
      currentPeriodEnd: Timestamp.fromDate(periodEnd),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    const subRef = await addDoc(collection(db, 'subscriptions'), subscription)

    // Create invoice
    const invoice = {
      customerId: user.uid,
      subscriptionId: subRef.id,
      amount: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
      status: 'sent',
      dueDate: Timestamp.fromDate(periodEnd),
      invoiceNumber: generateInvoiceNumber(),
      createdAt: Timestamp.now(),
    }

    await addDoc(collection(db, 'invoices'), invoice)

    return NextResponse.json({ id: subRef.id, ...subscription }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/subscriptions - Update subscription (upgrade/downgrade)
export async function PATCH(request: NextRequest) {
  try {
    const user = auth.currentUser
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subscriptionId, action, newPlan } = await request.json()

    const subRef = doc(db, 'subscriptions', subscriptionId)
    const subSnap = await getDoc(subRef)

    if (!subSnap.exists()) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

    const subscription = subSnap.data()
    if (subscription.customerId !== user.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    switch (action) {
      case 'upgrade':
        if (!newPlan) return NextResponse.json({ error: 'New plan required' }, { status: 400 })
        await updateDoc(subRef, { plan: newPlan, updatedAt: Timestamp.now() })
        break
      case 'pause':
        await updateDoc(subRef, { status: 'paused', pausedAt: Timestamp.now(), updatedAt: Timestamp.now() })
        break
      case 'resume':
        await updateDoc(subRef, { status: 'active', pausedAt: null, updatedAt: Timestamp.now() })
        break
      case 'cancel':
        await updateDoc(subRef, { status: 'cancelled', cancelledAt: Timestamp.now(), updatedAt: Timestamp.now() })
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
