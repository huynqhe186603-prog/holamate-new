import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Store, GraduationCap, ShoppingBag, ArrowRight, MapPin } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Đơn hàng của tôi' }

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  submitted:  { label: 'Chờ xác nhận', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  confirmed:  { label: 'Đã xác nhận',  classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed:  { label: 'Hoàn thành',   classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:  { label: 'Đã hủy',       classes: 'bg-red-100 text-red-700 border-red-200' },
}

const FULFILLMENT: Record<string, string> = {
  pickup: 'Tự đến lấy',
  seller_delivery: 'Quán giao',
}

export default async function OrdersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/orders')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, fulfillment_method, buyer_name, buyer_address, total_price, note, created_at,
      vendors(id, name, vendor_type),
      order_items(id, item_name, item_price, quantity, subtotal)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Đơn hàng của tôi</h1>
        <p className="text-sm text-neutral-500 mt-1">{orders?.length ?? 0} đơn hàng</p>
      </div>

      {!orders || orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order }: { order: any }) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.submitted
  const vendor = order.vendors
  const items: any[] = order.order_items ?? []
  const date = new Date(order.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const vendorHref = vendor
    ? vendor.vendor_type === 'student_booth'
      ? `/explore/booths/${vendor.id}`
      : `/explore/vendors/${vendor.id}`
    : null

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 min-w-0">
          {vendor?.vendor_type === 'student_booth'
            ? <GraduationCap className="w-4 h-4 text-neutral-400 shrink-0" />
            : <Store className="w-4 h-4 text-neutral-400 shrink-0" />}
          {vendorHref ? (
            <Link href={vendorHref} className="text-sm font-semibold text-neutral-900 truncate hover:text-primary transition-colors">
              {vendor?.name ?? 'Quán'}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-neutral-900 truncate">{vendor?.name ?? 'Quán'}</span>
          )}
        </div>
        <span className={cn('shrink-0 px-2 py-0.5 rounded-full border text-[11px] font-semibold', cfg.classes)}>
          {cfg.label}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1.5">
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 flex-1 min-w-0 truncate">{item.item_name}</span>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-neutral-400 text-xs">×{item.quantity}</span>
              <span className="text-neutral-600 font-medium text-xs">
                {(item.subtotal / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100 space-y-2">
        {/* Delivery address */}
        {order.buyer_address && (
          <div className="flex items-start gap-1.5 text-xs text-blue-700">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{order.buyer_address}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-400">{date} · {FULFILLMENT[order.fulfillment_method] ?? ''}</p>
            {order.note && <p className="text-xs text-neutral-500 italic">&ldquo;{order.note}&rdquo;</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-neutral-400 mb-0.5">Tổng cộng</p>
            <p className="text-sm font-bold text-primary">
              {(order.total_price / 1000).toFixed(0)}k
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-20 text-center space-y-4 rounded-2xl border border-dashed border-neutral-200">
      <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
      <div>
        <p className="font-medium text-neutral-600">Chưa có đơn hàng nào</p>
        <p className="text-sm text-neutral-400 mt-1">Khám phá các quán ăn và đặt món ngay!</p>
      </div>
      <Link href="/explore" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 h-9')}>
        Khám phá ẩm thực <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
