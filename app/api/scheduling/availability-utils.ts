import { SupabaseClient, createClient } from '@supabase/supabase-js'

const TIME_SLOTS = [
  { start: '08:00', end: '10:00' },
  { start: '10:00', end: '12:00' },
  { start: '12:00', end: '14:00' },
  { start: '14:00', end: '16:00' },
  { start: '16:00', end: '18:00' },
]

const ACTIVE_ORDER_STATUSES = ['pending', 'processing', 'in_transit', 'confirmed', 'accepted']
const ACTIVE_EMPLOYEE_STATUSES = new Set(['available', 'active', 'online'])

type SlotType = 'pickup' | 'delivery'

type LocationInput = {
  postcode?: string | null
  latitude?: number | null
  longitude?: number | null
}

type AvailabilitySlot = {
  timeSlot: string
  availablePros: number
  remainingCapacity: number
}

type EmployeeRow = {
  id: string
  email?: string | null
  name?: string | null
  phone?: string | null
  availability_status?: string | null
  service_areas?: unknown
  user_type?: string | null
  role?: string | null
  is_employee?: boolean | null
}

type AvailabilityRow = {
  employee_id: string
  availability_schedule?: Record<string, { available?: boolean; start?: string | null; end?: string | null }> | null
  service_radius_km?: number | null
  day_of_week?: string | null
  start_time?: string | null
  end_time?: string | null
  is_available?: boolean | null
}

type ServiceArea = string | number | Record<string, unknown>

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

function getDayKey(date: string) {
  const dayIndex = new Date(`${date}T00:00:00`).getDay()
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayIndex]
}

function toMinutes(time?: string | null) {
  if (!time) return null
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  const aStart = toMinutes(startA)
  const aEnd = toMinutes(endA)
  const bStart = toMinutes(startB)
  const bEnd = toMinutes(endB)

  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false
  return aStart < bEnd && bStart < aEnd
}

function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function parseServiceAreas(raw: unknown): ServiceArea[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as ServiceArea[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as ServiceArea[]) : [parsed as ServiceArea]
    } catch {
      return raw.split(',').map(area => area.trim()).filter(Boolean)
    }
  }
  if (typeof raw === 'number' || typeof raw === 'object') return [raw as ServiceArea]
  return []
}

function areaMatches(area: ServiceArea, location: LocationInput, fallbackRadiusKm: number) {
  if (!area) return false

  if (typeof area === 'string' || typeof area === 'number') {
    return Boolean(location.postcode && String(area).includes(location.postcode))
  }

  const areaPostcode = area.postcode || area.zip || area.postalCode || area.postal_code
  if (areaPostcode && location.postcode && String(areaPostcode) === String(location.postcode)) {
    return true
  }

  const areaLat = Number(area.latitude ?? area.lat)
  const areaLng = Number(area.longitude ?? area.lng)
  const radiusKm = Number(area.radiusKm ?? area.radius_km ?? area.service_radius_km ?? fallbackRadiusKm)

  if (
    Number.isFinite(areaLat) &&
    Number.isFinite(areaLng) &&
    Number.isFinite(radiusKm) &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number'
  ) {
    return calculateDistanceKm(areaLat, areaLng, location.latitude, location.longitude) <= radiusKm
  }

  return false
}

function isWithinServiceArea(employee: EmployeeRow, availabilityRows: AvailabilityRow[], location: LocationInput) {
  const radiusKm = Number(availabilityRows.find(row => row.service_radius_km)?.service_radius_km || 15)
  const serviceAreas = parseServiceAreas(employee.service_areas)

  if (serviceAreas.length > 0) {
    return serviceAreas.some(area => areaMatches(area, location, radiusKm))
  }

  return true
}

function isEmployeeActive(employee: EmployeeRow) {
  const status = String(employee.availability_status || 'available').toLowerCase()
  return ACTIVE_EMPLOYEE_STATUSES.has(status)
}

function hasScheduleForSlot(rows: AvailabilityRow[], dayKey: string, slot: { start: string; end: string }) {
  if (rows.length === 0) return true

  const scheduleRows = rows.filter(row => row.availability_schedule)
  for (const row of scheduleRows) {
    const day = row.availability_schedule?.[dayKey]
    if (!day?.available) continue
    if (day.start && day.end && rangesOverlap(day.start, day.end, slot.start, slot.end)) return true
  }

  const perDayRows = rows.filter(row => String(row.day_of_week || '').toLowerCase() === dayKey)
  for (const row of perDayRows) {
    if (row.is_available === false) continue
    if (row.start_time && row.end_time && rangesOverlap(row.start_time, row.end_time, slot.start, slot.end)) return true
  }

  return false
}

async function getBookedCount(supabase: SupabaseClient, date: string, slotType: SlotType, timeSlot: string) {
  const dateColumn = slotType === 'pickup' ? 'pickup_date' : 'delivery_date'
  const slotColumn = slotType === 'pickup' ? 'pickup_time_slot' : 'delivery_time_slot'

  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq(dateColumn, date)
    .eq(slotColumn, timeSlot)
    .in('status', ACTIVE_ORDER_STATUSES)

  if (error) {
    console.warn('[Scheduling] Could not count booked orders:', error.message)
    return 0
  }

  return count || 0
}

async function loadEmployeeCandidates(supabase: SupabaseClient) {
  const employeeMap = new Map<string, EmployeeRow>()

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('*')

  if (employeesError) {
    console.warn('[Scheduling] Could not load employees:', employeesError.message)
  }

  for (const employee of (employees || []) as EmployeeRow[]) {
    if (employee.id) {
      employeeMap.set(employee.id, employee)
    }
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')

  if (usersError) {
    console.warn('[Scheduling] Could not load role-marked users:', usersError.message)
  }

  for (const user of (users || []) as EmployeeRow[]) {
    const userType = String(user.user_type || '').toLowerCase()
    const role = String(user.role || '').toLowerCase()
    const isEmployee = user.is_employee === true || userType === 'pro' || userType === 'employee' || role === 'employee' || role === 'pro'

    if (isEmployee && user.id && !employeeMap.has(user.id)) {
      employeeMap.set(user.id, {
        ...user,
        availability_status: 'available',
        service_areas: [],
      })
    }
  }

  return Array.from(employeeMap.values())
}

export async function getLiveEmployeeSlots({
  date,
  slotType,
  location,
}: {
  date: string
  slotType: SlotType
  location: LocationInput
}): Promise<{ slots: AvailabilitySlot[]; usedLiveAvailability: boolean }> {
  const supabase = getSupabaseAdmin()

  const employees = await loadEmployeeCandidates(supabase)

  if (!employees || employees.length === 0) {
    return {
      usedLiveAvailability: true,
      slots: TIME_SLOTS.map(slot => ({
        timeSlot: `${slot.start}-${slot.end}`,
        availablePros: 0,
        remainingCapacity: 0,
      })),
    }
  }

  const { data: availabilityRows, error: availabilityError } = await supabase
    .from('employee_availability')
    .select('*')

  if (availabilityError) {
    console.warn('[Scheduling] Could not load employee availability:', availabilityError.message)
  }

  const rowsByEmployee = new Map<string, AvailabilityRow[]>()
  for (const row of availabilityRows || []) {
    const rows = rowsByEmployee.get(row.employee_id) || []
    rows.push(row)
    rowsByEmployee.set(row.employee_id, rows)
  }

  const dayKey = getDayKey(date)
  const slots: AvailabilitySlot[] = []

  for (const slot of TIME_SLOTS) {
    const eligibleEmployees = employees.filter((employee) => {
      const rows = rowsByEmployee.get(employee.id) || []
      return (
        isEmployeeActive(employee) &&
        isWithinServiceArea(employee, rows, location) &&
        hasScheduleForSlot(rows, dayKey, slot)
      )
    })

    const timeSlot = `${slot.start}-${slot.end}`
    const bookedCount = await getBookedCount(supabase, date, slotType, timeSlot)
    const remainingCapacity = Math.max(eligibleEmployees.length - bookedCount, 0)

    slots.push({
      timeSlot,
      availablePros: remainingCapacity,
      remainingCapacity,
    })
  }

  return { slots, usedLiveAvailability: true }
}

export function extractLocation(address: string, details?: { postcode?: string; latitude?: number; longitude?: number }): LocationInput {
  const zipMatch = address.match(/\b(\d{4})\b/)
  return {
    postcode: details?.postcode || (zipMatch ? zipMatch[1] : null),
    latitude: typeof details?.latitude === 'number' ? details.latitude : null,
    longitude: typeof details?.longitude === 'number' ? details.longitude : null,
  }
}
