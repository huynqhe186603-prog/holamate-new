import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/explore/StarRating'
import { PhotoGallery } from '../../_components/PhotoGallery'
import { CartMenuSection } from '@/components/cart/CartMenuSection'
import { CartButton } from '@/components/cart/CartButton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { computeRating } from '@/lib/utils/explore'
import {
  ArrowLeft, MapPin, Phone, Clock, Truck, MessageCircle, GraduationCap,
} from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('vendors')
    .select('name, description')
    .eq('id', params.id)
    .eq('vendor_type', 'student_booth')
    .single()
  if (!data) return { title: 'Gian hàng sinh viên' }
  return { title: data.name, description: data.description ?? undefined }
}

export default async function BoothDetailPage({ params }: Props) {
  const supabase = createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select(`
      id, name, description, vendor_type, status,
      cover_image_url, logo_url, phone, zalo, address, area,
      latitude, longitude, opening_hours, has_delivery, delivery_note,
      price_range_min, price_range_max, food_categories,
      menu_items(
        id, name, description, price, item_type,
        image_url, is_available, selling_date, is_featured, sort_order
      ),
      vendor_media(
        id, image_url, storage_path, media_type, caption, is_primary, status
      ),
      reviews(
        id, rating, content, is_anonymous, created_at, status,
        avg_vote_score, vote_count,
        profiles(full_name, avatar_url)
      )
    `)
    .eq('id', params.id)
    .eq('status', 'active')
    .eq('vendor_type', 'student_booth')
    .single()

  if (!vendor) notFound()

  const openingHours = vendor.opening_hours as Record<string, string> | null
  const { avg: ratingAvg, count: ratingCount } = computeRating(
    (vendor.reviews ?? []).filter((r: any) => r.status === 'visible')
  )
  const visiblePhotos = (vendor.vendor_media ?? []).filter((m: any) => m.status === 'visible')
  const menuItems = [...(vendor.menu_items ?? [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  )
  const visibleReviews = (vendor.reviews ?? [])
    .filter((r: any) => r.status === 'visible')
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Parse selling time from opening_hours (booths use same field, but different UX label)
  const today = new Date()
  const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][today.getDay()]
  const todaySelling = openingHours?.[dayKey]

  return (
    <div className="pb-28 sm:pb-0">
      {/* Back */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-4">
        <Link
          href="/explore?type=student_booth"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Gian hàng sinh viên
        </Link>
      </div>

      {/* Cover */}
      <div className="relative w-full aspect-[16/7] sm:aspect-[21/8] bg-amber-50 overflow-hidden mt-3">
        {vendor.cover_image_url ? (
          <Image
            src={vendor.cover_image_url}
            alt={vendor.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-16 h-16 text-amber-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* Student booth badge */}
        <div className="absolute bottom-4 left-4">
          <span className="px-2.5 py-1 rounded-full bg-white/90 text-amber-700 border border-amber-200 text-xs font-semibold">
            🎓 Gian hàng sinh viên
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="py-5 border-b border-neutral-100">
          <h1 className="text-xl font-bold text-neutral-900">{vendor.name}</h1>
          {vendor.description && (
            <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{vendor.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <StarRating rating={ratingAvg} count={ratingCount} size="md" />
            {vendor.has_delivery && (
              <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <Truck className="w-3.5 h-3.5" /> Có giao
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="py-5 border-b border-neutral-100 space-y-4">
          {/* Selling time today */}
          <div className="flex gap-3">
            <Clock className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-0.5">Thời gian bán</p>
              <p className="text-sm text-neutral-700">
                {todaySelling && todaySelling !== 'closed'
                  ? `Hôm nay: ${todaySelling}`
                  : 'Không bán hôm nay'}
              </p>
            </div>
          </div>

          {/* Pickup location */}
          {(vendor.address || vendor.area) && (
            <div className="flex gap-3">
              <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-0.5">Điểm hẹn nhận hàng</p>
                <p className="text-sm text-neutral-700">{vendor.address ?? vendor.area}</p>
              </div>
            </div>
          )}

          {/* Delivery note */}
          {vendor.delivery_note && (
            <div className="flex gap-3">
              <Truck className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-0.5">Giao hàng</p>
                <p className="text-sm text-neutral-700">{vendor.delivery_note}</p>
              </div>
            </div>
          )}

          {/* Phone */}
          {vendor.phone && (
            <div className="flex gap-3">
              <Phone className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-0.5">Liên hệ</p>
                <a href={`tel:${vendor.phone}`} className="text-sm text-primary hover:underline">
                  {vendor.phone}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="py-6 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900 mb-4">
            Sản phẩm ({menuItems.length})
          </h2>
          <CartMenuSection
            items={menuItems as any}
            vendorId={vendor.id}
            vendorName={vendor.name}
            vendorType="student_booth"
          />
        </div>

        {/* Reviews */}
        {visibleReviews.length > 0 && (
          <div className="py-6 border-b border-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900">Đánh giá ({ratingCount})</h2>
              {ratingAvg && <StarRating rating={ratingAvg} count={ratingCount} size="md" />}
            </div>
            <div className="space-y-4">
              {visibleReviews.map((review: any) => {
                const name = review.is_anonymous ? 'Người dùng ẩn danh' : (review.profiles?.full_name ?? 'Người dùng')
                const date = new Date(review.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })
                return (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-amber-700">{name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{name}</p>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-xs text-neutral-400">{date}</span>
                        </div>
                      </div>
                    </div>
                    {review.content && (
                      <p className="text-sm text-neutral-600 leading-relaxed pl-10">{review.content}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Gallery */}
        {visiblePhotos.length > 0 && (
          <div className="py-6 border-b border-neutral-100">
            <h2 className="text-base font-bold text-neutral-900 mb-4">Hình ảnh ({visiblePhotos.length})</h2>
            <PhotoGallery photos={visiblePhotos as any} />
          </div>
        )}

        {/* Map */}
        {vendor.latitude && vendor.longitude && (
          <div className="py-6">
            <h2 className="text-base font-bold text-neutral-900 mb-4">Điểm hẹn</h2>
            <div className="rounded-2xl overflow-hidden border border-neutral-200 aspect-[16/9]">
              <iframe
                src={`https://maps.google.com/maps?q=${vendor.latitude},${vendor.longitude}&z=16&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Điểm hẹn ${vendor.name}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Zalo CTA — desktop only */}
      {vendor.zalo && (
        <div className="hidden sm:block mx-auto max-w-3xl px-4 sm:px-6 py-4 border-t border-neutral-100">
          <a
            href={`https://zalo.me/${vendor.zalo.replace(/^0/, '84')}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline' }), 'h-10 gap-2 font-medium')}
          >
            <MessageCircle className="w-4 h-4 text-blue-500" />
            Liên hệ Zalo
          </a>
        </div>
      )}

      {/* Floating cart button */}
      <CartButton vendorId={vendor.id} />
    </div>
  )
}
