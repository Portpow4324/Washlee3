/**
 * TEST ENDPOINT - Create and assign mock order in one call
 * Only for development/testing purposes
 * 
 * Usage: POST /api/test/full-mock-order
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST API] Creating and assigning full mock order...')

    // Generate a valid UUID v4
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Create a mock user
    const mockUserId = generateUUID()
    const mockUserEmail = `test-${Date.now()}@washlee.test`
    const mockUserPhone = `04${Math.floor(Math.random() * 1000000000).toString().padStart(8, '0')}`

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: mockUserId,
        name: 'Test Customer',
        email: mockUserEmail,
        phone: mockUserPhone,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error('[TEST API] Error creating user:', userError)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    console.log('[TEST API] ✓ Created user:', userData.id)

    // Create order and immediately assign to test employee
    const testProId = 'a0392f42-e63a-4f46-b022-16730081c346'

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: mockUserId,
        pro_id: testProId, // Assign immediately
        total_price: 133.50,
        status: 'confirmed',
        pickup_address: '123 Test Street, South Yarra VIC 3141',
        delivery_address: '456 Demo Avenue, Carlton VIC 3053',
        items: JSON.stringify({
          weight: 10,
          bagCount: 1,
          service_type: 'standard',
          delivery_speed: 'express',
          protection_plan: 'premium',
          addOns: {}
        }),
        notes: 'Mock order for testing',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error('[TEST API] Error creating order:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    console.log('[TEST API] ✓ Created and assigned order:', orderData.id)

    return NextResponse.json({
      success: true,
      userId: mockUserId,
      orderId: orderData.id,
      userName: 'Test Customer',
      userEmail: mockUserEmail,
      userPhone: mockUserPhone,
      proId: testProId,
      orderTotal: orderData.total_price,
      message: 'Full mock order created and assigned! Check /employee/orders',
    }, { status: 201 })
  } catch (err) {
    console.error('[TEST API] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
