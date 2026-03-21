import { NextRequest, NextResponse } from 'next/server'
import { getUserNotifications, markUserNotificationAsRead, archiveNotification, deleteNotification, createNotification } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const result = await getUserNotifications(userId, unreadOnly)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Get notifications error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action

    if (action === 'create') {
      const { userId, notificationData } = body
      const result = await createNotification(userId, notificationData)
      return NextResponse.json(result)
    }

    if (action === 'markAsRead') {
      const { notificationId } = body
      const result = await markUserNotificationAsRead(notificationId)
      return NextResponse.json(result)
    }

    if (action === 'archive') {
      const { notificationId } = body
      const result = await archiveNotification(notificationId)
      return NextResponse.json(result)
    }

    if (action === 'delete') {
      const { notificationId } = body
      const result = await deleteNotification(notificationId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[API] Notification action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process notification' },
      { status: 500 }
    )
  }
}
