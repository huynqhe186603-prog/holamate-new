'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

interface Props {
  vendorId: string
  vendorName: string
}

export function MenuViewTracker({ vendorId, vendorName }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    if (!ref.current || firedRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true
          trackEvent({
            event_type: 'view_menu',
            event_data: { vendor_id: vendorId, vendor_name: vendorName },
          })
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [vendorId, vendorName])

  return <div ref={ref} />
}
