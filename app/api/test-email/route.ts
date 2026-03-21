import { NextRequest, NextResponse } from 'next/server'
import { sendEmailViaResend } from '@/lib/resend-email'

/**
 * Test email sending - for debugging Resend configuration
 * GET /api/test-email?to=your@email.com
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const toEmail = searchParams.get('to') || 'test@example.com'

  try {
    console.log('[TestEmail] Sending test email to:', toEmail)

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2d2b;
      background-color: #f7fefe;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(31, 45, 43, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .header-title {
      font-size: 24px;
      margin: 10px 0 0 0;
    }
    .content {
      padding: 40px 30px;
    }
    .message {
      color: #6b7b78;
      line-height: 1.6;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .success-box {
      background-color: #E8FFFB;
      border: 2px solid #48C9B0;
      border-radius: 8px;
      padding: 25px;
      text-align: center;
      margin: 30px 0;
    }
    .checkmark {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .success-text {
      font-size: 16px;
      font-weight: 600;
      color: #48C9B0;
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      color: #6b7b78;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e8e6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🧺 Washlee</div>
      <h1 class="header-title">Test Email</h1>
    </div>
    
    <div class="content">
      <div class="message">
        This is a test email from Washlee using <strong>Resend</strong>.
      </div>
      
      <div class="success-box">
        <div class="checkmark">✓</div>
        <div class="success-text">If you received this email, Resend is working correctly!</div>
      </div>
      
      <div class="message">
        <strong>Time:</strong> ${new Date().toISOString()}
      </div>
      
      <div class="message">
        You can now use Resend for all Washlee email notifications including:
        <br>✓ Email verification
        <br>✓ Order confirmations
        <br>✓ Delivery updates
        <br>✓ Account notifications
      </div>
    </div>
    
    <div class="footer">
      <div style="margin: 10px 0;">Washlee - On-Demand Laundry Service</div>
      <div style="margin: 10px 0;">© 2026 Washlee. All rights reserved.</div>
    </div>
  </div>
</body>
</html>
    `

    await sendEmailViaResend({
      to: toEmail,
      subject: 'Washlee Test Email - Resend Working',
      html: htmlContent,
    })

    console.log('[TestEmail] ✓ Test email sent successfully to:', toEmail)
    return NextResponse.json({
      success: true,
      message: `Test email sent to ${toEmail}`,
      service: 'Resend',
    })
  } catch (error) {
    console.error('[TestEmail] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Make sure RESEND_API_KEY is set in .env.local'
    }, { status: 500 })
  }
}
