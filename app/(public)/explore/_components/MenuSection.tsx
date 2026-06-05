'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type MenuItem = {
  id: string
  name: string
  description: string | null
  price: number
  item_type: string
  image_url: string | null
  is_available: boolean
  selling_date: string | null
  is_featured: boolean
}

const TYPE_LABELS: Record<string, string> = {
  food: 'Đồ ăn',
  drink: 'Đồ uống',
  combo: 'Combo',
  display_product: 'Sản phẩm',
}

interface MenuSectionProps {
  items: MenuItem[]
}

export function MenuSection({ items }: MenuSectionProps) {
  const today = new Date().toISOString().split('T')[0]

  // Filter: available + selling_date is null OR today
  const available = items.filter(
    i => i.is_available && (!i.selling_date || i.selling_date === today)
  )

  // Group by item_type
  const grouped = available.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const group = item.item_type ?? 'food'
    acc[group] = [...(acc[group] ?? []), item]
    return acc
  }, {})

  const types = Object.keys(grouped)
  const [activeType, setActiveType] = useState(types[0] ?? 'food')

  if (available.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-neutral-400 text-sm">Chưa có món ăn nào được cập nhật.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Type tabs */}
      {types.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                activeType === type
                  ? 'border-primary bg-primary text-white'
                  : 'border-neutral-200 text-neutral-600 hover:border-primary/40'
              )}
            >
              {TYPE_LABELS[type] ?? type} ({grouped[type].length})
            </button>
          ))}
        </div>
      )}

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(grouped[activeType] ?? []).map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className={cn(
      'flex gap-3 rounded-xl border border-neutral-100 bg-white p-3',
      !item.is_available && 'opacity-50'
    )}>
      {/* Image */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-neutral-100">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">
            🍽️
          </div>
        )}
        {item.is_featured && (
          <div className="absolute top-1 left-1">
            <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-white leading-none">
              HOT
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="font-medium text-neutral-900 text-sm leading-snug line-clamp-2">
            {item.name}
          </p>
          {item.description && (
            <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{item.description}</p>
          )}
          {item.selling_date && (
            <p className="text-[10px] text-amber-600 mt-0.5 font-medium">
              📅 Bán hôm nay
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold text-primary">
            {item.price >= 1000
              ? `${Math.round(item.price / 1000)}k`
              : `${item.price}đ`}
          </span>
          {!item.is_available && (
            <span className="text-[10px] text-neutral-400 font-medium">Hết hàng</span>
          )}
        </div>
      </div>
    </div>
  )
}
