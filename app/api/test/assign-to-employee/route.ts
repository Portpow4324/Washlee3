/**
 * TEST ENDPOINT - Assign mock order to employee
 * Only for development/testing purposes
 * 
 * Usage: POST /api/test/assign-to-employee
 * Body: { orderId: "..." }
 * 
 * Assigns the order to the logged-in employee's pro_id
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    console.log('[TEST API] Assigning order to employee:', orderId)

    // Get the session to find the employee's ID
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      // Use a test employee ID for development
      const testProId = 'a0392f42-e63a-4f46-b022-16730081c346' // From the screenshots
      
      console.log('[TEST API] Using test employee ID:', testProId)

      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ pro_id: testProId })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        console.error('[TEST API] Error assigning order:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      console.log('[TEST API] ✓ Order assigned to employee')
      return NextResponse.json({
        success: true,
        orderId: data.id,
        proId: data.pro_id,
        message: 'Order assigned to test employee! Refresh /employee/orders to see it.',
      }, { status: 200 })
    }

    return NextResponse.json({ error: 'Auth not implemented in test' }, { status: 400 })
  } catch (err) {
    console.error('[TEST API] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
