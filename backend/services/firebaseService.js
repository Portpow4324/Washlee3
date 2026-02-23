const admin = require('firebase-admin')

/**
 * Initialize Firebase Admin SDK
 */
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
if (!serviceAccountKey) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set')
}

const serviceAccount = JSON.parse(serviceAccountKey)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const auth = admin.auth()

/**
 * Get user document from Firestore
 */
async function getUser(uid) {
  try {
    const doc = await db.collection('users').doc(uid).get()
    if (!doc.exists) {
      return null
    }
    return { uid: doc.id, ...doc.data() }
  } catch (error) {
    console.error(`[Firebase] Error getting user ${uid}:`, error)
    throw error
  }
}

/**
 * Update user document
 */
async function updateUser(uid, data) {
  try {
    await db.collection('users').doc(uid).update(data)
    return await getUser(uid)
  } catch (error) {
    console.error(`[Firebase] Error updating user ${uid}:`, error)
    throw error
  }
}

/**
 * Query users by conditions
 */
async function queryUsers(conditions = []) {
  try {
    let query = db.collection('users')

    // Apply conditions
    for (const { field, operator, value } of conditions) {
      query = query.where(field, operator, value)
    }

    const snapshot = await query.get()
    const users = []
    snapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() })
    })

    return users
  } catch (error) {
    console.error('[Firebase] Error querying users:', error)
    throw error
  }
}

/**
 * Get pending payment users
 */
async function getPendingPaymentUsers() {
  return queryUsers([
    { field: 'subscription.paymentStatus', operator: '==', value: 'pending' },
  ])
}

/**
 * Get active subscription users
 */
async function getActiveSubscriptionUsers() {
  return queryUsers([
    { field: 'subscription.active', operator: '==', value: true },
  ])
}

/**
 * Get wash club (loyalty) members
 */
async function getWashClubUsers() {
  return queryUsers([
    { field: 'loyaltyMember', operator: '==', value: true },
  ])
}

/**
 * Get employees
 */
async function getEmployeeUsers() {
  return queryUsers([
    { field: 'isEmployee', operator: '==', value: true },
  ])
}

/**
 * Get customers only (no subscriptions, no loyalty, not employees)
 */
async function getCustomerOnlyUsers() {
  return queryUsers([
    { field: 'isEmployee', operator: '==', value: false },
    { field: 'loyaltyMember', operator: '==', value: false },
    { field: 'subscription.active', operator: '==', value: false },
  ])
}

/**
 * Confirm payment (admin manual override)
 */
async function confirmPayment(uid, adminUID) {
  const now = admin.firestore.Timestamp.now()

  return updateUser(uid, {
    'subscription.active': true,
    'subscription.paymentStatus': 'paid',
    'adminApproval.status': 'confirmed',
    'adminApproval.confirmedBy': adminUID,
    'adminApproval.confirmedAt': now,
  })
}

/**
 * Reject/reset payment
 */
async function rejectPayment(uid) {
  return updateUser(uid, {
    'subscription.active': false,
    'subscription.paymentStatus': 'none',
    'adminApproval.status': 'rejected',
  })
}

/**
 * Update subscription after successful Stripe payment
 */
async function activateSubscription(uid, plan) {
  const now = admin.firestore.Timestamp.now()

  return updateUser(uid, {
    'subscription.active': true,
    'subscription.paymentStatus': 'paid',
    'subscription.plan': plan,
    'adminApproval.status': 'confirmed',
    'adminApproval.confirmedBy': 'stripe',
    'adminApproval.confirmedAt': now,
  })
}

/**
 * Deactivate subscription on payment failure
 */
async function deactivateSubscription(uid) {
  return updateUser(uid, {
    'subscription.active': false,
    'subscription.paymentStatus': 'none',
  })
}

/**
 * Create order in Firestore and sync to customer account
 */
async function createOrder(uid, orderData) {
  try {
    const orderId = orderData.orderId || `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Build order object with all booking details
    const order = {
      orderId,
      uid,
      email: orderData.email,
      amount: orderData.amount,
      sessionId: orderData.sessionId,
      paymentId: orderData.paymentId,
      status: orderData.status || 'confirmed',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      timeline: [
        {
          status: 'confirmed',
          timestamp: admin.firestore.Timestamp.now(),
          message: 'Order confirmed with payment',
        }
      ],
    }

    // Include booking data if provided (for laundry services)
    if (orderData.bookingData) {
      order.bookingData = orderData.bookingData
      order.estimatedWeight = orderData.bookingData.estimatedWeight
      order.deliverySpeed = orderData.bookingData.deliverySpeed
      order.deliveryAddress = orderData.bookingData.deliveryAddress
      order.pickupTime = orderData.bookingData.pickupTime
      order.scheduleDate = orderData.bookingData.scheduleDate
      order.scheduleTime = orderData.bookingData.scheduleTime
      order.specialCare = orderData.bookingData.specialCare
    }

    // Save to orders collection
    await db.collection('orders').doc(orderId).set(order)
    console.log(`[Firebase] Order created in orders collection: ${orderId}`)
    
    // CRITICAL: Also save to customer account for syncing
    // This is what syncs the order to the customer's Washlee account
    const userRef = db.collection('users').doc(uid)
    
    // Add order to user's orders array
    await userRef.update({
      orders: admin.firestore.FieldValue.arrayUnion({
        orderId,
        email: orderData.email,
        amount: orderData.amount,
        status: order.status,
        createdAt: order.createdAt,
        estimatedWeight: order.estimatedWeight,
        deliverySpeed: order.deliverySpeed,
        deliveryAddress: order.deliveryAddress,
      }),
      lastOrderId: orderId,
      lastOrderDate: admin.firestore.Timestamp.now(),
    })
    console.log(`[Firebase] ✓ Order synced to customer account: ${uid}`)
    
    return { orderId, ...order }
  } catch (error) {
    console.error(`[Firebase] Error creating order:`, error.message)
    console.error(`[Firebase] Error details:`, error)
    throw error
  }
}

/**
 * Get order by ID
 */
async function getOrder(orderId) {
  try {
    const doc = await db.collection('orders').doc(orderId).get()
    
    if (!doc.exists) {
      console.log(`[Firebase] Order not found: ${orderId}`)
      return null
    }

    return { orderId: doc.id, ...doc.data() }
  } catch (error) {
    console.error(`[Firebase] Error fetching order ${orderId}:`, error.message)
    throw error
  }
}

/**
 * Get orders by user ID
 */
async function getUserOrders(uid) {
  try {
    const snapshot = await db.collection('orders')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get()

    const orders = []
    snapshot.forEach(doc => {
      orders.push({ orderId: doc.id, ...doc.data() })
    })

    return orders
  } catch (error) {
    console.error(`[Firebase] Error fetching orders for ${uid}:`, error.message)
    throw error
  }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status, message) {
  try {
    const order = await getOrder(orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    const timeline = order.timeline || []
    timeline.push({
      status,
      timestamp: admin.firestore.Timestamp.now(),
      message,
    })

    await db.collection('orders').doc(orderId).update({
      status,
      updatedAt: admin.firestore.Timestamp.now(),
      timeline,
    })

    console.log(`[Firebase] Order ${orderId} status updated to ${status}`)
    return true
  } catch (error) {
    console.error(`[Firebase] Error updating order ${orderId}:`, error.message)
    throw error
  }
}

/**
 * Verify Firebase token and get user claims
 */
async function verifyFirebaseToken(token) {
  try {
    const decodedToken = await auth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error('[Firebase] Token verification failed:', error)
    throw new Error('Invalid or expired token')
  }
}

module.exports = {
  db,
  auth,
  getUser,
  updateUser,
  queryUsers,
  getPendingPaymentUsers,
  getActiveSubscriptionUsers,
  getWashClubUsers,
  getEmployeeUsers,
  getCustomerOnlyUsers,
  confirmPayment,
  rejectPayment,
  activateSubscription,
  deactivateSubscription,
  verifyFirebaseToken,
  createOrder,
  getOrder,
  getUserOrders,
  updateOrderStatus,
}
