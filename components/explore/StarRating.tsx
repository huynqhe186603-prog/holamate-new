import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number | null
  count?: number
  size?: 'sm' | 'md'
  showEmpty?: boolean
  className?: string
}

export function StarRating({
  rating,
  count,
  size = 'sm',
  showEmpty = false,
  className,
}: StarRatingProps) {
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  if (!rating && !showEmpty) {
    return (
      <span className={cn('text-xs text-neutral-400', className)}>
        Chưa có đánh giá
      </span>
    )
  }

  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = rating ? i < Math.round(rating) : false
    return filled
  })

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {stars.map((filled, i) => (
          <Star
            key={i}
            className={cn(
              starSize,
              filled
                ? 'fill-amber-400 text-amber-400'
                : 'fill-neutral-200 text-neutral-200'
            )}
          />
        ))}
      </div>
      {rating && (
        <span className={cn('font-medium text-neutral-700', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && count > 0 && (
        <span className={cn('text-neutral-400', size === 'sm' ? 'text-xs' : 'text-sm')}>
          ({count})
        </span>
      )}
    </div>
  )
}
