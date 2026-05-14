import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession } from '@/lib/security/apiAuth'
import { cleanString, isBodyTooLarge } from '@/lib/security/validation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const MAX_BODY_BYTES = 64 * 1024
const CAMPAIGN_TYPES = new Set([
  'promotional',
  'transactional',
  'newsletter',
  'winback',
])
const SEGMENTS = new Set(['customers', 'pros', 'new_users', 'inactive_users'])

type CampaignPayload = {
  campaignName?: unknown
  campaignType?: unknown
  segments?: unknown
  templateKey?: unknown
  subject?: unknown
  message?: unknown
  ctaUrl?: unknown
  scheduleTime?: unknown
}

function isMissingTableError(message: string) {
  return /does not exist|schema cache|relation .* not found/i.test(message)
}

function cleanSegments(value: unknown) {
  if (!Array.isArray(value)) return ['customers']
  const cleaned = value
    .map((segment) => cleanString(segment, 40))
    .filter((segment) => SEGMENTS.has(segment))

  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : ['customers']
}

function cleanScheduledFor(value: unknown) {
  const raw = cleanString(value, 80)
  if (!raw) return null

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function cleanPayload(body: CampaignPayload) {
  const campaignName = cleanString(body.campaignName, 160)
  const subject = cleanString(body.subject, 220)
  const campaignType = cleanString(body.campaignType, 40)
  const scheduledFor = cleanScheduledFor(body.scheduleTime)

  return {
    campaignName,
    subject,
    row: {
      campaign_name: campaignName,
      campaign_type: CAMPAIGN_TYPES.has(campaignType)
        ? campaignType
        : 'promotional',
      segments: cleanSegments(body.segments),
      template_key: cleanString(body.templateKey, 120) || 'promotional_campaign',
      subject,
      message: cleanString(body.message, 12000),
      cta_url: cleanString(body.ctaUrl, 600) || null,
      scheduled_for: scheduledFor,
      status: scheduledFor ? 'scheduled' : 'draft',
      updated_at: new Date().toISOString(),
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json(
        { success: false, error: 'Admin session required' },
        { status: 401 },
      )
    }

    if (isBodyTooLarge(request.headers.get('content-length'), MAX_BODY_BYTES)) {
      return NextResponse.json(
        { success: false, error: 'Campaign payload is too large' },
        { status: 413 },
      )
    }

    const body = (await request.json()) as CampaignPayload
    const { campaignName, subject, row } = cleanPayload(body)

    if (!campaignName || !subject) {
      return NextResponse.json(
        { success: false, error: 'Campaign name and subject are required' },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
      .insert(row)
      .select()
      .single()

    if (error) {
      if (isMissingTableError(error.message)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Marketing campaigns table is not available. Apply the latest Supabase migration first.',
          },
          { status: 503 },
        )
      }

      throw error
    }

    return NextResponse.json({
      success: true,
      campaign: data,
      message: row.status === 'scheduled' ? 'Campaign scheduled' : 'Campaign saved as draft',
    })
  } catch (error) {
    console.error('[Marketing Campaigns Create] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create campaign',
      },
      { status: 500 },
    )
  }
}
