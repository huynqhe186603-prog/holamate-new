'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, X, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { REPORT_REASONS, type ReportReasonKey } from '@/lib/utils/reviews'

interface ReportButtonProps {
  reviewId: string
  currentUserId: string | null
}

export function ReportButton({ reviewId, currentUserId }: ReportButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReasonKey | ''>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleOpen = () => {
    if (!currentUserId) { router.push('/login'); return }
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!reason || !currentUserId) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('review_reports').insert({
      review_id: reviewId,
      reporter_id: currentUserId,
      reason,
      description: description.trim() || null,
    })
    setLoading(false)
    setDone(true)
  }

  const handleClose = () => {
    setOpen(false)
    setReason('')
    setDescription('')
    setDone(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors"
        title="Report review"
      >
        <Flag className="w-3 h-3" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {done ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-1">Đã gửi báo cáo</h3>
                <p className="text-sm text-neutral-500">Admin sẽ xem xét và xử lý trong thời gian sớm nhất.</p>
                <button
                  onClick={handleClose}
                  className="mt-5 w-full h-10 rounded-lg bg-neutral-100 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-neutral-900 mb-1">Báo cáo review</h3>
                <p className="text-sm text-neutral-500 mb-4">Chọn lý do báo cáo:</p>

                <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
                  {REPORT_REASONS.map(({ key, label }) => (
                    <label
                      key={key}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors',
                        reason === key
                          ? 'border-primary bg-primary/5'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        value={key}
                        checked={reason === key}
                        onChange={() => setReason(key as ReportReasonKey)}
                        className="accent-primary"
                      />
                      <span className="text-sm text-neutral-700">{label}</span>
                    </label>
                  ))}
                </div>

                {reason === 'other' && (
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Mô tả chi tiết lý do..."
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm resize-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 mb-4"
                  />
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 h-10 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason || loading}
                    className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
