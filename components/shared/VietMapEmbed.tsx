'use client'

import { useEffect, useRef } from 'react'

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
      const { default: vietmapgl } = await import('@vietmap/vietmap-gl-js')
      if (cancelled || !containerRef.current) return

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
