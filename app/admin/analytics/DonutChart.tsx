// Renders as horizontal percentage bars (donut chart alternative without a chart library)
const EVENT_LABELS: Record<string, string> = {
  page_view:    'Xem trang',
  view_vendor:  'Xem quán',
  search:       'Tìm kiếm',
  add_to_cart:  'Thêm giỏ',
  checkout:     'Đặt món',
  write_review: 'Viết review',
  use_ai:       'Dùng AI',
  filter:       'Lọc',
  sign_in:      'Đăng nhập',
  sign_up:      'Đăng ký',
}

const BAR_COLORS = [
  'bg-primary',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-400',
  'bg-teal-500',
  'bg-indigo-400',
]

interface DonutChartProps {
  data: { event_type: string; count: number }[]
}

export function DonutChart({ data }: DonutChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-400 py-4 text-center">Chưa có dữ liệu.</p>
  }
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.event_type} className="flex items-center gap-3">
          <span className="text-xs text-neutral-600 w-24 shrink-0 truncate">
            {EVENT_LABELS[d.event_type] ?? d.event_type}
          </span>
          <div className="flex-1 bg-neutral-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${BAR_COLORS[i % BAR_COLORS.length]}`}
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-neutral-700 w-8 text-right tabular-nums">
            {d.count}
          </span>
        </div>
      ))}
    </div>
  )
}
