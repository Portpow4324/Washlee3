import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { NotificationPreference, defaultNotificationPreferences, validateNotificationPreference } from '@/lib/notificationService'

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prefRef = doc(db, 'notification-preferences', user.uid)
    const prefSnap = await getDoc(prefRef)

    if (!prefSnap.exists()) {
      // Return default preferences
      return NextResponse.json({
        id: user.uid,
        userId: user.uid,
        ...defaultNotificationPreferences,
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json(prefSnap.data())
  } catch (error: any) {
    console.error('Preferences fetch error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch preferences' }, { status: 500 })
  }
}

// PATCH /api/notifications/preferences - Update preferences
export async function PATCH(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    // Validate inputs
    const validation = validateNotificationPreference(updates)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const prefRef = doc(db, 'notification-preferences', user.uid)

    // Get existing preferences or use defaults
    const prefSnap = await getDoc(prefRef)
    let preferences = prefSnap.exists()
      ? prefSnap.data()
      : { id: user.uid, userId: user.uid, ...defaultNotificationPreferences }

    // Update with new values
    preferences = {
      ...preferences,
      ...updates,
      updatedAt: Timestamp.now(),
    }

    await setDoc(prefRef, preferences)

    return NextResponse.json(preferences)
  } catch (error: any) {
    console.error('Preferences update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update preferences' }, { status: 500 })
  }
}

// POST /api/notifications/preferences/reset - Reset to defaults
export async function POST(request: NextRequest) {
  try {
    const user = auth.currentUser

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prefRef = doc(db, 'notification-preferences', user.uid)

    const preferences: NotificationPreference = {
      id: user.uid,
      userId: user.uid,
      ...defaultNotificationPreferences,
      updatedAt: Timestamp.now(),
    }

    await setDoc(prefRef, preferences)

    return NextResponse.json(preferences)
  } catch (error: any) {
    console.error('Preferences reset error:', error)
    return NextResponse.json({ error: error.message || 'Failed to reset preferences' }, { status: 500 })
  }
}
