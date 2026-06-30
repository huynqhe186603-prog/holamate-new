'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatVND } from '@/lib/utils/formatters'
import { Pencil, Plus, Trash2, Upload, X } from 'lucide-react'

type MenuItem = {
  id: string
  name: string
  description: string | null
  item_type: string
  price: number
  stock_quantity: number | null
  is_available: boolean
  selling_date: string | null
  image_url: string | null
}

type ItemForm = {
  name: string
  description: string
  item_type: string
  price: number
  stock_quantity: number
  is_available: boolean
  selling_date: string
}

const EMPTY_FORM: ItemForm = {
  name: '', description: '', item_type: 'food', price: 0,
  stock_quantity: 0, is_available: true, selling_date: '',
}

function validateItem(f: ItemForm): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!f.name.trim() || f.name.trim().length < 2) errors.name = 'Tên món tối thiểu 2 ký tự'
  if (!f.price || Number(f.price) <= 0) errors.price = 'Giá phải lớn hơn 0'
  return errors
}

export default function SellerMenuPage() {
  const supabase = createClient()
  const [vendors, setVendors] = useState<any[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [items, setItems] = useState<MenuItem[]>([])
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable' | 'today'>('all')

  // Add form
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM)
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)

  // Edit modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editForm, setEditForm] = useState<ItemForm>(EMPTY_FORM)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

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
    supabase.from('menu_items').select('*').eq('vendor_id', selectedVendorId).order('created_at', { ascending: false })
      .then(({ data }) => setItems(data ?? []))
  }, [selectedVendorId, supabase])

  const filteredItems = useMemo(() => items.filter(item => {
    if (filter === 'available') return item.is_available
    if (filter === 'unavailable') return !item.is_available
    if (filter === 'today') return !item.selling_date || item.selling_date === new Date().toISOString().split('T')[0]
    return true
  }), [filter, items])

  const addItem = async () => {
    const errors = validateItem(form)
    setAddErrors(errors)
    if (Object.keys(errors).length) return
    if (!selectedVendorId) return
    setAdding(true)
    const { data, error } = await supabase.from('menu_items').insert({
      vendor_id: selectedVendorId,
      name: form.name.trim(),
      description: form.description || null,
      item_type: form.item_type as any,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      is_available: Boolean(form.is_available),
      selling_date: form.selling_date || null,
      image_url: null,
      is_featured: false,
      sort_order: items.length,
    }).select('*').single()
    setAdding(false)
    if (!error && data) {
      setItems([data as MenuItem, ...items])
      setForm(EMPTY_FORM)
      setAddErrors({})
      showToast('Đã thêm món thành công')
    } else {
      alert(error?.message || 'Không thể thêm món')
    }
  }

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setEditForm({
      name: item.name,
      description: item.description ?? '',
      item_type: item.item_type,
      price: item.price,
      stock_quantity: item.stock_quantity ?? 0,
      is_available: item.is_available,
      selling_date: item.selling_date ?? '',
    })
    setEditErrors({})
  }

  const saveEdit = async () => {
    if (!editingItem) return
    const errors = validateItem(editForm)
    setEditErrors(errors)
    if (Object.keys(errors).length) return
    setSaving(true)
    const { error } = await supabase.from('menu_items').update({
      name: editForm.name.trim(),
      description: editForm.description || null,
      item_type: editForm.item_type as any,
      price: Number(editForm.price),
      stock_quantity: Number(editForm.stock_quantity),
      is_available: Boolean(editForm.is_available),
      selling_date: editForm.selling_date || null,
      updated_at: new Date().toISOString(),
    }).eq('id', editingItem.id)
    setSaving(false)
    if (!error) {
      setItems(prev => prev.map(i => i.id === editingItem.id
        ? { ...i, ...editForm, name: editForm.name.trim(), description: editForm.description || null, selling_date: editForm.selling_date || null }
        : i))
      setEditingItem(null)
      showToast('Đã cập nhật món')
    } else {
      alert(error.message)
    }
  }

  const deleteItem = async (item: MenuItem) => {
    if (!confirm(`Bạn có chắc muốn xóa món "${item.name}"?\nHành động này không thể hoàn tác.`)) return
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
    if (error) { alert(error.message); return }
    supabase.storage.from('menu-item-images')
      .remove([`vendors/${selectedVendorId}/items/${item.id}/main.jpg`])
    setItems(prev => prev.filter(i => i.id !== item.id))
    showToast('Đã xóa món')
  }

  const toggleAvailable = async (item: MenuItem) => {
    const { error } = await supabase.from('menu_items').update({ is_available: !item.is_available, updated_at: new Date().toISOString() }).eq('id', item.id)
    if (!error) setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
  }

  const updateStock = async (item: MenuItem, stock: number) => {
    const { error } = await supabase.from('menu_items').update({ stock_quantity: stock }).eq('id', item.id)
    if (!error) setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock_quantity: stock } : i))
  }

  const uploadMainImage = async (item: MenuItem) => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      const path = `vendors/${selectedVendorId}/items/${item.id}/main.jpg`
      const { error: uploadError } = await supabase.storage.from('menu-item-images').upload(path, file, { upsert: true })
      if (uploadError) { alert(uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from('menu-item-images').getPublicUrl(path)
      const { error } = await supabase.from('menu_items').update({ image_url: publicUrl }).eq('id', item.id)
      if (!error) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, image_url: publicUrl } : i))
        showToast('Đã cập nhật ảnh')
      } else alert(error.message)
    }
    input.click()
  }

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">Sửa món</h2>
              <button onClick={() => setEditingItem(null)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <Input
                  placeholder="Tên món *"
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className={editErrors.name ? 'border-red-400' : ''}
                />
                {editErrors.name && <p className="text-red-500 text-xs mt-1">{editErrors.name}</p>}
              </div>
              <textarea
                placeholder="Mô tả"
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                className="min-h-[68px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={editForm.item_type}
                  onChange={e => setEditForm(p => ({ ...p, item_type: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="food">Food</option>
                  <option value="drink">Drink</option>
                  <option value="combo">Combo</option>
                  <option value="display_product">Display</option>
                </select>
                <div>
                  <Input
                    type="number"
                    placeholder="Giá (VND) *"
                    value={editForm.price || ''}
                    onChange={e => setEditForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className={editErrors.price ? 'border-red-400' : ''}
                  />
                  {editErrors.price && <p className="text-red-500 text-xs mt-1">{editErrors.price}</p>}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  placeholder="Số lượng còn"
                  value={editForm.stock_quantity || ''}
                  onChange={e => setEditForm(p => ({ ...p, stock_quantity: Number(e.target.value) }))}
                />
                <Input
                  type="date"
                  value={editForm.selling_date}
                  onChange={e => setEditForm(p => ({ ...p, selling_date: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={editForm.is_available}
                  onChange={e => setEditForm(p => ({ ...p, is_available: e.target.checked }))}
                />
                Có sẵn để bán
              </label>
            </div>
            <div className="flex gap-3 pt-1">
              <Button onClick={saveEdit} disabled={saving} className="flex-1">
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>Huỷ</Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Menu / Sản phẩm</h1>
        <p className="text-sm text-neutral-500">Quản lý món, tồn kho, trạng thái bán và ảnh chính.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        {/* Add form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thêm món</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={selectedVendorId}
              onChange={e => setSelectedVendorId(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <div>
              <Input
                placeholder="Tên món *"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={addErrors.name ? 'border-red-400' : ''}
              />
              {addErrors.name && <p className="text-red-500 text-xs mt-1">{addErrors.name}</p>}
            </div>
            <textarea
              placeholder="Mô tả"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="min-h-[72px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.item_type}
                onChange={e => setForm(p => ({ ...p, item_type: e.target.value }))}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="food">Food</option>
                <option value="drink">Drink</option>
                <option value="combo">Combo</option>
                <option value="display_product">Display</option>
              </select>
              <div>
                <Input
                  type="number"
                  placeholder="Giá (VND) *"
                  value={form.price || ''}
                  onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                  className={addErrors.price ? 'border-red-400' : ''}
                />
                {addErrors.price && <p className="text-red-500 text-xs mt-1">{addErrors.price}</p>}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="number"
                placeholder="Số lượng còn"
                value={form.stock_quantity || ''}
                onChange={e => setForm(p => ({ ...p, stock_quantity: Number(e.target.value) }))}
              />
              <Input
                type="date"
                value={form.selling_date}
                onChange={e => setForm(p => ({ ...p, selling_date: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))}
              />
              Có sẵn để bán
            </label>
            <Button onClick={addItem} disabled={adding} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              {adding ? 'Đang thêm...' : 'Thêm món'}
            </Button>
          </CardContent>
        </Card>

        {/* Item list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách món</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['all', 'available', 'unavailable', 'today'] as const).map(f => (
                <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Tất cả' : f === 'available' ? 'Còn hàng' : f === 'unavailable' ? 'Hết hàng' : 'Theo ngày'}
                </Button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredItems.map(item => (
                <article key={item.id} className="rounded-2xl border border-neutral-100 bg-white p-4 space-y-3">
                  <div className="flex gap-3">
                    {item.image_url
                      ? <Image src={item.image_url} alt={item.name} width={72} height={72} className="h-[72px] w-[72px] rounded-xl object-cover shrink-0" />
                      : <div className="h-[72px] w-[72px] rounded-xl bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-500 shrink-0">No image</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                          <p className="text-xs text-neutral-500 line-clamp-1">{item.description || 'Không có mô tả'}</p>
                        </div>
                        <Badge variant={item.is_available ? 'default' : 'secondary'}>
                          {item.is_available ? 'Còn bán' : 'Hết hàng'}
                        </Badge>
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
                    <Button size="sm" variant="outline" onClick={() => toggleAvailable(item)}>
                      {item.is_available ? 'Ẩn món' : 'Mở bán'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStock(item, Math.max((item.stock_quantity ?? 0) - 1, 0))}>-1</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStock(item, (item.stock_quantity ?? 0) + 1)}>+1</Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => uploadMainImage(item)}>
                      <Upload className="w-3.5 h-3.5" /> Ảnh
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(item)}>
                      <Pencil className="w-3.5 h-3.5" /> Sửa
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="gap-1 text-red-600 hover:bg-red-50 hover:border-red-200"
                      onClick={() => deleteItem(item)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </Button>
                  </div>
                </article>
              ))}
              {!filteredItems.length && (
                <p className="text-sm text-neutral-500 py-4 text-center">Không có món nào trong danh mục này.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
