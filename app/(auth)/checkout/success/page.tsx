import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, ShoppingBag, ArrowRight, MessageCircle, Store, MapPin } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Đặt món thành công' }

function formatVND(amount: number) {
  return amount >= 1000 ? `${Math.round(amount / 1000)}k` : `${amount}đ`
}

interface Props {
  searchParams: { orderId?: string }
}

async function SuccessContent({ orderId }: { orderId: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, fulfillment_method, buyer_name, buyer_phone, buyer_address, total_price, note, created_at,
      vendors(id, name, vendor_type, phone, zalo),
      order_items(id, item_name, item_price, quantity, subtotal)
    `)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-neutral-500">Không tìm thấy đơn hàng.</p>
        <Link href="/account/orders" className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}>
          Xem đơn hàng của tôi
        </Link>
      </div>
    )
  }

  const vendor = order.vendors as any
  const items: any[] = order.order_items ?? []
  const vendorHref = vendor?.vendor_type === 'student_booth'
    ? `/explore/booths/${vendor?.id}`
    : `/explore/vendors/${vendor?.id}`

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6 animate-fade-in">
      {/* Success header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Đặt món thành công!</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Yêu cầu của bạn đã được gửi đến quán. Đang chờ xác nhận.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Đang chờ quán xác nhận
        </span>
      </div>

      {/* Order summary */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-semibold text-neutral-900">{vendor?.name ?? 'Quán'}</span>
          </div>
          <span className="text-xs text-neutral-400 font-mono">#{order.id.slice(-8).toUpperCase()}</span>
        </div>

        <div className="divide-y divide-neutral-50 px-4">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-neutral-700 flex-1 min-w-0 truncate">
                {item.item_name}
                <span className="text-neutral-400 ml-1">×{item.quantity}</span>
              </span>
              <span className="font-medium text-neutral-800 ml-3 shrink-0">{formatVND(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-t border-neutral-100">
          <div className="text-xs text-neutral-500 space-y-0.5">
            <p>{order.fulfillment_method === 'pickup' ? 'Tự đến lấy' : 'Quán giao'}</p>
            {order.buyer_address && (
              <p className="flex items-start gap-1 text-blue-700">
                <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                {order.buyer_address}
              </p>
            )}
            {order.note && <p className="italic">&ldquo;{order.note}&rdquo;</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-400">Tổng cộng</p>
            <p className="text-base font-bold text-primary">{formatVND(order.total_price)}</p>
          </div>
        </div>
      </div>

      {/* Contact vendor */}
      {(vendor?.phone || vendor?.zalo) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-800">Liên hệ quán nếu cần</p>
          <div className="flex flex-wrap gap-2">
            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-amber-200 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
              >
                📞 {vendor.phone}
              </a>
            )}
            {vendor.zalo && (
              <a
                href={`https://zalo.me/${vendor.zalo.replace(/^0/, '84')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-amber-200 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                Zalo
              </a>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        <Link
          href="/account/orders"
          className={cn(buttonVariants(), 'w-full h-11 gap-2 font-medium')}
        >
          <ShoppingBag className="w-4 h-4" />
          Xem đơn hàng của tôi
        </Link>
        <Link
          href={vendorHref}
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full h-11 gap-2 font-medium')}
        >
          Về trang quán
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = searchParams
  if (!orderId) redirect('/account/orders')

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
      </div>
    }>
      <SuccessContent orderId={orderId} />
    </Suspense>
  )
}
