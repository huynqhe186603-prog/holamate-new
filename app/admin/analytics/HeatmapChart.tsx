// Hourly activity heatmap — 24 columns, color-coded by activity level
interface HeatmapChartProps {
  data: { hour: number; count: number }[]
}

function intensityClass(count: number, max: number): string {
  if (count === 0) return 'bg-neutral-100'
  const ratio = count / max
  if (ratio < 0.2) return 'bg-primary/15'
  if (ratio < 0.4) return 'bg-primary/30'
  if (ratio < 0.6) return 'bg-primary/50'
  if (ratio < 0.8) return 'bg-primary/70'
  return 'bg-primary'
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  const max = Math.max(...data.map(d => d.count), 1)
  const hourMap = new Map(data.map(d => [d.hour, d.count]))

  return (
    <div>
      <div className="grid grid-cols-12 gap-1 mb-2">
        {Array.from({ length: 24 }, (_, h) => {
          const count = hourMap.get(h) ?? 0
          return (
            <div
              key={h}
              title={`${h}:00 — ${count} sự kiện`}
              className={`h-8 rounded flex items-end justify-center pb-0.5 ${intensityClass(count, max)} cursor-default`}
            >
              <span className="text-[8px] font-medium text-neutral-500 select-none">{h}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-end gap-2 mt-1">
        <span className="text-[10px] text-neutral-400">Ít</span>
        {['bg-neutral-100', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-neutral-400">Nhiều</span>
      </div>
    </div>
  )
}
