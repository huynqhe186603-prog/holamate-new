'use client'

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import {
  type Cart, type CartItem,
  saveCart, removeCart, clearAllCarts,
  cartTotal, cartCount,
} from '@/lib/cart'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartContextType {
  cart: Cart | null
  pendingAdd: { vendorId: string; vendorName: string; vendorType: 'fixed_shop' | 'student_booth'; item: CartItem } | null
  totalPrice: number
  totalItems: number
  addItem: (
    vendorId: string,
    vendorName: string,
    vendorType: 'fixed_shop' | 'student_booth',
    item: CartItem
  ) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, delta: number) => void
  clearCart: () => void
  confirmReplaceCart: () => void
  cancelReplaceCart: () => void
}

const CartCtx = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [pendingAdd, setPendingAdd] = useState<CartContextType['pendingAdd']>(null)
  const [mounted, setMounted] = useState(false)

  // Restore from localStorage on mount
  useEffect(() => {
    setMounted(true)
    // Try to find an existing cart
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('hm_cart_')) {
        try {
          const raw = localStorage.getItem(key)
          if (raw) {
            const c = JSON.parse(raw) as Cart
            if (c.items.length > 0) { setCart(c); break }
          }
        } catch {}
      }
    }
  }, [])

  // Persist whenever cart changes
  useEffect(() => {
    if (!mounted) return
    if (cart) saveCart(cart)
  }, [cart, mounted])

  const addItem = useCallback((
    vendorId: string,
    vendorName: string,
    vendorType: 'fixed_shop' | 'student_booth',
    item: CartItem
  ) => {
    setCart(prev => {
      // Different vendor → prompt to replace
      if (prev && prev.vendorId !== vendorId && prev.items.length > 0) {
        setPendingAdd({ vendorId, vendorName, vendorType, item })
        return prev
      }
      // Same vendor or empty cart → merge
      if (!prev || prev.vendorId !== vendorId) {
        return { vendorId, vendorName, vendorType, items: [{ ...item, quantity: 1 }] }
      }
      const existing = prev.items.find(i => i.menuItemId === item.menuItemId)
      const items = existing
        ? prev.items.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev.items, { ...item, quantity: 1 }]
      return { ...prev, items }
    })
  }, [])

  const removeItem = useCallback((menuItemId: string) => {
    setCart(prev => {
      if (!prev) return null
      const items = prev.items.filter(i => i.menuItemId !== menuItemId)
      if (items.length === 0) {
        removeCart(prev.vendorId)
        return null
      }
      return { ...prev, items }
    })
  }, [])

  const updateQuantity = useCallback((menuItemId: string, delta: number) => {
    setCart(prev => {
      if (!prev) return null
      const items = prev.items
        .map(i => i.menuItemId === menuItemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter(i => i.quantity > 0)
      if (items.length === 0) {
        removeCart(prev.vendorId)
        return null
      }
      return { ...prev, items }
    })
  }, [])

  const clearCart = useCallback(() => {
    if (cart) removeCart(cart.vendorId)
    clearAllCarts()
    setCart(null)
  }, [cart])

  const confirmReplaceCart = useCallback(() => {
    if (!pendingAdd) return
    const { vendorId, vendorName, vendorType, item } = pendingAdd
    clearAllCarts()
    setCart({ vendorId, vendorName, vendorType, items: [{ ...item, quantity: 1 }] })
    setPendingAdd(null)
  }, [pendingAdd])

  const cancelReplaceCart = useCallback(() => {
    setPendingAdd(null)
  }, [])

  const totalPrice = cart ? cartTotal(cart.items) : 0
  const totalItems = cart ? cartCount(cart.items) : 0

  return (
    <CartCtx.Provider value={{
      cart, pendingAdd, totalPrice, totalItems,
      addItem, removeItem, updateQuantity, clearCart,
      confirmReplaceCart, cancelReplaceCart,
    }}>
      {children}

      {/* Replace cart confirm dialog */}
      {pendingAdd && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={cancelReplaceCart} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="font-semibold text-neutral-900 mb-2">Đổi quán?</h3>
            <p className="text-sm text-neutral-500 mb-5">
              Giỏ hàng hiện tại từ <span className="font-medium text-neutral-800">{cart?.vendorName}</span> sẽ bị xóa.
              Bạn muốn thêm món từ <span className="font-medium text-neutral-800">{pendingAdd.vendorName}</span> không?
            </p>
            <div className="flex gap-3">
              <button onClick={cancelReplaceCart} className="flex-1 h-10 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                Giữ giỏ cũ
              </button>
              <button onClick={confirmReplaceCart} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                Đồng ý đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </CartCtx.Provider>
  )
}
