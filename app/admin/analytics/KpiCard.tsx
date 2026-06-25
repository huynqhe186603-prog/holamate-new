import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: number | string
  sub?: string
  icon: LucideIcon
  color: string
}

export function KpiCard({ label, value, sub, icon: Icon, color }: KpiCardProps) {
  return (
    <div className={cn('rounded-2xl border p-5 flex items-start gap-4', color)}>
      <div className="p-2.5 rounded-xl bg-white/70 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
