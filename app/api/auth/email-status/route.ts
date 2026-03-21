import { NextRequest, NextResponse } from 'next/server'
import { getEmailProviderStatus, verifySMTPConnection } from '@/lib/emailServiceV2'

/**
 * Check email provider configuration and connectivity
 * GET /api/auth/email-status
 * Returns detailed status about available email providers
 */

export async function GET(request: NextRequest) {
  try {
    const status = getEmailProviderStatus()
    
    // Verify SMTP connection if configured
    let smtpConnected = false
    if (status.smtp.configured) {
      smtpConnected = await verifySMTPConnection()
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      providers: {
        resend: {
          ...status.resend,
          status: status.resend.configured && status.resend.verifiedDomain ? 'ready' : 'not-ready',
          issue: !status.resend.configured 
            ? 'API key not set'
            : !status.resend.verifiedDomain
            ? 'Using test email - verify domain in Resend dashboard'
            : null,
        },
        smtp: {
          ...status.smtp,
          status: status.smtp.configured && smtpConnected ? 'ready' : 'not-ready',
          connected: smtpConnected,
          issue: !status.smtp.configured 
            ? 'Not configured'
            : !smtpConnected
            ? 'Connection failed - check credentials'
            : null,
        },
      },
      recommendation: status.smtp.configured && smtpConnected
        ? 'SMTP (Gmail) is ready - emails will be sent via Gmail'
        : status.resend.configured && status.resend.verifiedDomain
        ? 'Resend is ready - verify domain for production'
        : 'No email provider configured',
    })
  } catch (error) {
    console.error('[EmailStatus] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}

/**
 * Send test email
 * POST /api/auth/email-status
 * Body: { to: string, testMode?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, testMode = false } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Email address required in "to" field' },
        { status: 400 }
      )
    }

    // Import sendEmail function
    const { sendEmail } = await import('@/lib/emailServiceV2')

    const result = await sendEmail({
      to,
      subject: '🧺 Washlee Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0;">✓ Email Service Working!</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <p style="font-size: 18px; color: #1f2d2b; margin-top: 0;">Hi there,</p>
            <p style="color: #6b7b78; line-height: 1.6;">This is a test email from Washlee to verify your email configuration is working correctly.</p>
            <div style="background: #E8FFFB; border: 2px solid #48C9B0; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center;">
              <p style="font-size: 14px; color: #1f2d2b; margin: 0;"><strong>Provider:</strong> ${process.env.SMTP_HOST ? 'SMTP (Gmail)' : 'Resend'}</p>
              <p style="font-size: 12px; color: #6b7b78; margin: 10px 0 0 0;">Sent at ${new Date().toISOString()}</p>
            </div>
            <p style="color: #6b7b78; font-size: 12px;">If you received this email, your email service is configured correctly!</p>
          </div>
        </div>
      `,
    })

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          provider: result.provider,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully via ${result.provider}`,
      provider: result.provider,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('[EmailStatus] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test email' },
      { status: 500 }
    )
  }
}
