'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Phone, MessageSquare, Clock, Navigation } from 'lucide-react'
import Button from './Button'

interface ProLocation {
  lat: number
  lng: number
  status: string
  name: string
  phone: string
  rating: number
  eta?: string
  vehicle?: string
}

interface LiveTrackingProps {
  orderId: string
  proLocation?: ProLocation
  customerLocation?: { lat: number; lng: number }
  orderStatus?: string
}

declare global {
  interface Window {
    google: any
  }
}

export default function LiveTracking({
  orderId,
  proLocation,
  customerLocation,
  orderStatus
}: LiveTrackingProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [map, setMap] = useState<any>(null)
  const proMarkerRef = useRef<any>(null)
  const customerMarkerRef = useRef<any>(null)
  const routeRef = useRef<any>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 14,
      center: proLocation ? { lat: proLocation.lat, lng: proLocation.lng } : { lat: -33.8688, lng: 151.2093 },
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    })

    mapInstanceRef.current = newMap
    setMap(newMap)
  }, [])

  // Update pro location marker
  useEffect(() => {
    if (!map || !proLocation || !window.google) return

    // Remove old marker
    if (proMarkerRef.current) {
      proMarkerRef.current.setMap(null)
    }

    // Create new marker for pro
    proMarkerRef.current = new window.google.maps.Marker({
      position: { lat: proLocation.lat, lng: proLocation.lng },
      map,
      title: proLocation.name,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#48C9B0',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    })

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="font-family: sans-serif; font-size: 12px; color: #1f2d2b;">
          <strong>${proLocation.name}</strong><br/>
          Status: ${proLocation.status}<br/>
          Rating: ⭐ ${proLocation.rating}
        </div>
      `
    })

    proMarkerRef.current.addListener('click', () => {
      if (customerMarkerRef.current?.infoWindow) {
        customerMarkerRef.current.infoWindow.close()
      }
      infoWindow.open(map, proMarkerRef.current)
    })

    proMarkerRef.current.infoWindow = infoWindow

    // Center map on pro
    map.setCenter({ lat: proLocation.lat, lng: proLocation.lng })
  }, [map, proLocation])

  // Update customer location marker
  useEffect(() => {
    if (!map || !customerLocation || !window.google) return

    // Remove old marker
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setMap(null)
    }

    // Create new marker for customer
    customerMarkerRef.current = new window.google.maps.Marker({
      position: customerLocation,
      map,
      title: 'Delivery Address',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#F97316',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    })

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="font-family: sans-serif; font-size: 12px; color: #1f2d2b;">
          <strong>Delivery Address</strong>
        </div>
      `
    })

    customerMarkerRef.current.infoWindow = infoWindow

    customerMarkerRef.current.addListener('click', () => {
      if (proMarkerRef.current?.infoWindow) {
        proMarkerRef.current.infoWindow.close()
      }
      infoWindow.open(map, customerMarkerRef.current)
    })
  }, [map, customerLocation])

  // Draw route between pro and customer
  useEffect(() => {
    if (!map || !proLocation || !customerLocation || !window.google) return

    // Remove old route
    if (routeRef.current) {
      routeRef.current.setMap(null)
    }

    const route = new window.google.maps.Polyline({
      path: [
        { lat: proLocation.lat, lng: proLocation.lng },
        { lat: customerLocation.lat, lng: customerLocation.lng }
      ],
      geodesic: true,
      strokeColor: '#48C9B0',
      strokeOpacity: 0.7,
      strokeWeight: 3,
      map
    })

    routeRef.current = route

    // Fit bounds to show both markers
    const bounds = new window.google.maps.LatLngBounds()
    bounds.extend({ lat: proLocation.lat, lng: proLocation.lng })
    bounds.extend(customerLocation)
    map.fitBounds(bounds, 100)
  }, [map, proLocation, customerLocation])

  return (
    <div className="space-y-6">
      {/* Map */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray/10">
        <div ref={mapRef} style={{ width: '100%', height: '400px' }} />
      </div>

      {/* Pro Info Card */}
      {proLocation && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border border-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left - Pro Info */}
            <div>
              <h3 className="font-bold text-dark mb-4">Your Washlee Pro</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray mb-1">Name</p>
                  <p className="font-semibold text-dark">{proLocation.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray mb-1">Rating</p>
                  <p className="font-semibold text-dark">⭐ {proLocation.rating} / 5.0</p>
                </div>
                {proLocation.vehicle && (
                  <div>
                    <p className="text-sm text-gray mb-1">Vehicle</p>
                    <p className="font-semibold text-dark">{proLocation.vehicle}</p>
                  </div>
                )}
                {proLocation.eta && (
                  <div className="flex items-center gap-2 pt-2 border-t border-primary/20">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray">Estimated Arrival</p>
                      <p className="font-semibold text-dark">{proLocation.eta}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm text-gray mb-3">Status</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {proLocation.status}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => window.open(`tel:${proLocation.phone}`)}
                >
                  <Phone className="w-4 h-4" />
                  Call Pro
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="bg-white rounded-lg p-6 border border-gray/10">
        <h3 className="font-bold text-dark mb-4">Order Status</h3>
        <div className="space-y-4">
          {['Confirmed', 'In Transit', 'Arriving Soon', 'Picked Up', 'In Washing', 'Delivering', 'Completed'].map(
            (status, index) => (
              <div key={status} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                      orderStatus === status.toLowerCase().replace(' ', '-')
                        ? 'bg-primary border-primary text-white'
                        : 'bg-light border-gray/20 text-gray'
                    }`}
                  >
                    {index === 0 ? <MapPin className="w-5 h-5" /> : index + 1}
                  </div>
                  {index < 6 && (
                    <div
                      className={`w-1 h-8 ${
                        orderStatus === status.toLowerCase().replace(' ', '-')
                          ? 'bg-primary'
                          : 'bg-gray/20'
                      }`}
                    />
                  )}
                </div>
                <div className="pt-2">
                  <p className="font-semibold text-dark">{status}</p>
                  <p className="text-sm text-gray">
                    {status === 'Confirmed' && 'Order confirmed and assigned to pro'}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
