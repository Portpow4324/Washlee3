import { NextRequest, NextResponse } from 'next/server'
import admin from 'firebase-admin'

// Initialize Firebase Admin
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'washlee-7d3c6',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@washlee-7d3c6.iam.gserviceaccount.com',
    privateKey: privateKey?.replace(/\\n/g, '\n'),
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.projectId,
    })
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.error('[AVAILABILITY] Firebase init error:', error.message)
    }
  }
}

const db = admin.firestore()

/**
 * POST /api/availability/search
 * Searches for available pros based on location, service type, date, and time
 * Returns sorted list of pros with availability and pricing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      zipCode,
      serviceType = 'standard_wash',
      date,
      timeWindow,
      sortBy = 'rating'
    } = body

    if (!zipCode || !date) {
      return NextResponse.json(
        { error: 'zipCode and date required' },
        { status: 400 }
      )
    }

    // In production, implement real geolocation search
    // For now, return mock data
    const mockPros = [
      {
        proId: 'pro_001',
        name: 'John D.',
        rating: 4.9,
        jobsCompleted: 250,
        estimatedCost: 32.00,
        distance: '2.5 miles',
        availability: ['08:00-10:00', '14:00-16:00'],
        serviceTypes: ['standard_wash', 'dry_clean']
      },
      {
        proId: 'pro_002',
        name: 'Sarah M.',
        rating: 4.8,
        jobsCompleted: 180,
        estimatedCost: 30.00,
        distance: '1.2 miles',
        availability: ['10:00-12:00', '16:00-18:00'],
        serviceTypes: ['standard_wash', 'delicates']
      },
      {
        proId: 'pro_003',
        name: 'Mike R.',
        rating: 4.7,
        jobsCompleted: 320,
        estimatedCost: 28.00,
        distance: '3.1 miles',
        availability: ['08:00-10:00', '12:00-14:00'],
        serviceTypes: ['standard_wash', 'express']
      }
    ]

    // Filter by service type
    let results = mockPros.filter(pro =>
      pro.serviceTypes.includes(serviceType)
    )

    // Filter by availability
    if (timeWindow) {
      results = results.filter(pro =>
        pro.availability.includes(timeWindow)
      )
    }

    // Sort
    if (sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'distance') {
      results.sort((a, b) => {
        const distA = parseFloat(a.distance)
        const distB = parseFloat(b.distance)
        return distA - distB
      })
    } else if (sortBy === 'price') {
      results.sort((a, b) => a.estimatedCost - b.estimatedCost)
    }

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      searchCriteria: {
        zipCode,
        serviceType,
        date,
        timeWindow
      }
    })
  } catch (error) {
    console.error('[AVAILABILITY-ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to search availability' },
      { status: 500 }
    )
  }
}
