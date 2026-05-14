import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession } from '@/lib/security/apiAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type CampaignRow = {
  id: string
  campaign_name: string | null
  campaign_type: string | null
  segments: string[] | null
  status: string | null
  sent_count: number | null
  open_count: number | null
  click_count: number | null
  created_at: string | null
  scheduled_for: string | null
  subject: string | null
  message: string | null
  cta_url: string | null
  template_key: string | null
}

function isMissingTableError(message: string) {
  return /does not exist|schema cache|relation .* not found/i.test(message)
}

function toCampaign(row: CampaignRow) {
  return {
    id: row.id,
    campaignName: row.campaign_name || 'Untitled campaign',
    campaignType: row.campaign_type || 'promotional',
    segments: row.segments || [],
    status: row.status || 'draft',
    sentCount: row.sent_count || 0,
    openCount: row.open_count || 0,
    clickCount: row.click_count || 0,
    createdAt: row.created_at,
    scheduledFor: row.scheduled_for || undefined,
    subject: row.subject || '',
    message: row.message || '',
    ctaUrl: row.cta_url || '',
    templateKey: row.template_key || 'promotional_campaign',
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json(
        { success: false, error: 'Admin session required' },
        { status: 401 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
      .select(
        [
          'id',
          'campaign_name',
          'campaign_type',
          'segments',
          'status',
          'sent_count',
          'open_count',
          'click_count',
          'created_at',
          'scheduled_for',
          'subject',
          'message',
          'cta_url',
          'template_key',
        ].join(', '),
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingTableError(error.message)) {
        return NextResponse.json({
          success: true,
          campaigns: [],
          warning: 'marketing_campaigns table is not available yet',
        })
      }

      throw error
    }

    return NextResponse.json({
      success: true,
      campaigns: ((data || []) as CampaignRow[]).map(toCampaign),
    })
  } catch (error) {
    console.error('[Marketing Campaigns List] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to load campaigns',
      },
      { status: 500 },
    )
  }
}
