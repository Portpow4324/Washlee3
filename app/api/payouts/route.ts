import { NextRequest, NextResponse } from 'next/server'
import { getEmployeePayout, updatePayoutBankAccount, requestPayout } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
    }

    const result = await getEmployeePayout(employeeId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Get payout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get payout' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action

    if (action === 'updateBankAccount') {
      const { payoutId, bankInfo } = body
      const result = await updatePayoutBankAccount(payoutId, bankInfo)
      return NextResponse.json(result)
    }

    if (action === 'requestPayout') {
      const { payoutId, amount } = body
      const result = await requestPayout(payoutId, amount)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[API] Payout action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process payout' },
      { status: 500 }
    )
  }
}
