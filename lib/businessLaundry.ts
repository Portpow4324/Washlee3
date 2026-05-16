import { serviceAreaSuburbs } from '@/lib/localLandingPages'

/**
 * Business Laundry — shared data + service-area check.
 *
 * Quote-based, customer-owned laundry first. This module holds the funnel
 * option lists and a lightweight front-end area check. It does NOT touch
 * payment, auth, or Supabase — the funnel itself posts to the existing
 * /api/contact endpoint (see BusinessQuoteFunnel).
 */

export type BusinessType = {
  id: string
  label: string
}

export const BUSINESS_TYPES: BusinessType[] = [
  { id: 'cafe', label: 'Café' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'salon', label: 'Salon / beauty' },
  { id: 'gym', label: 'Gym / fitness studio' },
  { id: 'office', label: 'Office / workplace' },
  { id: 'short-stay', label: 'Short-stay / Airbnb' },
  { id: 'other', label: 'Other local business' },
]

export type LaundryItem = {
  id: string
  label: string
}

export const LAUNDRY_ITEMS: LaundryItem[] = [
  { id: 'tea-towels', label: 'Tea towels' },
  { id: 'aprons', label: 'Aprons' },
  { id: 'uniforms', label: 'Uniforms' },
  { id: 'bar-towels', label: 'Bar towels' },
  { id: 'hand-towels', label: 'Hand towels' },
  { id: 'salon-gym-towels', label: 'Salon / gym towels' },
]

export type Frequency = {
  id: string
  label: string
  helper: string
}

export const FREQUENCIES: Frequency[] = [
  { id: 'weekly', label: 'Weekly', helper: 'One scheduled pickup per week' },
  { id: 'twice-weekly', label: 'Twice weekly', helper: 'Two scheduled pickups per week' },
  { id: 'three-times-weekly', label: 'Three times weekly', helper: 'Three scheduled pickups per week' },
  { id: 'daily', label: 'Daily / high volume', helper: 'Daily pickups or large recurring volume' },
]

export const PICKUP_WINDOWS = [
  'Early morning (6–9am)',
  'Morning (9am–12pm)',
  'Midday (12–3pm)',
  'Afternoon (3–6pm)',
  'Evening (after 6pm)',
  'Flexible / no preference',
]

/**
 * Primary postcodes for the current Greater Melbourne service-area suburbs.
 * Kept conservative — only suburbs Washlee already lists as serviced.
 */
const SERVICED_POSTCODES: Record<string, string> = {
  'Melbourne CBD': '3000',
  'South Melbourne': '3205',
  Richmond: '3121',
  'South Yarra': '3141',
  'St Kilda': '3182',
  Carlton: '3053',
  Brunswick: '3056',
  Fitzroy: '3065',
  Prahran: '3181',
  Docklands: '3008',
}

export type AreaCheckResult =
  | { status: 'serviced'; matchedSuburb: string }
  | { status: 'waitlist' }
  | { status: 'empty' }

/**
 * Lightweight front-end area check. Accepts a suburb name or a 4-digit
 * postcode. This is intentionally simple — the booking flow remains the
 * authoritative availability check before any order is placed.
 */
export function checkBusinessArea(rawInput: string): AreaCheckResult {
  const input = rawInput.trim()
  if (!input) return { status: 'empty' }

  const normalized = input.toLowerCase()

  // Postcode match
  const postcodeMatch = input.match(/\b(\d{4})\b/)
  if (postcodeMatch) {
    const postcode = postcodeMatch[1]
    const suburbForPostcode = Object.entries(SERVICED_POSTCODES).find(
      ([, code]) => code === postcode
    )
    if (suburbForPostcode) {
      return { status: 'serviced', matchedSuburb: suburbForPostcode[0] }
    }
  }

  // Suburb-name match (exact or contained)
  const suburbMatch = serviceAreaSuburbs.find((suburb) => {
    const s = suburb.toLowerCase()
    return s === normalized || normalized.includes(s) || s.includes(normalized)
  })
  if (suburbMatch) {
    return { status: 'serviced', matchedSuburb: suburbMatch }
  }

  return { status: 'waitlist' }
}
