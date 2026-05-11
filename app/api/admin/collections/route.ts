import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type CollectionConfig = {
  table: string
  select: string
  order?: string
  filters?: Array<{ column: string; value: string }>
  patchable?: string[]
}

const COLLECTIONS: Record<string, CollectionConfig> = {
  subscriptions: {
    table: 'customers',
    select: 'id, subscription_plan, subscription_status, subscription_active, users(email, name)',
    order: 'updated_at',
  },
  supportTickets: {
    table: 'inquiries',
    select: '*',
    order: 'submitted_at',
    filters: [{ column: 'type', value: 'customer_inquiry' }],
    patchable: ['status', 'admin_notes', 'updated_at'],
  },
  washClub: {
    table: 'wash_clubs',
    select: 'id, user_id, card_number, tier, credits_balance, earned_credits, redeemed_credits, total_spend, status, join_date, users(email)',
    order: 'join_date',
  },
}

function getConfig(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || ''
  const config = COLLECTIONS[name]

  return { name, config }
}

function applyFilters(query: any, config: CollectionConfig) {
  let nextQuery = query

  for (const filter of config.filters || []) {
    nextQuery = nextQuery.eq(filter.column, filter.value)
  }

  if (config.order) {
    nextQuery = nextQuery.order(config.order, { ascending: false })
  }

  return nextQuery
}

export async function GET(request: NextRequest) {
  try {
    const { name, config } = getConfig(request)
    if (!config) {
      return NextResponse.json({ success: false, error: `Unknown admin collection: ${name}` }, { status: 400 })
    }

    let query = applyFilters(supabaseAdmin.from(config.table).select(config.select), config)
    let { data, error } = await query

    if (error && config.select !== '*') {
      query = applyFilters(supabaseAdmin.from(config.table).select('*'), config)
      const fallback = await query
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('[Admin Collections] GET error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load admin collection' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, id, updates } = body
    const config = COLLECTIONS[name]

    if (!config || !id || !updates || typeof updates !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid admin collection update' }, { status: 400 })
    }

    if (!config.patchable?.length) {
      return NextResponse.json({ success: false, error: 'Collection is read-only' }, { status: 405 })
    }

    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => config.patchable?.includes(key))
    )

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ success: false, error: 'No allowed fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from(config.table)
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Admin Collections] PATCH error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update admin collection' },
      { status: 500 }
    )
  }
}
