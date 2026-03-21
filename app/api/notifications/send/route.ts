import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { fcmToken, title, body } = await request.json()

    if (!fcmToken || !title || !body) {
      return NextResponse.json(
        { error: 'FCM token, title, and body are required' },
        { status: 400 }
      )
    }

    // FCM notifications coming in Phase 9
    console.log('[API] Notification would be sent:', { fcmToken: fcmToken.slice(-8), title, body })

    return NextResponse.json({
      success: true,
      message: 'Notification queued (Phase 9 implementation)',
    })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
