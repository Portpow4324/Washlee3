import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    if (!input || input.length < 3) {
      return NextResponse.json({ predictions: [] })
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Places API key not configured' },
        { status: 500 }
      )
    }

    // Call Google Places Autocomplete API
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${GOOGLE_PLACES_API_KEY}&language=en&region=au&components=country:au`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Filter to only Australian addresses
    const predictions = data.predictions || []
    
    console.log('Google Places Response Status:', data.status)
    console.log('Predictions Count:', predictions.length)
    console.log('Sample Prediction:', predictions[0])

    return NextResponse.json({
      predictions: predictions.map((prediction: any) => ({
        placeId: prediction.place_id,
        main_text: prediction.main_text || prediction.description,
        secondary_text: prediction.secondary_text || '',
        description: prediction.description,
      })),
    })
  } catch (error) {
    console.error('Autocomplete API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch address predictions' },
      { status: 500 }
    )
  }
}
