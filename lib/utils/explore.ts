// DB-level categories (used by VendorCard for label display)
export const FOOD_CATEGORIES = [
  { key: 'com', label: 'Cơm', emoji: '🍚' },
  { key: 'bun_pho_mi', label: 'Bún/Phở/Mì', emoji: '🍜' },
  { key: 'tra_sua', label: 'Trà sữa', emoji: '🧋' },
  { key: 'cafe', label: 'Cafe', emoji: '☕' },
  { key: 'an_vat', label: 'Ăn vặt', emoji: '🍢' },
  { key: 'do_uong', label: 'Đồ uống', emoji: '🥤' },
] as const

export type FoodCategoryKey = typeof FOOD_CATEGORIES[number]['key']

// UI-level grouped categories (used by FilterBar, with URL-param keys)
export const FOOD_CATEGORY_GROUPS = [
  {
    groupKey: 'food',
    groupLabel: 'Đồ ăn',
    categories: [
      { key: 'com-chao', label: 'Cơm & Cháo', emoji: '🍚' },
      { key: 'bun-pho-mi', label: 'Bún, Phở & Mì', emoji: '🍜' },
      { key: 'banh-mi', label: 'Bánh mì & Sandwich', emoji: '🥖' },
      { key: 'an-vat', label: 'Ăn vặt & Snack', emoji: '🍢' },
    ],
  },
  {
    groupKey: 'drink',
    groupLabel: 'Đồ uống',
    categories: [
      { key: 'ca-phe', label: 'Cà phê', emoji: '☕' },
      { key: 'tra-tra-sua', label: 'Trà & Trà sữa', emoji: '🧋' },
      { key: 'nuoc-ep', label: 'Nước ép & Sinh tố', emoji: '🥤' },
      { key: 'do-uong-khac', label: 'Đồ uống khác', emoji: '🧃' },
    ],
  },
] as const

// Map URL category keys → DB food_categories array values (null = use text search)
export const CATEGORY_DB_MAP: Record<string, string[] | null> = {
  'com-chao':     ['com'],
  'bun-pho-mi':   ['bun_pho_mi'],
  'an-vat':       ['an_vat'],
  'ca-phe':       ['cafe'],
  'tra-tra-sua':  ['tra_sua'],
  'do-uong-khac': ['do_uong'],
  'banh-mi':      null,
  'nuoc-ep':      null,
}

// Text keywords for categories that have no direct DB mapping
export const CATEGORY_TEXT_SEARCH: Record<string, string> = {
  'banh-mi': 'bánh mì',
  'nuoc-ep':  'nước ép',
}

const DAY_MAP: Record<string, string> = {
  sun: 'CN', mon: 'T2', tue: 'T3', wed: 'T4',
  thu: 'T5', fri: 'T6', sat: 'T7',
}
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function isVendorOpen(openingHours: Record<string, string> | null): boolean {
  if (!openingHours) return false
  const now = new Date()
  const dayKey = DAY_KEYS[now.getDay()]
  const hours = openingHours[dayKey]
  if (!hours || hours === 'closed') return false
  const [open, close] = hours.split('-').map((t: string) => {
    const [h, m] = t.trim().split(':').map(Number)
    return h * 60 + m
  })
  const current = now.getHours() * 60 + now.getMinutes()
  return current >= open && current <= close
}

export function formatOpeningHours(openingHours: Record<string, string> | null): string {
  if (!openingHours) return 'Chưa cập nhật'
  const now = new Date()
  const dayKey = DAY_KEYS[now.getDay()]
  const todayHours = openingHours[dayKey]
  if (!todayHours || todayHours === 'closed') return 'Hôm nay đóng cửa'
  return `Hôm nay: ${todayHours}`
}

export function formatOpeningHoursFull(openingHours: Record<string, string> | null): string[] {
  if (!openingHours) return []
  return DAY_KEYS.map(day => {
    const hours = openingHours[day]
    const label = DAY_MAP[day]
    if (!hours || hours === 'closed') return `${label}: Đóng cửa`
    return `${label}: ${hours}`
  })
}

export function computeRating(reviews: { rating: number }[]): {
  avg: number | null
  count: number
} {
  if (!reviews || reviews.length === 0) return { avg: null, count: 0 }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  return { avg: Math.round(avg * 10) / 10, count: reviews.length }
}

export function formatPriceRange(min: number | null, max: number | null): string {
  if (!min && !max) return 'Chưa cập nhật'
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}đ`
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (max) return `Đến ${fmt(max)}`
  if (min) return `Từ ${fmt(min)}`
  return ''
}

export type VendorWithRating = {
  id: string
  name: string
  description: string | null
  vendor_type: 'fixed_shop' | 'student_booth'
  cover_image_url: string | null
  logo_url: string | null
  phone: string | null
  zalo: string | null
  address: string | null
  area: string | null
  opening_hours: Record<string, string> | null
  has_delivery: boolean
  price_range_min: number | null
  price_range_max: number | null
  food_categories: string[] | null
  rating_avg: number | null
  rating_count: number
  is_open: boolean
}
