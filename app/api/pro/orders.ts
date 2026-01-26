import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, Timestamp } from 'firebase/firestore'
import { ProJob, validateProJob } from '@/lib/proJobUtils'

// GET /api/pro/orders?status=available|accepted|in-progress - Get pro's jobs
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = new URL(request.url).searchParams
    const status = params.get('status') || 'available'

    // Get pro profile
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id

    // Query jobs by status
    const jobsQuery = query(
      collection(db, 'pro-jobs'),
      where('proId', '==', proId),
      where('status', '==', status)
    )

    const snapshot = await getDocs(jobsQuery)
    const jobs = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const timeA = a.pickupTime?.toMillis?.() || 0
        const timeB = b.pickupTime?.toMillis?.() || 0
        return timeA - timeB
      })

    return NextResponse.json(jobs)
  } catch (error: any) {
    console.error('Jobs fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch jobs' }, { status: 500 })
  }
}

// GET /api/pro/orders/available - Get available orders for pro to accept
export async function PUT(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pro profile
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id
    const proData = proSnapshot.docs[0].data()

    // Get all unassigned orders (status = pending)
    const ordersQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'pending')
    )

    const snapshot = await getDocs(ordersQuery)
    const availableOrders = snapshot.docs
      .map(doc => {
        const order = doc.data()
        // Filter by pro's service area (simplified - in production, use geohashing)
        return {
          id: doc.id,
          customerId: order.customerId,
          weight: order.totalWeight || 0,
          pickupAddress: order.pickupAddress,
          deliveryAddress: order.deliveryAddress,
          pickupTime: order.pickupDate,
          estimatedDelivery: order.estimatedDelivery,
          services: order.items?.map((i: any) => i.service) || [],
          price: order.total || 0,
          customerRating: order.customerRating || 4.5,
          distance: Math.random() * 10, // Dummy distance - replace with real calculation
          estimatedEarnings: (order.total || 0) * 0.7, // 70% to pro
        }
      })
      .filter((o: any) => o.distance <= (proData.maxDistance || 15))

    return NextResponse.json(availableOrders)
  } catch (error: any) {
    console.error('Available orders fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch available orders' }, { status: 500 })
  }
}

// POST /api/pro/orders - Accept a job
export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, action } = await request.json()

    if (!orderId || !action) {
      return NextResponse.json({ error: 'orderId and action required' }, { status: 400 })
    }

    // Get pro profile
    const proQuery = query(collection(db, 'pros'), where('userId', '==', user.uid))
    const proSnapshot = await getDocs(proQuery)

    if (proSnapshot.empty) {
      return NextResponse.json({ error: 'Pro profile not found' }, { status: 404 })
    }

    const proId = proSnapshot.docs[0].id
    const proData = proSnapshot.docs[0].data()

    // Get order
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const orderData = orderSnap.data()

    switch (action) {
      case 'accept':
        if (orderData.status !== 'pending') {
          return NextResponse.json({ error: 'Order is no longer available' }, { status: 400 })
        }

        // Create pro job record
        const jobData: Omit<ProJob, 'id'> = {
          orderId,
          customerId: orderData.customerId,
          proId,
          status: 'accepted',
          orderDetails: {
            weight: orderData.totalWeight || 0,
            items: orderData.items?.map((i: any) => i.name) || [],
            specialInstructions: orderData.instructions || '',
            services: orderData.items?.map((i: any) => i.service) || [],
          },
          pickupLocation: {
            address: orderData.pickupAddress,
            lat: orderData.pickupLat || -33.8688,
            lng: orderData.pickupLng || 151.2093,
            instructions: orderData.pickupInstructions || '',
          },
          deliveryLocation: {
            address: orderData.deliveryAddress,
            lat: orderData.deliveryLat || -33.8688,
            lng: orderData.deliveryLng || 151.2093,
            instructions: orderData.deliveryInstructions || '',
          },
          pickupTime: orderData.pickupDate,
          estimatedDeliveryTime: orderData.estimatedDelivery,
          earnings: (orderData.total || 0) * 0.7,
          acceptedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }

        const jobRef = await addDoc(collection(db, 'pro-jobs'), jobData)

        // Update order with assigned pro
        await updateDoc(orderRef, {
          status: 'accepted',
          assignedPro: {
            id: proId,
            name: proData.name,
            phone: proData.phone,
            avatar: proData.avatar,
          },
          updatedAt: Timestamp.now(),
        })

        return NextResponse.json({ id: jobRef.id, ...jobData }, { status: 201 })

      case 'decline':
        // Just return success - order remains available for other pros
        return NextResponse.json({ success: true, message: 'Order declined' })

      case 'return':
        // Return an accepted job back to available pool
        const jobQuery = query(
          collection(db, 'pro-jobs'),
          where('orderId', '==', orderId),
          where('proId', '==', proId)
        )
        const jobSnapshot = await getDocs(jobQuery)

        if (jobSnapshot.empty) {
          return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        const jobId = jobSnapshot.docs[0].id
        const jobRefForReturn = doc(db, 'pro-jobs', jobId)

        await updateDoc(jobRefForReturn, {
          status: 'available',
          updatedAt: Timestamp.now(),
        })

        // Reset order assignment
        await updateDoc(orderRef, {
          status: 'pending',
          assignedPro: null,
          updatedAt: Timestamp.now(),
        })

        return NextResponse.json({ success: true, message: 'Job returned' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Job action error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process job action' }, { status: 500 })
  }
}

// PATCH /api/pro/orders/[jobId] - Update job status
export async function PATCH(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId, status, feedback, rating } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const jobRef = doc(db, 'pro-jobs', jobId)
    const jobSnap = await getDoc(jobRef)

    if (!jobSnap.exists()) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const job = jobSnap.data()

    // Verify ownership
    if (job.proId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates: any = {
      updatedAt: Timestamp.now(),
    }

    if (status) {
      updates.status = status
      if (status === 'completed') {
        updates.actualDeliveryTime = Timestamp.now()
      } else if (status === 'in-progress') {
        updates.actualPickupTime = Timestamp.now()
      }
    }

    if (feedback) updates.feedback = feedback
    if (rating) updates.rating = rating

    await updateDoc(jobRef, updates)

    return NextResponse.json({ ...job, ...updates })
  } catch (error: any) {
    console.error('Job update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update job' }, { status: 500 })
  }
}
