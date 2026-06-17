'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatVND } from '@/lib/utils/formatters'
import { Camera, EyeOff, Upload } from 'lucide-react'

// ── Opening Hours Editor ────────────────────────────────────────────────────

const DAYS = [
  { key: 'mon', label: 'Thứ 2' },
  { key: 'tue', label: 'Thứ 3' },
  { key: 'wed', label: 'Thứ 4' },
  { key: 'thu', label: 'Thứ 5' },
  { key: 'fri', label: 'Thứ 6' },
  { key: 'sat', label: 'Thứ 7' },
  { key: 'sun', label: 'CN' },
]

type DayHours = { open: boolean; from: string; to: string }
type WeekHours = Record<string, DayHours>

function parseHours(raw: any): WeekHours {
  const result: WeekHours = {}
  for (const d of DAYS) {
    const val = raw?.[d.key]
    if (val && typeof val === 'string') {
      const [from = '07:00', to = '22:00'] = val.split('-')
      result[d.key] = { open: true, from, to }
    } else {
      result[d.key] = { open: false, from: '07:00', to: '22:00' }
    }
  }
  return result
}

function serializeHours(wh: WeekHours): Record<string, string | null> {
  const result: Record<string, string | null> = {}
  for (const d of DAYS) {
    result[d.key] = wh[d.key].open ? `${wh[d.key].from}-${wh[d.key].to}` : null
  }
  return result
}

function OpeningHoursEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const [hours, setHours] = useState<WeekHours>(() => parseHours(value))

  const update = (key: string, patch: Partial<DayHours>) => {
    const next = { ...hours, [key]: { ...hours[key], ...patch } }
    setHours(next)
    onChange(serializeHours(next))
  }

  const applyMonToAll = () => {
    const mon = hours['mon']
    const next: WeekHours = {}
    for (const d of DAYS) next[d.key] = { ...mon }
    setHours(next)
    onChange(serializeHours(next))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">Giờ mở cửa</span>
        <Button type="button" size="sm" variant="ghost" onClick={applyMonToAll} className="h-7 px-2 text-xs text-primary">
          Áp dụng T2 cho tất cả
        </Button>
      </div>
      <div className="rounded-xl border border-neutral-200 overflow-hidden">
        {DAYS.map((d, i) => {
          const h = hours[d.key]
          return (
            <div key={d.key} className={`flex items-center gap-2 px-3 py-2 text-sm bg-white ${i < DAYS.length - 1 ? 'border-b border-neutral-100' : ''}`}>
              <span className="w-12 shrink-0 text-xs text-neutral-500">{d.label}</span>
              <button
                type="button"
                onClick={() => update(d.key, { open: !h.open })}
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${h.open ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}
              >
                {h.open ? 'Mở' : 'Nghỉ'}
              </button>
              {h.open ? (
                <div className="flex flex-1 items-center gap-1.5">
                  <input
                    type="time"
                    value={h.from}
                    onChange={e => update(d.key, { from: e.target.value })}
                    className="flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
                  />
                  <span className="text-neutral-400 text-xs">–</span>
                  <input
                    type="time"
                    value={h.to}
                    onChange={e => update(d.key, { to: e.target.value })}
                    className="flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
                  />
                </div>
              ) : (
                <span className="flex-1 text-xs italic text-neutral-400">Nghỉ</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateVendor(f: any): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!f.name?.trim()) errors.name = 'Tên quán không được để trống'
  if (f.phone && !/^\d{10}$/.test((f.phone ?? '').replace(/\s/g, ''))) {
    errors.phone = 'Số điện thoại phải đủ 10 chữ số'
  }
  return errors
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SellerVendorsPage() {
  const supabase = createClient()
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')
  const [form, setForm] = useState<any>({})
  const [vendorErrors, setVendorErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [sellerId, setSellerId] = useState<string | null>(null)
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const uploadSellerAvatar = () => {
    if (!sellerId) return
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      if (file.size > 5 * 1024 * 1024) { alert('Ảnh tối đa 5MB'); return }
      const path = `sellers/${sellerId}/avatar.jpg`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) { alert(uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const freshUrl = `${publicUrl}?t=${Date.now()}`
      const { error } = await supabase.from('sellers').update({ avatar_url: freshUrl }).eq('id', sellerId)
      if (!error) { setSellerAvatar(freshUrl); showToast('Đã cập nhật ảnh đại diện') }
      else alert(error.message)
    }
    input.click()
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: seller } = await supabase.from('sellers').select('id, avatar_url').eq('user_id', user.id).single()
      if (!seller) return
      setSellerId(seller.id)
      setSellerAvatar(seller.avatar_url ?? null)
      const { data: roles } = await supabase.from('seller_vendor_roles').select('vendor_id').eq('seller_id', seller.id)
      const ids = (roles ?? []).map((r: any) => r.vendor_id)
      if (!ids.length) { setLoading(false); return }
      const { data: vendorRows } = await supabase
        .from('vendors')
        .select('id,name,vendor_type,status,description,address,phone,zalo,has_delivery,delivery_note,cover_image_url,logo_url,opening_hours')
        .in('id', ids)
      const { data: reviews } = await supabase.from('reviews').select('vendor_id,rating').in('vendor_id', ids).eq('status', 'visible')
      const { data: orders } = await supabase.from('orders').select('vendor_id,total_price,status,created_at').in('vendor_id', ids)
      const today = new Date().toISOString().split('T')[0]
      const stats: Record<string, { todayOrders: number; revenue: number; rating: number }> = {}
      ids.forEach((id: string) => {
        const vendorOrders = (orders ?? []).filter((o: any) => o.vendor_id === id && o.created_at.startsWith(today) && o.status !== 'cancelled')
        const vendorReviews = (reviews ?? []).filter((r: any) => r.vendor_id === id)
        stats[id] = {
          todayOrders: vendorOrders.length,
          revenue: vendorOrders.reduce((s: number, o: any) => s + Number(o.total_price || 0), 0),
          rating: vendorReviews.length ? vendorReviews.reduce((s: number, r: any) => s + Number(r.rating || 0), 0) / vendorReviews.length : 0,
        }
      })
      const merged = (vendorRows ?? []).map((v: any) => ({ ...v, ...stats[v.id] }))
      setVendors(merged)
      if (merged[0]) { setSelectedId(merged[0].id); setForm(merged[0]) }
      setLoading(false)
    }
    load()
  }, [supabase])

  const selectedVendor = useMemo(() => vendors.find(v => v.id === selectedId) ?? vendors[0] ?? null, [vendors, selectedId])

  const saveVendor = async () => {
    if (!selectedVendor) return
    const errors = validateVendor(form)
    setVendorErrors(errors)
    if (Object.keys(errors).length) return
    setSaving(true)
    const { error } = await supabase.from('vendors').update({
      name: form.name.trim(),
      description: form.description || null,
      address: form.address || null,
      phone: form.phone || null,
      zalo: form.zalo || null,
      has_delivery: Boolean(form.has_delivery),
      delivery_note: form.delivery_note || null,
      opening_hours: form.opening_hours ?? {},
    }).eq('id', selectedVendor.id)
    setSaving(false)
    if (!error) {
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, ...form } : v))
      showToast('Cập nhật quán thành công')
    } else {
      alert(error.message)
    }
  }

  const uploadFile = async (kind: 'cover' | 'logo') => {
    if (!selectedVendor) return
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      const path = `vendor-images/vendors/${selectedVendor.id}/${kind}.jpg`
      const { error: uploadError } = await supabase.storage.from('vendor-images').upload(path, file, { upsert: true })
      if (uploadError) { alert(uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from('vendor-images').getPublicUrl(path)
      const updatePayload = kind === 'cover' ? { cover_image_url: publicUrl } : { logo_url: publicUrl }
      const { error } = await supabase.from('vendors').update(updatePayload).eq('id', selectedVendor.id)
      if (!error) {
        setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, ...updatePayload } : v))
        setForm((prev: any) => ({ ...prev, ...updatePayload }))
        showToast('Tải ảnh thành công')
      } else alert(error.message)
    }
    input.click()
  }

  const uploadGallery = async () => {
    if (!selectedVendor) return
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      const path = `vendor-images/vendors/${selectedVendor.id}/gallery/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('vendor-images').upload(path, file, { upsert: true })
      if (uploadError) { alert(uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from('vendor-images').getPublicUrl(path)
      const { error: insertError } = await supabase.from('vendor_media').insert({
        vendor_id: selectedVendor.id, image_url: publicUrl, storage_path: path,
        media_type: 'menu', status: 'visible',
        uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      })
      if (insertError) alert(insertError.message)
      else showToast('Đã thêm ảnh vào thư viện')
    }
    input.click()
  }

  if (loading) return <p className="text-sm text-neutral-500">Đang tải...</p>

  const hasErrors = Object.keys(vendorErrors).length > 0

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Quán / Gian hàng</h1>
        <p className="text-sm text-neutral-500">Quản lý thông tin, ảnh bìa, logo và thư viện ảnh.</p>
      </div>

      {/* Seller avatar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-primary/10 shrink-0 ring-2 ring-neutral-100">
            {sellerAvatar ? (
              <Image src={sellerAvatar} alt="Avatar người bán" fill className="object-cover" sizes="64px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">S</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-900 mb-0.5">Ảnh đại diện người bán</p>
            <p className="text-xs text-neutral-500 mb-2">Hiển thị trong Seller Dashboard</p>
            <Button size="sm" variant="outline" onClick={uploadSellerAvatar} className="gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Đổi ảnh đại diện
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        {/* Vendor list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách vendor đang quản lý</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vendors.map(v => (
              <button
                key={v.id}
                onClick={() => { setSelectedId(v.id); setForm(v); setVendorErrors({}) }}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedVendor?.id === v.id ? 'border-primary bg-primary/5' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}
              >
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

        {/* Edit panel */}
        {selectedVendor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chỉnh sửa thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span>Tên quán *</span>
                  <Input
                    value={form.name ?? ''}
                    onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))}
                    className={vendorErrors.name ? 'border-red-400' : ''}
                  />
                  {vendorErrors.name && <p className="text-red-500 text-xs mt-1">{vendorErrors.name}</p>}
                </label>
                <label className="space-y-1 text-sm">
                  <span>Loại</span>
                  <Input value={selectedVendor.vendor_type === 'student_booth' ? 'Gian hàng sinh viên' : 'Quán ăn cố định'} disabled />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span>Mô tả</span>
                  <textarea
                    value={form.description ?? ''}
                    onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                    className="min-h-[72px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Địa chỉ</span>
                  <Input value={form.address ?? ''} onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Điện thoại</span>
                  <Input
                    value={form.phone ?? ''}
                    onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))}
                    className={vendorErrors.phone ? 'border-red-400' : ''}
                  />
                  {vendorErrors.phone && <p className="text-red-500 text-xs mt-1">{vendorErrors.phone}</p>}
                </label>
                <label className="space-y-1 text-sm">
                  <span>Zalo</span>
                  <Input value={form.zalo ?? ''} onChange={e => setForm((p: any) => ({ ...p, zalo: e.target.value }))} />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Ghi chú giao/nhận</span>
                  <Input value={form.delivery_note ?? ''} onChange={e => setForm((p: any) => ({ ...p, delivery_note: e.target.value }))} />
                </label>
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input type="checkbox" checked={Boolean(form.has_delivery)} onChange={e => setForm((p: any) => ({ ...p, has_delivery: e.target.checked }))} />
                  Có ship
                </label>
              </div>

              {/* Opening hours UI — key forces remount when switching vendors */}
              <OpeningHoursEditor
                key={selectedId}
                value={form.opening_hours}
                onChange={v => setForm((p: any) => ({ ...p, opening_hours: v }))}
              />

              <div className="flex flex-wrap gap-3">
                <Button onClick={saveVendor} disabled={saving || hasErrors}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button variant="outline" onClick={() => uploadFile('cover')}>Tải ảnh bìa</Button>
                <Button variant="outline" onClick={() => uploadFile('logo')}>Tải logo</Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-500 mb-2">Ảnh bìa</p>
                  {selectedVendor.cover_image_url
                    ? <Image src={selectedVendor.cover_image_url} alt="Cover" width={320} height={180} className="h-28 w-full rounded-xl object-cover" />
                    : <div className="h-28 rounded-xl border border-dashed border-neutral-200 flex items-center justify-center text-xs text-neutral-500">Chưa có ảnh</div>}
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-500 mb-2">Logo</p>
                  {selectedVendor.logo_url
                    ? <Image src={selectedVendor.logo_url} alt="Logo" width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />
                    : <div className="h-20 w-20 rounded-xl border border-dashed border-neutral-200 flex items-center justify-center text-xs text-neutral-500">Logo</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Thư viện ảnh</p>
                    <p className="text-xs text-neutral-500">Xem, thêm và ẩn ảnh trong gallery.</p>
                  </div>
                  <Button variant="outline" onClick={uploadGallery} className="gap-2">
                    <Upload className="w-4 h-4" /> Thêm ảnh
                  </Button>
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
    supabase.from('vendor_media').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
      .then(({ data }) => setImages(data ?? []))
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
            {image.status !== 'hidden' && (
              <Button variant="ghost" size="sm" onClick={() => hideImage(image.id)} className="gap-1 text-red-600 hover:bg-red-50">
                <EyeOff className="w-3.5 h-3.5" /> Ẩn
              </Button>
            )}
          </div>
        </div>
      ))}
      {!images.length && <p className="text-sm text-neutral-500">Chưa có ảnh nào trong thư viện.</p>}
    </div>
  )
}
