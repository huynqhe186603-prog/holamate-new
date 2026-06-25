interface BarChartProps {
  data: { label: string; value: number }[]
}

export function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-28">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
          {d.value > 0 && (
            <span className="text-[9px] text-neutral-500 tabular-nums">{d.value}</span>
          )}
          <div
            className="w-full bg-primary/70 rounded-t transition-all hover:bg-primary"
            style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%`, minHeight: d.value > 0 ? '4px' : '0' }}
          />
          <span className="text-[9px] text-neutral-400 truncate w-full text-center leading-none mt-0.5">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}
