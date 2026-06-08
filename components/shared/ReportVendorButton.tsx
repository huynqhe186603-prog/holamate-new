'use client'

import { useState } from 'react'
import { Flag, X, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const REASONS = [
  { value: 'wrong_hours',    emoji: '🕐', label: 'Giờ mở cửa không đúng' },
  { value: 'wrong_price',    emoji: '💰', label: 'Giá không đúng thực tế' },
  { value: 'wrong_info',     emoji: '📍', label: 'Địa chỉ/vị trí sai' },
  { value: 'wrong_image',    emoji: '🖼️', label: 'Ảnh không đúng thực tế' },
  { value: 'closed_down',    emoji: '🔒', label: 'Quán đã đóng cửa' },
  { value: 'inappropriate',  emoji: '⚠️', label: 'Nội dung không phù hợp' },
  { value: 'other',          emoji: '📝', label: 'Lý do khác' },
] as const

type ReasonValue = typeof REASONS[number]['value']

interface Props {
  vendorId: string
}

export function ReportVendorButton({ vendorId }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [open, setOpen]           = useState(false)
  const [reason, setReason]       = useState<ReasonValue | ''>('')
  const [description, setDesc]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const handleOpen = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setReason('')
    setDesc('')
    setError(null)
    setDone(false)
  }

  const handleSubmit = async () => {
    if (!reason) { setError('Vui lòng chọn lý do báo cáo'); return }
    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { error: dbErr } = await db.from('vendor_reports').insert({
      vendor_id: vendorId,
      reporter_id: user.id,
      reason,
      description: reason === 'other' ? description.trim() || null : description.trim() || null,
    })

    setSubmitting(false)

    if (dbErr) {
      if (dbErr.code === '23505') {
        setError('Bạn đã báo cáo quán này rồi.')
      } else {
        setError('Đã xảy ra lỗi. Thử lại sau nhé!')
      }
      return
    }
    setDone(true)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-500 transition-colors"
      >
        <Flag className="w-3 h-3" />
        Báo cáo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-5 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900">Báo cáo thông tin</h2>
              <button onClick={handleClose} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {done ? (
              <div className="py-6 flex flex-col items-center gap-3 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
                <p className="font-medium text-neutral-800">Đã gửi báo cáo!</p>
                <p className="text-sm text-neutral-500">
                  Cảm ơn bạn. Chúng mình sẽ kiểm tra và cập nhật sớm nhất có thể.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 px-4 py-2 rounded-xl bg-neutral-100 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-neutral-500 mb-3">Chọn lý do báo cáo:</p>

                <div className="space-y-1.5 mb-4">
                  {REASONS.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors ${
                        reason === r.value
                          ? 'border-red-300 bg-red-50'
                          : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => { setReason(r.value); setError(null) }}
                        className="sr-only"
                      />
                      <span className="text-base leading-none">{r.emoji}</span>
                      <span className="text-sm text-neutral-700">{r.label}</span>
                      {reason === r.value && (
                        <span className="ml-auto w-4 h-4 rounded-full bg-red-500 shrink-0" />
                      )}
                    </label>
                  ))}
                </div>

                {/* Description textarea — shown for all, required for 'other' */}
                {reason && (
                  <textarea
                    value={description}
                    onChange={e => setDesc(e.target.value)}
                    placeholder={reason === 'other' ? 'Mô tả chi tiết lý do...' : 'Thêm mô tả (tuỳ chọn)...'}
                    rows={3}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 mb-4"
                  />
                )}

                {error && (
                  <p className="text-xs text-red-500 mb-3">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !reason}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Gửi báo cáo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
