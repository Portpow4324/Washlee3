import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { extractLocation, getLiveEmployeeSlots } from '../availability-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Mock time slots - use this until Supabase functions are set up
type SlotResponse = {
  timeSlot: string
  availablePros: number
  remainingCapacity: number
}

const generateMockSlots = (): SlotResponse[] => {
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
    const { date, address, addressDetails, duration_minutes = 30 } = await request.json()

    console.log('[Delivery Slots API] Received request:', { date, address, duration_minutes })

    // Validate input
    if (!date || !address) {
      console.error('[Delivery Slots API] Missing required fields:', { date, address })
      return NextResponse.json(
        { error: 'Missing required fields: date, address', received: { date, address } },
        { status: 400 }
      )
    }

    console.log('[Delivery Slots API] Request valid, generating slots')

    const location = extractLocation(address, addressDetails)
    const zip = location.postcode

    const liveAvailability = await getLiveEmployeeSlots({
      date,
      slotType: 'delivery',
      location,
    })

    if (liveAvailability.usedLiveAvailability) {
      return NextResponse.json({
        success: true,
        date,
        slots: liveAvailability.slots,
        totalAvailable: liveAvailability.slots.filter(slot => slot.availablePros > 0).length,
        source: 'employee_availability',
      })
    }

    // Mock data first
    const slots = generateMockSlots()

    // Try Supabase call (will fail gracefully if functions don't exist)
    try {
      const { data, error } = await supabase.rpc('get_available_delivery_slots', {
        p_date: date,
        p_zip: zip
      })

      if (data && !error) {
        // Supabase functions are set up, use real data
        const realSlots = (data as Array<{ time_slot: string; available_pros?: number; remaining_capacity?: number }>).map((slot) => ({
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
    } catch {
      console.log('Supabase RPC not available, using mock slots')
    }

    return NextResponse.json({
      success: true,
      date,
      slots,
      totalAvailable: slots.filter((s) => s.availablePros > 0).length
    })
  } catch (error: unknown) {
    console.error('Error in delivery-slots API:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
}
