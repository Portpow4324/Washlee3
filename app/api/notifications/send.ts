import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { Notification, NotificationEvent, NotificationType, getNotificationTitle } from '@/lib/notificationService'

// POST /api/notifications/send - Send notification (Internal/Admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId, event, title, message, notificationType, data } = await request.json()

    if (!userId || !event || !title || !message || !notificationType) {
      return NextResponse.json(
        { error: 'userId, event, title, message, and notificationType required' },
        { status: 400 }
      )
    }

    // Validate inputs
    const validEvents: NotificationEvent[] = [
      'order_confirmed',
      'pro_assigned',
      'order_pickup',
      'order_washing',
      'order_delivery',
      'order_completed',
      'order_cancelled',
      'review_requested',
      'pro_verified',
      'earnings_ready',
      'support_response',
      'promotional',
    ]

    const validTypes: NotificationType[] = ['email', 'sms', 'push', 'in-app']

    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    if (!validTypes.includes(notificationType)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // Create notification record
    const notificationData: Omit<Notification, 'id'> = {
      userId,
      type: notificationType,
      event,
      title: title || getNotificationTitle(event),
      message,
      data,
      read: false,
      createdAt: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, 'notifications'), notificationData)

    // TODO: Send actual notifications via Resend/Twilio
    // if (notificationType === 'email') {
    //   await sendViaResend(userId, notificationData)
    // } else if (notificationType === 'sms') {
    //   await sendViaTwilio(userId, notificationData)
    // } else if (notificationType === 'push') {
    //   await sendViaFCM(userId, notificationData)
    // }

    return NextResponse.json(
      {
        id: docRef.id,
        ...notificationData,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Notification send error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 })
  }
}

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = new URL(request.url).searchParams
    const limit = parseInt(params.get('limit') || '50')
    const unreadOnly = params.get('unreadOnly') === 'true'

    // Query notifications
    let q = query(collection(db, 'notifications'), where('userId', '==', user.uid))

    const snapshot = await getDocs(q)
    let notifications = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        const timeA = (a as any).createdAt?.toMillis?.() || 0
        const timeB = (b as any).createdAt?.toMillis?.() || 0
        return timeB - timeA
      })
      .slice(0, limit)

    if (unreadOnly) {
      notifications = notifications.filter((n: any) => !n.read)
    }

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 })
  }
}

// PATCH /api/notifications/[id] - Mark as read
export async function PATCH(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId, action } = await request.json()

    if (!notificationId || !action) {
      return NextResponse.json({ error: 'notificationId and action required' }, { status: 400 })
    }

    const notifRef = doc(db, 'notifications', notificationId)

    switch (action) {
      case 'mark_read':
        await updateDoc(notifRef, {
          read: true,
          readAt: Timestamp.now(),
        })
        break

      case 'mark_unread':
        await updateDoc(notifRef, {
          read: false,
        })
        break

      case 'delete':
        // Soft delete by marking with deletedAt
        await updateDoc(notifRef, {
          deleted: true,
          deletedAt: Timestamp.now(),
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update notification' }, { status: 500 })
  }
}
