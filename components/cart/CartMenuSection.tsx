'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, Trash2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/components/cart/CartContext'
import { formatVND } from '@/lib/cart'

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

interface CartMenuSectionProps {
  items: MenuItem[]
  vendorId: string
  vendorName: string
  vendorType: 'fixed_shop' | 'student_booth'
  isOpen?: boolean
}

export function CartMenuSection({ items, vendorId, vendorName, vendorType, isOpen = true }: CartMenuSectionProps) {
  const { cart, addItem, updateQuantity } = useCart()
  const today = new Date().toISOString().split('T')[0]

  const available = items.filter(i => i.is_available && (!i.selling_date || i.selling_date === today))
  const grouped = available.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const g = item.item_type ?? 'food'
    acc[g] = [...(acc[g] ?? []), item]
    return acc
  }, {})
  const types = Object.keys(grouped)
  const [activeType, setActiveType] = useState(types[0] ?? 'food')

  const getCartQty = (menuItemId: string) =>
    cart?.items.find(i => i.menuItemId === menuItemId)?.quantity ?? 0

  if (available.length === 0) {
    return <p className="text-sm text-neutral-400 py-6 text-center">Chưa có món nào hôm nay.</p>
  }

  return (
    <div>
      {/* Closed warning — shown when vendor is not currently open */}
      {!isOpen && (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-4 text-sm text-amber-800">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Quán đang đóng cửa. Bạn vẫn có thể chọn món — đơn sẽ được xử lý khi quán mở cửa trở lại.</p>
        </div>
      )}
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

      {/* Items */}
      <div className="space-y-2.5">
        {(grouped[activeType] ?? []).map(item => {
          const qty = getCartQty(item.id)
          return (
            <div
              key={item.id}
              className={cn(
                'flex gap-3 rounded-xl border p-3 transition-colors',
                qty > 0 ? 'border-primary/30 bg-primary/5' : 'border-neutral-100 bg-white'
              )}
            >
              {/* Image */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-neutral-100">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">🍽️</div>
                )}
                {item.is_featured && (
                  <div className="absolute top-1 left-1">
                    <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-white">HOT</span>
                  </div>
                )}
              </div>

              {/* Info + controls */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="font-medium text-neutral-900 text-sm leading-snug line-clamp-2">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                  {item.selling_date && (
                    <p className="text-[10px] text-amber-600 mt-0.5 font-medium">📅 Hôm nay</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-bold text-primary">{formatVND(item.price)}</span>

                  {qty === 0 ? (
                    <button
                      onClick={() => addItem(vendorId, vendorName, vendorType, {
                        menuItemId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                        image_url: item.image_url,
                      })}
                      className="flex items-center gap-1 rounded-full bg-primary text-white text-xs font-medium px-3 py-1.5 hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        {qty === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="text-sm font-bold text-neutral-900 w-5 text-center">{qty}</span>
                      <button
                        onClick={() => addItem(vendorId, vendorName, vendorType, {
                          menuItemId: item.id,
                          name: item.name,
                          price: item.price,
                          quantity: 1,
                          image_url: item.image_url,
                        })}
                        className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
