import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import {
  validateDamageClaim,
  getAutoResolution,
  ClaimStatus,
  DamageClaim,
} from '@/lib/claimsUtils'

// Helper to verify user authentication
async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  // In production, verify token properly
  return authHeader.substring(7)
}

// GET /api/claims - Fetch user's claims (with optional filters)
async function handleGet(request: NextRequest) {
  const user = await verifyUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderId = searchParams.get('orderId')

    const constraints: QueryConstraint[] = [where('customerId', '==', user)]

    if (status) {
      constraints.push(where('status', '==', status))
    }

    if (orderId) {
      constraints.push(where('orderId', '==', orderId))
    }

    const q = query(collection(db, 'claims'), ...constraints)
    const snapshot = await getDocs(q)

    const claims = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DamageClaim[]

    return NextResponse.json({ claims }, { status: 200 })
  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 })
  }
}

// POST /api/claims - Submit a new damage claim
async function handlePost(request: NextRequest) {
  const user = await verifyUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { orderId, damageType, severity, description, photos, proId, orderTotal } = body

    // Validation
    const validation = validateDamageClaim({
      orderId,
      customerId: user,
      proId,
      damageType,
      severity,
      description,
      photos,
    })

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Verify order exists and belongs to user
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const orderData = orderSnap.data()
    if (orderData.customerId !== user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if claim already exists for this order
    const existingQ = query(
      collection(db, 'claims'),
      where('orderId', '==', orderId),
      where('customerId', '==', user)
    )
    const existingSnap = await getDocs(existingQ)

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: 'A claim already exists for this order' },
        { status: 400 }
      )
    }

    // Get auto-resolution
    const resolution = getAutoResolution(severity, orderTotal || 0)

    // Create claim
    const claimRef = await addDoc(collection(db, 'claims'), {
      orderId,
      customerId: user,
      proId,
      damageType,
      severity,
      description,
      photos,
      status: 'submitted' as ClaimStatus,
      resolution: resolution.type,
      compensation: resolution.amount,
      submittedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Log activity
    await addDoc(collection(db, 'auditLog'), {
      action: 'claim_submitted',
      userId: user,
      orderId,
      claimId: claimRef.id,
      severity,
      timestamp: Timestamp.now(),
    })

    // Emit event for admin notification
    await addDoc(collection(db, 'events'), {
      type: 'claim_submitted',
      claimId: claimRef.id,
      orderId,
      customerId: user,
      proId,
      severity,
      timestamp: Timestamp.now(),
      acknowledged: false,
    })

    return NextResponse.json(
      {
        id: claimRef.id,
        message: 'Claim submitted successfully',
        status: 'submitted',
        estimatedResolution: resolution.type,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting claim:', error)
    return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleGet(request)
}

export async function POST(request: NextRequest) {
  return handlePost(request)
}
