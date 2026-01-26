import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase'
import { 
  updateProLocation, 
  addTrackingUpdate, 
  updateDeliveryProof 
} from '@/lib/trackingService'
import { Timestamp } from 'firebase/firestore'

// Update pro's live location
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, latitude, longitude, address, photoUrl, proName, status, message } = body
    const orderId = params.id

    // Verify user is authenticated (optional - can add auth check)

    if (action === 'update_location') {
      const success = await updateProLocation(orderId, latitude, longitude, address)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update location' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Location updated',
        location: { latitude, longitude, address }
      })
    }

    if (action === 'update_status') {
      const success = await addTrackingUpdate(orderId, {
        orderId,
        status: status as any,
        message,
        timestamp: Timestamp.now(),
        location: latitude && longitude ? {
          latitude,
          longitude,
          address
        } : undefined
      })

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update status' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Status updated',
        status
      })
    }

    if (action === 'delivery_proof') {
      const success = await updateDeliveryProof(orderId, photoUrl, proName)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to save delivery proof' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Delivery proof saved'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Tracking update error:', error)
    return NextResponse.json(
      { error: 'Failed to process tracking update' },
      { status: 500 }
    )
  }
}

// Get tracking info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = params.id

    // In a real app, you'd query Firestore here
    // For now, returning mock data structure

    return NextResponse.json({
      orderId,
      currentStatus: 'in_transit',
      proLocation: {
        latitude: -33.8688,
        longitude: 151.2093,
        address: 'Sydney, NSW',
        lastUpdated: new Date().toISOString()
      },
      updates: [
        {
          status: 'scheduled',
          message: 'Order scheduled',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          status: 'collected',
          message: 'Laundry picked up',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        },
        {
          status: 'in_transit',
          message: 'Being cleaned',
          timestamp: new Date().toISOString()
        }
      ],
      estimatedDelivery: new Date(Date.now() + 86400000).toISOString()
    })
  } catch (error) {
    console.error('Error fetching tracking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracking info' },
      { status: 500 }
    )
  }
}
