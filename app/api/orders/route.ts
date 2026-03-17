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
 * 
 * Supports idempotency keys to prevent duplicate orders from retried requests
 * Use header: Idempotency-Key: <uid>-<timestamp>
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[ORDERS-API] POST request received')
    
    // Extract idempotency key from request header
    const idempotencyKey = request.headers.get('idempotency-key')
    if (idempotencyKey) {
      console.log('[ORDERS-API] Idempotency key provided:', idempotencyKey.substring(0, 20) + '...')
    }
    
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

    // Check for duplicate order using idempotency key
    if (idempotencyKey) {
      try {
        const idempotencyRef = db.collection('idempotency_keys').doc(idempotencyKey)
        const idempotencyDoc = await idempotencyRef.get()

        if (idempotencyDoc && idempotencyDoc.exists) {
          const existingOrder = idempotencyDoc.data()
          console.log('[ORDERS-API] ⟲ Duplicate request detected. Returning cached order:', existingOrder?.orderId)
          
          return NextResponse.json({
            success: true,
            isDuplicate: true,
            data: {
              orderId: existingOrder?.orderId,
              message: 'Order already created (duplicate request)'
            }
          }, { status: 200 })
        }
      } catch (idempotencyError) {
        console.error('[ORDERS-API] Error checking idempotency:', idempotencyError)
        // Continue with order creation if idempotency check fails
      }
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
      // Generate orderId first so we can include it in the document
      const tempDocRef = db.collection('temp').doc()
      orderId = tempDocRef.id
      console.log('[ORDERS-API] Generated orderId:', orderId)
      
      // Include orderId in orderData
      const orderDataWithId = { ...orderData, orderId }
      
      // Remove undefined values to prevent Firestore errors
      const cleanedOrderData = Object.fromEntries(
        Object.entries(orderDataWithId).filter(([_, v]) => v !== undefined)
      )
      
      console.log('[ORDERS-API] Creating order at user subcollection path...')
      console.log(`[ORDERS-API] Path: users/${finalUid}/orders/${orderId}`)
      
      // Create order at user subcollection path so checkout can find it
      await db.collection('users').doc(finalUid).collection('orders').doc(orderId).set(cleanedOrderData, { merge: false })
      
      // Store idempotency key for future requests
      if (idempotencyKey) {
        try {
          await db.collection('idempotency_keys').doc(idempotencyKey).set({
            orderId,
            uid: finalUid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hour TTL
          })
          console.log('[ORDERS-API] ✓ Idempotency key stored')
        } catch (idempotencyError) {
          console.error('[ORDERS-API] Warning: Failed to store idempotency key:', idempotencyError)
          // Don't fail the entire request if idempotency key storage fails
        }
      }
      
      console.log('[ORDERS-API] ✓ Order created successfully:', orderId)
      console.log('[ORDERS-API] Order stored at user subcollection with uid:', finalUid)
      
      return NextResponse.json({
        success: true,
        data: {
          orderId,
          message: 'Order created successfully'
        }
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
