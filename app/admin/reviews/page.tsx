'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { logAdminAction } from '@/lib/admin'
import { cn } from '@/lib/utils'
import { EyeOff, Trash2, X, AlertCircle } from 'lucide-react'

const REVIEW_STATUS_CFG: Record<string, { label: string; classes: string }> = {
  visible: { label: 'Hiển thị', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  hidden:  { label: 'Đã ẩn',    classes: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  pending: { label: 'Chờ',      classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  removed: { label: 'Đã xóa',   classes: 'bg-red-100 text-red-700 border-red-200' },
}

const TABS = [
  { value: 'reviews', label: 'Tất cả reviews' },
  { value: 'reports', label: 'Review bị report' },
] as const

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500 text-sm">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function AdminReviewsPage() {
  const supabase = createClient()
  const [adminId, setAdminId] = useState('')
  const [tab, setTab] = useState<'reviews' | 'reports'>('reviews')
  const [reviews, setReviews] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [noteModal, setNoteModal] = useState<{ reportId: string; reviewId: string } | null>(null)
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminId(user.id)
    }
    init()
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: reviewData }, { data: reportData }] = await Promise.all([
      supabase
        .from('reviews')
        .select('id, rating, content, status, review_type, is_anonymous, created_at, user_id, vendor_id, profiles(full_name, email), vendors(name)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('review_reports')
        .select('id, reason, description, status, created_at, review_id, reporter_id, reviewed_at, reviews(id, content, rating, status, vendor_id, vendors(name)), profiles!review_reports_reporter_id_fkey(full_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])
    setReviews(reviewData ?? [])
    setReports(reportData ?? [])
    setLoading(false)
  }

  const filteredReviews = reviews.filter(r => !statusFilter || r.status === statusFilter)

  const updateReviewStatus = async (id: string, status: string) => {
    const prev = reviews.find(r => r.id === id)?.status
    const { error } = await supabase.from('reviews').update({ status: status as any }).eq('id', id)
    if (!error) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      await logAdminAction(supabase, adminId, `review_${status}`, 'reviews', id, { previous_status: prev })
    } else alert(error.message)
  }

  const resolveReport = async (reportId: string, reviewId: string, action: 'hide' | 'remove' | 'dismiss') => {
    const now = new Date().toISOString()
    if (action === 'hide' || action === 'remove') {
      const status = action === 'hide' ? 'hidden' : 'removed'
      await supabase.from('reviews').update({ status: status as any }).eq('id', reviewId)
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r))
    }
    await supabase.from('review_reports').update({
      status: 'resolved',
      reviewed_at: now,
      reviewed_by: adminId,
    }).eq('id', reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
    await logAdminAction(supabase, adminId, `report_${action}`, 'review_reports', reportId, { review_id: reviewId, action })
  }

  const resolveReportWithNote = async () => {
    if (!noteModal) return
    const { reportId, reviewId } = noteModal
    await supabase.from('review_reports').update({
      status: 'resolved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      description: adminNote || null,
    }).eq('id', reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
    await logAdminAction(supabase, adminId, 'report_resolved_with_note', 'review_reports', reportId, { note: adminNote, review_id: reviewId })
    setNoteModal(null)
    setAdminNote('')
  }

  return (
    <div className="space-y-6">
      {/* Note modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNoteModal(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Ghi chú xử lý</h3>
              <button onClick={() => setNoteModal(null)}><X className="w-4 h-4 text-neutral-400" /></button>
            </div>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Ghi chú về quyết định xử lý report này..."
              className="w-full min-h-[100px] rounded-xl border border-neutral-200 px-3 py-2 text-sm resize-none"
            />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={resolveReportWithNote}>Xác nhận</Button>
              <Button variant="outline" onClick={() => setNoteModal(null)}>Hủy</Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Reviews</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Kiểm duyệt review và xử lý report.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === t.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            {t.label}
            {t.value === 'reports' && reports.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">{reports.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-neutral-500">Đang tải...</p> : (
        <>
          {/* Reviews tab */}
          {tab === 'reviews' && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Tất cả trạng thái</option>
                  {Object.entries(REVIEW_STATUS_CFG).map(([v, c]) => (
                    <option key={v} value={v}>{c.label}</option>
                  ))}
                </select>
                <span className="text-sm text-neutral-400 self-center">{filteredReviews.length} reviews</span>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-neutral-100">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide w-[300px]">Nội dung</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Rating</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Quán</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden xl:table-cell">Người viết</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Ngày</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filteredReviews.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-400">Không có review nào.</td></tr>
                    )}
                    {filteredReviews.map(review => {
                      const statusCfg = REVIEW_STATUS_CFG[review.status] ?? REVIEW_STATUS_CFG.visible
                      return (
                        <tr key={review.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-neutral-800 line-clamp-2 max-w-[280px] text-xs leading-relaxed">
                              {review.content || <span className="text-neutral-400 italic">Không có nội dung</span>}
                            </p>
                          </td>
                          <td className="px-4 py-3"><StarRow rating={review.rating} /></td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold', statusCfg.classes)}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell max-w-[120px] truncate">
                            {(review.vendors as any)?.name ?? '—'}
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            <p className="text-neutral-600 text-xs truncate max-w-[100px]">
                              {review.is_anonymous ? 'Ẩn danh' : ((review.profiles as any)?.full_name ?? '—')}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell whitespace-nowrap">
                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {review.status === 'visible' && (
                                <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-neutral-600"
                                  onClick={() => updateReviewStatus(review.id, 'hidden')}>
                                  <EyeOff className="w-3.5 h-3.5" /> Ẩn
                                </Button>
                              )}
                              {review.status === 'hidden' && (
                                <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-emerald-600 border-emerald-200"
                                  onClick={() => updateReviewStatus(review.id, 'visible')}>
                                  Hiện
                                </Button>
                              )}
                              {review.status !== 'removed' && (
                                <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => updateReviewStatus(review.id, 'removed')}>
                                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports tab */}
          {tab === 'reports' && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 py-12 text-center">
                  <p className="text-sm text-neutral-400">Không có report nào chờ xử lý.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-neutral-100">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide w-[220px]">Review bị report</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Lý do</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Người report</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Ngày</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {reports.map(report => (
                        <tr key={report.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-xs text-neutral-700 line-clamp-2 max-w-[200px]">
                              {(report.reviews as any)?.content || <span className="text-neutral-400 italic">Không có nội dung</span>}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              {(report.reviews as any)?.vendors?.name}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              {report.reason}
                            </span>
                            {report.description && (
                              <p className="text-xs text-neutral-400 mt-0.5 max-w-[200px] truncate">{report.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-neutral-600 text-xs hidden lg:table-cell">
                            {(report.profiles as any)?.full_name ?? (report.profiles as any)?.email ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell whitespace-nowrap">
                            {new Date(report.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-neutral-600"
                                onClick={() => resolveReport(report.id, report.review_id, 'hide')}>
                                <EyeOff className="w-3.5 h-3.5" /> Ẩn review
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => resolveReport(report.id, report.review_id, 'remove')}>
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2"
                                onClick={() => { setNoteModal({ reportId: report.id, reviewId: report.review_id }); setAdminNote('') }}>
                                Ghi chú + Đóng
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-neutral-400"
                                onClick={() => resolveReport(report.id, report.review_id, 'dismiss')}>
                                Bỏ qua
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
