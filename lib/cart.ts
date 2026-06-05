export type CartItem = {
  menuItemId: string
  name: string
  price: number
  quantity: number
  image_url: string | null
}

export type Cart = {
  vendorId: string
  vendorName: string
  vendorType: 'fixed_shop' | 'student_booth'
  items: CartItem[]
}

const PREFIX = 'hm_cart_'

export const cartKey = (vendorId: string) => `${PREFIX}${vendorId}`

export function loadCart(vendorId: string): Cart | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(cartKey(vendorId))
    return raw ? (JSON.parse(raw) as Cart) : null
  } catch { return null }
}

export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(cartKey(cart.vendorId), JSON.stringify(cart))
}

export function removeCart(vendorId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(cartKey(vendorId))
}

export function clearAllCarts(): void {
  if (typeof window === 'undefined') return
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.price * i.quantity, 0)
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.quantity, 0)
}

export function formatVND(amount: number): string {
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`
  return `${amount}đ`
}
