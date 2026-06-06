import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/explore/StarRating'
import { PhotoGallery } from '../../_components/PhotoGallery'
import { ReviewSection } from '@/components/reviews/ReviewSection'
import { CartMenuSection } from '@/components/cart/CartMenuSection'
import { CartButton } from '@/components/cart/CartButton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isVendorOpen, formatOpeningHoursFull } from '@/lib/utils/explore'
import { VietMapEmbed } from '@/components/shared/VietMapEmbed'
import {
  ArrowLeft, MapPin, Phone, Clock, Truck, MessageCircle, UtensilsCrossed,
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
    .single()
  if (!data) return { title: 'Quán ăn' }
  return {
    title: data.name,
    description: data.description ?? undefined,
  }
}

export default async function VendorDetailPage({ params }: Props) {
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
    .single()

  if (!vendor) notFound()

  // Type casts
  const openingHours = vendor.opening_hours as Record<string, string> | null
  const isOpen = isVendorOpen(openingHours)
  const hoursLines = formatOpeningHoursFull(openingHours)
  const allReviews = (vendor.reviews ?? []).filter((r: any) => r.status === 'visible')
  const ratingAvg = allReviews.length
    ? Math.round(allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length * 10) / 10
    : null
  const ratingCount = allReviews.length

  const visiblePhotos = (vendor.vendor_media ?? []).filter(
    (m: any) => m.status === 'visible'
  )

  const menuItems = [...(vendor.menu_items ?? [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  )

  return (
    <div className="pb-28 sm:pb-0">
      {/* Back nav */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-4">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Khám phá ẩm thực
        </Link>
      </div>

      {/* Cover image */}
      <div className="relative w-full aspect-[16/7] sm:aspect-[21/8] bg-neutral-200 overflow-hidden mt-3">
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
            <UtensilsCrossed className="w-16 h-16 text-neutral-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Vendor header */}
        <div className="py-5 border-b border-neutral-100">
          <div className="flex items-start gap-4">
            {/* Logo */}
            {vendor.logo_url && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm shrink-0 -mt-8 bg-white">
                <Image src={vendor.logo_url} alt={`Logo ${vendor.name}`} fill className="object-cover" sizes="64px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-neutral-900 leading-snug">{vendor.name}</h1>
                <span
                  className={cn(
                    'shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                    isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                  )}
                >
                  {isOpen ? 'Đang mở' : 'Đã đóng'}
                </span>
              </div>
              {vendor.description && (
                <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{vendor.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                <StarRating rating={ratingAvg} count={ratingCount} size="md" />
                {vendor.has_delivery && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                    <Truck className="w-3.5 h-3.5" />
                    Có giao hàng
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="py-5 border-b border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Address */}
          {(vendor.address || vendor.area) && (
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Địa chỉ">
              {vendor.address ?? vendor.area}
            </InfoRow>
          )}
          {/* Phone */}
          {vendor.phone && (
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Điện thoại">
              <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                {vendor.phone}
              </a>
            </InfoRow>
          )}
          {/* Delivery note */}
          {vendor.delivery_note && (
            <InfoRow icon={<Truck className="w-4 h-4" />} label="Giao hàng">
              {vendor.delivery_note}
            </InfoRow>
          )}
          {/* Hours */}
          {hoursLines.length > 0 && (
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Giờ mở cửa">
              <div className="space-y-0.5">
                {hoursLines.map(line => (
                  <div key={line} className="text-sm text-neutral-600">{line}</div>
                ))}
              </div>
            </InfoRow>
          )}
        </div>

        {/* Menu */}
        <div className="py-6 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900 mb-4">
            Menu ({menuItems.length} món)
          </h2>
          <CartMenuSection
            items={menuItems as any}
            vendorId={vendor.id}
            vendorName={vendor.name}
            vendorType="fixed_shop"
          />
        </div>

        {/* Reviews */}
        <div className="py-6 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-900 mb-4">Đánh giá</h2>
          <ReviewSection vendorId={vendor.id} vendorName={vendor.name} />
        </div>

        {/* Photo gallery */}
        {visiblePhotos.length > 0 && (
          <div className="py-6 border-b border-neutral-100">
            <h2 className="text-base font-bold text-neutral-900 mb-4">
              Hình ảnh ({visiblePhotos.length})
            </h2>
            <PhotoGallery photos={visiblePhotos as any} />
          </div>
        )}

        {/* Map */}
        {vendor.latitude && vendor.longitude && (
          <div className="py-6">
            <h2 className="text-base font-bold text-neutral-900 mb-4">Vị trí</h2>
            <div className="rounded-2xl overflow-hidden border border-neutral-200 aspect-[16/9]">
              <VietMapEmbed
                latitude={vendor.latitude}
                longitude={vendor.longitude}
                zoom={16}
                title={vendor.name}
              />
            </div>
          </div>
        )}
      </div>

      {/* Zalo CTA — desktop inline (cart button handles mobile) */}
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

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-neutral-400 shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-sm text-neutral-700">{children}</div>
      </div>
    </div>
  )
}

