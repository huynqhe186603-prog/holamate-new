import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '../_components/DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Seller Dashboard' }

export default async function SellerDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get seller + vendor IDs
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

  // Fetch recent orders (last 10)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_price, buyer_name, created_at, vendors(name), order_items(quantity)')
    .in('vendor_id', vendorIds.length ? vendorIds : ['__none__'])
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch recent reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, content, is_anonymous, created_at, profiles(full_name), vendors(name)')
    .in('vendor_id', vendorIds.length ? vendorIds : ['__none__'])
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
      <DashboardClient
        vendorIds={vendorIds}
        initialOrders={(orders ?? []) as any}
        initialReviews={(reviews ?? []) as any}
      />
    </div>
  )
}
