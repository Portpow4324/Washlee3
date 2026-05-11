import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabaseClientFactory'

type EmployeeProfilePayload = {
  employeeId?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  serviceRadiusKm?: number
}

async function getTableColumns(tableName: string) {
  const supabase = getServiceRoleClient()
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)

  if (error) {
    console.warn(`[EmployeeProfile] Could not inspect ${tableName} columns:`, error.message)
    return new Set(
      tableName === 'employees'
        ? [
            'id',
            'email',
            'first_name',
            'last_name',
            'name',
            'phone',
            'address',
            'city',
            'state',
            'postcode',
            'country',
            'latitude',
            'longitude',
            'service_areas',
            'availability_status',
            'account_status',
            'status',
            'updated_at',
          ]
        : [
            'id',
            'first_name',
            'last_name',
            'name',
            'phone',
            'address',
            'state',
            'user_type',
            'is_employee',
            'role',
            'updated_at',
          ]
    )
  }

  return new Set((data || []).map((row: { column_name: string }) => row.column_name))
}

async function upsertWithColumnFallback(table: string, payload: Record<string, unknown>, conflictKey: string) {
  const supabase = getServiceRoleClient()
  let currentPayload = { ...payload }

  for (let attempt = 0; attempt < 12; attempt++) {
    const result = await supabase
      .from(table)
      .upsert(currentPayload, { onConflict: conflictKey })
      .select()

    if (!result.error) return result

    const message = result.error.message || ''
    const missingColumn =
      message.match(/'([^']+)' column/)?.[1] ||
      message.match(/column "([^"]+)"/)?.[1]

    if (!missingColumn || !(missingColumn in currentPayload)) {
      return result
    }

    const nextPayload = { ...currentPayload }
    delete nextPayload[missingColumn]
    currentPayload = nextPayload
  }

  return supabase
    .from(table)
    .upsert(currentPayload, { onConflict: conflictKey })
    .select()
}

function buildName(firstName?: string, lastName?: string) {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

function getServiceAreas(payload: EmployeeProfilePayload) {
  if (!payload.address && !payload.postcode && !payload.latitude && !payload.longitude) return []

  return [
    {
      address: payload.address || '',
      suburb: payload.city || '',
      state: payload.state || '',
      postcode: payload.postcode || '',
      country: payload.country || 'Australia',
      lat: payload.latitude ?? null,
      lng: payload.longitude ?? null,
      radiusKm: payload.serviceRadiusKm || 15,
    },
  ]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')

  if (!employeeId) {
    return NextResponse.json({ error: 'Missing employeeId parameter' }, { status: 400 })
  }

  try {
    const supabase = getServiceRoleClient()
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .maybeSingle()

    if (error) {
      console.error('[EmployeeProfile] Fetch error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch employee profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (error) {
    console.error('[EmployeeProfile] Unexpected fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch employee profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload: EmployeeProfilePayload = await request.json()
    const employeeId = payload.employeeId

    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 })
    }

    const supabase = getServiceRoleClient()
    const employeeColumns = await getTableColumns('employees')
    const usersColumns = await getTableColumns('users')
    const name = buildName(payload.firstName, payload.lastName)
    const serviceAreas = getServiceAreas(payload)

    const employeeUpdate: Record<string, unknown> = {}
    const userUpdate: Record<string, unknown> = {}

    employeeUpdate.id = employeeId
    if (payload.email) employeeUpdate.email = payload.email
    if (employeeColumns.has('first_name')) employeeUpdate.first_name = payload.firstName || null
    if (employeeColumns.has('last_name')) employeeUpdate.last_name = payload.lastName || null
    if (employeeColumns.has('name')) employeeUpdate.name = name || null
    if (employeeColumns.has('phone')) employeeUpdate.phone = payload.phone || null
    if (employeeColumns.has('address')) employeeUpdate.address = payload.address || null
    if (employeeColumns.has('city')) employeeUpdate.city = payload.city || null
    if (employeeColumns.has('state')) employeeUpdate.state = payload.state || null
    if (employeeColumns.has('postcode')) employeeUpdate.postcode = payload.postcode || null
    if (employeeColumns.has('country')) employeeUpdate.country = payload.country || 'Australia'
    if (employeeColumns.has('latitude')) employeeUpdate.latitude = payload.latitude ?? null
    if (employeeColumns.has('longitude')) employeeUpdate.longitude = payload.longitude ?? null
    if (employeeColumns.has('service_areas')) employeeUpdate.service_areas = serviceAreas
    if (employeeColumns.has('availability_status')) employeeUpdate.availability_status = 'available'
    if (employeeColumns.has('account_status')) employeeUpdate.account_status = 'active'
    if (employeeColumns.has('status')) employeeUpdate.status = 'active'
    if (employeeColumns.has('updated_at')) employeeUpdate.updated_at = new Date().toISOString()

    if (usersColumns.has('first_name')) userUpdate.first_name = payload.firstName || null
    if (usersColumns.has('last_name')) userUpdate.last_name = payload.lastName || null
    if (usersColumns.has('name')) userUpdate.name = name || null
    if (usersColumns.has('phone')) userUpdate.phone = payload.phone || null
    if (usersColumns.has('address')) userUpdate.address = payload.address || null
    if (usersColumns.has('state')) userUpdate.state = payload.state || null
    if (usersColumns.has('user_type')) userUpdate.user_type = 'pro'
    if (usersColumns.has('is_employee')) userUpdate.is_employee = true
    if (usersColumns.has('role')) userUpdate.role = 'employee'
    if (usersColumns.has('updated_at')) userUpdate.updated_at = new Date().toISOString()

    if (Object.keys(employeeUpdate).length > 1) {
      const { error } = await upsertWithColumnFallback('employees', employeeUpdate, 'id')

      if (error) {
        console.error('[EmployeeProfile] Employee update error:', error.message)
        return NextResponse.json({ error: 'Failed to update employee profile', details: error.message }, { status: 500 })
      }
    }

    if (Object.keys(userUpdate).length > 0) {
      const { error } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', employeeId)

      if (error) {
        console.warn('[EmployeeProfile] User update warning:', error.message)
      }
    }

    if (payload.serviceRadiusKm) {
      await supabase
        .from('employee_availability')
        .upsert(
          {
            employee_id: employeeId,
            service_radius_km: Math.min(Math.max(Number(payload.serviceRadiusKm), 1), 50),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'employee_id' }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[EmployeeProfile] Unexpected update error:', error)
    return NextResponse.json({ error: 'Failed to update employee profile' }, { status: 500 })
  }
}
