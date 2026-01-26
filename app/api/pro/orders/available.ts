import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  doc,
  getDoc,
  addDoc
} from 'firebase/firestore'

export const runtime = 'nodejs'

// GET /api/pro/orders/available - Get available orders for pro
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('lat')
    const longitude = searchParams.get('lng')
    const maxDistance = parseInt(searchParams.get('maxDistance') || '50') // km
    const status = searchParams.get('status') || 'pending'

    // Get available orders (pending, not assigned to pro)
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'pending'),
      where('proId', '==', null),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const snapshot = await getDocs(q)
    let orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    // Filter by distance if coordinates provided
    if (latitude && longitude) {
      const proLat = parseFloat(latitude)
      const proLng = parseFloat(longitude)

      orders = orders.filter((order: any) => {
        const orderCoords = order.address?.coordinates
        if (!orderCoords) return true // Include if no coordinates

        const distance = calculateDistance(
          proLat,
          proLng,
          orderCoords.lat,
          orderCoords.lng
        )
        return distance <= maxDistance
      })
    }

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length
    })

  } catch (error) {
    console.error('Available orders error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/pro/orders/accept - Accept an available order
export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      )
    }

    // Get the order
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orderSnap.data()

    // Check if already assigned
    if (order.proId) {
      return NextResponse.json(
        { error: 'Order already accepted by another pro' },
        { status: 400 }
      )
    }

    // Check if still pending
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order is no longer available' },
        { status: 400 }
      )
    }

    // Check pro status (should be verified)
    const proRef = doc(db, 'pros', user.uid)
    const proSnap = await getDoc(proRef)

    if (!proSnap.exists()) {
      return NextResponse.json(
        { error: 'Pro profile not found' },
        { status: 404 }
      )
    }

    const proData = proSnap.data()
    if (proData.verificationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'You must be verified to accept orders' },
        { status: 403 }
      )
    }

    // Update order to assign to pro
    await updateDoc(orderRef, {
      proId: user.uid,
      status: 'accepted',
      assignedPro: {
        id: user.uid,
        name: proData.name,
        phone: proData.phone,
        rating: proData.rating || 0
      },
      updatedAt: Timestamp.now()
    })

    // Create pro-job record
    const jobsRef = collection(db, 'pro-jobs')
    await addDoc(jobsRef, {
      orderId,
      proId: user.uid,
      status: 'accepted',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully',
      orderId
    })

  } catch (error) {
    console.error('Accept order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept order' },
      { status: 500 }
    )
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
