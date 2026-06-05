'use client'

import { Fragment, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logAdminAction } from '@/lib/admin'
import { cn } from '@/lib/utils'
import { Check, X, EyeOff, Search, ChevronDown, ChevronUp } from 'lucide-react'

const STATUS_CFG: Record<string, { label: string; classes: string }> = {
  pending:   { label: 'Chờ duyệt', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  active:    { label: 'Hoạt động', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  hidden:    { label: 'Đã ẩn',     classes: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  rejected:  { label: 'Từ chối',   classes: 'bg-red-100 text-red-700 border-red-200' },
  duplicate: { label: 'Trùng lặp', classes: 'bg-orange-100 text-orange-700 border-orange-200' },
}

const STATUS_FILTERS = [
  { value: '',          label: 'Tất cả'    },
  { value: 'pending',   label: 'Chờ duyệt' },
  { value: 'active',    label: 'Hoạt động' },
  { value: 'hidden',    label: 'Đã ẩn'     },
  { value: 'rejected',  label: 'Từ chối'   },
]

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold', cfg.classes)}>
      {cfg.label}
    </span>
  )
}

export default function AdminVendorsPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adminId, setAdminId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '')
  const [typeFilter, setTypeFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminId(user.id)
      load()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vendors')
      .select('id, name, vendor_type, status, source, phone, address, description, cover_image_url, logo_url, food_categories, has_delivery, created_at, updated_at')
      .order('created_at', { ascending: false })
    setVendors(data ?? [])
    setLoading(false)
  }

  const filtered = vendors.filter(v => {
    if (statusFilter && v.status !== statusFilter) return false
    if (typeFilter && v.vendor_type !== typeFilter) return false
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const updateStatus = async (id: string, status: string) => {
    const prev = vendors.find(v => v.id === id)?.status
    const { error } = await supabase.from('vendors').update({ status: status as any }).eq('id', id)
    if (!error) {
      setVendors(prev => prev.map(v => v.id === id ? { ...v, status } : v))
      await logAdminAction(supabase, adminId, `vendor_${status}`, 'vendors', id, { previous_status: prev, new_status: status })
    } else {
      alert(error.message)
    }
  }

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('vendors').update({
      name: editForm.name,
      description: editForm.description ?? null,
      address: editForm.address ?? null,
      phone: editForm.phone ?? null,
      has_delivery: Boolean(editForm.has_delivery),
    }).eq('id', id)
    if (!error) {
      setVendors(prev => prev.map(v => v.id === id ? { ...v, ...editForm } : v))
      await logAdminAction(supabase, adminId, 'vendor_edited', 'vendors', id)
      setEditingId(null)
    } else {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Vendors</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Duyệt, ẩn và quản lý tất cả quán ăn &amp; gian hàng.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Tìm tên vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
        >
          {STATUS_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Tất cả loại</option>
          <option value="fixed_shop">Quán ăn cố định</option>
          <option value="student_booth">Gian hàng SV</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-neutral-500">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-100">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide w-[260px]">Tên</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Loại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden xl:table-cell">Nguồn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Ngày tạo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">
                    Không tìm thấy vendor nào.
                  </td>
                </tr>
              )}
              {filtered.map(vendor => (
                <Fragment key={vendor.id}>
                  <tr
                    className="hover:bg-neutral-50/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === vendor.id ? null : vendor.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 truncate max-w-[220px]">{vendor.name}</p>
                          {vendor.address && (
                            <p className="text-xs text-neutral-400 truncate max-w-[220px]">{vendor.address}</p>
                          )}
                        </div>
                        {expandedId === vendor.id
                          ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {vendor.vendor_type === 'student_booth' ? 'Gian hàng SV' : 'Quán ăn'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={vendor.status} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500 hidden xl:table-cell">{vendor.source}</td>
                    <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">
                      {new Date(vendor.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {vendor.status !== 'active' && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => updateStatus(vendor.id, 'active')}
                          >
                            <Check className="w-3.5 h-3.5" /> Duyệt
                          </Button>
                        )}
                        {vendor.status !== 'hidden' && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 gap-1 text-neutral-600"
                            onClick={() => updateStatus(vendor.id, 'hidden')}
                          >
                            <EyeOff className="w-3.5 h-3.5" /> Ẩn
                          </Button>
                        )}
                        {vendor.status !== 'rejected' && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => updateStatus(vendor.id, 'rejected')}
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </Button>
                        )}
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            setEditingId(vendor.id)
                            setEditForm({ name: vendor.name, description: vendor.description, address: vendor.address, phone: vendor.phone, has_delivery: vendor.has_delivery })
                          }}
                        >
                          Sửa
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expandedId === vendor.id && (
                    <tr className="bg-neutral-50/80">
                      <td colSpan={6} className="px-4 py-4">
                        {editingId === vendor.id ? (
                          <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
                            <label className="block space-y-1 text-xs">
                              <span className="font-medium text-neutral-600">Tên</span>
                              <Input value={editForm.name ?? ''} onChange={e => setEditForm((p:any) => ({ ...p, name: e.target.value }))} />
                            </label>
                            <label className="block space-y-1 text-xs">
                              <span className="font-medium text-neutral-600">SĐT</span>
                              <Input value={editForm.phone ?? ''} onChange={e => setEditForm((p:any) => ({ ...p, phone: e.target.value }))} />
                            </label>
                            <label className="block space-y-1 text-xs sm:col-span-2">
                              <span className="font-medium text-neutral-600">Địa chỉ</span>
                              <Input value={editForm.address ?? ''} onChange={e => setEditForm((p:any) => ({ ...p, address: e.target.value }))} />
                            </label>
                            <label className="block space-y-1 text-xs sm:col-span-2">
                              <span className="font-medium text-neutral-600">Mô tả</span>
                              <textarea
                                value={editForm.description ?? ''}
                                onChange={e => setEditForm((p:any) => ({ ...p, description: e.target.value }))}
                                className="min-h-[60px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm resize-none"
                              />
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" checked={Boolean(editForm.has_delivery)} onChange={e => setEditForm((p:any) => ({ ...p, has_delivery: e.target.checked }))} />
                              Có giao hàng
                            </label>
                            <div className="sm:col-span-2 flex gap-2">
                              <Button size="sm" onClick={() => saveEdit(vendor.id)}>Lưu</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Hủy</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-3 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-neutral-500 mb-1">Thông tin</p>
                              <p className="text-neutral-700">{vendor.phone || 'Chưa có SĐT'}</p>
                              <p className="text-neutral-600 text-xs mt-0.5">{vendor.address || 'Chưa có địa chỉ'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-neutral-500 mb-1">Mô tả</p>
                              <p className="text-neutral-600 text-xs line-clamp-3">{vendor.description || 'Chưa có mô tả'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-neutral-500 mb-1">ID</p>
                              <p className="text-neutral-400 text-xs font-mono">{vendor.id}</p>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-neutral-400">{filtered.length} vendors</p>
    </div>
  )
}
