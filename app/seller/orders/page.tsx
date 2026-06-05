'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatVND } from '@/lib/utils/formatters'
import { Bell, CheckCircle2, Phone, XCircle } from 'lucide-react'

const TABS = ['submitted', 'confirmed', 'completed', 'cancelled'] as const

export default function SellerOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [vendorIds, setVendorIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('submitted')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', user.id).single()
      if (!seller) return
      const { data: roles } = await supabase.from('seller_vendor_roles').select('vendor_id').eq('seller_id', seller.id)
      const ids = (roles ?? []).map((r: any) => r.vendor_id)
      setVendorIds(ids)
      if (!ids.length) return
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*), vendors(name)')
        .in('vendor_id', ids)
        .order('created_at', { ascending: false })
      setOrders(data ?? [])
    }
    load()
  }, [supabase])

  useEffect(() => {
    if (!vendorIds.length) return
    const channels = vendorIds.map(vid => supabase
      .channel(`orders-${vid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vid}` }, payload => {
        const order = payload.new as any
        setOrders(prev => [order, ...prev])
        setToast(`Đơn mới từ ${order.buyer_name ?? 'khách hàng'}`)
        setTimeout(() => setToast(null), 4000)
      })
      .subscribe())
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [supabase, vendorIds])

  const filtered = useMemo(() => orders.filter(o => o.status === activeTab), [orders, activeTab])

  const updateStatus = async (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (!error) setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    else alert(error.message)
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      {toast && <div className="fixed right-4 top-20 z-50 flex items-center gap-3 rounded-2xl bg-neutral-900 px-4 py-3 text-white shadow-xl"><Bell className="w-4 h-4 text-amber-400" /> <span className="text-sm">{toast}</span></div>}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Đơn hàng</h1>
        <p className="text-sm text-neutral-500">Realtime nhận đơn mới, xác nhận đơn và theo dõi trạng thái.</p>
      </div>
      <div className="flex flex-wrap gap-2">{TABS.map(tab => <Button key={tab} size="sm" variant={activeTab === tab ? 'default' : 'outline'} onClick={() => setActiveTab(tab)}>{tab === 'submitted' ? 'Mới' : tab === 'confirmed' ? 'Đã xác nhận' : tab === 'completed' ? 'Hoàn thành' : 'Đã hủy'}</Button>)}</div>
      <div className="space-y-3">{filtered.map(order => (
        <Card key={order.id} className="border-neutral-100">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{order.buyer_name}</CardTitle>
                <p className="text-xs text-neutral-500">{order.vendors?.name ?? 'Quán'} · {new Date(order.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <Badge variant={order.status === 'submitted' ? 'secondary' : order.status === 'confirmed' ? 'outline' : order.status === 'completed' ? 'default' : 'destructive'}>{order.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-700">
            <div className="grid gap-2 sm:grid-cols-2">
              <p>📞 {order.buyer_phone}</p>
              <p>🚚 {order.fulfillment_method === 'pickup' ? 'Nhận tại quán' : 'Giao tận nơi'}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-3 space-y-1">
              {(order.order_items ?? []).map((item: any) => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><span>{item.item_name} × {item.quantity}</span><strong>{formatVND(item.subtotal)}</strong></div>)}
            </div>
            <div className="flex items-center justify-between text-sm font-semibold"><span>Tổng tiền</span><span className="text-primary">{formatVND(order.total_price)}</span></div>
            {order.note && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Ghi chú: {order.note}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {order.status === 'submitted' && <Button size="sm" onClick={() => updateStatus(order.id, 'confirmed')} className="gap-1"><CheckCircle2 className="w-4 h-4" /> Xác nhận</Button>}
              {order.status === 'confirmed' && <><Button size="sm" onClick={() => updateStatus(order.id, 'completed')} className="gap-1"><CheckCircle2 className="w-4 h-4" /> Hoàn thành</Button><Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'cancelled')} className="gap-1 text-red-600 hover:bg-red-50"><XCircle className="w-4 h-4" /> Hủy</Button></>}
              {order.status === 'submitted' && <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'cancelled')} className="gap-1 text-red-600 hover:bg-red-50"><XCircle className="w-4 h-4" /> Hủy</Button>}
              <Button size="sm" variant="outline" className="gap-1"><Phone className="w-4 h-4" /> Liên hệ</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {!filtered.length && <p className="text-sm text-neutral-500">Không có đơn hàng trong nhóm này.</p>}</div>
    </div>
  )
}
