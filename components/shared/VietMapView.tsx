'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Navigation, X, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const CDN_CSS = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.css'
const CDN_JS  = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.js'

function injectStyle(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`
  return `${(metres / 1000).toFixed(1)} km`
}

function formatTime(ms: number): string {
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `~${mins} phút`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `~${h} giờ` : `~${h} giờ ${m} phút`
}

interface Props {
  vendorLat: number
  vendorLng: number
  vendorName: string
  vendorAddress?: string | null
}

interface RouteInfo {
  distance: number
  time: number
}

export function VietMapView({ vendorLat, vendorLng, vendorName, vendorAddress }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<any>(null)
  const userMarkerRef  = useRef<any>(null)
  const cancelledRef   = useRef(false)

  const [showMap,       setShowMap]       = useState(false)
  const [mapLoaded,     setMapLoaded]     = useState(false)
  const [routeInfo,     setRouteInfo]     = useState<RouteInfo | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [gpsError,      setGpsError]      = useState<string | null>(null)

  const drawRoute = useCallback(async (userLat: number, userLng: number) => {
    const map = mapRef.current
    const vietmapgl = (window as any).vietmapgl
    if (!map || !vietmapgl || cancelledRef.current) return

    // Blue marker: user position
    if (userMarkerRef.current) userMarkerRef.current.remove()
    userMarkerRef.current = new vietmapgl.Marker({ color: '#3B82F6' })
      .setLngLat([userLng, userLat])
      .addTo(map)

    setIsLoadingRoute(true)
    try {
      const res = await fetch(
        `/api/route-directions?fromLat=${userLat}&fromLng=${userLng}&toLat=${vendorLat}&toLng=${vendorLng}`
      )
      if (!res.ok || cancelledRef.current) return
      const data = await res.json()
      if (cancelledRef.current) return

      setRouteInfo({ distance: data.distance, time: data.time })

      // Draw or update route polyline
      if (map.getSource('route')) {
        ;(map.getSource('route') as any).setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: data.points },
        })
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: data.points },
          },
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3B82F6', 'line-width': 4, 'line-opacity': 0.85 },
        })
      }

      if (data.bbox) {
        map.fitBounds(
          [[data.bbox[0], data.bbox[1]], [data.bbox[2], data.bbox[3]]],
          { padding: 60, maxZoom: 17 }
        )
      }
    } catch {
      // route fetch failed — markers still visible
    } finally {
      if (!cancelledRef.current) setIsLoadingRoute(false)
    }
  }, [vendorLat, vendorLng])

  const initMap = useCallback(async () => {
    if (!containerRef.current) return
    const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY
    if (!apiKey) return

    injectStyle(CDN_CSS)
    await loadScript(CDN_JS)
    if (cancelledRef.current || !containerRef.current) return

    const vietmapgl = (window as any).vietmapgl
    if (!vietmapgl) return

    const map = new vietmapgl.Map({
      container: containerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
      center: [vendorLng, vendorLat],
      zoom: 15,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      if (cancelledRef.current) return

      // Orange marker: vendor position
      const popup = new vietmapgl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<strong style="font-size:13px">${vendorName}</strong>` +
        (vendorAddress ? `<br/><span style="font-size:11px;color:#666">${vendorAddress}</span>` : '')
      )
      new vietmapgl.Marker({ color: '#F97316' })
        .setLngLat([vendorLng, vendorLat])
        .setPopup(popup)
        .addTo(map)
        .togglePopup()

      setMapLoaded(true)

      // Request GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelledRef.current) return
            setGpsError(null)
            drawRoute(pos.coords.latitude, pos.coords.longitude)
          },
          () => {
            if (!cancelledRef.current) setGpsError('Không thể lấy vị trí của bạn')
          },
          { enableHighAccuracy: true, timeout: 8000 }
        )
      } else {
        setGpsError('Trình duyệt không hỗ trợ GPS')
      }
    })
  }, [vendorLat, vendorLng, vendorName, vendorAddress, drawRoute])

  useEffect(() => {
    if (!showMap) return
    cancelledRef.current = false
    initMap()
    return () => {
      cancelledRef.current = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      userMarkerRef.current = null
      setMapLoaded(false)
      setRouteInfo(null)
      setIsLoadingRoute(false)
      setGpsError(null)
    }
  }, [showMap, initMap])

  const googleMapsUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${vendorLat},${vendorLng}&travelmode=driving`

  // ── Collapsed state ──────────────────────────────────────────────────────
  if (!showMap) {
    return (
      <button
        onClick={() => setShowMap(true)}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm font-medium text-neutral-700 hover:border-primary/40 hover:text-primary transition-colors shadow-sm"
      >
        <MapPin className="w-4 h-4 text-primary" />
        Xem vị trí &amp; Chỉ đường
      </button>
    )
  }

  // ── Expanded state ───────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Map canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-200 h-72 sm:h-96">
        <div
          ref={containerRef}
          className="w-full h-full"
          aria-label={`Bản đồ: ${vendorName}`}
        />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Info + action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {isLoadingRoute && (
          <span className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Đang tính đường đi...
          </span>
        )}
        {routeInfo && !isLoadingRoute && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
            {formatDistance(routeInfo.distance)} · {formatTime(routeInfo.time)}
          </span>
        )}
        {gpsError && !isLoadingRoute && !routeInfo && (
          <span className="text-xs text-neutral-400">{gpsError}</span>
        )}

        <div className={cn('flex items-center gap-2', !isLoadingRoute && !routeInfo && !gpsError ? '' : 'ml-auto')}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Google Maps
          </a>
          <button
            onClick={() => setShowMap(false)}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
