export type ReviewWithRelations = {
  id: string
  user_id: string
  review_type: 'vendor' | 'menu_item'
  vendor_id: string | null
  menu_item_id: string | null
  rating: number
  content: string | null
  is_anonymous: boolean
  status: string
  avg_vote_score: number | null
  vote_count: number
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
  vendors: { id: string; name: string; vendor_type: string } | null
  menu_items: { id: string; name: string } | null
  review_media: { id: string; image_url: string; status: string }[]
}

export const REPORT_REASONS = [
  { key: 'spam', label: 'Spam' },
  { key: 'seeding', label: 'Seeding (review ảo)' },
  { key: 'fake_review', label: 'Review giả mạo' },
  { key: 'offensive_content', label: 'Nội dung xúc phạm' },
  { key: 'irrelevant', label: 'Không liên quan' },
  { key: 'personal_attack', label: 'Công kích cá nhân' },
  { key: 'sensitive_info', label: 'Thông tin nhạy cảm' },
  { key: 'other', label: 'Lý do khác' },
] as const

export type ReportReasonKey = typeof REPORT_REASONS[number]['key']

export function getReviewerName(review: Pick<ReviewWithRelations, 'is_anonymous' | 'profiles'>): string {
  if (review.is_anonymous) return 'Người dùng ẩn danh'
  return review.profiles?.full_name ?? 'Người dùng'
}

export function getReviewSubject(review: Pick<ReviewWithRelations, 'review_type' | 'vendors' | 'menu_items'>): string {
  if (review.review_type === 'menu_item' && review.menu_items) {
    const vendor = review.vendors?.name ?? ''
    return `${review.menu_items.name}${vendor ? ` · ${vendor}` : ''}`
  }
  return review.vendors?.name ?? 'Không xác định'
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Supabase select fragment for reviews with all relations
export const REVIEWS_SELECT = `
  id, user_id, review_type, vendor_id, menu_item_id,
  rating, content, is_anonymous, status, avg_vote_score, vote_count, created_at,
  profiles(full_name, avatar_url),
  vendors(id, name, vendor_type),
  menu_items(id, name),
  review_media(id, image_url, status)
` as const
