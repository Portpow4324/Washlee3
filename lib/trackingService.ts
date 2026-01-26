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
  DocumentReference
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
