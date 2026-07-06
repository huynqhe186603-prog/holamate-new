'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { ChartCard, EmptyChart } from '../ChartCard'
import type { DayCount, FreqGroup } from '../types'

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

// Color scale: red → yellow → green → blue (more logins = better retention)
const FREQ_COLORS = ['#FCA5A5', '#FCD34D', '#6EE7B7', '#60A5FA']

interface Props {
  returnLoginsByDay: DayCount[]
  loginFreqGroups: FreqGroup[]
  month: number
}

export function RetentionCharts({ returnLoginsByDay, loginFreqGroups, month }: Props) {
  const hasReturnLogins = returnLoginsByDay.some(d => d.count > 0)
  const hasFreqData = loginFreqGroups.some(g => g.count > 0)

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-amber-400 inline-block" />
        Nhóm 3 — Retention (Tháng {month})
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard
          title="Lượt đăng nhập quay lại theo ngày"
          subtitle="Users đã có tài khoản từ trước"
        >
          {hasReturnLogins ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={returnLoginsByDay} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={dayTick} interval={0} />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Lượt quay lại']} labelFormatter={d => `Ngày ${d}`} />
                <Bar dataKey="count" name="Đăng nhập quay lại" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Phân bổ số lần đăng nhập / user"
          subtitle="Trong tháng — nhiều lần = tốt hơn"
        >
          {hasFreqData ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={loginFreqGroups} layout="vertical" margin={{ top: 0, right: 40, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="group" type="category" tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickLine={false} axisLine={false} width={68} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Users']} />
                <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]} maxBarSize={22}
                  label={{ position: 'right', fontSize: 11, fill: '#9CA3AF' }}>
                  {loginFreqGroups.map((_, i) => (
                    <Cell key={i} fill={FREQ_COLORS[i % FREQ_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

      </div>
    </section>
  )
}
