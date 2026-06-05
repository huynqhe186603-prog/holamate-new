'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatVND } from '@/lib/utils/formatters'
import { EyeOff, Upload } from 'lucide-react'

export default function SellerVendorsPage() {
  const supabase = createClient()
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!seller) return
      const { data: roles } = await supabase
        .from('seller_vendor_roles')
        .select('vendor_id')
        .eq('seller_id', seller.id)
      const ids = (roles ?? []).map((r: any) => r.vendor_id)
      if (!ids.length) { setLoading(false); return }
      const { data: vendorRows } = await supabase
        .from('vendors')
        .select('id,name,vendor_type,status,description,address,phone,zalo,has_delivery,delivery_note,cover_image_url,logo_url,opening_hours')
        .in('id', ids)
      const { data: reviews } = await supabase
        .from('reviews')
        .select('vendor_id,rating')
        .in('vendor_id', ids)
        .eq('status', 'visible')
      const { data: orders } = await supabase
        .from('orders')
        .select('vendor_id,total_price,status,created_at')
        .in('vendor_id', ids)
      const today = new Date().toISOString().split('T')[0]
      const stats: Record<string, { todayOrders: number; revenue: number; rating: number }> = {}
      ids.forEach((id: string) => {
        const vendorOrders = (orders ?? []).filter((o: any) => o.vendor_id === id && o.created_at.startsWith(today) && o.status !== 'cancelled')
        const vendorReviews = (reviews ?? []).filter((r: any) => r.vendor_id === id)
        stats[id] = {
          todayOrders: vendorOrders.length,
          revenue: vendorOrders.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0),
          rating: vendorReviews.length ? vendorReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / vendorReviews.length : 0,
        }
      })
      const merged = (vendorRows ?? []).map((vendor: any) => ({ ...vendor, ...stats[vendor.id] }))
      setVendors(merged)
      if (merged[0]) { setSelectedId(merged[0].id); setForm(merged[0]) }
      setLoading(false)
    }
    load()
  }, [supabase])

  const selectedVendor = useMemo(() => vendors.find(v => v.id === selectedId) ?? vendors[0] ?? null, [vendors, selectedId])

  const saveVendor = async () => {
    if (!selectedVendor) return
    const { error } = await supabase.from('vendors').update({
      name: form.name,
      description: form.description,
      address: form.address,
      phone: form.phone,
      zalo: form.zalo,
      has_delivery: Boolean(form.has_delivery),
      delivery_note: form.delivery_note,
      opening_hours: form.opening_hours ?? {},
    }).eq('id', selectedVendor.id)
    if (!error) {
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, ...form } : v))
      alert('Cập nhật quán thành công')
    } else {
      alert(error.message)
    }
  }

  const uploadFile = async (kind: 'cover' | 'logo') => {
    if (!selectedVendor) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const path = `vendor-images/vendors/${selectedVendor.id}/${kind}.jpg`
      const { error: uploadError } = await supabase.storage.from('vendor-images').upload(path, file, { upsert: true })
      if (uploadError) { alert(uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from('vendor-images').getPublicUrl(path)
      const updatePayload = kind === 'cover' ? { cover_image_url: publicUrl } : { logo_url: publicUrl }
      const { error } = await supabase.from('vendors').update(updatePayload).eq('id', selectedVendor.id)
      if (!error) {
        setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, [kind === 'cover' ? 'cover_image_url' : 'logo_url']: publicUrl } : v))
        setForm((prev: any) => ({ ...prev, [kind === 'cover' ? 'cover_image_url' : 'logo_url']: publicUrl }))
        alert('Tải ảnh thành công')
      } else alert(error.message)
    }
    input.click()
  }

  const uploadGallery = async () => {
    if (!selectedVendor) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const path = `vendor-images/vendors/${selectedVendor.id}/gallery/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('vendor-images').upload(path, file, { upsert: true })
      if (uploadError) { alert(uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from('vendor-images').getPublicUrl(path)
      const { error: insertError } = await supabase.from('vendor_media').insert({ vendor_id: selectedVendor.id, image_url: publicUrl, storage_path: path, media_type: 'menu', status: 'visible', uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null })
      if (insertError) alert(insertError.message)
      else alert('Đã thêm ảnh vào thư viện')
    }
    input.click()
  }

  if (loading) return <p className="text-sm text-neutral-500">Đang tải...</p>

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Quán / Gian hàng</h1>
        <p className="text-sm text-neutral-500">Quản lý thông tin, ảnh bìa, logo và thư viện ảnh.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách vendor đang quản lý</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vendors.map(v => (
              <button key={v.id} onClick={() => { setSelectedId(v.id); setForm(v) }} className={`w-full rounded-2xl border p-4 text-left transition ${selectedVendor?.id === v.id ? 'border-primary bg-primary/5' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{v.name}</p>
                    <p className="text-xs text-neutral-500">{v.vendor_type === 'student_booth' ? 'Gian hàng SV' : 'Quán ăn cố định'}</p>
                  </div>
                  <Badge variant="secondary">{v.status}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                  <span>⭐ {v.rating ? v.rating.toFixed(1) : 'Chưa có'}</span>
                  <span>📦 {v.todayOrders ?? 0} đơn hôm nay</span>
                  <span>💰 {formatVND(v.revenue ?? 0)}</span>
                </div>
              </button>
            ))}
            {!vendors.length && <p className="text-sm text-neutral-500">Bạn chưa quản lý vendor nào.</p>}
          </CardContent>
        </Card>

        {selectedVendor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chỉnh sửa thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm"><span>Tên quán</span><Input value={form.name ?? ''} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} /></label>
                <label className="space-y-1 text-sm"><span>Loại</span><Input value={selectedVendor.vendor_type === 'student_booth' ? 'Gian hàng sinh viên' : 'Quán ăn cố định'} disabled /></label>
                <label className="space-y-1 text-sm md:col-span-2"><span>Mô tả</span><textarea value={form.description ?? ''} onChange={e => setForm((p:any)=>({...p, description:e.target.value}))} className="min-h-[72px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm" /></label>
                <label className="space-y-1 text-sm"><span>Địa chỉ</span><Input value={form.address ?? ''} onChange={e => setForm((p:any)=>({...p, address:e.target.value}))} /></label>
                <label className="space-y-1 text-sm"><span>Điện thoại</span><Input value={form.phone ?? ''} onChange={e => setForm((p:any)=>({...p, phone:e.target.value}))} /></label>
                <label className="space-y-1 text-sm"><span>Zalo</span><Input value={form.zalo ?? ''} onChange={e => setForm((p:any)=>({...p, zalo:e.target.value}))} /></label>
                <label className="space-y-1 text-sm"><span>Giờ mở cửa</span><Input value={typeof form.opening_hours === 'object' ? JSON.stringify(form.opening_hours) : ''} onChange={e => setForm((p:any)=>({...p, opening_hours: JSON.parse(e.target.value || '{}')}))} /></label>
                <label className="space-y-1 text-sm"><span>Ghi chú giao/nhận</span><Input value={form.delivery_note ?? ''} onChange={e => setForm((p:any)=>({...p, delivery_note:e.target.value}))} /></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.has_delivery)} onChange={e => setForm((p:any)=>({...p, has_delivery:e.target.checked}))} /> Có ship</label>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={saveVendor}>Lưu thay đổi</Button>
                <Button variant="outline" onClick={() => uploadFile('cover')}>Tải ảnh bìa</Button>
                <Button variant="outline" onClick={() => uploadFile('logo')}>Tải logo</Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-500 mb-2">Ảnh bìa</p>
                  {selectedVendor.cover_image_url ? <Image src={selectedVendor.cover_image_url} alt="Cover" width={320} height={180} className="h-28 w-full rounded-xl object-cover" /> : <div className="h-28 rounded-xl border border-dashed border-neutral-200 flex items-center justify-center text-xs text-neutral-500">Chưa có ảnh</div>}
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-500 mb-2">Logo</p>
                  {selectedVendor.logo_url ? <Image src={selectedVendor.logo_url} alt="Logo" width={80} height={80} className="h-20 w-20 rounded-xl object-cover" /> : <div className="h-20 w-20 rounded-xl border border-dashed border-neutral-200 flex items-center justify-center text-xs text-neutral-500">Logo</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Thư viện ảnh</p>
                    <p className="text-xs text-neutral-500">Xem, thêm và ẩn ảnh trong gallery.</p>
                  </div>
                  <Button variant="outline" onClick={uploadGallery} className="gap-2"><Upload className="w-4 h-4" /> Thêm ảnh</Button>
                </div>
                <GalleryList vendorId={selectedVendor.id} supabase={supabase} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function GalleryList({ vendorId, supabase }: { vendorId: string; supabase: ReturnType<typeof createClient> }) {
  const [images, setImages] = useState<any[]>([])
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('vendor_media').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
      setImages(data ?? [])
    }
    load()
  }, [supabase, vendorId])

  const hideImage = async (id: string) => {
    const { error } = await supabase.from('vendor_media').update({ status: 'hidden' }).eq('id', id)
    if (!error) setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'hidden' } : i))
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {images.map(image => (
        <div key={image.id} className="rounded-2xl border border-neutral-100 bg-white p-3">
          <Image src={image.image_url} alt="Vendor gallery" width={320} height={180} className="h-28 w-full rounded-xl object-cover" />
          <div className="mt-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-neutral-500">{image.media_type}</p>
              <p className="text-xs font-medium text-neutral-700">{image.status}</p>
            </div>
            {image.status !== 'hidden' && <Button variant="ghost" size="sm" onClick={() => hideImage(image.id)} className="gap-1 text-red-600 hover:bg-red-50"><EyeOff className="w-3.5 h-3.5" /> Ẩn</Button>}
          </div>
        </div>
      ))}
      {!images.length && <p className="text-sm text-neutral-500">Chưa có ảnh nào trong thư viện.</p>}
    </div>
  )
}
