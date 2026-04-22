import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    console.log('[Email Test] Starting email test...')
    console.log('[Email Test] Environment variables check:')
    console.log('[Email Test] SMTP_HOST:', process.env.SMTP_HOST)
    console.log('[Email Test] SMTP_USER:', process.env.SMTP_USER)
    console.log('[Email Test] GMAIL_USER:', process.env.GMAIL_USER)
    console.log('[Email Test] ADMIN_EMAIL:', process.env.ADMIN_EMAIL)

    const testEmail = process.env.ADMIN_EMAIL || 'lukaverde045@gmail.com'

    console.log('[Email Test] Sending test email to:', testEmail)

    const success = await sendEmail({
      to: testEmail,
      subject: '📧 Washlee Email Test - Cancellation System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">✅ Email System Test</h1>
          </div>
          
          <div style="background: #f5f5f5; padding: 30px;">
            <h2 style="color: #1f2d2b;">Email Configuration Status</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #1f2d2b;">Test Type:</td>
                <td style="padding: 10px;">Cancellation System Email Verification</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #1f2d2b;">Date/Time:</td>
                <td style="padding: 10px;">${new Date().toLocaleString('en-AU')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; font-weight: bold; color: #1f2d2b;">Recipient:</td>
                <td style="padding: 10px;">${testEmail}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #1f2d2b;">Status:</td>
                <td style="padding: 10px; color: #28a745; font-weight: bold;">✅ Email System Working</td>
              </tr>
            </table>

            <div style="background: #E8FFFB; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <h3 style="color: #48C9B0; margin-top: 0;">What This Means:</h3>
              <ul style="color: #1f2d2b;">
                <li>Email service is configured correctly</li>
                <li>SMTP credentials are valid</li>
                <li>Order cancellation emails will be sent successfully</li>
                <li>Admin and customer notifications are working</li>
              </ul>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">📝 Next Steps:</h3>
              <ol style="color: #856404;">
                <li>Test order cancellation in the dashboard</li>
                <li>Select a cancellation reason</li>
                <li>Customer and admin will receive emails automatically</li>
                <li>Check email folders (inbox + spam) for test emails</li>
              </ol>
            </div>
          </div>

          <div style="background: #1f2d2b; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: white; margin: 0; font-size: 12px;">
              Washlee Laundry Service | Order Cancellation System
            </p>
          </div>
        </div>
      `,
    })

    console.log('[Email Test] Send result:', success)

    return NextResponse.json({
      success,
      message: success
        ? 'Test email sent successfully! Check your email.'
        : 'Test email failed. Check server logs for details.',
      recipient: testEmail,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[Email Test] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Email test failed',
        details: error,
      },
      { status: 500 }
    )
  }
}
