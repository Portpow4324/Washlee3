/**
 * TEST ENDPOINT - Create mock order with customer profile
 * Only for development/testing purposes
 * 
 * Usage: POST /api/test/create-mock-order
 * 
 * Creates:
 * 1. A mock user profile in users table
 * 2. A mock order linked to that user
 * 
 * Returns: { userId, orderId, success: true }
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST API] Creating mock order with customer profile...')

    // Generate a valid UUID v4
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Create a mock user profile with valid UUID
    const mockUserId = generateUUID()
    const mockUserEmail = `test-${Date.now()}@washlee.test`
    const mockUserPhone = `04${Math.floor(Math.random() * 1000000000).toString().padStart(8, '0')}`

    console.log('[TEST API] Creating user profile:', { mockUserId, mockUserEmail, mockUserPhone })

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: mockUserId,
        name: 'John Smith (Test)',
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

    // Create a mock order
    const bookingDetails = {
      weight: 10,
      bagCount: 1,
      service_type: 'standard',
      delivery_speed: 'express',
      protection_plan: 'premium',
      addOns: {}
    }

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: mockUserId,
        total_price: 133.50,
        status: 'confirmed',
        pickup_address: '123 Test Street, South Yarra VIC 3141',
        delivery_address: '456 Demo Avenue, Carlton VIC 3053',
        items: JSON.stringify(bookingDetails),
        notes: 'Mock order for testing',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error('[TEST API] Error creating order:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    console.log('[TEST API] ✓ Created order:', orderData.id)

    return NextResponse.json({
      success: true,
      userId: mockUserId,
      orderId: orderData.id,
      userName: userData.name,
      userEmail: userData.email,
      orderTotal: orderData.total_price,
      message: 'Mock order created successfully! Go to /employee/orders to see it.',
    }, { status: 201 })
  } catch (err) {
    console.error('[TEST API] Exception:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
