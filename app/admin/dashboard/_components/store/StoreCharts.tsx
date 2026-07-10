'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import { ChartCard, EmptyChart, KpiCard } from '../ChartCard'
import type { DayRevenue, DayCount, NameValue, VendorRating } from '../types'

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

function fmtVND(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

interface Props {
  totalActiveVendors: number
  partneredVendors: number
  ordersInMonth: number
  ordersByDay: DayRevenue[]
  topVendorsByViews: NameValue[]
  topVendorsByOrders: NameValue[]
  reviewsByDay: DayCount[]
  vendorRatings: VendorRating[]
  month: number
}

export function StoreCharts({
  totalActiveVendors, partneredVendors, ordersInMonth,
  ordersByDay, topVendorsByViews, topVendorsByOrders,
  reviewsByDay, vendorRatings, month,
}: Props) {
  const hasOrders = ordersByDay.some(d => d.count > 0)
  const hasRevenue = ordersByDay.some(d => d.revenue > 0)
  const hasReviews = reviewsByDay.some(d => d.count > 0)
  const hasRatings = vendorRatings.length > 0

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-orange-400 inline-block" />
        Phân tích quán ăn & đơn hàng (Tháng {month})
      </h3>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Tổng số quán" value={totalActiveVendors}
          sub="" color="bg-blue-50 border-blue-100" icon="🏪" />
        <KpiCard label="Quán liên kết" value={partneredVendors}
          sub="" color="bg-orange-50 border-orange-100" icon="🤝" />
        <KpiCard label="Đơn hàng trong tháng" value={ordersInMonth}
          sub={`Tháng ${month}`} color="bg-emerald-50 border-emerald-100" icon="🛒" />
      </div>

      {/* Orders + Revenue by day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Đơn hàng theo ngày" subtitle="Số đơn mỗi ngày">
          {hasOrders ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ordersByDay} margin={{ top: 20, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={dayTick} interval={0} />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Đơn hàng']} labelFormatter={d => `Ngày ${d}`} />
                <Bar dataKey="count" name="Đơn hàng" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={18}>
                  <LabelList dataKey="count" position="top"
                    style={{ fontSize: '11px', fontWeight: '600', fill: '#374151' }}
                    formatter={(v) => Number(v) > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Doanh thu theo ngày" subtitle="Tổng total_price (VND)">
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ordersByDay} margin={{ top: 20, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={dayTick} interval={0} />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={fmtVND} />
                <Tooltip {...TOOLTIP_STYLE}
                  formatter={(v) => [`${fmtVND(Number(v))}đ`, 'Doanh thu']}
                  labelFormatter={d => `Ngày ${d}`} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={18}>
                  <LabelList dataKey="revenue" position="top"
                    style={{ fontSize: '11px', fontWeight: '600', fill: '#374151' }}
                    formatter={(v) => Number(v) > 0 ? fmtVND(Number(v)) : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Top vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top quán được xem nhiều nhất" subtitle="Theo view_vendor events">
          {topVendorsByViews.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topVendorsByViews} layout="vertical" margin={{ top: 0, right: 40, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false} axisLine={false} width={120} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Lượt xem']} />
                <Bar dataKey="value" name="Lượt xem" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  <LabelList dataKey="value" position="right"
                    style={{ fontSize: '11px', fontWeight: '600', fill: '#374151' }}
                    formatter={(v) => Number(v) > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Top quán được đặt nhiều nhất" subtitle="Theo số đơn hàng">
          {topVendorsByOrders.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topVendorsByOrders} layout="vertical" margin={{ top: 0, right: 40, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false} axisLine={false} width={120} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Đơn hàng']} />
                <Bar dataKey="value" name="Đơn hàng" fill="#8B5CF6" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  <LabelList dataKey="value" position="right"
                    style={{ fontSize: '11px', fontWeight: '600', fill: '#374151' }}
                    formatter={(v) => Number(v) > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>
      {/* Reviews by day + Vendor avg ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Reviews theo ngày" subtitle="Số lượt đánh giá mỗi ngày">
          {hasReviews ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reviewsByDay} margin={{ top: 20, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={TICK_STYLE} tickLine={false} axisLine={false}
                  tickFormatter={dayTick} interval={0} />
                <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Reviews']} labelFormatter={d => `Ngày ${d}`} />
                <Bar dataKey="count" name="Reviews" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={18}>
                  <LabelList dataKey="count" position="top"
                    style={{ fontSize: '11px', fontWeight: '600', fill: '#374151' }}
                    formatter={(v) => Number(v) > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Điểm đánh giá trung bình" subtitle="Rating TB theo từng quán liên kết">
          {hasRatings ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vendorRatings} layout="vertical" margin={{ top: 0, right: 48, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={TICK_STYLE} tickLine={false} axisLine={false}
                  ticks={[1, 2, 3, 4, 5]} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false} axisLine={false} width={120} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}★`, 'Điểm TB']} />
                <Bar dataKey="avgRating" name="Điểm TB" fill="#F59E0B" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  <LabelList dataKey="avgRating" position="right"
                    style={{ fontSize: '11px', fontWeight: '600', fill: '#374151' }}
                    formatter={(v) => Number(v) > 0 ? `${v}★` : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>
    </section>
  )
}
