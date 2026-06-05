'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatVND } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

const STATUS_CFG: Record<string, { label: string; classes: string }> = {
  submitted:  { label: 'Đã gửi',      classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  confirmed:  { label: 'Đã xác nhận', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed:  { label: 'Hoàn thành',  classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:  { label: 'Đã hủy',      classes: 'bg-red-100 text-red-700 border-red-200' },
}

export default function AdminOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('orders')
        .select('id, buyer_name, buyer_phone, status, total_price, fulfillment_method, note, created_at, updated_at, vendor_id, vendors(name), order_items(id, item_name, quantity, item_price, subtotal)')
        .order('created_at', { ascending: false })
        .limit(500)
      setOrders(data ?? [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter && o.status !== statusFilter) return false
      if (dateFilter) {
        const orderDate = o.created_at.split('T')[0]
        if (orderDate !== dateFilter) return false
      }
      if (search) {
        const q = search.toLowerCase()
        return (
          o.buyer_name?.toLowerCase().includes(q) ||
          o.buyer_phone?.includes(q) ||
          (o.vendors as any)?.name?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [orders, statusFilter, dateFilter, search])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayOrders = orders.filter(o => o.created_at.startsWith(today) && o.status !== 'cancelled')
    return {
      total: orders.length,
      todayCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((s, o) => s + (o.total_price ?? 0), 0),
      pending: orders.filter(o => o.status === 'submitted').length,
    }
  }, [orders])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Orders</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Theo dõi tất cả đơn hàng toàn hệ thống.</p>
      </div>

      {/* Quick stats */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Tổng đơn',       value: stats.total,                     color: 'bg-neutral-50 border-neutral-200' },
            { label: 'Đơn hôm nay',    value: stats.todayCount,                color: 'bg-blue-50 border-blue-100' },
            { label: 'DT hôm nay',     value: formatVND(stats.todayRevenue),   color: 'bg-emerald-50 border-emerald-100' },
            { label: 'Chờ xác nhận',   value: stats.pending,                   color: 'bg-amber-50 border-amber-100' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-2xl border p-4', s.color)}>
              <p className="text-xl font-bold text-neutral-900">{s.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input placeholder="Tìm tên, SĐT, tên quán..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
          <option value="">Tất cả status</option>
          {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <Input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="w-auto"
          title="Lọc theo ngày"
        />
        {(statusFilter || dateFilter || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(''); setDateFilter(''); setSearch('') }}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-neutral-500">Đang tải...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-neutral-100">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Người đặt</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Quán</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tổng tiền</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden xl:table-cell">Hình thức</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Thời gian</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-400">Không tìm thấy đơn hàng nào.</td></tr>
                )}
                {filtered.map(order => {
                  const statusCfg = STATUS_CFG[order.status] ?? STATUS_CFG.submitted
                  const isExpanded = expandedId === order.id
                  return (
                    <Fragment key={order.id}>
                      <tr
                        className="hover:bg-neutral-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-900">{order.buyer_name}</p>
                          <p className="text-xs text-neutral-400">{order.buyer_phone}</p>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell max-w-[140px] truncate">
                          {(order.vendors as any)?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary">
                          {formatVND(order.total_price)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold', statusCfg.classes)}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-500 text-xs hidden xl:table-cell">
                          {order.fulfillment_method === 'pickup' ? '🏪 Nhận tại quán' : '🛵 Giao tận nơi'}
                        </td>
                        <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell whitespace-nowrap">
                          {new Date(order.created_at).toLocaleString('vi-VN', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-neutral-400 inline" />
                            : <ChevronDown className="w-4 h-4 text-neutral-400 inline" />
                          }
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExpanded && (
                        <tr className="bg-neutral-50/60">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                              <div>
                                <p className="text-xs font-semibold text-neutral-500 mb-2">Danh sách món</p>
                                <div className="space-y-1.5">
                                  {(order.order_items ?? []).map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between text-xs text-neutral-700">
                                      <span>{item.item_name} × {item.quantity}</span>
                                      <span className="font-semibold">{formatVND(item.subtotal)}</span>
                                    </div>
                                  ))}
                                  <div className="flex items-center justify-between text-sm font-bold text-primary border-t border-neutral-100 pt-1.5 mt-1.5">
                                    <span>Tổng</span>
                                    <span>{formatVND(order.total_price)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2 text-xs text-neutral-600">
                                <p><span className="font-semibold text-neutral-500">Order ID:</span> <span className="font-mono text-neutral-400">{order.id}</span></p>
                                <p><span className="font-semibold text-neutral-500">Vendor ID:</span> <span className="font-mono text-neutral-400">{order.vendor_id}</span></p>
                                {order.note && (
                                  <p className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-amber-800">
                                    <span className="font-semibold">Ghi chú:</span> {order.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400">{filtered.length} / {orders.length} đơn hàng</p>
        </>
      )}
    </div>
  )
}
