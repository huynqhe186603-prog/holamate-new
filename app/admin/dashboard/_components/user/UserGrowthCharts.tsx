'use client'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import { ChartCard, EmptyChart } from '../ChartCard'
import type { DayCount } from '../types'

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

interface Props {
  signupsByDay: DayCount[]
  cumulativeByDay: DayCount[]
  month: number
}

export function UserGrowthCharts({ signupsByDay, cumulativeByDay, month }: Props) {
  const hasSignups = signupsByDay.some(d => d.count > 0)
  const hasCumulative = cumulativeByDay.some(d => d.count > 0)

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-orange-400 inline-block" />
        Nhóm 1 — Tăng trưởng người dùng (Tháng {month})
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard title="Người dùng đăng ký mới" subtitle="Sign-up events theo ngày">
          {hasSignups ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={signupsByDay} margin={{ top: 20, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={dayTick} interval={0} />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Đăng ký']} labelFormatter={d => `Ngày ${d}`} />
                <Bar dataKey="count" name="Đăng ký mới" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={18}>
                  <LabelList dataKey="count" position="top"
                    style={{ fontSize: '11px', fontWeight: '600', fill: '#374151' }}
                    formatter={(v) => Number(v) > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Tổng người dùng tích lũy" subtitle="Cộng dồn đến cuối mỗi ngày">
          {hasCumulative ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cumulativeByDay} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={dayTick} interval={0} />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Tổng users']} labelFormatter={d => `Ngày ${d}`} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Tổng tích lũy"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3B82F6', r: 3 }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList dataKey="count" position="top"
                    style={{ fontSize: '10px', fontWeight: '600', fill: '#3B82F6' }}
                    formatter={(v) => Number(v) > 0 ? v : ''} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

      </div>
    </section>
  )
}
