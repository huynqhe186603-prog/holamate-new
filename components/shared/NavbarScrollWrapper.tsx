'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavbarScrollWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) { setScrolled(true); return }
    const check = () => setScrolled(window.scrollY > 50)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [isHome])

  const transparent = isHome && !scrolled

  return (
    <header
      data-transparent={transparent}
      className={
        transparent
          ? 'sticky top-0 z-50 w-full border-b border-white/10 bg-transparent transition-all duration-300'
          : 'sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md transition-all duration-300'
      }
    >
      {children}
    </header>
  )
}
