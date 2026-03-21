import { NextRequest, NextResponse } from 'next/server'
import { createBusinessAccount, getBusinessAccount } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, accountData } = body

    const result = await createBusinessAccount(customerId, accountData)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Business account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create business account' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId')
    if (!customerId) {
      return NextResponse.json({ error: 'customerId required' }, { status: 400 })
    }

    const result = await getBusinessAccount(customerId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Get business account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get business account' },
      { status: 500 }
    )
  }
}
