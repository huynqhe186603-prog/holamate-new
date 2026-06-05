export function VendorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-neutral-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-neutral-200 rounded w-3/4" />
        <div className="flex gap-1.5">
          <div className="h-5 bg-neutral-100 rounded-md w-12" />
          <div className="h-5 bg-neutral-100 rounded-md w-16" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 bg-neutral-200 rounded w-20" />
          <div className="h-3 bg-neutral-200 rounded w-16" />
        </div>
        <div className="h-3 bg-neutral-100 rounded w-24" />
      </div>
    </div>
  )
}

export function VendorGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <VendorCardSkeleton key={i} />
      ))}
    </div>
  )
}
