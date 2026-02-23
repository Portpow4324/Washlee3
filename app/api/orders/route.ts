import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (!privateKey) {
    console.error('[ORDERS-API] FIREBASE_PRIVATE_KEY is missing!')
  }
  
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
    privateKey: privateKey?.replace(/\\n/g, '\n'),
  }

  try {
    console.log('[ORDERS-API] Initializing Firebase Admin SDK...')
    console.log('[ORDERS-API] Project ID:', serviceAccount.projectId)
    console.log('[ORDERS-API] Client Email:', serviceAccount.clientEmail)
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.projectId,
    })
    console.log('[ORDERS-API] Firebase Admin SDK initialized successfully')
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('[ORDERS-API] Firebase init error:', error.message)
      console.error('[ORDERS-API] Full error:', error)
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
    console.log('[ORDERS-API] POST request received')
    
    const body = await request.json()
    console.log('[ORDERS-API] Request body received:', { 
      uid: body.uid,
      customerEmail: body.customerEmail,
      orderTotal: body.orderTotal,
      bookingData: body.bookingData ? 'present' : 'missing'
    })
    
    const { uid, userId, customerName, customerEmail, customerPhone, bookingData, orderTotal } = body

    // Support both uid and userId for backward compatibility, but store as uid
    const finalUid = uid || userId
    
    console.log('[ORDERS-API] Final UID:', finalUid)
    
    if (!finalUid || !orderTotal || !bookingData) {
      console.log('[ORDERS-API] Validation failed:', { finalUid: !!finalUid, orderTotal: !!orderTotal, bookingData: !!bookingData })
      return NextResponse.json(
        { error: 'Missing required fields: uid or userId, orderTotal, bookingData' },
        { status: 400 }
      )
    }

    console.log('[ORDERS-API] Creating order for user:', finalUid)

    const orderData = {
      uid: finalUid,
      email: customerEmail,
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
      console.log('[ORDERS-API] Getting orders collection reference...')
      const ordersRef = db.collection('orders')
      console.log('[ORDERS-API] Orders collection reference obtained')
      
      console.log('[ORDERS-API] Adding document to Firestore...')
      const docRef = await ordersRef.add(orderData)
      orderId = docRef.id
      console.log('[ORDERS-API] ✓ Order created successfully:', orderId)
      console.log('[ORDERS-API] Order stored with uid:', finalUid)
      
      return NextResponse.json({
        success: true,
        orderId,
        message: 'Order created successfully'
      }, { status: 201 })
    } catch (dbError: any) {
      const errorMsg = dbError.message || 'Unknown error'
      console.error('[ORDERS-API] Database Error:', errorMsg)
      console.error('[ORDERS-API] Error code:', dbError.code)
      console.error('[ORDERS-API] Full error object:', dbError)

      return NextResponse.json(
        { error: `Failed to create order: ${errorMsg}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error'
    console.error('[ORDERS-API] Outer Error:', errorMsg)
    console.error('[ORDERS-API] Error stack:', error.stack)
    console.error('[ORDERS-API] Full error:', error)

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
