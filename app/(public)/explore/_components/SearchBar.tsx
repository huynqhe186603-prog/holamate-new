'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

const PLACEHOLDERS: Record<string, string> = {
  fixed_shop:    'Tìm tên quán, số điện thoại...',
  online_seller: 'Tìm tên người bán, SĐT...',
  student_booth: 'Tìm tên gian hàng, SĐT...',
}

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const type = searchParams.get('type') ?? 'fixed_shop'
  const qParam = searchParams.get('q') ?? ''

  const [value, setValue] = useState(qParam)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync if URL changes externally (e.g. tab switch clears q)
  useEffect(() => { setValue(qParam) }, [qParam])

  const pushQ = (q: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (q.trim()) {
      params.set('q', q.trim())
      trackEvent({ event_type: 'search', event_data: { query: q.trim().slice(0, 100) } })
    } else {
      params.delete('q')
    }
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushQ(v), 300)
  }

  const handleClear = () => {
    setValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    pushQ('')
  }

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={PLACEHOLDERS[type] ?? PLACEHOLDERS.fixed_shop}
        className={cn(
          'w-full h-11 pl-10 pr-10 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400',
          'focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
          'transition-all duration-150',
          isPending && 'opacity-70'
        )}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
