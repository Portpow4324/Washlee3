import { NextResponse, type NextRequest } from 'next/server'
import { sendEmailViaResend } from '@/lib/resend-email'

const SUPPORT_INBOX = process.env.SUPPORT_INBOX_EMAIL || 'support@washlee.com.au'

const TOPIC_LABELS: Record<string, string> = {
  booking: 'Booking help',
  order: 'Existing order',
  pro: 'Becoming a Pro',
  billing: 'Billing',
  feedback: 'Feedback',
  other: 'Other',
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  let body: {
    name?: string
    email?: string
    phone?: string
    subject?: string
    message?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    )
  }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim()
  const phone = (body.phone ?? '').trim()
  const subject = (body.subject ?? '').trim()
  const message = (body.message ?? '').trim()

  if (!name || !email || !message) {
    return NextResponse.json(
      { success: false, error: 'Name, email, and message are required.' },
      { status: 400 }
    )
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { success: false, error: 'That email doesn’t look right.' },
      { status: 400 }
    )
  }
  if (message.length > 5000) {
    return NextResponse.json(
      { success: false, error: 'Message is too long (max 5,000 characters).' },
      { status: 400 }
    )
  }

  const topicLabel = subject ? TOPIC_LABELS[subject] ?? subject : 'General enquiry'
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safePhone = phone ? escapeHtml(phone) : ''
  const safeTopic = escapeHtml(topicLabel)
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />')

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #14201E; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%); color: #fff; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">New Washlee contact message</h1>
        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">${safeTopic}</p>
      </div>
      <div style="background: #f7fefe; padding: 24px; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; font-size: 14px; line-height: 1.5;">
          <tr><td style="padding: 4px 0; color: #6B7B78; width: 90px;">From</td><td style="padding: 4px 0;"><strong>${safeName}</strong> &lt;${safeEmail}&gt;</td></tr>
          ${safePhone ? `<tr><td style="padding: 4px 0; color: #6B7B78;">Phone</td><td style="padding: 4px 0;">${safePhone}</td></tr>` : ''}
          <tr><td style="padding: 4px 0; color: #6B7B78;">Topic</td><td style="padding: 4px 0;">${safeTopic}</td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #E1ECEA; margin: 16px 0;" />
        <p style="margin: 0 0 8px; color: #6B7B78; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Message</p>
        <div style="background: #ffffff; border: 1px solid #E1ECEA; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6;">
          ${safeMessage}
        </div>
      </div>
      <p style="text-align: center; color: #9BA8A6; font-size: 11px; margin: 16px 0 0;">Washlee · Melbourne, Australia</p>
    </div>
  `

  try {
    await sendEmailViaResend({
      to: SUPPORT_INBOX,
      subject: `[Contact] ${topicLabel} — ${name}`,
      html,
      replyTo: email,
    })
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes('not configured')
        ? 'Email is not configured on the server. The team will pick this up via logs.'
        : err instanceof Error
          ? err.message
          : 'Failed to send the message.'

    console.error('[contact] Failed to send email:', err)
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}
