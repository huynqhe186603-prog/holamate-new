'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatVND } from '@/lib/utils/formatters'
import { Plus, Upload } from 'lucide-react'

export default function SellerMenuPage() {
  const supabase = createClient()
  const [vendors, setVendors] = useState<any[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable' | 'today'>('all')
  const [form, setForm] = useState({ name: '', description: '', item_type: 'food', price: 0, stock_quantity: 0, is_available: true, selling_date: '' })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', user.id).single()
      if (!seller) return
      const { data: roles } = await supabase.from('seller_vendor_roles').select('vendor_id').eq('seller_id', seller.id)
      const ids = (roles ?? []).map((r: any) => r.vendor_id)
      const { data: vendorRows } = await supabase.from('vendors').select('id,name').in('id', ids)
      setVendors(vendorRows ?? [])
      if (vendorRows?.[0]) setSelectedVendorId(vendorRows[0].id)
    }
    load()
  }, [supabase])

  useEffect(() => {
    if (!selectedVendorId) return
    const loadItems = async () => {
      const { data } = await supabase.from('menu_items').select('*').eq('vendor_id', selectedVendorId).order('created_at', { ascending: false })
      setItems(data ?? [])
    }
    loadItems()
  }, [selectedVendorId, supabase])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filter === 'available') return item.is_available
      if (filter === 'unavailable') return !item.is_available
      if (filter === 'today') return !item.selling_date || item.selling_date === new Date().toISOString().split('T')[0]
      return true
    })
  }, [filter, items])

  const addItem = async () => {
    if (!selectedVendorId) return
    const { data, error } = await supabase.from('menu_items').insert({
      vendor_id: selectedVendorId,
      name: form.name,
      description: form.description,
      item_type: form.item_type as any,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      is_available: Boolean(form.is_available),
      selling_date: form.selling_date || null,
      image_url: null,
      is_featured: false,
      sort_order: items.length,
    }).select('*').single()
    if (!error && data) { setItems([data, ...items]); setForm({ name: '', description: '', item_type: 'food', price: 0, stock_quantity: 0, is_available: true, selling_date: '' }) }
    else alert(error?.message || 'Không thể thêm món')
  }

  const toggleAvailable = async (item: any) => {
    const { error } = await supabase.from('menu_items').update({ is_available: !item.is_available, updated_at: new Date().toISOString() }).eq('id', item.id)
    if (!error) setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
  }

  const updateStock = async (item: any, stock: number) => {
    const { error } = await supabase.from('menu_items').update({ stock_quantity: stock }).eq('id', item.id)
    if (!error) setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock_quantity: stock } : i))
  }

  const uploadMainImage = async (item: any) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const path = `menu-item-images/vendors/${selectedVendorId}/items/${item.id}/main.jpg`
      const { error: uploadError } = await supabase.storage.from('menu-item-images').upload(path, file, { upsert: true })
      if (uploadError) { alert(uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from('menu-item-images').getPublicUrl(path)
      const { error } = await supabase.from('menu_items').update({ image_url: publicUrl }).eq('id', item.id)
      if (!error) setItems(prev => prev.map(i => i.id === item.id ? { ...i, image_url: publicUrl } : i))
      else alert(error.message)
    }
    input.click()
  }

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Menu / Sản phẩm</h1>
        <p className="text-sm text-neutral-500">Quản lý món, tồn kho, trạng thái bán và ảnh chính.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thêm món</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <Input placeholder="Tên món" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <textarea placeholder="Mô tả" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="min-h-[72px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm" />
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={form.item_type} onChange={e => setForm(p => ({ ...p, item_type: e.target.value }))} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                <option value="food">Food</option><option value="drink">Drink</option><option value="combo">Combo</option>
              </select>
              <Input type="number" placeholder="Giá (VND)" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="number" placeholder="Số lượng còn" value={form.stock_quantity} onChange={e => setForm(p => ({ ...p, stock_quantity: Number(e.target.value) }))} />
              <Input type="date" value={form.selling_date} onChange={e => setForm(p => ({ ...p, selling_date: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} /> Có sẵn để bán</label>
            <Button onClick={addItem} className="w-full gap-2"><Plus className="w-4 h-4" /> Thêm món</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách món</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">{['all','available','unavailable','today'].map(f => <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f as any)}>{f === 'all' ? 'Tất cả' : f === 'available' ? 'Còn hàng' : f === 'unavailable' ? 'Hết hàng' : 'Theo ngày'}</Button>)}</div>
            <div className="space-y-3">{filteredItems.map(item => (
              <article key={item.id} className="rounded-2xl border border-neutral-100 bg-white p-4 space-y-3">
                <div className="flex gap-3">
                  {item.image_url ? <Image src={item.image_url} alt={item.name} width={72} height={72} className="h-18 w-18 rounded-xl object-cover" /> : <div className="h-18 w-18 rounded-xl bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-500">No image</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                        <p className="text-xs text-neutral-500">{item.description || 'Không có mô tả'}</p>
                      </div>
                      <Badge variant={item.is_available ? 'default' : 'secondary'}>{item.is_available ? 'Còn bán' : 'Hết hàng'}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-bold text-primary">{formatVND(item.price)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                  <span>Loại: {item.item_type}</span>
                  <span>Kho: {item.stock_quantity ?? 0}</span>
                  <span>Ngày: {item.selling_date || 'mọi ngày'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleAvailable(item)}>{item.is_available ? 'Ẩn món' : 'Mở bán'}</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStock(item, Math.max((item.stock_quantity ?? 0) - 1, 0))}>-1 tồn kho</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStock(item, (item.stock_quantity ?? 0) + 1)}>+1 tồn kho</Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => uploadMainImage(item)}><Upload className="w-3.5 h-3.5" /> Ảnh</Button>
                </div>
              </article>
            ))}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
