/**
 * DEBUG ENDPOINT - Trace through pricing calculation
 * POST /api/test/debug-pricing
 * 
 * Logs what gets calculated for a booking
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[DEBUG-PRICING] ===== FULL PAYLOAD =====')
    console.log('[DEBUG-PRICING] Amount received:', body.amount)
    console.log('[DEBUG-PRICING] Protection plan:', body.protectionPlan)
    console.log('[DEBUG-PRICING] Booking details:', JSON.stringify(body.bookingDetails, null, 2))
    
    // Calculate what it should be
    if (body.bookingDetails) {
      const bd = body.bookingDetails
      const weight = bd.estimatedWeight || (bd.bagCount * 10)
      const rate = bd.deliverySpeed === 'express' ? 12.50 : 7.50
      const laundryBase = weight * rate
      let total = laundryBase
      
      if (bd.hangDry) total += 16.50
      if (bd.protectionPlan === 'premium') total += 3.50
      if (bd.protectionPlan === 'premium-plus') total += 8.50
      if (bd.oversizedItems) total += (bd.oversizedItems * 8.0)
      
      total = Math.max(total, 75.0)
      
      console.log('[DEBUG-PRICING] CALCULATED VALUES:')
      console.log('[DEBUG-PRICING]   - estimatedWeight:', weight)
      console.log('[DEBUG-PRICING]   - deliverySpeed:', bd.deliverySpeed)
      console.log('[DEBUG-PRICING]   - rate:', rate)
      console.log('[DEBUG-PRICING]   - laundryBase:', laundryBase)
      console.log('[DEBUG-PRICING]   - protection:', bd.protectionPlan)
      console.log('[DEBUG-PRICING]   - calculated total:', total)
      console.log('[DEBUG-PRICING]   - API received amount:', body.amount)
      console.log('[DEBUG-PRICING]   - MATCH:', total === body.amount ? '✓ YES' : '✗ NO - MISMATCH!')
    }

    return NextResponse.json({
      success: true,
      message: 'Check server logs for debug output',
    })
  } catch (error) {
    console.error('[DEBUG-PRICING] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
