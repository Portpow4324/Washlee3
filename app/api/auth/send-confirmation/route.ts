import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emailService'
import { getVerificationEmailHtml } from '@/lib/resend-email'

/**
 * Send confirmation email via SendGrid
 * POST /api/auth/send-confirmation
 * Body: { email: string, firstName: string, verificationCode: string }
 */

export async function POST(request: NextRequest) {
  try {
    console.log('[SendConfirmation] POST endpoint called!')
    const body = await request.json()
    const { email, firstName = 'User', verificationCode } = body

    console.log('[SendConfirmation] Received body:', { email, firstName, verificationCode })

    if (!email) {
      console.log('[SendConfirmation] Email is missing!')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('[SendConfirmation] Sending confirmation email to:', email)
    console.log('[SendConfirmation] FirstName:', firstName)
    console.log('[SendConfirmation] VerificationCode:', verificationCode)

    // Get email template
    const htmlContent = getVerificationEmailHtml(firstName, verificationCode || '000000')

    // Send via SendGrid
    const result = await sendEmail({
      to: email,
      subject: 'Verify Your Washlee Email Address',
      html: htmlContent,
    })

    if (!result.success) {
      console.error('[SendConfirmation] Email send failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    console.log(`[SendConfirmation] ✓ Email sent successfully to:`, email)
    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully',
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('[SendConfirmation] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send confirmation email' },
      { status: 500 }
    )
  }
}
