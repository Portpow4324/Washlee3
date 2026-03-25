import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'MVP disabled' }, { status: 503 })
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, message' },
        { status: 400 }
      )
    }

    // In development, log the message instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log('[SMS] Development mode - SMS would be sent to:', phoneNumber)
      console.log('[SMS] Message:', message)
      return NextResponse.json({ success: true, message: 'SMS logged (development mode)' }, { status: 200 })
    }

    // In production, SMS sending would be implemented here
    // For now, return success to allow signup flow to continue
    console.log('[SMS] SMS sending not yet implemented in production')
    return NextResponse.json({ success: true, message: 'SMS capability not yet available' }, { status: 200 })
  } catch (error: any) {
    console.error('[SMS] Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'MVP disabled' }, { status: 503 })
}
export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'MVP disabled' }, { status: 503 })
}
export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'MVP disabled' }, { status: 503 })
}
