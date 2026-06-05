'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logAdminAction } from '@/lib/admin'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

const STATUS_CFG: Record<string, { label: string; classes: string }> = {
  pending:  { label: 'Chờ duyệt', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  approved: { label: 'Đã duyệt',  classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Từ chối',   classes: 'bg-red-100 text-red-700 border-red-200' },
}

const FILTERS = [
  { value: 'pending',  label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt'  },
  { value: 'rejected', label: 'Từ chối'   },
]

export default function AdminVerificationsPage() {
  const supabase = createClient()
  const [adminId, setAdminId] = useState('')
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminId(user.id)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('student_verifications')
      .select('id, student_email, status, submitted_at, reviewed_at, rejection_reason, user_id, profiles!student_verifications_user_id_fkey(full_name, email, user_type)')
      .eq('status', filter as any)
      .order('submitted_at', { ascending: false })
    setVerifications(data ?? [])
    setLoading(false)
  }

  const approve = async (id: string, userId: string) => {
    const now = new Date().toISOString()
    const { error: e1 } = await supabase.from('student_verifications').update({
      status: 'approved',
      reviewed_at: now,
      reviewed_by: adminId,
    }).eq('id', id)
    const { error: e2 } = await supabase.from('profiles').update({ user_type: 'student_user' }).eq('id', userId)
    if (!e1 && !e2) {
      setVerifications(prev => prev.filter(v => v.id !== id))
      await logAdminAction(supabase, adminId, 'verification_approved', 'student_verifications', id, { user_id: userId })
    } else alert(e1?.message ?? e2?.message)
  }

  const reject = async (id: string, userId: string) => {
    const now = new Date().toISOString()
    const { error } = await supabase.from('student_verifications').update({
      status: 'rejected',
      reviewed_at: now,
      reviewed_by: adminId,
      rejection_reason: rejectReason || null,
    }).eq('id', id)
    if (!error) {
      setVerifications(prev => prev.filter(v => v.id !== id))
      await logAdminAction(supabase, adminId, 'verification_rejected', 'student_verifications', id, { user_id: userId, reason: rejectReason })
      setRejectModal(null)
      setRejectReason('')
    } else alert(error.message)
  }

  const pendingItem = rejectModal ? verifications.find(v => v.id === rejectModal) : null

  return (
    <div className="space-y-6">
      {/* Reject modal */}
      {rejectModal && pendingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRejectModal(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Từ chối xác thực</h3>
              <button onClick={() => setRejectModal(null)}><X className="w-4 h-4 text-neutral-400" /></button>
            </div>
            <p className="text-sm text-neutral-600">Email SV: <strong>{pendingItem.student_email}</strong></p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600">Lý do từ chối (tùy chọn)</label>
              <Input
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Email không đúng định dạng trường..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => reject(pendingItem.id, pendingItem.user_id)}
              >
                Xác nhận từ chối
              </Button>
              <Button variant="outline" onClick={() => setRejectModal(null)}>Hủy</Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Xác thực sinh viên</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Duyệt và từ chối yêu cầu xác thực tài khoản sinh viên.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-100">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email sinh viên</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Người dùng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Gửi lúc</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {verifications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                    Không có yêu cầu xác thực nào.
                  </td>
                </tr>
              )}
              {verifications.map(v => {
                const profile = v.profiles as any
                const statusCfg = STATUS_CFG[v.status] ?? STATUS_CFG.pending
                return (
                  <tr key={v.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-800">{v.student_email}</p>
                      {v.rejection_reason && (
                        <p className="text-xs text-red-500 mt-0.5">{v.rejection_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-neutral-700">{profile?.full_name ?? '—'}</p>
                      <p className="text-xs text-neutral-400">{profile?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold', statusCfg.classes)}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell whitespace-nowrap">
                      {new Date(v.submitted_at).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {v.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-3 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => approve(v.id, v.user_id)}
                          >
                            <Check className="w-3.5 h-3.5" /> Duyệt
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-3 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => { setRejectModal(v.id); setRejectReason('') }}
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-neutral-400">{verifications.length} yêu cầu</p>
    </div>
  )
}
