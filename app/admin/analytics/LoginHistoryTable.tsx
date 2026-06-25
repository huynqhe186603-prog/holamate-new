const EVENT_BADGE: Record<string, { label: string; cls: string }> = {
  sign_up:  { label: 'Đăng ký',   cls: 'bg-emerald-100 text-emerald-700' },
  sign_in:  { label: 'Đăng nhập', cls: 'bg-blue-100 text-blue-700' },
  sign_out: { label: 'Đăng xuất', cls: 'bg-neutral-100 text-neutral-600' },
}

interface LoginRow {
  id: string
  user_id: string | null
  event_type: string
  provider: string | null
  ip_address: string | null
  created_at: string
}

interface LoginHistoryTableProps {
  rows: LoginRow[]
}

function formatTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export function LoginHistoryTable({ rows }: LoginHistoryTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-400 py-4 text-center">Chưa có dữ liệu.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500">User ID</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500">Sự kiện</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500">Provider</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500">IP</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500">Thời gian (UTC+7)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const badge = EVENT_BADGE[row.event_type] ?? { label: row.event_type, cls: 'bg-neutral-100 text-neutral-600' }
            return (
              <tr key={row.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500">
                  {row.user_id ? `${row.user_id.slice(0, 8)}…` : '—'}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-neutral-500 capitalize">{row.provider ?? '—'}</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500">{row.ip_address ?? '—'}</td>
                <td className="py-2.5 px-3 text-neutral-500 text-[11px] tabular-nums">{formatTime(row.created_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
