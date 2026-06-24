import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bike, Clock, Store, ShoppingBag, GraduationCap, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRating } from '@/components/explore/StarRating'
import { FOOD_CATEGORIES, formatPriceRange } from '@/lib/utils/explore'
import type { VendorWithRating } from '@/lib/utils/explore'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function getTodayHours(openingHours: Record<string, string> | null): string | null {
  if (!openingHours) return null
  // Use UTC+7 to avoid server-side timezone bug on Vercel (UTC+0)
  const vnDay = new Date(Date.now() + 7 * 60 * 60 * 1000).getUTCDay()
  const h = openingHours[DAY_KEYS[vnDay]]
  return h && h !== 'closed' ? h : null
}

interface VendorCardProps {
  vendor: VendorWithRating
  href: string
}

export function VendorCard({ vendor, href }: VendorCardProps) {
  const categoryLabels = vendor.food_categories
    ?.map(key => FOOD_CATEGORIES.find(c => c.key === key)?.label)
    .filter(Boolean)
    .slice(0, 2) ?? []

  const todayHours = getTodayHours(vendor.opening_hours)

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:border-primary/40 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
    >
      {/* Cover image */}
      <div className="relative aspect-[16/9] bg-neutral-100 overflow-hidden">
        {vendor.cover_image_url ? (
          <Image
            src={vendor.cover_image_url}
            alt={vendor.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <span className="text-4xl opacity-30">🍽️</span>
          </div>
        )}

        {/* Type badge — top-left */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-neutral-700 border border-neutral-200 leading-tight backdrop-blur-sm">
            <Store className="w-2.5 h-2.5" />
            Quán ăn
          </span>
        </div>

        {/* Partnership badge — bottom-left */}
        <div className="absolute bottom-2.5 left-2.5">
          {vendor.is_partnered ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500 text-white leading-tight shadow-sm">
              ✓ Đối tác
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800/60 text-neutral-300 leading-tight backdrop-blur-sm">
              Chưa liên kết
            </span>
          )}
        </div>

        {/* Status + ship — top-right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-semibold leading-tight',
            vendor.is_open
              ? 'bg-emerald-500 text-white'
              : 'bg-neutral-800/70 text-white backdrop-blur-sm'
          )}>
            {vendor.is_open ? 'Đang mở' : 'Đã đóng'}
          </span>
          {vendor.has_delivery && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500 text-white leading-tight">
              Có ship
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {vendor.name}
        </h3>

        {categoryLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categoryLabels.map(label => (
              <span key={label} className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[11px] font-medium">
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <StarRating rating={vendor.rating_avg} count={vendor.rating_count} />
          <span className="text-xs font-medium text-neutral-600 shrink-0">
            {formatPriceRange(vendor.price_range_min, vendor.price_range_max)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          {vendor.area && (
            <div className="flex items-center gap-1.5 text-neutral-400">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="text-xs truncate">{vendor.area}</span>
            </div>
          )}
          {todayHours && (
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="text-xs">{todayHours}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

/* Online seller variant (online_seller) */
export function OnlineSellerCard({ vendor, href }: VendorCardProps) {
  const categoryLabels = vendor.food_categories
    ?.map(key => FOOD_CATEGORIES.find(c => c.key === key)?.label)
    .filter(Boolean)
    .slice(0, 2) ?? []

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-orange-100 bg-white overflow-hidden hover:border-orange-300 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
    >
      <div className="relative aspect-[16/9] bg-orange-50 overflow-hidden">
        {vendor.cover_image_url ? (
          <Image
            src={vendor.cover_image_url}
            alt={vendor.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-orange-50">
            <span className="text-4xl opacity-40">🛵</span>
          </div>
        )}

        {/* Type badge — top-left */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/90 text-white border border-orange-300 leading-tight backdrop-blur-sm">
            <ShoppingBag className="w-2.5 h-2.5" />
            Giao hàng online
          </span>
        </div>

        {/* Ship badge — top-right (always shown) */}
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-white leading-tight">
            <Bike className="w-2.5 h-2.5" />
            Ship tận nơi
          </span>
        </div>

        {/* Partnership badge — bottom-left */}
        <div className="absolute bottom-2.5 left-2.5">
          {vendor.is_partnered ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500 text-white leading-tight shadow-sm">
              ✓ Đối tác
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800/60 text-neutral-300 leading-tight backdrop-blur-sm">
              Chưa liên kết
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {vendor.name}
        </h3>

        {categoryLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categoryLabels.map(label => (
              <span key={label} className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[11px] font-medium">
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <StarRating rating={vendor.rating_avg} count={vendor.rating_count} />
          <span className="text-xs font-medium text-neutral-600 shrink-0">
            {formatPriceRange(vendor.price_range_min, vendor.price_range_max)}
          </span>
        </div>

        {vendor.phone && (
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Phone className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate">{vendor.phone}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

/* Booth variant (student_booth) */
export function BoothCard({ vendor, href }: VendorCardProps) {
  const categoryLabels = vendor.food_categories
    ?.map(key => FOOD_CATEGORIES.find(c => c.key === key)?.label)
    .filter(Boolean)
    .slice(0, 2) ?? []

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-violet-100 bg-white overflow-hidden hover:border-violet-300 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
    >
      <div className="relative aspect-[16/9] bg-violet-50 overflow-hidden">
        {vendor.cover_image_url ? (
          <Image
            src={vendor.cover_image_url}
            alt={vendor.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-violet-50">
            <span className="text-4xl opacity-40">🧑‍🍳</span>
          </div>
        )}

        {/* Booth badge — top-left */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 border border-violet-200 leading-tight backdrop-blur-sm">
            <GraduationCap className="w-2.5 h-2.5" />
            Gian hàng SV
          </span>
        </div>

        {/* Ship badge — top-right */}
        {vendor.has_delivery && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500 text-white leading-tight">
              <Bike className="w-2.5 h-2.5" />
              Ship
            </span>
          </div>
        )}

        {/* Partnership badge — bottom-left */}
        <div className="absolute bottom-2.5 left-2.5">
          {vendor.is_partnered ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500 text-white leading-tight shadow-sm">
              ✓ Đối tác
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800/60 text-neutral-300 leading-tight backdrop-blur-sm">
              Chưa liên kết
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {vendor.name}
        </h3>

        {categoryLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categoryLabels.map(label => (
              <span key={label} className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 text-[11px] font-medium">
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <StarRating rating={vendor.rating_avg} count={vendor.rating_count} />
          <span className="text-xs font-medium text-neutral-600 shrink-0">
            {formatPriceRange(vendor.price_range_min, vendor.price_range_max)}
          </span>
        </div>

        {(vendor.address || vendor.area) && (
          <div className="flex items-center gap-1.5 text-neutral-400">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate">{vendor.address ?? vendor.area}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
