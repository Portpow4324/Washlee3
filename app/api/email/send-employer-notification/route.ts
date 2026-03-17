import { NextRequest, NextResponse } from 'next/server'
import { sendEmployerNotificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const employeeData = await request.json()

    if (!employeeData.firstName || !employeeData.lastName || !employeeData.email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email' },
        { status: 400 }
      )
    }

    const result = await sendEmployerNotificationEmail(employeeData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send notification' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Employer notification sent successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API] Employer notification email error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to send employer notification' },
      { status: 500 }
    )
  }
}
