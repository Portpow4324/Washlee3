import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const status = searchParams.get('status')
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
  }
  
  try {
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_id,
        user_id,
        employee_id,
        customer_name,
        customer_email,
        customer_phone,
        pickup_address,
        delivery_address,
        pickup_time,
        delivery_time,
        weight,
        services,
        notes,
        status,
        earnings,
        rating,
        review,
        created_at,
        updated_at
      `)
      .eq('employee_id', userId)
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }
    
    // Order by most recent first
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Orders fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status, ...updateData } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }
    
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
      ...updateData
    }
    
    if (status) {
      updatePayload.status = status
    }
    
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
    
    if (error) {
      console.error('Order update error:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      data: data[0] 
    })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
