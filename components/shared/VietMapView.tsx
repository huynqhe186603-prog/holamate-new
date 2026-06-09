'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Navigation, X, Loader2, ExternalLink, AlertCircle, Clock } from 'lucide-react'

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
    if ((window as any).vietmapgl) { resolve(); return }
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('CDN load failed')), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('CDN load failed'))
    document.head.appendChild(s)
  })
}

function fmtDist(m: number) { return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km` }
function fmtTime(ms: number) {
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
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showMap,        setShowMap]        = useState(false)
  const [mapLoaded,      setMapLoaded]      = useState(false)
  const [mapError,       setMapError]       = useState<string | null>(null)
  const [routeInfo,      setRouteInfo]      = useState<{ distance: number; time: number } | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [gpsError,       setGpsError]       = useState<string | null>(null)

  // ── Routing ───────────────────────────────────────────────────────────────
  const drawRoute = useCallback(async (userLat: number, userLng: number) => {
    const map  = mapRef.current
    const vmgl = (window as any).vietmapgl
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
        map.fitBounds(
          [[data.bbox[0], data.bbox[1]], [data.bbox[2], data.bbox[3]]],
          { padding: 60, maxZoom: 17 }
        )
      }
    } catch { /* silent */ } finally {
      if (!cancelledRef.current) setIsLoadingRoute(false)
    }
  }, [vendorLat, vendorLng])

  // ── Map init ──────────────────────────────────────────────────────────────
  const startMap = useCallback(async () => {
    if (!containerRef.current) { setMapError('Container chưa sẵn sàng'); return }

    // Load VietMap GL JS from CDN
    try {
      injectStyle(CDN_CSS)
      console.log('[VietMapView] Loading SDK from CDN…')
      await loadScript(CDN_JS)
      console.log('[VietMapView] SDK ready:', !!(window as any).vietmapgl)
    } catch {
      if (!cancelledRef.current) setMapError('Không tải được thư viện bản đồ (CDN unpkg)')
      return
    }
    if (cancelledRef.current) return

    const vmgl = (window as any).vietmapgl
    if (!vmgl) { setMapError('SDK chưa khởi tạo sau khi load'); return }

    // Style URL now goes through our proxy → no CORS issue
    let map: any
    try {
      map = new vmgl.Map({
        container: containerRef.current,
        style: '/api/vietmap/style',   // ← proxy, not direct VietMap URL
        center: [vendorLng, vendorLat],
        zoom: 15,
        attributionControl: false,
      })
    } catch (err: any) {
      console.error('[VietMapView] new Map():', err)
      if (!cancelledRef.current) setMapError('Không khởi tạo được bản đồ: ' + (err?.message ?? ''))
      return
    }
    mapRef.current = map

    map.on('error', (e: any) => {
      console.error('[VietMapView] map error:', e?.error ?? e)
      // Only show fatal errors (before map has fully loaded)
      if (!cancelledRef.current && !mapLoaded)
        setMapError('Lỗi tải bản đồ: ' + (e?.error?.message ?? 'Lỗi không xác định'))
    })

    // Timeout: if map.on('load') never fires in 20s
    timerRef.current = setTimeout(() => {
      if (!cancelledRef.current && !mapLoaded) {
        console.error('[VietMapView] load timeout')
        setMapError('Bản đồ tải quá lâu — kiểm tra kết nối mạng')
      }
    }, 20000)

    map.on('load', () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      if (cancelledRef.current) return
      console.log('[VietMapView] map loaded OK ✓')

      // Vendor marker (orange)
      const popup = new vmgl.Popup({ offset: 25, closeButton: false }).setHTML(
        `<strong style="font-size:13px">${vendorName}</strong>` +
        (vendorAddress ? `<br/><span style="font-size:11px;color:#666">${vendorAddress}</span>` : '')
      )
      new vmgl.Marker({ color: '#F97316' })
        .setLngLat([vendorLng, vendorLat]).setPopup(popup).addTo(map).togglePopup()

      setMapLoaded(true)

      // Request GPS → draw route
      if (!navigator.geolocation) { setGpsError('Trình duyệt không hỗ trợ GPS'); return }
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (!cancelledRef.current) drawRoute(pos.coords.latitude, pos.coords.longitude) },
        (err) => {
          console.warn('[VietMapView] GPS:', err.code, err.message)
          if (!cancelledRef.current) setGpsError('Không thể lấy vị trí của bạn')
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  }, [vendorLat, vendorLng, vendorName, vendorAddress, drawRoute, mapLoaded])

  // ── Effect ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showMap) return
    cancelledRef.current = false
    startMap()
    return () => {
      cancelledRef.current = true
      if (timerRef.current)  { clearTimeout(timerRef.current); timerRef.current = null }
      if (mapRef.current)    { mapRef.current.remove(); mapRef.current = null }
      userMarkerRef.current = null
      setMapLoaded(false); setMapError(null); setRouteInfo(null)
      setIsLoadingRoute(false); setGpsError(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  const googleMapsDir =
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
      <div className="relative rounded-2xl overflow-hidden border border-neutral-200" style={{ height: 360 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-label={`Bản đồ: ${vendorName}`} />

        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-100">
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
            <span className="text-xs text-neutral-400">Đang tải bản đồ…</span>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-50 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm font-medium text-neutral-700">Không tải được bản đồ</p>
            <p className="text-xs text-neutral-400">{mapError}</p>
            <button
              onClick={() => {
                setMapError(null); setMapLoaded(false)
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

      {/* Route info / loading / GPS error */}
      {isLoadingRoute && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-sm text-blue-600">Đang tính đường đi…</span>
        </div>
      )}
      {routeInfo && !isLoadingRoute && (
        <div className="flex items-center gap-4 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-1.5 text-sm font-medium text-blue-700">
            <Navigation className="w-4 h-4" />
            {fmtDist(routeInfo.distance)}
          </div>
          <div className="text-neutral-300">|</div>
          <div className="flex items-center gap-1.5 text-sm text-blue-600">
            <Clock className="w-4 h-4" />
            {fmtTime(routeInfo.time)}
          </div>
          <div className="ml-auto text-xs text-blue-500">🏍️ Xe máy</div>
        </div>
      )}
      {gpsError && !isLoadingRoute && !routeInfo && (
        <p className="text-xs text-neutral-400 px-1">{gpsError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <a
          href={googleMapsDir}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-300 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />Google Maps
        </a>
        <button
          onClick={() => setShowMap(false)}
          className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />Đóng
        </button>
      </div>
    </div>
  )
}
