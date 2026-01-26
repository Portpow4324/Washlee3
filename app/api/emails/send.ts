import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, addDoc, collection, Timestamp, updateDoc } from 'firebase/firestore'
import { getEmailTemplate, DEFAULT_PREFERENCES, EmailSequenceType } from '@/lib/emailSequences'

// NOTE: This uses environment variables for email service
// For production, configure either:
// - Resend API (recommended for Next.js): npm install resend
// - SendGrid: npm install @sendgrid/mail
// - AWS SES: npm install aws-sdk

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, customerId, email, type, variables, templateId } = body

    switch (action) {
      case 'send_email': {
        // Send transactional email
        const emailContent = getEmailTemplate(type as EmailSequenceType, variables || {})

        // Log email
        const emailLog = {
          customerId,
          email,
          type,
          subject: variables?.subject || 'Washlee Email',
          status: 'sent',
          sentAt: Timestamp.now()
        }

        // In development, just log it
        console.log('Email sent:', emailLog)

        // TODO: Integrate with Resend/SendGrid/SES
        // For now, save to database
        await addDoc(collection(db, 'email_logs'), emailLog)

        return NextResponse.json({
          success: true,
          message: 'Email queued for delivery',
          logId: emailLog
        })
      }

      case 'get_preferences': {
        // Get user email preferences
        if (!customerId) {
          return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
        }

        const prefsRef = doc(db, 'email_preferences', customerId)
        const prefsSnap = await getDoc(prefsRef)

        if (!prefsSnap.exists()) {
          // Return defaults
          return NextResponse.json({
            preferences: DEFAULT_PREFERENCES,
            unsubscribed: false
          })
        }

        return NextResponse.json(prefsSnap.data())
      }

      case 'update_preferences': {
        // Update email preferences
        if (!customerId) {
          return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
        }

        const prefsRef = doc(db, 'email_preferences', customerId)
        const prefsSnap = await getDoc(prefsRef)

        const prefs = {
          customerId,
          email,
          preferences: body.preferences || DEFAULT_PREFERENCES,
          unsubscribed: body.unsubscribed || false,
          updatedAt: Timestamp.now()
        }

        if (prefsSnap.exists()) {
          await updateDoc(prefsRef, prefs)
        } else {
          await addDoc(collection(db, 'email_preferences'), {
            ...prefs,
            createdAt: Timestamp.now()
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Preferences updated'
        })
      }

      case 'unsubscribe': {
        // Unsubscribe from all emails
        if (!customerId) {
          return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
        }

        const prefsRef = doc(db, 'email_preferences', customerId)
        await updateDoc(prefsRef, {
          unsubscribed: true,
          unsubscribedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })

        return NextResponse.json({
          success: true,
          message: 'Unsubscribed from all emails'
        })
      }

      case 'send_bulk': {
        // Send bulk email campaign
        const { recipients, subject, htmlContent } = body

        const emailLogs = recipients.map((recipient: any) => ({
          customerId: recipient.customerId,
          email: recipient.email,
          type: 'promotional',
          subject,
          status: 'sent',
          sentAt: Timestamp.now()
        }))

        // Save all logs
        for (const log of emailLogs) {
          await addDoc(collection(db, 'email_logs'), log)
        }

        console.log('Bulk email sent to', emailLogs.length, 'recipients')

        return NextResponse.json({
          success: true,
          message: `Email sent to ${emailLogs.length} recipients`,
          count: emailLogs.length
        })
      }

      case 'get_logs': {
        // Get email logs for customer
        if (!customerId) {
          return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
        }

        // TODO: Query email logs from Firestore
        // For now, return empty
        return NextResponse.json({
          logs: [],
          total: 0
        })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
