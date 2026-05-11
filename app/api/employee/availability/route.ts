import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return { userId: null, error: 'Missing authorization token' }

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabaseAuth.auth.getUser(token)

  if (error || !data.user) return { userId: null, error: 'Invalid or expired token' }
  return { userId: data.user.id, error: null }
}

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
  const auth = await getAuthenticatedUser(request)
  if (auth.error || !auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  
  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employeeId parameter' }, { status: 400 })
  }

  if (employeeId !== auth.userId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
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
        data: data.availability_schedule || DEFAULT_AVAILABILITY,
        serviceRadiusKm: data.service_radius_km || 15,
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
          service_radius_km: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      return NextResponse.json({ 
        success: true,
        data: DEFAULT_AVAILABILITY,
        serviceRadiusKm: 15,
        isDefault: true 
      })
    }
    
    // Other errors
    if (error) {
      console.error('Availability fetch error:', error)
      return NextResponse.json({ 
        success: true,
        data: DEFAULT_AVAILABILITY,
        serviceRadiusKm: 15,
        isDefault: true 
      })
    }
    
    return NextResponse.json({ 
      success: true,
      data: DEFAULT_AVAILABILITY,
      serviceRadiusKm: 15,
    })
  } catch (error) {
    console.error('Availability fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch availability',
      data: DEFAULT_AVAILABILITY,
      serviceRadiusKm: 15,
      isDefault: true 
    }, { status: 200 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (auth.error || !auth.userId) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
  }

  try {
    const { employeeId, availability, serviceRadiusKm } = await request.json()
    
    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 })
    }

    if (employeeId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    
    if (!availability) {
      return NextResponse.json({ error: 'Missing availability data' }, { status: 400 })
    }
    
    const radius = Number(serviceRadiusKm)
    const payload = {
      employee_id: employeeId,
      availability_schedule: availability,
      service_radius_km: Number.isFinite(radius) ? Math.min(Math.max(radius, 1), 50) : 15,
      updated_at: new Date().toISOString()
    }

    let { data, error } = await supabaseAdmin
      .from('employee_availability')
      .upsert(
        payload,
        {
          onConflict: 'employee_id'
        }
      )
      .select()

    if (error && error.message?.includes('service_radius_km')) {
      const retry = await supabaseAdmin
        .from('employee_availability')
        .upsert(
          {
            employee_id: payload.employee_id,
            availability_schedule: payload.availability_schedule,
            updated_at: payload.updated_at,
          },
          {
            onConflict: 'employee_id'
          }
        )
        .select()

      data = retry.data
      error = retry.error
    }
    
    if (error) {
      console.error('Availability update error:', error)
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      data: data?.[0]?.availability_schedule || availability,
      serviceRadiusKm: data?.[0]?.service_radius_km || payload.service_radius_km,
    })
  } catch (error) {
    console.error('Availability update error:', error)
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
  }
}
