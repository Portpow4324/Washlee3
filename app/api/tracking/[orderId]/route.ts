import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, Timestamp, increment } from 'firebase/firestore'

export interface TrackingUpdate {
  orderId: string
  status: 'pending' | 'accepted' | 'collecting' | 'washing' | 'delivering' | 'completed'
  location?: { lat: number; lng: number }
  eta?: string
  message?: string
  timestamp: Date
}

// GET /api/tracking/[orderId] - Get real-time order status and tracking info
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Fetch order
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderSnap.data()

    // Fetch pro details if assigned
    let proInfo = null
    if (order.assignedPro?.id) {
      const proRef = doc(db, 'pros', order.assignedPro.id)
      const proSnap = await getDoc(proRef)
      if (proSnap.exists()) {
        proInfo = {
          id: proSnap.id,
          name: proSnap.data().name,
          phone: proSnap.data().phone,
          email: proSnap.data().email,
          avatar: proSnap.data().avatar,
          rating: proSnap.data().rating || 0,
          verified: proSnap.data().verified || false,
        }
      }
    }

    // Fetch tracking updates
    const updatesRef = collection(db, 'orders', orderId, 'tracking-updates')
    const updatesSnap = await getDocs(updatesRef)
    const updates = updatesSnap.docs.map(doc => doc.data()).sort((a, b) => {
      const timeA = a.timestamp.toMillis?.() || 0
      const timeB = b.timestamp.toMillis?.() || 0
      return timeB - timeA
    })

    return NextResponse.json({
      orderId,
      status: order.status,
      currentStep: order.status,
      estimatedDelivery: order.estimatedDelivery,
      pickupDate: order.pickupDate,
      deliveryDate: order.deliveryDate,
      pro: proInfo,
      updates: updates.map(u => ({
        ...u,
        timestamp: u.timestamp.toMillis?.() ? new Date(u.timestamp.toMillis()) : u.timestamp,
      })),
      timeline: [
        { step: 'pending', label: 'Order Placed', completed: order.status !== null },
        { step: 'accepted', label: 'Pro Accepted', completed: ['accepted', 'collecting', 'washing', 'delivering', 'completed'].includes(order.status) },
        { step: 'collecting', label: 'Picking Up', completed: ['collecting', 'washing', 'delivering', 'completed'].includes(order.status) },
        { step: 'washing', label: 'Washing', completed: ['washing', 'delivering', 'completed'].includes(order.status) },
        { step: 'delivering', label: 'Delivering', completed: ['delivering', 'completed'].includes(order.status) },
        { step: 'completed', label: 'Completed', completed: order.status === 'completed' },
      ],
    })
  } catch (error: any) {
    console.error('Tracking fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch tracking' }, { status: 500 })
  }
}

// PATCH /api/tracking/[orderId] - Update tracking status (Pro only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params
    const { status, location, eta, message } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'accepted', 'collecting', 'washing', 'delivering', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update order status
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now(),
    })

    // Create tracking update record
    const updateData: TrackingUpdate = {
      orderId,
      status,
      location,
      eta,
      message,
      timestamp: new Date(),
    }

    const updatesRef = collection(db, 'orders', orderId, 'tracking-updates')
    const updateDocRef = await addDoc(updatesRef, {
      ...updateData,
      timestamp: Timestamp.now(),
    })

    // Increment update count on order
    await updateDoc(orderRef, {
      trackingUpdateCount: increment(1),
    })

    return NextResponse.json({
      ...updateData,
      id: updateDocRef.id,
    })
  } catch (error: any) {
    console.error('Tracking update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update tracking' }, { status: 500 })
  }
}
