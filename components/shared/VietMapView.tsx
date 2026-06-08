'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Navigation, X, Loader2, ExternalLink, AlertCircle } from 'lucide-react'

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
    // Already available — skip
    if ((window as any).vietmapgl) { resolve(); return }
    // Tag exists but still loading — attach to it instead of resolving immediately
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Script error')), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Script error'))
    document.head.appendChild(s)
  })
}

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}
function formatTime(ms: number) {
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `~${mins} phút`
  const h = Math.floor(mins / 60), m = mins % 60
  return m === 0 ? `~${h} giờ` : `~${h} giờ ${m} phút`
}

interface Props {
  vendorLat: number
  vendorLng: number
  vendorName: string
  vendorAddress?: string | null
}

export function VietMapView({ vendorLat, vendorLng, vendorName, vendorAddress }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const cancelledRef  = useRef(false)
  const loadTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showMap,        setShowMap]        = useState(false)
  const [mapLoaded,      setMapLoaded]      = useState(false)
  const [mapError,       setMapError]       = useState<string | null>(null)
  const [routeInfo,      setRouteInfo]      = useState<{ distance: number; time: number } | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [gpsError,       setGpsError]       = useState<string | null>(null)

  // ── Route ────────────────────────────────────────────────────────────────
  const drawRoute = useCallback(async (userLat: number, userLng: number) => {
    const map       = mapRef.current
    const vmgl      = (window as any).vietmapgl
    if (!map || !vmgl || cancelledRef.current) return

    if (userMarkerRef.current) userMarkerRef.current.remove()
    userMarkerRef.current = new vmgl.Marker({ color: '#3B82F6' })
      .setLngLat([userLng, userLat]).addTo(map)

    setIsLoadingRoute(true)
    try {
      const res = await fetch(
        `/api/route-directions?fromLat=${userLat}&fromLng=${userLng}&toLat=${vendorLat}&toLng=${vendorLng}`
      )
      if (!res.ok || cancelledRef.current) return
      const data = await res.json()
      if (cancelledRef.current) return

      setRouteInfo({ distance: data.distance, time: data.time })

      if (map.getSource('route')) {
        ;(map.getSource('route') as any).setData({
          type: 'Feature', geometry: { type: 'LineString', coordinates: data.points },
        })
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: data.points } },
        })
        map.addLayer({
          id: 'route-line', type: 'line', source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3B82F6', 'line-width': 4, 'line-opacity': 0.85 },
        })
      }
      if (data.bbox) {
        map.fitBounds([[data.bbox[0], data.bbox[1]], [data.bbox[2], data.bbox[3]]], { padding: 60, maxZoom: 17 })
      }
    } catch { /* silent */ } finally {
      if (!cancelledRef.current) setIsLoadingRoute(false)
    }
  }, [vendorLat, vendorLng])

  // ── Map init ──────────────────────────────────────────────────────────────
  const startMap = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY
    console.log('[VietMapView] API Key present:', !!apiKey)

    if (!containerRef.current) { setMapError('Lỗi: container chưa sẵn sàng'); return }
    if (!apiKey)                 { setMapError('API key chưa được cấu hình'); return }

    // Load CDN
    try {
      injectStyle(CDN_CSS)
      console.log('[VietMapView] Loading VietMap script…')
      await loadScript(CDN_JS)
      console.log('[VietMapView] Script ready. window.vietmapgl:', !!(window as any).vietmapgl)
    } catch {
      if (!cancelledRef.current) setMapError('Không tải được thư viện bản đồ (CDN)')
      return
    }
    if (cancelledRef.current) return

    const vmgl = (window as any).vietmapgl
    if (!vmgl) { setMapError('window.vietmapgl undefined sau khi load script'); return }

    // Init map instance
    let map: any
    try {
      map = new vmgl.Map({
        container: containerRef.current,
        style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
        center: [vendorLng, vendorLat],
        zoom: 15,
        attributionControl: false,
      })
    } catch (err: any) {
      console.error('[VietMapView] new Map() threw:', err)
      if (!cancelledRef.current) setMapError('Không khởi tạo được bản đồ: ' + (err?.message ?? String(err)))
      return
    }
    mapRef.current = map

    // Style/tile load errors
    map.on('error', (e: any) => {
      console.error('[VietMapView] map.on(error):', e?.error ?? e)
      if (!cancelledRef.current)
        setMapError('Lỗi tải bản đồ — kiểm tra API key hoặc kết nối mạng')
    })

    // Timeout: if 'load' never fires
    loadTimerRef.current = setTimeout(() => {
      if (!cancelledRef.current && mapRef.current) {
        console.error('[VietMapView] Timeout — map.on(load) never fired')
        setMapError('Bản đồ tải quá lâu — kiểm tra kết nối mạng')
      }
    }, 15000)

    map.on('load', () => {
      if (loadTimerRef.current) { clearTimeout(loadTimerRef.current); loadTimerRef.current = null }
      if (cancelledRef.current) return
      console.log('[VietMapView] map loaded OK')

      // Vendor marker
      const popup = new vmgl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<strong style="font-size:13px">${vendorName}</strong>` +
        (vendorAddress ? `<br/><span style="font-size:11px;color:#666">${vendorAddress}</span>` : '')
      )
      new vmgl.Marker({ color: '#F97316' })
        .setLngLat([vendorLng, vendorLat]).setPopup(popup).addTo(map).togglePopup()

      setMapLoaded(true)

      // GPS
      if (!navigator.geolocation) { setGpsError('Trình duyệt không hỗ trợ GPS'); return }
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (!cancelledRef.current) drawRoute(pos.coords.latitude, pos.coords.longitude) },
        (err) => {
          console.warn('[VietMapView] GPS denied:', err.code, err.message)
          if (!cancelledRef.current) setGpsError('Không thể lấy vị trí của bạn')
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  }, [vendorLat, vendorLng, vendorName, vendorAddress, drawRoute])

  // ── Effect ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showMap) return
    cancelledRef.current = false
    startMap()
    return () => {
      cancelledRef.current = true
      if (loadTimerRef.current) { clearTimeout(loadTimerRef.current); loadTimerRef.current = null }
      if (mapRef.current)       { mapRef.current.remove(); mapRef.current = null }
      userMarkerRef.current = null
      setMapLoaded(false)
      setMapError(null)
      setRouteInfo(null)
      setIsLoadingRoute(false)
      setGpsError(null)
    }
  // startMap is stable; re-running only when showMap toggles is correct
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  const googleMapsUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${vendorLat},${vendorLng}&travelmode=driving`

  // ── Collapsed ─────────────────────────────────────────────────────────────
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

  // ── Expanded ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Map canvas — explicit px height so GL has a real size to work with */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-200" style={{ height: 360 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-label={`Bản đồ: ${vendorName}`} />

        {/* Loading */}
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-100">
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
            <span className="text-xs text-neutral-400">Đang tải bản đồ…</span>
          </div>
        )}

        {/* Error */}
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-50 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm font-medium text-neutral-700">Không tải được bản đồ</p>
            <p className="text-xs text-neutral-400">{mapError}</p>
            <button
              onClick={() => {
                setMapError(null)
                setMapLoaded(false)
                if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
                startMap()
              }}
              className="mt-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-neutral-400 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {isLoadingRoute && (
          <span className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Đang tính đường đi…
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

        <div className="ml-auto flex items-center gap-2">
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
