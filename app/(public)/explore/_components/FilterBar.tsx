'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition, useState, useEffect } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FOOD_CATEGORY_GROUPS } from '@/lib/utils/explore'

const SLIDER_MAX = 200000
const SLIDER_STEP = 5000

function formatPriceK(n: number): string {
  if (n === 0) return '0đ'
  if (n >= SLIDER_MAX) return '200k+'
  return `${Math.round(n / 1000)}k`
}

export function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const category = searchParams.get('category') ?? ''
  const maxPriceParam = Number(searchParams.get('max_price') ?? SLIDER_MAX)
  const openNow = searchParams.get('open_now') === 'true'
  const hasDelivery = searchParams.get('has_delivery') === 'true'

  // Local state for slider — update URL only on release
  const [sliderValue, setSliderValue] = useState(maxPriceParam)
  useEffect(() => { setSliderValue(maxPriceParam) }, [maxPriceParam])

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [searchParams, pathname, router])

  const toggleCategory = (key: string) =>
    updateParam('category', category === key ? null : key)

  const toggleBool = (key: string, current: boolean) =>
    updateParam(key, current ? null : 'true')

  const commitSlider = () =>
    updateParam('max_price', sliderValue >= SLIDER_MAX ? null : String(sliderValue))

  const activeCount = [
    category ? 1 : 0,
    maxPriceParam < SLIDER_MAX ? 1 : 0,
    openNow ? 1 : 0,
    hasDelivery ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    ;['category', 'max_price', 'open_now', 'has_delivery', 'page'].forEach(k => params.delete(k))
    setSliderValue(SLIDER_MAX)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className={cn('space-y-4 transition-opacity duration-150', isPending && 'opacity-60 pointer-events-none')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <SlidersHorizontal className="w-4 h-4" />
          Bộ lọc
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Category groups */}
      <div className="space-y-3">
        {FOOD_CATEGORY_GROUPS.map(group => (
          <div key={group.groupKey}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">
              {group.groupLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.categories.map(({ key, label, emoji }) => (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                    category === key
                      ? 'border-primary bg-primary text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary/50 hover:text-primary'
                  )}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Price slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Giá tối đa</span>
          <span className={cn(
            'text-xs font-semibold tabular-nums',
            sliderValue < SLIDER_MAX ? 'text-primary' : 'text-neutral-400'
          )}>
            {formatPriceK(0)} — {formatPriceK(sliderValue)}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          value={sliderValue}
          onChange={e => setSliderValue(Number(e.target.value))}
          onMouseUp={commitSlider}
          onTouchEnd={commitSlider}
          className="w-full cursor-pointer accent-primary"
          style={{ height: '6px' }}
        />

        <div className="flex justify-between text-[10px] text-neutral-400 px-0.5 select-none">
          <span>0</span>
          <span>50k</span>
          <span>100k</span>
          <span>150k</span>
          <span>200k+</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-2">
        <Toggle
          label="Đang mở"
          active={openNow}
          onClick={() => toggleBool('open_now', openNow)}
          color="emerald"
        />
        <Toggle
          label="Có ship"
          active={hasDelivery}
          onClick={() => toggleBool('has_delivery', hasDelivery)}
          color="blue"
        />
      </div>
    </div>
  )
}

function Toggle({
  label,
  active,
  onClick,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  color: 'emerald' | 'blue'
}) {
  const activeClass =
    color === 'emerald'
      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
      : 'border-blue-500 bg-blue-50 text-blue-700'

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? activeClass : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
      )}
    >
      <span className={cn(
        'w-2 h-2 rounded-full',
        active
          ? color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'
          : 'bg-neutral-300'
      )} />
      {label}
    </button>
  )
}
