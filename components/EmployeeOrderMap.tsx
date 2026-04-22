'use client'

import { useEffect, useRef, useState } from 'react'

interface GoogleMapsComponentProps {
  pickupAddress: string
  deliveryAddress?: string
  mapId?: string
  height?: string
}

export default function EmployeeOrderMap({
  pickupAddress,
  deliveryAddress,
  mapId = 'employee-order-map',
  height = '400px'
}: GoogleMapsComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (!window.google?.maps) {
      console.warn('Google Maps API not loaded yet')
      return
    }

    if (!mapRef.current) return

    try {
      // Initialize map
      if (!mapInstance.current) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          zoom: 14,
          center: { lat: -33.8688, lng: 151.2093 }, // Default to Sydney, AU
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
        })
      }

      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker instanceof window.google.maps.marker.AdvancedMarkerElement) {
          marker.map = null
        } else if (marker.setMap) {
          marker.setMap(null)
        }
      })
      markersRef.current = []

      // Geocode pickup address and add marker
      const geocoder = new window.google.maps.Geocoder()

      const addMarker = (address: string, isPickup: boolean) => {
        geocoder.geocode({ address: address }, (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location
            
            let marker
            try {
              // Try to use AdvancedMarkerElement if available
              if (window.google.maps?.marker?.AdvancedMarkerElement) {
                // Create marker content
                const markerContent = document.createElement('div')
                markerContent.className = 'marker'
                markerContent.innerHTML = isPickup 
                  ? '<div style="width: 32px; height: 32px; background: #FFD700; border: 2px solid #FFA500; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 18px;">📍</div>'
                  : '<div style="width: 32px; height: 32px; background: #4285F4; border: 2px solid #1967D2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">🚗</div>'
                
                // Create AdvancedMarkerElement
                marker = new window.google.maps.marker.AdvancedMarkerElement({
                  map: mapInstance.current,
                  position: location,
                  title: isPickup ? 'Pickup Location' : 'Delivery Location',
                  content: markerContent,
                })
              } else {
                // Fall back to standard Marker
                marker = new window.google.maps.Marker({
                  position: location,
                  map: mapInstance.current,
                  title: isPickup ? 'Pickup Location' : 'Delivery Location',
                  icon: isPickup
                    ? 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                    : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                })
              }
            } catch (error) {
              console.error('Error creating marker:', error)
              return
            }

            // Add info window
            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div style="padding: 8px;">
                <p style="font-weight: bold; margin: 0 0 4px 0;">${isPickup ? '📍 Pickup' : '🚗 Delivery'}</p>
                <p style="margin: 0; font-size: 12px;">${address}</p>
              </div>`,
            })

            marker.addListener('click', () => {
              // Close all other info windows
              markersRef.current.forEach(m => {
                if (m.infoWindow) m.infoWindow.close()
              })
              infoWindow.open(mapInstance.current, marker)
            })

            marker.infoWindow = infoWindow
            markersRef.current.push(marker)

            // Center map to fit all markers
            const bounds = new window.google.maps.LatLngBounds()
            markersRef.current.forEach(m => {
              bounds.extend(m.getPosition())
            })
            mapInstance.current.fitBounds(bounds)
          } else {
            console.warn(`Geocode error for ${address}:`, status)
          }
        })
      }

      if (pickupAddress) {
        addMarker(pickupAddress, true)
      }

      if (deliveryAddress) {
        addMarker(deliveryAddress, false)
      }

      // If no addresses, show a helpful message
      if (!pickupAddress && !deliveryAddress) {
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              background: #f0f0f0;
              border-radius: 8px;
              font-family: system-ui;
              color: #666;
            ">
              <div style="text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 14px;">No address provided</p>
                <p style="margin: 0; font-size: 12px; color: #999;">Add pickup and delivery addresses to see the map</p>
              </div>
            </div>
          `
        }
      }
    } catch (error) {
      console.error('Map initialization error:', error)
      setMapError(true)
    }
  }, [pickupAddress, deliveryAddress])

  if (mapError) {
    return (
      <div
        style={{
          width: '100%',
          height: height,
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f0f0',
          fontFamily: 'system-ui',
          color: '#666'
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>Map unavailable</p>
          <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
            {pickupAddress && `📍 Pickup: ${pickupAddress}`}
          </p>
          {deliveryAddress && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
              🚗 Delivery: {deliveryAddress}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      id={mapId}
      style={{
        width: '100%',
        height: height,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  )
}
