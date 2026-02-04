import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.projectId,
    })
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('[ORDERS-API] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

/**
 * POST /api/orders - Create an order in Firestore (server-side)
 * Called from booking/page.tsx when user clicks "Confirm & Pay"
 * This bypasses client-side Firebase issues by using Admin SDK
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, customerName, customerEmail, customerPhone, bookingData, orderTotal } = body

    if (!userId || !orderTotal || !bookingData) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, orderTotal, bookingData' },
        { status: 400 }
      )
    }

    console.log('[ORDERS-API] Creating order for user:', userId)

    const orderData = {
      userId,
      customerName: customerName || 'Customer',
      customerEmail,
      customerPhone: customerPhone || '',
      
      // Pickup details
      pickupTime: bookingData.pickupTime === 'soon' ? 'ASAP' : `${bookingData.scheduleDate} ${bookingData.scheduleTime}`,
      pickupAddress: bookingData.pickupAddress || 'To be provided',
      
      // Laundry preferences
      detergent: bookingData.detergent,
      waterTemperature: bookingData.waterTemp,
      specialCare: bookingData.specialCare,
      foldingPreference: bookingData.foldingPreference,
      estimatedWeight: parseFloat(bookingData.estimatedWeight),
      
      // Delivery - Full address with separate fields
      deliverySpeed: bookingData.deliverySpeed,
      deliveryAddress: bookingData.deliveryAddress,
      deliveryAddressLine1: bookingData.deliveryAddressLine1 || '',
      deliveryAddressLine2: bookingData.deliveryAddressLine2 || '',
      deliveryCity: bookingData.deliveryCity || '',
      deliveryState: bookingData.deliveryState || '',
      deliveryPostcode: bookingData.deliveryPostcode || '',
      deliveryCountry: bookingData.deliveryCountry || 'Australia',
      deliveryNotes: bookingData.deliveryNotes || '',
      
      // Order status
      status: 'pending_payment',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // Pricing
      baseCost: parseFloat(bookingData.estimatedWeight) * 3.0,
      deliveryCost: bookingData.deliverySpeed === 'same-day' ? 5.0 : 0,
      subtotal: orderTotal,
    }

    // Create order in Firestore with proper error handling
    let orderId: string
    try {
      const ordersRef = db.collection('orders')
      const docRef = await ordersRef.add(orderData)
      orderId = docRef.id
      console.log('[ORDERS-API] ✓ Order created successfully:', orderId)
      
      return NextResponse.json({
        success: true,
        orderId,
        message: 'Order created successfully'
      }, { status: 201 })
    } catch (dbError: any) {
      const errorMsg = dbError.message || 'Unknown error'
      console.error('[ORDERS-API] Database Error:', errorMsg, dbError)

      return NextResponse.json(
        { error: `Failed to create order: ${errorMsg}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error'
    console.error('[ORDERS-API] Error:', errorMsg, error)

    return NextResponse.json(
      { error: `Failed to process request: ${errorMsg}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Orders API is running',
    endpoint: '/api/orders',
    method: 'POST'
  })
}
