'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '@/components/cart/CartContext'
import { formatVND } from '@/lib/cart'
import { cn } from '@/lib/utils'

interface CartButtonProps {
  vendorId: string
  className?: string
}

export function CartButton({ vendorId, className }: CartButtonProps) {
  const { cart, totalItems, totalPrice } = useCart()

  // Only show if cart belongs to this vendor
  if (!cart || cart.vendorId !== vendorId || totalItems === 0) return null

  return (
    <div className={cn(
      'fixed bottom-0 inset-x-0 z-40 px-4 pb-4 sm:pb-6 pointer-events-none',
      className
    )}>
      <div className="mx-auto max-w-3xl pointer-events-auto">
        <Link
          href={`/checkout/${vendorId}`}
          className="flex items-center justify-between gap-3 w-full rounded-2xl bg-neutral-900 text-white px-5 py-3.5 shadow-xl hover:bg-neutral-800 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white leading-none">
                {totalItems}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Xem giỏ hàng</p>
              <p className="text-xs text-neutral-400">
                {totalItems} món · {formatVND(totalPrice)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-base font-bold text-primary">{formatVND(totalPrice)}</span>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  )
}
