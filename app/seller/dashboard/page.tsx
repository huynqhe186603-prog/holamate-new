import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '../_components/DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Seller Dashboard' }

export default async function SellerDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: seller } = await supabase
    .from('sellers')
    .select('id, seller_vendor_roles(vendor_id)')
    .eq('user_id', user.id)
    .single()

  if (!seller) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-neutral-600 font-medium">Tài khoản seller chưa được kích hoạt.</p>
        <p className="text-sm text-neutral-400">Liên hệ admin để kích hoạt.</p>
      </div>
    )
  }

  const vendorIds = (seller.seller_vendor_roles ?? []).map((r: any) => r.vendor_id as string)
  const safeIds = vendorIds.length ? vendorIds : ['__none__']

  const { data: vendorPartnership } = await supabase
    .from('vendors')
    .select('is_partnered')
    .in('id', safeIds)
  const isAnyPartnered = (vendorPartnership ?? []).some((v: any) => v.is_partnered)

  // Fetch recent orders for the list (last 10)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_price, buyer_name, created_at, vendors(name), order_items(quantity)')
    .in('vendor_id', safeIds)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch accurate today stats (no limit — needed to avoid truncation bug)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: todayData } = await supabase
    .from('orders')
    .select('total_price, status, order_items(quantity)')
    .in('vendor_id', safeIds)
    .gte('created_at', todayStart.toISOString())

  const todayActive = (todayData ?? []).filter((o: any) => o.status !== 'cancelled')
  const initialTodayRevenue = todayActive.reduce((s: number, o: any) => s + Number(o.total_price || 0), 0)
  const initialTodayItems = todayActive.reduce(
    (s: number, o: any) => s + ((o.order_items as any[]) ?? []).reduce((q: number, i: any) => q + i.quantity, 0),
    0,
  )
  const initialNewOrders = (todayData ?? []).filter((o: any) => o.status === 'submitted').length

  // Fetch recent reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, content, is_anonymous, created_at, profiles(full_name), vendors(name)')
    .in('vendor_id', safeIds)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      </div>

      {/* Partnership status banner */}
      {isAnyPartnered ? (
        <div className="flex items-start gap-2.5 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800">
          <span className="shrink-0 font-bold">✓</span>
          <p>Quán của bạn đã liên kết với HolaMate. Khách hàng có thể đặt món trực tuyến.</p>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          <span className="shrink-0">⚠️</span>
          <p>Quán của bạn chưa được xác nhận liên kết. Liên hệ HolaMate để kích hoạt tính năng đặt món.</p>
        </div>
      )}
      <DashboardClient
        vendorIds={vendorIds}
        initialOrders={(orders ?? []) as any}
        initialReviews={(reviews ?? []) as any}
        initialTodayRevenue={initialTodayRevenue}
        initialTodayItems={initialTodayItems}
        initialNewOrders={initialNewOrders}
      />
    </div>
  )
}
