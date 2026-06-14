import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import { OpenRouteServiceRouter } from '../../utils/OpenRouteService'

// Fix for default markers in Leaflet with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  description?: string
  type?: 'address' | 'service' | 'user'
  color?: string
  draggable?: boolean
}

interface MapProps {
  center: [number, number]
  zoom: number
  markers?: MapMarker[]
  height?: string
  onMarkerClick?: (marker: MapMarker) => void
  onMarkerDragEnd?: (markerId: string, lat: number, lng: number) => void
  onMapClick?: (lat: number, lng: number) => void
  className?: string
  routing?: {
    start: [number, number],
    end: [number, number],
    profile?: 'car' | 'bike' | 'walk' | 'train'
  }
  onRouteFound?: (route: any) => void
  onRouteError?: (error: any) => void
}

export const Map: React.FC<MapProps> = ({
  center,
  zoom,
  markers = [],
  height = '400px',
  onMarkerClick,
  onMarkerDragEnd,
  onMapClick,
  className = '',
  routing,
  onRouteFound,
  onRouteError,
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom)

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add click handler if provided
    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    mapInstanceRef.current = map
    setMapReady(true)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update map center when it changes
  useEffect(() => {
    if (mapInstanceRef.current && mapReady) {
      mapInstanceRef.current.setView(center, zoom)
    }
  }, [center, zoom, mapReady])

  // Update markers when they change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    // Add new markers
    markers.forEach(marker => {
      const iconColor = marker.color || (marker.type === 'service' ? '#3B82F6' : '#10B981')

      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${iconColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              background-color: white;
              width: 8px;
              height: 8px;
              border-radius: 50%;
            "></div>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: customIcon,
        draggable: marker.draggable
      }).addTo(mapInstanceRef.current!)

      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(marker))
      }

      if (marker.draggable && onMarkerDragEnd) {
        leafletMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng()
          onMarkerDragEnd(marker.id, lat, lng)
        })
      }

      // Add popup if description exists
      if (marker.description) {
        leafletMarker.bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold;">${marker.title}</h4>
            <p style="margin: 0; color: #666;">${marker.description}</p>
          </div>
        `)
      }

      markersRef.current.push(leafletMarker)
    })
  }, [markers, onMarkerClick, mapReady])

  // Fallback state
  const [isFallback, setIsFallback] = useState(false);

  // Routing Control
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !routing) return

    // Use OpenRouteService if Key is available
    const orsKey = import.meta.env.VITE_ORS_API_KEY;

    let router;
    if (orsKey && orsKey.length > 5 && !isFallback) {
      console.log("✅ Initializing OpenRouteService Router", { profile: routing.profile });
      router = new OpenRouteServiceRouter(orsKey, {
        profile: routing.profile
      });
    } else {
      // OSRM Default (Fallback or Primary)
      if (isFallback) console.warn("🔄 Using OSRM Fallback Mode");

      const serviceUrl = 'https://router.project-osrm.org/route/v1';

      // Map internal profile to OSRM profile
      let osrmProfile = 'driving';
      if (routing.profile === 'walk') osrmProfile = 'foot';
      if (routing.profile === 'bike') osrmProfile = 'bike';
      if (routing.profile === 'car') osrmProfile = 'driving';

      // @ts-ignore
      router = L.Routing.osrmv1({
        serviceUrl: serviceUrl,
        profile: osrmProfile,
        routingOptions: {
          steps: true,
          alternatives: true
        }
      });
    }

    // @ts-ignore
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(routing.start[0], routing.start[1]),
        L.latLng(routing.end[0], routing.end[1])
      ],
      router: router,
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: 'blue', opacity: 0.7, weight: 5 }],
        extendToWaypoints: false,
        missingRouteTolerance: 0
      }
    }).addTo(mapInstanceRef.current)

    if (onRouteFound) {
      routingControl.on('routesfound', (e: any) => {
        const routes = e.routes
        if (routes && routes.length > 0) {
          console.log("Route found:", routes[0])
          onRouteFound(routes[0])
          // Do NOT reset fallback if we are already in fallback mode to avoid bouncing back to failing service
        }
      })

      routingControl.on('routingerror', (e: any) => {
        console.error("Routing Error:", e)

        // Trigger fallback if we were trying ORS
        if (orsKey && orsKey.length > 5 && !isFallback) {
          console.warn("🔄 ORS Failed. Switching to Default OSRM via State Update...");
          setIsFallback(true);
          return;
        }

        if (onRouteError) onRouteError(e);
      })
    }

    return () => {
      // @ts-ignore
      if (mapInstanceRef.current && routingControl) {
        try {
          mapInstanceRef.current.removeControl(routingControl);
        } catch (e) {
        }
      }
    }
  }, [mapReady, routing])

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      <style>{`
        .leaflet-routing-container {
          display: none !important;
        }
      `}</style>
    </div>
  )
}

export const MapSkeleton: React.FC<{ height?: string }> = ({ height = '400px' }) => (
  <div
    className="bg-gray-200 rounded-lg overflow-hidden relative"
    style={{ height }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
      <div className="absolute top-4 left-4 space-y-2">
        <div className="h-8 w-64 bg-gray-400 rounded animate-pulse"></div>
        <div className="h-10 w-48 bg-gray-400 rounded animate-pulse"></div>
      </div>
      <div className="absolute bottom-4 right-4">
        <div className="h-12 w-12 bg-gray-400 rounded-full animate-pulse"></div>
      </div>
      {/* Mock map markers */}
      <div className="absolute top-1/3 left-1/4">
        <div className="h-6 w-6 bg-blue-500 rounded-full animate-pulse"></div>
      </div>
      <div className="absolute top-1/2 right-1/3">
        <div className="h-6 w-6 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      <div className="absolute bottom-1/3 left-1/2">
        <div className="h-6 w-6 bg-blue-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
)
