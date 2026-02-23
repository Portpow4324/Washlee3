import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const db = admin.firestore()
    
    // Get all email campaigns, sorted by creation date (newest first)
    const campaignsSnapshot = await db
      .collection('email_campaigns')
      .orderBy('createdAt', 'desc')
      .get()

    const campaigns = campaignsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        campaignName: data.campaignName || '',
        campaignType: data.campaignType || 'promotional',
        segments: data.segments || [],
        status: data.status || 'draft',
        sentCount: data.sentCount || 0,
        openCount: data.openCount || 0,
        clickCount: data.clickCount || 0,
        createdAt: data.createdAt ? new Date(data.createdAt.toDate?.() || data.createdAt).toISOString() : new Date().toISOString(),
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor.toDate?.() || data.scheduledFor).toISOString() : undefined,
      }
    })

    return NextResponse.json({
      campaigns,
      total: campaigns.length,
    })
  } catch (error) {
    console.error('Error listing campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to list campaigns', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
