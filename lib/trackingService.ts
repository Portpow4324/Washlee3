import { db } from '@/lib/firebase'
import { 
  doc, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  Timestamp,
  addDoc,
  DocumentReference,
  getDocs,
  writeBatch
} from 'firebase/firestore'

export interface TrackingUpdate {
  id?: string
  orderId: string
  timestamp: Timestamp
  status: 'scheduled' | 'collected' | 'in_transit' | 'delivering' | 'delivered' | 'cancelled'
  message: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  proId?: string
  eta?: Timestamp
}

export interface OrderTracking {
  orderId: string
  currentStatus: TrackingUpdate['status']
  updates: TrackingUpdate[]
  proLocation?: {
    latitude: number
    longitude: number
    lastUpdated: Timestamp
    accuracy?: number
  }
  estimatedDelivery?: Timestamp
  deliveryProof?: {
    photoUrl?: string
    signedAt?: Timestamp
    proName?: string
  }
  metrics?: {
    pickupTime?: number // minutes from order creation to pickup
    deliveryTime?: number // minutes from pickup to delivery
    totalDistance?: number // kilometers traveled
    avgSpeed?: number // km/h
    customerNotifications?: number // times customer notified
    lastNotified?: Timestamp
  }
  heatmapData?: {
    region: string
    serviceCount: number
    avgDeliveryTime: number
    demandScore: number
  }
}

// Get order tracking info
export async function getOrderTracking(orderId: string): Promise<OrderTracking | null> {
  try {
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)
    
    if (!orderSnap.exists()) {
      return null
    }

    const orderData = orderSnap.data()
    
    // Get all tracking updates for this order
    const updatesRef = collection(db, 'orders', orderId, 'tracking_updates')
    const updatesSnap = await getDoc(updatesRef as any)
    
    return {
      orderId,
      currentStatus: orderData.status || 'scheduled',
      updates: orderData.trackingUpdates || [],
      estimatedDelivery: orderData.estimatedDelivery,
      deliveryProof: orderData.deliveryProof,
      proLocation: orderData.proLocation
    }
  } catch (error) {
    console.error('Error fetching tracking:', error)
    return null
  }
}

// Subscribe to real-time tracking updates
export function subscribeToTracking(
  orderId: string,
  onUpdate: (tracking: OrderTracking) => void,
  onError?: (error: Error) => void
) {
  try {
    const orderRef = doc(db, 'orders', orderId)
    
    const unsubscribe = onSnapshot(
      orderRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          onUpdate({
            orderId,
            currentStatus: data.status || 'scheduled',
            updates: data.trackingUpdates || [],
            estimatedDelivery: data.estimatedDelivery,
            deliveryProof: data.deliveryProof,
            proLocation: data.proLocation
          })
        }
      },
      (error) => {
        console.error('Tracking subscription error:', error)
        if (onError) onError(error as Error)
      }
    )

    return unsubscribe
  } catch (error) {
    console.error('Error subscribing to tracking:', error)
    return () => {}
  }
}

// Add tracking update (for pros)
export async function addTrackingUpdate(
  orderId: string,
  update: Omit<TrackingUpdate, 'id'>
): Promise<string | null> {
  try {
    const orderRef = doc(db, 'orders', orderId)
    
    // Get current tracking updates
    const orderSnap = await getDoc(orderRef)
    if (!orderSnap.exists()) {
      throw new Error('Order not found')
    }

    const currentUpdates = orderSnap.data().trackingUpdates || []
    const newUpdates = [
      ...currentUpdates,
      {
        ...update,
        timestamp: update.timestamp || Timestamp.now()
      }
    ]

    // Update order with new status and tracking history
    await updateDoc(orderRef, {
      status: update.status,
      trackingUpdates: newUpdates,
      updatedAt: Timestamp.now()
    })

    return 'success'
  } catch (error) {
    console.error('Error adding tracking update:', error)
    return null
  }
}

// Update pro real-time location
export async function updateProLocation(
  orderId: string,
  latitude: number,
  longitude: number,
  address?: string
): Promise<boolean> {
  try {
    const orderRef = doc(db, 'orders', orderId)
    
    await updateDoc(orderRef, {
      proLocation: {
        latitude,
        longitude,
        address,
        lastUpdated: Timestamp.now(),
        accuracy: 10 // meters
      }
    })

    return true
  } catch (error) {
    console.error('Error updating pro location:', error)
    return false
  }
}

// Upload delivery proof (photo)
export async function updateDeliveryProof(
  orderId: string,
  photoUrl: string,
  proName: string
): Promise<boolean> {
  try {
    const orderRef = doc(db, 'orders', orderId)
    
    await updateDoc(orderRef, {
      deliveryProof: {
        photoUrl,
        signedAt: Timestamp.now(),
        proName
      },
      status: 'delivered'
    })

    return true
  } catch (error) {
    console.error('Error updating delivery proof:', error)
    return false
  }
}

// Get ETA for delivery
export function calculateETA(
  currentLocation: { lat: number; lng: number },
  destinationLocation: { lat: number; lng: number }
): { minutes: number; distance: number } {
  // Haversine formula for distance calculation (in km)
  const R = 6371 // Earth's radius in km
  const dLat = (destinationLocation.lat - currentLocation.lat) * (Math.PI / 180)
  const dLng = (destinationLocation.lng - currentLocation.lng) * (Math.PI / 180)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(currentLocation.lat * (Math.PI / 180)) *
      Math.cos(destinationLocation.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  
  // Average delivery speed: 40 km/h in city
  const minutes = Math.ceil((distance / 40) * 60)
  
  return { minutes, distance }
}

// Notification helper
export function getStatusMessage(status: string): string {
  const messages: { [key: string]: string } = {
    scheduled: '✅ Order scheduled',
    collected: '🚗 Pro picked up your laundry',
    in_transit: '⏱️ Being professionally cleaned',
    delivering: '🚗 Out for delivery',
    delivered: '✨ Delivered successfully',
    cancelled: '❌ Order cancelled'
  }
  return messages[status] || 'Order status updated'
}

// ============================================
// REAL-TIME FEATURES
// ============================================

/**
 * Calculate metrics for order performance
 */
export async function calculateOrderMetrics(orderId: string): Promise<any> {
  try {
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)
    
    if (!orderSnap.exists()) return null
    
    const orderData = orderSnap.data()
    const updates = orderData.trackingUpdates || []
    
    // Find key timestamps
    const createdAt = orderData.createdAt?.toDate() || new Date()
    const pickupUpdate = updates.find((u: any) => u.status === 'collected')
    const deliveryUpdate = updates.find((u: any) => u.status === 'delivered')
    
    const pickupTime = pickupUpdate 
      ? Math.round((pickupUpdate.timestamp.toDate() - createdAt) / 60000) 
      : null
    const deliveryTime = deliveryUpdate && pickupUpdate
      ? Math.round((deliveryUpdate.timestamp.toDate() - pickupUpdate.timestamp.toDate()) / 60000)
      : null
    
    return {
      orderId,
      pickupTime,
      deliveryTime,
      totalDistance: orderData.totalDistance || 0,
      avgSpeed: orderData.avgSpeed || 0,
      customerNotifications: orderData.notificationCount || 0,
      lastNotified: orderData.lastNotified
    }
  } catch (error) {
    console.error('Error calculating metrics:', error)
    return null
  }
}

/**
 * Generate heatmap data for service areas
 */
export async function generateHeatmapData(region: string): Promise<any> {
  try {
    const ordersRef = collection(db, 'orders')
    const q = query(ordersRef, where('deliveryState', '==', region))
    const snapshot = await getDocs(q)
    
    let totalDeliveries = 0
    let totalDeliveryTime = 0
    const locationFrequency: { [key: string]: number } = {}
    
    snapshot.forEach((doc) => {
      const data = doc.data()
      totalDeliveries++
      
      if (data.trackingUpdates) {
        const deliveryUpdate = data.trackingUpdates.find((u: any) => u.status === 'delivered')
        const pickupUpdate = data.trackingUpdates.find((u: any) => u.status === 'collected')
        
        if (deliveryUpdate && pickupUpdate) {
          const deliveryTime = 
            (deliveryUpdate.timestamp.toDate() - pickupUpdate.timestamp.toDate()) / 60000
          totalDeliveryTime += deliveryTime
        }
      }
      
      // Track deliveries by suburb
      const suburb = data.deliveryCity || 'Unknown'
      locationFrequency[suburb] = (locationFrequency[suburb] || 0) + 1
    })
    
    const avgDeliveryTime = totalDeliveries > 0 ? totalDeliveryTime / totalDeliveries : 0
    
    // Calculate demand score (0-100)
    const demandScore = Math.min(100, (totalDeliveries / 100) * 10)
    
    return {
      region,
      serviceCount: totalDeliveries,
      avgDeliveryTime: Math.round(avgDeliveryTime),
      demandScore: Math.round(demandScore),
      locations: locationFrequency,
      lastUpdated: Timestamp.now()
    }
  } catch (error) {
    console.error('Error generating heatmap data:', error)
    return null
  }
}

/**
 * Send predictive ETA and notifications to customer
 * This logs the notification intent - email sending can be handled separately
 */
export async function sendETANotification(
  orderId: string,
  customerEmail: string,
  customerName: string,
  estimatedMinutes: number,
  proName: string
): Promise<boolean> {
  try {
    // Increment notification counter
    const orderRef = doc(db, 'orders', orderId)
    const currentData = await getDoc(orderRef)
    
    await updateDoc(orderRef, {
      notificationCount: (currentData.data()?.notificationCount || 0) + 1,
      lastNotified: Timestamp.now()
    })
    
    console.log(`[TRACKING] ✓ ETA notification intent logged for ${customerName}`)
    console.log(`[TRACKING] Pro: ${proName} | ETA: ${estimatedMinutes} minutes`)
    console.log(`[TRACKING] Order: ${orderId} | Email: ${customerEmail}`)
    
    // Note: Email sending can be integrated via webhook or separate email service
    // For now, we log the notification intent in Firestore
    return true
  } catch (error) {
    console.error('Error logging ETA notification:', error)
    return false
  }
}

/**
 * Get real-time metrics dashboard
 */
export async function getTrackingMetricsDashboard(): Promise<any> {
  try {
    const ordersRef = collection(db, 'orders')
    const snapshot = await getDocs(ordersRef)
    
    const metrics = {
      totalOrders: 0,
      avgPickupTime: 0,
      avgDeliveryTime: 0,
      totalDistance: 0,
      topRegions: {} as { [key: string]: number },
      notificationsSent: 0,
      lastUpdated: Timestamp.now()
    }
    
    let totalPickupTime = 0
    let totalDeliveryTime = 0
    let pickupCount = 0
    let deliveryCount = 0
    let notificationCount = 0
    
    snapshot.forEach((doc) => {
      const data = doc.data()
      metrics.totalOrders++
      
      // Region tracking
      const region = data.deliveryState || 'Unknown'
      metrics.topRegions[region] = (metrics.topRegions[region] || 0) + 1
      
      // Metrics
      metrics.totalDistance += data.totalDistance || 0
      notificationCount += data.notificationCount || 0
      
      // Time metrics
      if (data.trackingUpdates) {
        const pickupUpdate = data.trackingUpdates.find((u: any) => u.status === 'collected')
        const deliveryUpdate = data.trackingUpdates.find((u: any) => u.status === 'delivered')
        
        if (pickupUpdate && data.createdAt) {
          const pickupTime = 
            (pickupUpdate.timestamp.toDate() - data.createdAt.toDate()) / 60000
          totalPickupTime += pickupTime
          pickupCount++
        }
        
        if (deliveryUpdate && pickupUpdate) {
          const deliveryTime = 
            (deliveryUpdate.timestamp.toDate() - pickupUpdate.timestamp.toDate()) / 60000
          totalDeliveryTime += deliveryTime
          deliveryCount++
        }
      }
    })
    
    return {
      totalOrders: metrics.totalOrders,
      avgPickupTime: pickupCount > 0 ? Math.round(totalPickupTime / pickupCount) : 0,
      avgDeliveryTime: deliveryCount > 0 ? Math.round(totalDeliveryTime / deliveryCount) : 0,
      totalDistance: Math.round(metrics.totalDistance * 10) / 10,
      notificationsSent: notificationCount,
      topRegions: metrics.topRegions,
      lastUpdated: metrics.lastUpdated
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return null
  }
}

/**
 * Comprehensive analytics metrics collection for dashboard
 * Collects DAU, MAU, booking trends, delivery metrics, and customer satisfaction
 */
export async function collectAnalyticsMetrics(days: number = 30) {
  try {
    console.log(`[ANALYTICS] Collecting metrics for last ${days} days...`)
    const ordersRef = collection(db, 'orders')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const q = query(
      ordersRef,
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    )

    const snapshot = await getDocs(q)
    
    const metrics = {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      dailyActiveUsers: new Set<string>(),
      monthlyActiveUsers: new Set<string>(),
      regions: {} as Record<string, number>,
      hourlyDistribution: {} as Record<number, number>,
      dayOfWeekDistribution: {} as Record<string, number>,
    }

    let totalPickupTime = 0
    let pickupCount = 0
    let totalDeliveryTime = 0
    let deliveryCount = 0
    let totalRating = 0
    let ratingCount = 0

    snapshot.forEach((doc) => {
      const data = doc.data()
      metrics.totalOrders++
      metrics.totalRevenue += data.totalAmount || 0

      // User tracking
      if (data.userId) {
        metrics.dailyActiveUsers.add(data.userId)
        metrics.monthlyActiveUsers.add(data.userId)
      }

      // Region tracking
      const region = data.deliveryState || 'Unknown'
      metrics.regions[region] = (metrics.regions[region] || 0) + 1

      // Day of week distribution
      if (data.createdAt) {
        const date = data.createdAt.toDate()
        const hour = date.getHours()
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        
        metrics.hourlyDistribution[hour] = (metrics.hourlyDistribution[hour] || 0) + 1
        metrics.dayOfWeekDistribution[dayName] = (metrics.dayOfWeekDistribution[dayName] || 0) + 1
      }

      // Status tracking
      if (data.status === 'delivered') {
        metrics.completedOrders++
      } else if (data.status === 'cancelled') {
        metrics.cancelledOrders++
      }

      // Rating tracking
      if (data.rating) {
        totalRating += data.rating
        ratingCount++
      }

      // Time metrics
      if (data.trackingUpdates && Array.isArray(data.trackingUpdates)) {
        const pickupUpdate = data.trackingUpdates.find((u: any) => u.status === 'collected')
        const deliveryUpdate = data.trackingUpdates.find((u: any) => u.status === 'delivered')

        if (pickupUpdate && data.createdAt) {
          const pickupTime = 
            (pickupUpdate.timestamp.toDate().getTime() - data.createdAt.toDate().getTime()) / 60000
          totalPickupTime += pickupTime
          pickupCount++
        }

        if (deliveryUpdate && pickupUpdate) {
          const deliveryTime = 
            (deliveryUpdate.timestamp.toDate().getTime() - pickupUpdate.timestamp.toDate().getTime()) / 60000
          totalDeliveryTime += deliveryTime
          deliveryCount++
        }
      }
    })

    const analyticsData = {
      timestamp: Timestamp.now(),
      days,
      summary: {
        totalOrders: metrics.totalOrders,
        completedOrders: metrics.completedOrders,
        cancelledOrders: metrics.cancelledOrders,
        completionRate: metrics.totalOrders > 0 ? Math.round((metrics.completedOrders / metrics.totalOrders) * 100) : 0,
        avgPickupTime: pickupCount > 0 ? Math.round(totalPickupTime / pickupCount) : 0,
        avgDeliveryTime: deliveryCount > 0 ? Math.round(totalDeliveryTime / deliveryCount) : 0,
        dau: metrics.dailyActiveUsers.size,
        mau: metrics.monthlyActiveUsers.size,
        totalRevenue: Math.round(metrics.totalRevenue * 100) / 100,
        avgOrderValue: metrics.totalOrders > 0 ? Math.round((metrics.totalRevenue / metrics.totalOrders) * 100) / 100 : 0,
        avgRating: ratingCount > 0 ? Math.round((totalRating / ratingCount) * 100) / 100 : 0,
      },
      topRegions: Object.entries(metrics.regions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([region, count]) => ({ region, count })),
      hourlyDistribution: metrics.hourlyDistribution,
      dayOfWeekDistribution: metrics.dayOfWeekDistribution,
    }

    // Log to Firestore for audit trail
    await addDoc(collection(db, 'analytics_snapshots'), analyticsData)
    console.log(`[ANALYTICS] ✓ Metrics collected: ${metrics.totalOrders} orders, $${analyticsData.summary.totalRevenue} revenue`)

    return analyticsData.summary
  } catch (error) {
    console.error('[ANALYTICS] Error collecting analytics metrics:', error)
    return null
  }
}