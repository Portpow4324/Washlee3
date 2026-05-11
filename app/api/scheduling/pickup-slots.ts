import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Mock time slots - use this until Supabase functions are set up
const generateMockSlots = (date: string): any[] => {
  const timeSlots = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '12:00', end: '14:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' }, // Last slot (6pm cutoff)
  ]

  return timeSlots.map(slot => ({
    timeSlot: `${slot.start}-${slot.end}`,
    availablePros: Math.floor(Math.random() * 3) + 2, // 2-4 pros
    remainingCapacity: Math.floor(Math.random() * 5) + 3 // 3-7 slots
  }))
}

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

    // Extract zip code from address (simple extraction)
    // Format: "123 Main St, Sydney NSW 2000, Australia" → "2000"
    const zipMatch = address.match(/\b(\d{4})\b/)
    const zip = zipMatch ? zipMatch[1] : null

    // TODO: Replace with actual Supabase RPC call when functions are set up
    // For now, use mock data
    const slots = generateMockSlots(date)

    // Try Supabase call (will fail gracefully if functions don't exist)
    try {
      const { data, error } = await supabase.rpc('get_available_pickup_slots', {
        p_date: date,
        p_zip: zip,
        p_duration_minutes: duration_minutes
      })

      if (data && !error) {
        // Supabase functions are set up, use real data
        const realSlots = data.map((slot: any) => ({
          timeSlot: slot.time_slot,
          availablePros: slot.available_pros || 0,
          remainingCapacity: slot.remaining_capacity || 0
        }))
        return NextResponse.json({
          success: true,
          date,
          slots: realSlots
        })
      }
    } catch (err) {
      console.log('Supabase RPC not available, using mock slots')
    }

    return NextResponse.json({
      success: true,
      date,
      slots,
      totalAvailable: slots.filter((s: any) => s.availablePros > 0).length
    })
  } catch (error: any) {
    console.error('Error in pickup-slots API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
