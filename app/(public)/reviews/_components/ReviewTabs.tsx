'use client'

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, Store, UtensilsCrossed, Search, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { REVIEWS_SELECT, type ReviewWithRelations } from '@/lib/utils/reviews'
import { ReviewCard } from '@/components/reviews/ReviewCard'

type TimeFilter = 'all' | '7d' | '30d' | '3m'
type SortBy = 'count' | 'rating'

const TABS = [
  { key: 'latest',    label: 'Mới nhất',   icon: Clock },
  { key: 'vendor',    label: 'Theo quán',  icon: Store },
  { key: 'menu_item', label: 'Theo món',   icon: UtensilsCrossed },
] as const

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: '7d',  label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '3m',  label: '3 tháng' },
]

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'count',  label: 'Review nhiều nhất' },
  { key: 'rating', label: 'Đánh giá cao nhất' },
]

type RawVendorReview = {
  id: string; rating: number; created_at: string; vendor_id: string
  vendors: { id: string; name: string; vendor_type: string; cover_image_url: string | null; logo_url: string | null } | null
}

type RawItemReview = {
  id: string; rating: number; created_at: string; menu_item_id: string
  menu_items: { id: string; name: string; image_url: string | null; vendor_id: string | null; vendors: { id: string; name: string; vendor_type: string } | null } | null
}

type GroupedVendor = { id: string; name: string; vendor_type: string; img: string | null; count: number; avgRating: number }
type GroupedItem   = { id: string; name: string; img: string | null; vendorId: string | null; vendorName: string | null; vendorType: string | null; count: number; avgRating: number }
type SelectedEntity = { id: string; name: string; type: 'vendor' | 'item'; pageHref: string | null }

export function ReviewTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  // Grouped data state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('count')
  const [vendorReviews, setVendorReviews] = useState<RawVendorReview[]>([])
  const [itemReviews, setItemReviews] = useState<RawItemReview[]>([])
  const [loading, setLoading] = useState(false)

  // New state
  const [search, setSearch] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const [selectedReviews, setSelectedReviews] = useState<ReviewWithRelations[]>([])
  const [selectedLoading, setSelectedLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get current user once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch grouped data when tab changes
  useEffect(() => {
    setSelectedEntity(null)
    setSearch('')
    setSelectedReviews([])

    if (activeTab === 'vendor' && vendorReviews.length === 0) {
      setLoading(true)
      supabase
        .from('reviews')
        .select('id, rating, created_at, vendor_id, vendors(id, name, vendor_type, cover_image_url, logo_url)')
        .eq('status', 'visible').eq('review_type', 'vendor').not('vendor_id', 'is', null).limit(1000)
        .then(({ data }) => { setVendorReviews((data ?? []) as unknown as RawVendorReview[]); setLoading(false) })
    }
    if (activeTab === 'menu_item' && itemReviews.length === 0) {
      setLoading(true)
      supabase
        .from('reviews')
        .select('id, rating, created_at, menu_item_id, menu_items(id, name, image_url, vendor_id, vendors(id, name, vendor_type))')
        .eq('status', 'visible').eq('review_type', 'menu_item').not('menu_item_id', 'is', null).limit(1000)
        .then(({ data }) => { setItemReviews((data ?? []) as unknown as RawItemReview[]); setLoading(false) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Fetch reviews for selected entity
  const handleEntitySelect = useCallback(async (entity: SelectedEntity) => {
    setSelectedEntity(entity)
    setSelectedLoading(true)
    setSelectedReviews([])

    const { data } = entity.type === 'vendor'
      ? await supabase.from('reviews').select(REVIEWS_SELECT)
          .eq('status', 'visible').eq('vendor_id', entity.id).eq('review_type', 'vendor')
          .order('created_at', { ascending: false }).limit(50)
      : await supabase.from('reviews').select(REVIEWS_SELECT)
          .eq('status', 'visible').eq('menu_item_id', entity.id).eq('review_type', 'menu_item')
          .order('created_at', { ascending: false }).limit(50)

    setSelectedReviews((data ?? []) as unknown as ReviewWithRelations[])
    setSelectedLoading(false)
  }, [supabase])

  // Computed grouped lists
  const cutoff = useMemo((): Date | null => {
    const now = new Date()
    if (timeFilter === '7d')  return new Date(now.getTime() - 7 * 86400_000)
    if (timeFilter === '30d') return new Date(now.getTime() - 30 * 86400_000)
    if (timeFilter === '3m')  return new Date(now.getTime() - 90 * 86400_000)
    return null
  }, [timeFilter])

  const groupedVendors = useMemo((): GroupedVendor[] => {
    const rows = cutoff ? vendorReviews.filter(r => new Date(r.created_at) >= cutoff) : vendorReviews
    const map = new Map<string, { v: RawVendorReview['vendors']; count: number; total: number }>()
    for (const r of rows) {
      if (!r.vendor_id || !r.vendors) continue
      const e = map.get(r.vendor_id) ?? { v: r.vendors, count: 0, total: 0 }
      e.count++; e.total += r.rating
      map.set(r.vendor_id, e)
    }
    return Array.from(map.values())
      .sort((a, b) => sortBy === 'count' ? b.count - a.count : (b.total / b.count) - (a.total / a.count))
      .map(({ v, count, total }) => ({ id: v!.id, name: v!.name, vendor_type: v!.vendor_type, img: v!.cover_image_url ?? v!.logo_url, count, avgRating: total / count }))
  }, [vendorReviews, cutoff, sortBy])

  const groupedItems = useMemo((): GroupedItem[] => {
    const rows = cutoff ? itemReviews.filter(r => new Date(r.created_at) >= cutoff) : itemReviews
    const map = new Map<string, { item: RawItemReview['menu_items']; count: number; total: number }>()
    for (const r of rows) {
      if (!r.menu_item_id || !r.menu_items) continue
      const e = map.get(r.menu_item_id) ?? { item: r.menu_items, count: 0, total: 0 }
      e.count++; e.total += r.rating
      map.set(r.menu_item_id, e)
    }
    return Array.from(map.values())
      .sort((a, b) => sortBy === 'count' ? b.count - a.count : (b.total / b.count) - (a.total / a.count))
      .map(({ item, count, total }) => ({
        id: item!.id, name: item!.name, img: item!.image_url,
        vendorId: item!.vendors?.id ?? item!.vendor_id ?? null,
        vendorName: item!.vendors?.name ?? null,
        vendorType: item!.vendors?.vendor_type ?? null,
        count, avgRating: total / count,
      }))
  }, [itemReviews, cutoff, sortBy])

  // Filtered by search
  const filteredVendors = useMemo(() =>
    search.trim() ? groupedVendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase())) : groupedVendors
  , [groupedVendors, search])

  const filteredItems = useMemo(() =>
    search.trim() ? groupedItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : groupedItems
  , [groupedItems, search])

  const switchTab = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', key)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  const isGrouped = activeTab === 'vendor' || activeTab === 'menu_item'
  const displayRows = activeTab === 'vendor' ? filteredVendors : filteredItems

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex bg-neutral-100 rounded-xl p-1 gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            disabled={isPending}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              activeTab === key ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Grouped tab content ── */}
      {isGrouped && (
        <>
          {/* Selected entity → inline reviews */}
          {selectedEntity ? (
            <div className="mt-4">
              <button
                onClick={() => setSelectedEntity(null)}
                className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Tất cả {activeTab === 'vendor' ? 'quán' : 'món'}
              </button>

              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-semibold text-neutral-900 truncate">{selectedEntity.name}</h2>
                {selectedEntity.pageHref && (
                  <Link
                    href={selectedEntity.pageHref}
                    className="flex items-center gap-1 text-sm text-primary hover:underline shrink-0 transition-colors"
                  >
                    {selectedEntity.type === 'vendor' ? 'Xem trang quán' : 'Xem trang quán'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {selectedLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : selectedReviews.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="text-4xl">💬</div>
                  <p className="text-sm text-neutral-400">Chưa có review nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedReviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      currentUserId={currentUserId}
                      userVoteScore={null}
                      showSubject={false}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {TIME_FILTERS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setTimeFilter(f.key)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                        timeFilter === f.key
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SORT_OPTIONS.map(s => (
                    <button
                      key={s.key}
                      onClick={() => setSortBy(s.key)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                        sortBy === s.key
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-amber-300'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={activeTab === 'vendor' ? 'Tìm quán...' : 'Tìm món...'}
                  className="w-full pl-9 pr-4 h-10 rounded-xl border border-neutral-200 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-colors"
                />
              </div>

              {/* Grouped list */}
              <div className="mt-3 space-y-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-neutral-100 animate-pulse" />
                  ))
                ) : displayRows.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <div className="text-4xl">🍽️</div>
                    <p className="text-sm text-neutral-400">
                      {search.trim() ? 'Không tìm thấy kết quả.' : 'Không có dữ liệu trong khoảng thời gian này.'}
                    </p>
                  </div>
                ) : (
                  displayRows.map((row, i) => {
                    const isVendorTab = activeTab === 'vendor'
                    const vRow = row as GroupedVendor
                    const iRow = row as GroupedItem
                    const img = isVendorTab ? vRow.img : iRow.img
                    const sub = isVendorTab ? null : iRow.vendorName

                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => handleEntitySelect({
                          id: row.id,
                          name: row.name,
                          type: isVendorTab ? 'vendor' : 'item',
                          pageHref: isVendorTab
                            ? vRow.vendor_type === 'student_booth' ? `/explore/booths/${vRow.id}` : `/explore/vendors/${vRow.id}`
                            : iRow.vendorId
                              ? iRow.vendorType === 'student_booth' ? `/explore/booths/${iRow.vendorId}` : `/explore/vendors/${iRow.vendorId}`
                              : null,
                        })}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl border border-neutral-100 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                      >
                        <span className="text-sm font-bold text-neutral-300 w-6 shrink-0 text-center">{i + 1}</span>
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center text-xl">
                          {img
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={img} alt="" className="w-full h-full object-cover" />
                            : isVendorTab ? '🏪' : '🍜'
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-neutral-900 truncate">{row.name}</p>
                          {sub && <p className="text-xs text-neutral-400 truncate">{sub}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-neutral-800">{row.count} review</p>
                          <p className="text-xs text-amber-500">★ {row.avgRating.toFixed(1)}</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
