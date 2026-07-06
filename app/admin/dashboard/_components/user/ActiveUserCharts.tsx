'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ChartCard, EmptyChart, KpiCard } from '../ChartCard'
import type { DayCount, EventCount } from '../types'

const TICK_STYLE = { fontSize: 11, fill: '#9CA3AF' }
const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#fff', border: '1px solid #E5E7EB',
    borderRadius: 8, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  labelStyle: { color: '#374151', fontWeight: 600 },
  itemStyle: { color: '#6B7280' },
}

function dayTick(day: number) {
  return day === 1 || day % 5 === 0 ? String(day) : ''
}

const EVENT_LABELS: Record<string, string> = {
  view_vendor:  'Xem quán',
  search:       'Tìm kiếm',
  use_ai:       'Trợ lý AI',
  filter:       'Lọc kết quả',
  checkout:     'Đặt món',
  write_review: 'Viết review',
}

interface Props {
  loginsByDay: DayCount[]
  c2UsersByDay: DayCount[]
  eventBreakdown: EventCount[]
  mauByDay: DayCount[]
  c1Count: number
  c2Count: number
  c3Count: number
  mauCount: number
  month: number
}

export function ActiveUserCharts({
  loginsByDay, c2UsersByDay, eventBreakdown, mauByDay,
  c1Count, c2Count, c3Count, mauCount, month,
}: Props) {
  const hasLogins = loginsByDay.some(d => d.count > 0)
  const hasC2 = c2UsersByDay.some(d => d.count > 0)
  const hasMau = mauByDay.some(d => d.count > 0)

  // reshape event breakdown for horizontal bar chart
  const eventData = eventBreakdown.map(e => ({
    name: EVENT_LABELS[e.event_type] ?? e.event_type,
    users: e.uniqueUsers,
    total: e.count,
  }))

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-violet-400 inline-block" />
        Nhóm 2 — Active User / MAU (Tháng {month})
      </h3>

      {/* KPI mini cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="C1 — Login ≥ 2 lần" value={c1Count}
          sub="trong tháng" color="bg-violet-50 border-violet-100" icon="🔑" />
        <KpiCard label="C2 — Phiên ≥ 3 phút" value={c2Count}
          sub="trong tháng" color="bg-emerald-50 border-emerald-100" icon="⏱️" />
        <KpiCard label="C3 — ≥ 1 hành động" value={c3Count}
          sub="trong tháng" color="bg-blue-50 border-blue-100" icon="🎯" />
        <KpiCard label="MAU (C1∩C2∩C3)" value={mauCount}
          sub="trong tháng" color="bg-orange-50 border-orange-200" icon="⭐" />
      </div>

      {/* Row 2: login chart + C2 chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Lượt đăng nhập theo ngày (C1)" subtitle="sign_in events">
          {hasLogins ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={loginsByDay} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={dayTick} interval={0} />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Lượt đăng nhập']} labelFormatter={d => `Ngày ${d}`} />
                <Bar dataKey="count" name="Lượt login" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Users có phiên ≥ 3 phút theo ngày (C2)" subtitle="Unique users đạt C2">
          {hasC2 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={c2UsersByDay} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={dayTick} interval={0} />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Users']} labelFormatter={d => `Ngày ${d}`} />
                <Bar dataKey="count" name="Users (C2)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Row 3: event breakdown (horizontal) + MAU by day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Hành động theo loại (C3)" subtitle="Unique users per event type">
          {eventData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventData} layout="vertical" margin={{ top: 0, right: 40, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false} axisLine={false} width={88} />
                <Tooltip {...TOOLTIP_STYLE}
                  formatter={(v, name) => [v, name === 'users' ? 'Unique users' : 'Tổng lượt']} />
                <Bar dataKey="users" name="users" fill="#F97316" radius={[0, 4, 4, 0]} maxBarSize={16}
                  label={{ position: 'right', fontSize: 11, fill: '#9CA3AF' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="MAU users hoạt động theo ngày" subtitle="Unique MAU users có event mỗi ngày">
          {hasMau ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mauByDay} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={dayTick} interval={0} />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'MAU users']} labelFormatter={d => `Ngày ${d}`} />
                <Bar dataKey="count" name="MAU users" fill="#EA580C" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>
    </section>
  )
}
