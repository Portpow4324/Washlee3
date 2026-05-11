import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const { date, address, duration_minutes = 30 } = await request.json()

    // Validate input
    if (!date || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: date, address' },
        { status: 400 }
      )
    }

    // Extract zip code from address
    const zipMatch = address.match(/\b(\d{4})\b/)
    const zip = zipMatch ? zipMatch[1] : null

    // Call Supabase function
    const { data, error } = await supabase.rpc('get_available_delivery_slots', {
      p_date: date,
      p_zip: zip,
      p_duration_minutes: duration_minutes
    })

    if (error) {
      console.error('Supabase RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch delivery slots', details: error.message },
        { status: 500 }
      )
    }

    // Transform data
    const slots = data.map((slot: any) => ({
      timeSlot: slot.time_slot,
      availablePros: slot.available_pros || 0,
      remainingCapacity: slot.remaining_capacity || 0
    }))

    return NextResponse.json({
      success: true,
      date,
      slots,
      totalAvailable: slots.filter((s: any) => s.availablePros > 0).length
    })
  } catch (error: any) {
    console.error('Error in delivery-slots API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
