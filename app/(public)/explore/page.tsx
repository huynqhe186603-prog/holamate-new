import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { VendorCard, OnlineSellerCard, BoothCard } from '@/components/explore/VendorCard'
import { VendorGridSkeleton } from '@/components/explore/VendorCardSkeleton'
import { FilterBar } from './_components/FilterBar'
import { TabSwitcher } from './_components/TabSwitcher'
import { computeRating, isVendorOpen, CATEGORY_DB_MAP, CATEGORY_TEXT_SEARCH } from '@/lib/utils/explore'
import type { VendorWithRating } from '@/lib/utils/explore'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Khám phá ẩm thực',
  description: 'Khám phá quán ăn và gian hàng sinh viên khu vực Hòa Lạc.',
}

interface ExplorePageProps {
  searchParams: {
    type?: string
    category?: string
    max_price?: string
    open_now?: string
    has_delivery?: string
    page?: string
  }
}

async function VendorGrid({ searchParams }: ExplorePageProps) {
  const supabase = createClient()
  const type = searchParams.type === 'student_booth'
    ? 'student_booth'
    : searchParams.type === 'online_seller'
      ? 'online_seller'
      : 'fixed_shop'
  const maxPrice = searchParams.max_price ? Number(searchParams.max_price) : null
  const openNow = searchParams.open_now === 'true'
  const hasDelivery = searchParams.has_delivery === 'true'
  const category = searchParams.category ?? null

  let query = supabase
    .from('vendors')
    .select(`
      id, name, description, vendor_type, cover_image_url, logo_url,
      phone, zalo, address, area, opening_hours, has_delivery,
      price_range_min, price_range_max, food_categories,
      reviews(rating)
    `)
    .eq('status', 'active')
    .eq('vendor_type', type as any)
    .order('created_at', { ascending: false })
    .limit(30)

  if (hasDelivery) query = query.eq('has_delivery', true)
  if (maxPrice) query = query.lte('price_range_min', maxPrice)
  if (category) {
    if (Object.prototype.hasOwnProperty.call(CATEGORY_DB_MAP, category)) {
      const dbValues = CATEGORY_DB_MAP[category]
      if (dbValues !== null) {
        query = query.contains('food_categories', dbValues)
      } else {
        const text = CATEGORY_TEXT_SEARCH[category]
        if (text) query = query.or(`name.ilike.%${text}%,description.ilike.%${text}%`)
      }
    } else {
      // Legacy category key (direct DB value)
      query = query.contains('food_categories', [category])
    }
  }

  const { data: raw, error } = await query

  if (error || !raw) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-400 text-sm">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      </div>
    )
  }

  // Compute rating + open status
  let vendors: VendorWithRating[] = raw.map((v: any) => {
    const { avg, count } = computeRating(v.reviews ?? [])
    return {
      ...v,
      opening_hours: v.opening_hours as Record<string, string> | null,
      food_categories: v.food_categories as string[] | null,
      rating_avg: avg,
      rating_count: count,
      is_open: isVendorOpen(v.opening_hours as Record<string, string> | null),
    }
  })

  // Client-side open_now filter (server doesn't know client timezone easily)
  if (openNow) vendors = vendors.filter(v => v.is_open)

  if (vendors.length === 0) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="text-5xl">🍽️</div>
        <p className="font-medium text-neutral-700">Không tìm thấy kết quả</p>
        <p className="text-sm text-neutral-400">Thử thay đổi bộ lọc để xem thêm.</p>
      </div>
    )
  }

  const CardComponent = type === 'fixed_shop'
    ? VendorCard
    : type === 'online_seller'
      ? OnlineSellerCard
      : BoothCard
  const hrefPrefix = type === 'fixed_shop' ? '/explore/vendors' : '/explore/booths'

  return (
    <>
      <p className="text-sm text-neutral-500 mb-4">
        {vendors.length} kết quả{category || maxPrice || openNow || hasDelivery ? ' (đã lọc)' : ''}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map(v => (
          <CardComponent key={v.id} vendor={v} href={`${hrefPrefix}/${v.id}`} />
        ))}
      </div>
    </>
  )
}

export default function ExplorePage({ searchParams }: ExplorePageProps) {
  const type = searchParams.type === 'student_booth'
    ? 'student_booth'
    : searchParams.type === 'online_seller'
      ? 'online_seller'
      : 'fixed_shop'

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Khám phá ẩm thực</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Quán ăn và gian hàng sinh viên khu vực Hòa Lạc
        </p>
      </div>

      {/* Tabs */}
      <Suspense>
        <TabSwitcher activeType={type} />
      </Suspense>

      {/* Filters */}
      <div className="mt-5 mb-6">
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      {/* Vendor Grid */}
      <Suspense fallback={<VendorGridSkeleton />}>
        <VendorGrid searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
