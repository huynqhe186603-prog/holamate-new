import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { VendorCard, BoothCard } from '@/components/explore/VendorCard'
import { UnsaveButton } from '../_components/UnsaveButton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isVendorOpen, computeRating } from '@/lib/utils/explore'
import type { VendorWithRating } from '@/lib/utils/explore'
import { Bookmark, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Đã lưu' }

export default async function SavedVendorsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/saved')

  const { data: saved } = await supabase
    .from('saved_vendors')
    .select(`
      id, created_at,
      vendors(
        id, name, description, vendor_type, cover_image_url, logo_url,
        phone, zalo, address, area, opening_hours, has_delivery,
        price_range_min, price_range_max, food_categories,
        reviews(rating)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const list = (saved ?? []).filter((s: any) => s.vendors) as any[]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Đã lưu</h1>
        <p className="text-sm text-neutral-500 mt-1">{list.length} quán/gian hàng</p>
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center space-y-4 rounded-2xl border border-dashed border-neutral-200">
          <Bookmark className="w-10 h-10 text-neutral-300 mx-auto" />
          <div>
            <p className="font-medium text-neutral-600">Chưa lưu quán nào</p>
            <p className="text-sm text-neutral-400 mt-1">Lưu quán yêu thích để xem lại sau!</p>
          </div>
          <Link href="/explore" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 h-9')}>
            Khám phá ẩm thực <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {list.map((item: any) => {
            const vendor = item.vendors
            const { avg, count } = computeRating(vendor.reviews ?? [])
            const vendorWithRating: VendorWithRating = {
              ...vendor,
              opening_hours: vendor.opening_hours as Record<string, string> | null,
              food_categories: vendor.food_categories as string[] | null,
              rating_avg: avg,
              rating_count: count,
              is_open: isVendorOpen(vendor.opening_hours as Record<string, string> | null),
            }

            const isFixed = vendor.vendor_type === 'fixed_shop'
            const href = isFixed
              ? `/explore/vendors/${vendor.id}`
              : `/explore/booths/${vendor.id}`
            const CardComponent = isFixed ? VendorCard : BoothCard

            return (
              <div key={item.id} className="relative">
                <CardComponent vendor={vendorWithRating} href={href} />
                {/* Unsave button overlay */}
                <div className="absolute top-3 left-3 z-10">
                  <UnsaveButton savedId={item.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
