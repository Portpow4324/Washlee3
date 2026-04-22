/**
 * GET /api/delivery/metrics
 * Returns current delivery metrics (active members, orders, capacity)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    console.log('[Delivery Metrics] Fetching current metrics...')

    // Get active employees (count all employees in the system)
    const { data: activeEmployees, count: employeeCount, error: employeesError } = await supabaseAdmin
      .from('employees')
      .select('id', { count: 'exact', head: false })

    if (employeesError) {
      console.error('[Delivery Metrics] Error fetching employees:', employeesError.message)
      return NextResponse.json(
        {
          metrics: getDefaultMetrics(),
          warning: 'Using default metrics',
        },
        { status: 200 }
      )
    }

    const activeMembers = employeeCount || activeEmployees?.length || 0

    // Get active orders (status = 'pending' or 'processing')
    const { data: activeOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('weight_kg, status')
      .in('status', ['pending', 'processing', 'in_transit'])

    if (ordersError) {
      console.error('[Delivery Metrics] Error fetching orders:', ordersError.message)
      return NextResponse.json(
        {
          metrics: getDefaultMetrics(),
          warning: 'Using default metrics',
        },
        { status: 200 }
      )
    }

    const activeOrderCount = activeOrders?.length || 0
    const totalOrderWeight = (activeOrders || []).reduce((sum: number, order: any) => sum + (order.weight_kg || 0), 0)
    const averageOrderWeight = activeOrderCount > 0 ? totalOrderWeight / activeOrderCount : 0

    // Capacity calculation:
    // - Each active member can process ~60kg per 8-hour shift
    // - That's 7.5 kg/hour per member
    // - With standard safety factor: 60kg per person per day
    const kapPerMember = 60 // kg per 8-hour day
    const totalCapacity = Math.max(activeMembers * kapPerMember, 60) // Min 60kg buffer
    const usedCapacity = totalOrderWeight
    const availableCapacity = Math.max(totalCapacity - usedCapacity, 0)
    const capacityUsage = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0

    const metrics = {
      activeMembers,
      activeOrders: activeOrderCount,
      averageOrderWeight: parseFloat(averageOrderWeight.toFixed(2)),
      totalCapacity: parseFloat(totalCapacity.toFixed(2)),
      availableCapacity: parseFloat(availableCapacity.toFixed(2)),
      capacityUsage: parseFloat(capacityUsage.toFixed(1)),
      standardDeliveryHours:
        capacityUsage > 80 ? 48 : capacityUsage > 60 ? 36 : 24,
      expressDeliveryHours:
        capacityUsage > 70 ? 12 : capacityUsage < 30 ? 4 : 6,
      lastUpdated: new Date().toISOString(),
    }

    console.log('[Delivery Metrics] Calculated metrics:', metrics)

    return NextResponse.json({ metrics }, { status: 200 })
  } catch (error: any) {
    console.error('[Delivery Metrics] Unexpected error:', error)
    return NextResponse.json(
      {
        metrics: getDefaultMetrics(),
        error: 'Failed to fetch metrics',
      },
      { status: 200 } // Return 200 so frontend still gets defaults
    )
  }
}

/**
 * Default metrics when system is unavailable
 */
function getDefaultMetrics() {
  return {
    activeMembers: 0, // Real data only - start at 0 until employees sign up
    activeOrders: 0,
    averageOrderWeight: 0,
    totalCapacity: 0,
    availableCapacity: 0,
    capacityUsage: 0,
    standardDeliveryHours: 24,
    expressDeliveryHours: 6,
    lastUpdated: new Date().toISOString(),
  }
}
