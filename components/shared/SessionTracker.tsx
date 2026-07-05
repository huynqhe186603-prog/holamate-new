'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics'

export function SessionTracker() {
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    trackEvent({ event_type: 'session_start' })

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        trackEvent({ event_type: 'session_heartbeat' })
      }
    }, 60_000)

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        trackEvent({ event_type: 'session_end' })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return null
}
