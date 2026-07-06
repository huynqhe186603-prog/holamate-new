interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-5 ${className}`}>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function EmptyChart({ height = 220 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-lg"
      style={{ height }}
    >
      Chưa có dữ liệu trong tháng này
    </div>
  )
}

export function KpiCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string | number; sub: string; color: string; icon: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg leading-none">{icon}</span>
        <p className="text-xs text-neutral-600 font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-neutral-900 tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </p>
      <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>
    </div>
  )
}
