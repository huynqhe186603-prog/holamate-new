'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Loader2, Store, AlertCircle } from 'lucide-react'

export default function BecomeSellerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingSeller, setExistingSeller] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    phone: '',
    seller_type: 'student_seller',
    bio: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: seller } = await supabase
        .from('sellers')
        .select('id, status, display_name, seller_type')
        .eq('user_id', user.id)
        .single()

      if (seller) setExistingSeller(seller)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single()

      if (profile) {
        setForm(f => ({
          ...f,
          display_name: profile.full_name ?? '',
          phone: (profile as any).phone ?? '',
        }))
      }

      setLoading(false)
    }
    init()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.display_name.trim() || !form.phone.trim()) {
      setError('Vui lòng nhập đầy đủ tên hiển thị và số điện thoại.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('sellers').insert({
      user_id: user.id,
      display_name: form.display_name.trim(),
      phone: form.phone.trim(),
      seller_type: form.seller_type as 'fixed_shop_owner' | 'student_seller' | 'both',
      bio: form.bio.trim() || null,
      status: 'pending',
    })

    if (insertError) {
      setError(insertError.message.includes('duplicate') || insertError.message.includes('unique')
        ? 'Bạn đã đăng ký người bán rồi.'
        : 'Đăng ký thất bại. Vui lòng thử lại.')
    } else {
      setSuccess(true)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Đăng ký thành công!</h2>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            Hồ sơ người bán của bạn đang chờ Admin duyệt.
            Thường mất 1–2 ngày làm việc. Bạn sẽ nhận được thông báo khi được duyệt.
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push('/')}>
            Về trang chủ
          </Button>
        </div>
      </div>
    )
  }

  if (existingSeller) {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Đang chờ duyệt', color: 'text-amber-600 bg-amber-50 border-amber-200' },
      active: { label: 'Đã được duyệt', color: 'text-green-600 bg-green-50 border-green-200' },
      rejected: { label: 'Bị từ chối', color: 'text-red-600 bg-red-50 border-red-200' },
      suspended: { label: 'Đã bị tạm khóa', color: 'text-neutral-600 bg-neutral-50 border-neutral-200' },
    }
    const s = statusMap[existingSeller.status] ?? statusMap.pending

    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Store className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900">Hồ sơ người bán</h2>
          <p className="mt-1 text-sm text-neutral-500">{existingSeller.display_name}</p>
          <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${s.color}`}>
            {s.label}
          </div>
          {existingSeller.status === 'active' && (
            <Button className="mt-6 w-full" onClick={() => router.push('/seller/dashboard')}>
              Vào Seller Dashboard
            </Button>
          )}
          <Button variant="outline" className="mt-3 w-full" onClick={() => router.push('/')}>
            Về trang chủ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">Đăng ký người bán</h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Bán hàng trên HolaMate — miễn phí, không cần phí nền tảng
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700 mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Tên hiển thị / Tên quán</Label>
              <Input
                placeholder="VD: Cơm Tấm Hương, Trà Sữa Linh..."
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Số điện thoại</Label>
              <Input
                type="text"
                placeholder="0912 345 678"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Loại người bán</Label>
              <select
                value={form.seller_type}
                onChange={e => setForm(f => ({ ...f, seller_type: e.target.value }))}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="student_seller">Sinh viên tự bán (gian hàng)</option>
                <option value="fixed_shop_owner">Chủ quán ăn cố định</option>
                <option value="both">Cả hai</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700">Giới thiệu ngắn (tùy chọn)</Label>
              <textarea
                placeholder="Mô tả về quán/sản phẩm bạn muốn bán..."
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="min-h-[80px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 leading-relaxed">
              Sau khi gửi, Admin HolaMate sẽ xem xét và duyệt hồ sơ trong 1–2 ngày làm việc.
            </div>

            <Button type="submit" className="w-full h-11 font-medium" disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang gửi…</> : 'Gửi đăng ký'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
