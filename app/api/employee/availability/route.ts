import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseAnonKey = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Default availability template
const DEFAULT_AVAILABILITY = {
  monday: { start: '09:00', end: '17:00', available: true },
  tuesday: { start: '09:00', end: '17:00', available: true },
  wednesday: { start: '09:00', end: '17:00', available: true },
  thursday: { start: '09:00', end: '17:00', available: true },
  friday: { start: '09:00', end: '17:00', available: true },
  saturday: { start: '10:00', end: '14:00', available: true },
  sunday: { start: null, end: null, available: false }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  
  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employeeId parameter' }, { status: 400 })
  }
  
  try {
    // Try to fetch existing availability from database
    const { data, error } = await supabaseAdmin
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employeeId)
      .single()
    
    // If record exists, return it
    if (data) {
      return NextResponse.json({ 
        success: true,
        data: data.availability_schedule || DEFAULT_AVAILABILITY 
      })
    }
    
    // If no record exists (PGRST116 error), return default and create new record
    if (error?.code === 'PGRST116') {
      // Create default availability record
      await supabaseAdmin
        .from('employee_availability')
        .insert({
          employee_id: employeeId,
          availability_schedule: DEFAULT_AVAILABILITY,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      return NextResponse.json({ 
        success: true,
        data: DEFAULT_AVAILABILITY,
        isDefault: true 
      })
    }
    
    // Other errors
    if (error) {
      console.error('Availability fetch error:', error)
      return NextResponse.json({ 
        success: true,
        data: DEFAULT_AVAILABILITY,
        isDefault: true 
      })
    }
    
    return NextResponse.json({ 
      success: true,
      data: DEFAULT_AVAILABILITY 
    })
  } catch (error) {
    console.error('Availability fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch availability',
      data: DEFAULT_AVAILABILITY,
      isDefault: true 
    }, { status: 200 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { employeeId, availability } = await request.json()
    
    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 })
    }
    
    if (!availability) {
      return NextResponse.json({ error: 'Missing availability data' }, { status: 400 })
    }
    
    // Upsert the availability record
    const { data, error } = await supabaseAdmin
      .from('employee_availability')
      .upsert(
        {
          employee_id: employeeId,
          availability_schedule: availability,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'employee_id'
        }
      )
      .select()
    
    if (error) {
      console.error('Availability update error:', error)
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      data: data[0]?.availability_schedule || availability 
    })
  } catch (error) {
    console.error('Availability update error:', error)
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
  }
}
