import { NextRequest, NextResponse } from 'next/server'
import { sendEmployeeConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { employeeEmail, employeeData } = await request.json()

    if (!employeeEmail || !employeeData) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeEmail, employeeData' },
        { status: 400 }
      )
    }

    const result = await sendEmployeeConfirmationEmail(employeeEmail, employeeData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Confirmation email sent successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[API] Employee confirmation email error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to send confirmation email' },
      { status: 500 }
    )
  }
}
