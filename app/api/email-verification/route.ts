import { NextRequest, NextResponse } from 'next/server'
import { sendEmailViaResend, getVerificationEmailHtml } from '@/lib/resend-email'

/**
 * Send email verification email via Resend
 * POST /api/email-verification
 * Body: { email: string, firstName: string, verificationCode: string }
 */

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, verificationCode } = await request.json()

    console.log('[EmailVerification] Received request:', { email, firstName })

    if (!email || !firstName || !verificationCode) {
      console.error('[EmailVerification] Missing required fields:', { email, firstName, verificationCode })
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, verificationCode' },
        { status: 400 }
      )
    }

    // Get email template
    const htmlContent = getVerificationEmailHtml(firstName, verificationCode)

    // Send via Resend
    console.log('[EmailVerification] Sending via Resend to:', email)
    await sendEmailViaResend({
      to: email,
      subject: 'Verify Your Washlee Email Address',
      html: htmlContent,
      replyTo: 'support@washlee.com'
    })

    console.log('[EmailVerification] ✓ Email sent successfully to:', email)
    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      service: 'Resend',
    })
  } catch (error) {
    console.error('[EmailVerification] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
