import { NextRequest, NextResponse } from 'next/server'
import { sendProOrderAssignment } from '@/lib/emailService'
import admin from 'firebase-admin'

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (privateKey) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.projectId,
      })
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        console.error('[PRO-ASSIGNMENT-API] Firebase init error:', error.message)
      }
    }
  }
}

const db = admin.firestore()

/**
 * POST /api/pro/assign-order
 * Assign an order to a pro and send notification email
 * 
 * Body:
 * - orderId: string (required)
 * - proId: string (required)
 * - proEmail: string (required)
 * - proName: string (required)
 * - customerName: string (required)
 * - pickupTime: string (optional)
 * - weight: string (optional)
 * - earnings: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      orderId, 
      proId,
      proEmail, 
      proName,
      customerName,
      pickupTime,
      weight,
      earnings
    } = await request.json()

    if (!orderId || !proId || !proEmail || !proName || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, proId, proEmail, proName, customerName' },
        { status: 400 }
      )
    }

    console.log('[PRO-ASSIGNMENT-API] Assigning order:', orderId, 'to pro:', proId)

    // Get order details from Firestore if not provided
    let orderDetails: any = {
      pickupTime: pickupTime || 'TBD',
      weight: weight || 'TBD',
      earnings: earnings || 'TBD'
    }

    try {
      const orderDoc = await db.collection('orders').doc(orderId).get()
      if (orderDoc.exists) {
        const data = orderDoc.data() as any
        orderDetails = {
          pickupTime: pickupTime || data.pickupTime || 'TBD',
          weight: weight || (data.estimatedWeight ? `${data.estimatedWeight}kg` : 'TBD'),
          earnings: earnings || 'TBD'
        }

        // Update order with assigned pro
        await db.collection('orders').doc(orderId).update({
          assignedProId: proId,
          assignedProName: proName,
          assignedProEmail: proEmail,
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        console.log('[PRO-ASSIGNMENT-API] ✓ Order updated with pro assignment')
      }
    } catch (dbError: any) {
      console.warn('[PRO-ASSIGNMENT-API] Could not fetch order details:', dbError.message)
      // Continue with provided details
    }

    // Send pro order assignment email
    const orderLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/pro/orders/${orderId}`

    const emailResult = await sendProOrderAssignment(
      proEmail,
      proName,
      orderId,
      customerName,
      orderDetails.pickupTime,
      orderDetails.weight,
      orderDetails.earnings,
      orderLink
    )

    if (emailResult.success) {
      console.log('[PRO-ASSIGNMENT-API] ✓ Order assignment email sent to:', proEmail)
      return NextResponse.json(
        { 
          success: true,
          message: 'Order assigned to pro and notification sent',
          orderId,
          proId
        },
        { status: 200 }
      )
    } else {
      console.error('[PRO-ASSIGNMENT-API] Email failed:', emailResult.error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to send notification email',
          orderId,
          proId
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[PRO-ASSIGNMENT-API] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Pro Order Assignment API',
    endpoint: '/api/pro/assign-order',
    method: 'POST',
    body: {
      orderId: 'string',
      proId: 'string',
      proEmail: 'string',
      proName: 'string',
      customerName: 'string',
      pickupTime: 'string (optional)',
      weight: 'string (optional)',
      earnings: 'string (optional)'
    }
  })
}
