import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingSummaryProps {
  reviews: { rating: number }[]
  className?: string
}

export function RatingSummary({ reviews, className }: RatingSummaryProps) {
  if (reviews.length === 0) return null

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100),
  }))

  return (
    <div className={cn('flex gap-6 items-center', className)}>
      {/* Average */}
      <div className="text-center shrink-0">
        <p className="text-4xl font-bold text-neutral-900">{avg.toFixed(1)}</p>
        <div className="flex justify-center gap-0.5 my-1">
          {[1, 2, 3, 4, 5].map(n => (
            <Star
              key={n}
              className={cn(
                'w-3.5 h-3.5',
                n <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'
              )}
            />
          ))}
        </div>
        <p className="text-xs text-neutral-400">{reviews.length} đánh giá</p>
      </div>

      {/* Distribution */}
      <div className="flex-1 space-y-1">
        {dist.map(({ star, count, pct }) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-3 text-right shrink-0">{star}</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-neutral-400 w-7 text-right shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
