export function formatVND(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`
  }
  return `${amount}đ`
}

export function formatVNDFull(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return formatDate(date)
}

export function isVendorOpen(openingHours: Record<string, string> | null): boolean {
  if (!openingHours) return false
  const now = new Date()
  const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()]
  const hours = openingHours[dayKey]
  if (!hours) return false

  const [open, close] = hours.split('-').map(t => {
    const [h, m] = t.trim().split(':').map(Number)
    return h * 60 + m
  })
  const current = now.getHours() * 60 + now.getMinutes()
  return current >= open && current <= close
}
