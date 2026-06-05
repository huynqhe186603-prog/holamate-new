'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/explore/StarRating'
import {
  ShoppingBag, TrendingUp, Package, Clock, CheckCircle2,
  XCircle, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Order = {
  id: string; status: string; total_price: number; buyer_name: string
  created_at: string; vendors: { name: string } | null
  order_items: { quantity: number }[]
}

type Review = {
  id: string; rating: number; content: string | null; is_anonymous: boolean
  created_at: string; profiles: { full_name: string | null } | null
  vendors: { name: string } | null
}

interface DashboardClientProps {
  vendorIds: string[]
  initialOrders: Order[]
  initialReviews: Review[]
}

const STATUS_CFG: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  submitted:  { label: 'Đã gửi',       icon: <Clock className="w-3 h-3" />,        classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  confirmed:  { label: 'Đã xác nhận',  icon: <CheckCircle2 className="w-3 h-3" />, classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed:  { label: 'Hoàn thành',   icon: <CheckCircle2 className="w-3 h-3" />, classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:  { label: 'Đã hủy',       icon: <XCircle className="w-3 h-3" />,      classes: 'bg-red-100 text-red-700 border-red-200' },
}

function formatVND(n: number) { return n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}đ` }
function formatTime(d: string) {
  const dt = new Date(d)
  return dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function DashboardClient({ vendorIds, initialOrders, initialReviews }: DashboardClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null)
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter(o => o.created_at.startsWith(today))
  const todayRevenue = todayOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total_price, 0)
  const todayItems = todayOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.order_items.reduce((q, i) => q + i.quantity, 0), 0)
  const newOrders = todayOrders.filter(o => o.status === 'submitted').length

  // Realtime: listen for new orders across all vendor IDs
  useEffect(() => {
    if (!vendorIds.length) return
    const channels = vendorIds.map(vid =>
      supabase
        .channel(`dashboard-orders-${vid}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'orders',
          filter: `vendor_id=eq.${vid}`,
        }, (payload) => {
          const newOrder = payload.new as any
          setOrders(prev => [newOrder, ...prev].slice(0, 10))
          setNewOrderAlert(newOrder.buyer_name ?? 'Đơn mới')
          setTimeout(() => setNewOrderAlert(null), 5000)
        })
        .subscribe()
    )
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [vendorIds, supabase])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* New order toast */}
      {newOrderAlert && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-3 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl animate-fade-in">
          <Bell className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold">Đơn mới!</p>
            <p className="text-xs text-neutral-400">{newOrderAlert}</p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={<ShoppingBag className="w-5 h-5 text-blue-600" />} label="Đơn mới hôm nay" value={newOrders} bg="bg-blue-50 border-blue-100" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} label="Doanh thu ước tính" value={formatVND(todayRevenue)} bg="bg-emerald-50 border-emerald-100" />
        <StatCard icon={<Package className="w-5 h-5 text-amber-600" />} label="Món đã bán hôm nay" value={todayItems} bg="bg-amber-50 border-amber-100 col-span-2 sm:col-span-1" />
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-neutral-900">Đơn gần nhất</h2>
          <Link href="/seller/orders" className="text-xs text-primary hover:underline underline-offset-2">
            Xem tất cả →
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center">
            <p className="text-sm text-neutral-400">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map(order => {
              const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.submitted
              return (
                <div key={order.id} className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{order.buyer_name}</p>
                    <p className="text-xs text-neutral-400">{formatTime(order.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-sm font-bold text-primary">{formatVND(order.total_price)}</p>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold', cfg.classes)}>
                      {cfg.icon}{cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent reviews */}
      {initialReviews.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-neutral-900 mb-3">Review gần nhất</h2>
          <div className="space-y-2">
            {initialReviews.slice(0, 3).map(review => (
              <div key={review.id} className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-neutral-800">
                    {review.is_anonymous ? 'Ẩn danh' : (review.profiles?.full_name ?? 'Người dùng')}
                  </span>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.content && (
                  <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">{review.content}</p>
                )}
                <p className="text-[10px] text-neutral-400 mt-1.5">{review.vendors?.name} · {
                  new Date(review.created_at).toLocaleDateString('vi-VN')
                }</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, bg }: {
  icon: React.ReactNode; label: string; value: string | number; bg: string
}) {
  return (
    <div className={cn('rounded-2xl border p-4', bg)}>
      <div className="mb-2">{icon}</div>
      <p className="text-xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </div>
  )
}
