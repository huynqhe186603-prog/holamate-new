'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const LABELS = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Rất tốt']

interface StarPickerProps {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'lg'
  readOnly?: boolean
  className?: string
}

export function StarPicker({ value, onChange, size = 'lg', readOnly = false, className }: StarPickerProps) {
  const [hovered, setHovered] = useState(0)
  const starSize = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  const active = hovered || value

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center">
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => !readOnly && setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => { if (!readOnly) { onChange(n); setHovered(0) } }}
              onMouseEnter={() => !readOnly && setHovered(n)}
              className={cn('transition-transform', !readOnly && 'hover:scale-110 active:scale-95')}
            >
              <Star
                className={cn(
                  starSize,
                  'transition-colors',
                  n <= active
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-neutral-200 text-neutral-200'
                )}
              />
            </button>
          ))}
        </div>
        {!readOnly && (
          <span className="ml-2 text-sm font-medium text-neutral-600 min-w-[80px]">
            {active > 0 ? LABELS[active] : ''}
          </span>
        )}
      </div>
    </div>
  )
}
