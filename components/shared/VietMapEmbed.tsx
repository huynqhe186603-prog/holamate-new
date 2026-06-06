'use client'

import { useEffect, useRef } from 'react'

const CDN_CSS = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.css'
const CDN_JS = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.js'

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

interface VietMapEmbedProps {
  latitude: number
  longitude: number
  zoom?: number
  title?: string
  className?: string
}

export function VietMapEmbed({
  latitude,
  longitude,
  zoom = 16,
  title = 'Vị trí',
  className = '',
}: VietMapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY
    if (!apiKey) return

    let cancelled = false

    const initMap = async () => {
      injectStyle(CDN_CSS)
      await loadScript(CDN_JS)
      if (cancelled || !containerRef.current) return

      const vietmapgl = (window as any).vietmapgl
      if (!vietmapgl) return

      const map = new vietmapgl.Map({
        container: containerRef.current,
        style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
        center: [longitude, latitude], // GL JS: [lng, lat]
        zoom,
        attributionControl: false,
      })
      mapRef.current = map

      map.on('load', () => {
        if (cancelled) return
        new vietmapgl.Marker({ color: '#ef4444' })
          .setLngLat([longitude, latitude])
          .setPopup(
            new vietmapgl.Popup({ offset: 25, closeButton: false }).setText(title)
          )
          .addTo(map)
      })
    }

    initMap()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [latitude, longitude, zoom, title])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      aria-label={`Bản đồ: ${title}`}
    />
  )
}
