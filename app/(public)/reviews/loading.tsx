import { ReviewCardSkeleton } from '@/components/reviews/ReviewCard'

export default function ReviewsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-neutral-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-28 bg-neutral-200 rounded-lg animate-pulse" />
      </div>
      <div className="h-11 bg-neutral-100 rounded-xl animate-pulse mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <ReviewCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
