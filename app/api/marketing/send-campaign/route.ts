import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { getServerSession } from 'next-auth'
import { sendTemplateEmail, sendCampaignEmail } from '@/lib/sendgrid-email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { campaignName, campaignType, segments, templateKey, subject, message, ctaUrl, scheduleTime } = data

    if (!campaignName || !campaignType || !segments || !templateKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create campaign record
    const campaignRef = await adminDb.collection('email_campaigns').add({
      campaignName,
      campaignType, // 'promotional' | 'transactional' | 'newsletter' | 'winback'
      segments, // ['customers'] | ['pros'] | ['new_users'] etc
      templateKey,
      subject,
      message,
      ctaUrl,
      status: scheduleTime ? 'scheduled' : 'sent',
      sentAt: !scheduleTime ? new Date() : null,
      scheduledFor: scheduleTime ? new Date(scheduleTime) : null,
      createdAt: new Date(),
      sentCount: 0,
      openCount: 0,
      clickCount: 0,
      bounceCount: 0,
    })

    // Get recipients based on segments
    const recipientEmails: string[] = []
    for (const segment of segments) {
      const usersSnapshot = await adminDb
        .collection('users')
        .where('segment', '==', segment)
        .select('email')
        .get()

      usersSnapshot.forEach((doc) => {
        if (doc.data().email) {
          recipientEmails.push(doc.data().email)
        }
      })
    }

    // Send campaign
    await sendCampaignEmail(
      campaignRef.id,
      segments,
      templateKey,
      {
        campaignTitle: campaignName,
        campaignMessage: message,
        offerText: ctaUrl ? `Click below to redeem offer` : '',
        callToActionText: ctaUrl ? `Limited time offer - Act now!` : '',
        ctaLink: ctaUrl || '',
        ctaButtonText: 'View Offer',
      },
      scheduleTime ? new Date(scheduleTime) : undefined
    )

    console.log(`[CAMPAIGN] Created: ${campaignRef.id} to ${recipientEmails.length} recipients`)

    return NextResponse.json({
      success: true,
      campaignId: campaignRef.id,
      recipientCount: recipientEmails.length,
      status: scheduleTime ? 'scheduled' : 'sent',
      message: `Campaign ${scheduleTime ? 'scheduled' : 'sent'} to ${recipientEmails.length} recipients`,
    })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignsSnapshot = await adminDb
      .collection('email_campaigns')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const campaigns = campaignsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      sentAt: doc.data().sentAt?.toDate?.(),
      scheduledFor: doc.data().scheduledFor?.toDate?.(),
    }))

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
