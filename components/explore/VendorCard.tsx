import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bike, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRating } from '@/components/explore/StarRating'
import { FOOD_CATEGORIES, formatPriceRange } from '@/lib/utils/explore'
import type { VendorWithRating } from '@/lib/utils/explore'

interface VendorCardProps {
  vendor: VendorWithRating
  href: string
}

export function VendorCard({ vendor, href }: VendorCardProps) {
  const categoryLabels = vendor.food_categories
    ?.map(key => FOOD_CATEGORIES.find(c => c.key === key)?.label)
    .filter(Boolean)
    .slice(0, 3) ?? []

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
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

        {/* Badges top-right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-semibold leading-tight',
              vendor.is_open
                ? 'bg-emerald-500 text-white'
                : 'bg-neutral-800/70 text-white backdrop-blur-sm'
            )}
          >
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
      <div className="p-4 space-y-2.5">
        {/* Name */}
        <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {vendor.name}
        </h3>

        {/* Category tags */}
        {categoryLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categoryLabels.map(label => (
              <span
                key={label}
                className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[11px] font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Rating + Price */}
        <div className="flex items-center justify-between gap-2">
          <StarRating rating={vendor.rating_avg} count={vendor.rating_count} />
          <span className="text-xs font-medium text-neutral-600 shrink-0">
            {formatPriceRange(vendor.price_range_min, vendor.price_range_max)}
          </span>
        </div>

        {/* Area */}
        {vendor.area && (
          <div className="flex items-center gap-1.5 text-neutral-400">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate">{vendor.area}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

/* Booth-specific variant (student_booth) */
export function BoothCard({ vendor, href }: VendorCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
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
          <div className="absolute inset-0 flex items-center justify-center bg-amber-50">
            <span className="text-4xl opacity-40">🧑‍🍳</span>
          </div>
        )}

        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
          {vendor.is_open && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500 text-white leading-tight">
              Đang bán
            </span>
          )}
          {vendor.has_delivery && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500 text-white leading-tight flex items-center gap-0.5">
              <Bike className="w-2.5 h-2.5" />
              Ship
            </span>
          )}
        </div>

        {/* Student badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-amber-700 border border-amber-200 leading-tight">
            Gian hàng SV
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {vendor.name}
        </h3>

        {vendor.description && (
          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {vendor.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <StarRating rating={vendor.rating_avg} count={vendor.rating_count} />
          <span className="text-xs font-medium text-neutral-600 shrink-0">
            {formatPriceRange(vendor.price_range_min, vendor.price_range_max)}
          </span>
        </div>

        {vendor.area && (
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate">{vendor.area}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
