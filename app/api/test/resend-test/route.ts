import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[RESEND TEST] ==========================================')
  console.log('[RESEND TEST] Resend Test Endpoint Called')
  
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  console.log('[RESEND TEST] RESEND_API_KEY:', resendApiKey ? '✅ Present' : '❌ Missing')
  console.log('[RESEND TEST] RESEND_FROM_EMAIL:', resendFromEmail || '❌ Missing')
  
  if (!resendApiKey) {
    console.error('[RESEND TEST] ❌ Resend not fully configured!')
    return NextResponse.json(
      { error: 'Resend not fully configured', success: false },
      { status: 500 }
    )
  }

  try {
    console.log('[RESEND TEST] Initializing Resend client with API key:', resendApiKey.substring(0, 10) + '...')
    const resend = new Resend(resendApiKey)
    
    console.log('[RESEND TEST] Attempting to send test email to delivered@resend.dev...')
    const response = await resend.emails.send({
      from: resendFromEmail,
      to: 'delivered@resend.dev', // Resend test inbox
      subject: 'Washlee - Test Email ' + new Date().getTime(),
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2d2b;">
          <h1 style="color: #48C9B0;">Washlee Test Email</h1>
          <p>This is a test email from your Washlee application.</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> ${resendFromEmail}</p>
          <p><strong>To:</strong> delivered@resend.dev</p>
        </div>
      `,
    })

    console.log('[RESEND TEST] Resend response:', JSON.stringify(response, null, 2))
    
    if (response.error) {
      console.error('[RESEND TEST] ❌ Resend error:', response.error)
      return NextResponse.json(
        { 
          success: false,
          error: response.error,
          provider: 'resend'
        },
        { status: 500 }
      )
    }

    console.log('[RESEND TEST] ✅ Email sent successfully via Resend!')
    console.log('[RESEND TEST] Message ID:', response.data?.id)
    
    return NextResponse.json(
      {
        success: true,
        provider: 'resend',
        messageId: response.data?.id,
        email: 'delivered@resend.dev',
        from: resendFromEmail,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[RESEND TEST] ❌ Exception:', error instanceof Error ? error.message : String(error))
    console.error('[RESEND TEST] Full error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : String(error),
        provider: 'resend'
      },
      { status: 500 }
    )
  }
}
