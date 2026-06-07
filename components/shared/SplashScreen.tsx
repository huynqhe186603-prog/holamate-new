'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const SPLASH_KEY = 'holamate_splash_shown'
const VISIBLE_MS = 2000
const FADE_MS = 500

export function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY)) return
    setVisible(true)

    const fadeTimer = setTimeout(() => setFading(true), VISIBLE_MS)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem(SPLASH_KEY, '1')
    }, VISIBLE_MS + FADE_MS)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-orange-400 to-orange-500"
      style={{
        transition: `opacity ${FADE_MS}ms ease-out`,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Logo + tagline */}
      <div
        className="flex flex-col items-center gap-5"
        style={{
          animation: 'splashIn 0.6s ease-out forwards',
        }}
      >
        <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src="/logo.jpg"
            alt="HolaMate"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="text-center space-y-1">
          <p className="text-3xl font-bold text-white tracking-tight drop-shadow">
            HolaMate
          </p>
          <p className="text-white/85 font-medium text-base">
            Chọn đúng quán – Ăn đúng gu!
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-16 w-48">
        <div className="w-full h-1 rounded-full bg-white/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/90"
            style={{
              animation: `splashProgress ${VISIBLE_MS}ms ease-in-out forwards`,
              boxShadow: '0 0 8px 2px rgba(255,255,255,0.6)',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splashIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
