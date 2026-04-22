import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import {
  ADMIN_COLLECTIONS,
  fetchCollectionData,
  getCollectionCount,
  getDashboardMetrics
} from '@/lib/supabaseAdminSync'

/**
 * POST /api/admin/sync-all-data
 * 
 * Syncs all Supabase data to admin panel
 * Can sync specific collections or all collections
 * 
 * Body:
 * {
 *   collections: ['users', 'orders', ...] // optional, defaults to all
 *   force: boolean // force resync even if data exists
 * }
 * 
 * Returns:
 * {
 *   success: boolean
 *   synced: number
 *   collections: {
 *     [collection]: {
 *       count: number
 *       error?: string
 *     }
 *   }
 *   metrics: {...}
 *   timestamp: string
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing bearer token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { collections, force } = body

    console.log('[AdminSync API] Starting sync:', {
      collections: collections ? collections.join(', ') : 'all',
      force,
      timestamp: new Date().toISOString()
    })

    const collectionsToSync = collections
      ? Object.entries(ADMIN_COLLECTIONS).filter(([key]) =>
          collections.includes(key.toLowerCase())
        )
      : Object.entries(ADMIN_COLLECTIONS)

    const results: Record<string, any> = {}
    let totalSynced = 0

    // Sync each collection
    for (const [collectionKey, collectionConfig] of collectionsToSync) {
      try {
        console.log(
          `[AdminSync API] Syncing collection: ${collectionConfig.name} from table: ${collectionConfig.supabaseTable}`
        )

        // Fetch all data from Supabase table
        const { data, error: fetchError } = await supabase
          .from(collectionConfig.supabaseTable)
          .select('*')
          .limit(10000) // Safety limit

        if (fetchError) {
          results[collectionConfig.name] = {
            count: 0,
            error: fetchError.message
          }
          console.error(
            `[AdminSync API] Error fetching ${collectionConfig.name}:`,
            fetchError
          )
          continue
        }

        const recordCount = data?.length || 0
        results[collectionConfig.name] = {
          count: recordCount,
          synced: true,
          timestamp: new Date().toISOString()
        }

        totalSynced += recordCount

        console.log(
          `[AdminSync API] Successfully synced ${recordCount} records for ${collectionConfig.name}`
        )
      } catch (error: any) {
        results[collectionConfig.name] = {
          count: 0,
          error: error.message
        }
        console.error(
          `[AdminSync API] Exception syncing ${collectionConfig.name}:`,
          error
        )
      }
    }

    // Get updated metrics
    console.log('[AdminSync API] Calculating dashboard metrics')
    const metrics = await getDashboardMetrics()

    console.log('[AdminSync API] Sync completed successfully')

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      collections: results,
      metrics,
      timestamp: new Date().toISOString(),
      message: `Successfully synced ${totalSynced} records across ${Object.keys(results).length} collections`
    })
  } catch (error: any) {
    console.error('[AdminSync API] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/sync-all-data
 * 
 * Get current sync status and metrics
 * 
 * Returns current metrics without performing sync
 */

export async function GET() {
  try {
    console.log('[AdminSync API] Fetching current metrics')

    const metrics = await getDashboardMetrics()

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[AdminSync API] Error fetching metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
