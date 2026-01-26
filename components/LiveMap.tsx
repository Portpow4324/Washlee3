'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, AlertCircle, Loader } from 'lucide-react'

// Declare Google Maps global type
declare global {
  interface Window {
    google: any
  }
}

interface MapProps {
  proLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  destinationLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  pickupLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  height?: string
  showRoute?: boolean
}

export default function LiveMap({
  proLocation,
  destinationLocation,
  pickupLocation,
  height = '400px',
  showRoute = true
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    // Check if Google Maps API is available
    if (typeof window === 'undefined' || !window.google) {
      // Fallback: Show placeholder if Google Maps not available
      setError('Map requires internet connection')
      setIsLoading(false)
      return
    }

    // Initialize map
    if (mapContainer.current && !mapRef.current) {
      try {
        const defaultCenter = proLocation || destinationLocation || {
          lat: -33.8688, // Sydney
          lng: 151.2093
        }

        mapRef.current = new window.google.maps.Map(mapContainer.current, {
          zoom: 13,
          center: defaultCenter,
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f3f3f3' }, { lightness: 20 }]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.fill',
              stylers: [{ color: '#ffffff' }, { lightness: 17 }]
            }
          ]
        })

        // Add markers
        if (pickupLocation) {
          new window.google.maps.Marker({
            position: pickupLocation,
            map: mapRef.current,
            title: 'Pickup Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
          })
        }

        if (proLocation) {
          new window.google.maps.Marker({
            position: proLocation,
            map: mapRef.current,
            title: 'Pro Current Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          })
        }

        if (destinationLocation) {
          new window.google.maps.Marker({
            position: destinationLocation,
            map: mapRef.current,
            title: 'Delivery Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          })
        }

        // Draw route if requested
        if (showRoute && proLocation && destinationLocation && window.google.maps.geometry) {
          const polyline = new window.google.maps.Polyline({
            path: [proLocation, destinationLocation],
            geodesic: true,
            strokeColor: '#48C9B0',
            strokeOpacity: 0.7,
            strokeWeight: 3,
            map: mapRef.current
          })
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Map initialization error:', err)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }
  }, [proLocation, destinationLocation, pickupLocation])

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray/20">
      {isLoading && (
        <div
          style={{ height }}
          className="bg-light flex items-center justify-center"
        >
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      )}

      {error && (
        <div
          style={{ height }}
          className="bg-light flex flex-col items-center justify-center gap-3 text-center p-6"
        >
          <AlertCircle size={40} className="text-red-500" />
          <div>
            <p className="font-semibold text-dark">{error}</p>
            <p className="text-sm text-gray mt-1">
              Map will load when internet is available
            </p>
          </div>

          {/* Fallback: Show location info as text */}
          <div className="mt-6 space-y-2 text-left">
            {pickupLocation && (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-dark">Pickup</p>
                  <p className="text-gray">{pickupLocation.address || `${pickupLocation.latitude}, ${pickupLocation.longitude}`}</p>
                </div>
              </div>
            )}
            {proLocation && (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-dark">Pro Location</p>
                  <p className="text-gray">{proLocation.address || `${proLocation.latitude}, ${proLocation.longitude}`}</p>
                </div>
              </div>
            )}
            {destinationLocation && (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-dark">Delivery</p>
                  <p className="text-gray">{destinationLocation.address || `${destinationLocation.latitude}, ${destinationLocation.longitude}`}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={mapContainer}
        style={{ height, display: isLoading || error ? 'none' : 'block' }}
        className="w-full"
      />
    </div>
  )
}
