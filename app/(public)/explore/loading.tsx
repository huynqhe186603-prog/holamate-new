import { VendorGridSkeleton } from '@/components/explore/VendorCardSkeleton'

export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-neutral-100 rounded animate-pulse" />
      </div>
      <div className="h-12 bg-neutral-100 rounded-xl animate-pulse mb-5" />
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-neutral-100 rounded-full animate-pulse shrink-0" />
          ))}
        </div>
        <div className="flex gap-3">
          <div className="h-8 w-64 bg-neutral-100 rounded animate-pulse" />
          <div className="h-8 w-24 bg-neutral-100 rounded-full animate-pulse ml-auto" />
          <div className="h-8 w-20 bg-neutral-100 rounded-full animate-pulse" />
        </div>
      </div>
      <VendorGridSkeleton count={6} />
    </div>
  )
}
