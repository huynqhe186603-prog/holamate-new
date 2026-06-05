import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GraduationCap, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { StudentVerifyForm } from '../_components/StudentVerifyForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Xác thực sinh viên' }

const STATUS_UI = {
  pending: {
    icon: Clock,
    color: 'amber',
    title: 'Đang chờ duyệt',
    desc: 'Yêu cầu của bạn đang được admin xem xét. Thường mất 1-2 ngày làm việc.',
  },
  approved: {
    icon: CheckCircle2,
    color: 'emerald',
    title: 'Đã xác thực sinh viên',
    desc: 'Tài khoản của bạn đã được xác thực. Cảm ơn bạn đã đóng góp cho cộng đồng HolaMate!',
  },
  rejected: {
    icon: XCircle,
    color: 'red',
    title: 'Yêu cầu bị từ chối',
    desc: 'Email sinh viên không hợp lệ hoặc không thể xác minh. Bạn có thể gửi lại với email khác.',
  },
} as const

export default async function VerifyStudentPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/verify-student')

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  const isVerified = profile?.user_type === 'student_user'

  const { data: verifications } = await supabase
    .from('student_verifications')
    .select('id, status, student_email, submitted_at, rejection_reason')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const latest = verifications?.[0]
  const canSubmit = !latest || latest.status === 'rejected'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Xác thực sinh viên</h1>
        <p className="text-sm text-neutral-500 mt-1">Tăng độ tin cậy cho review và gian hàng của bạn</p>
      </div>

      {/* Benefits */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-800">Lợi ích khi xác thực</h2>
        <ul className="space-y-2">
          {[
            'Review của bạn có badge "Sinh viên đã xác thực"',
            'Gian hàng sinh viên của bạn được ưu tiên hiển thị',
            'Tăng độ tin cậy trong cộng đồng Hòa Lạc',
            'Hạn chế spam và tài khoản ảo',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-neutral-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Current status */}
      {latest && (() => {
        const cfg = STATUS_UI[latest.status as keyof typeof STATUS_UI]
        if (!cfg) return null
        const Icon = cfg.icon
        const colors = {
          amber: 'bg-amber-50 border-amber-200 text-amber-800',
          emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          red: 'bg-red-50 border-red-200 text-red-800',
        } as const
        return (
          <div className={`rounded-2xl border p-5 ${colors[cfg.color as keyof typeof colors]}`}>
            <div className="flex items-start gap-3">
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{cfg.title}</p>
                <p className="text-sm mt-0.5 opacity-80">{cfg.desc}</p>
                <p className="text-xs mt-2 opacity-60">Email: {latest.student_email}</p>
                {latest.rejection_reason && (
                  <p className="text-xs mt-1 opacity-80">Lý do: {latest.rejection_reason}</p>
                )}
                {latest.status === 'rejected' && (
                  <div className="flex items-center gap-1.5 mt-3 text-sm font-medium opacity-90">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Gửi lại bên dưới
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Form */}
      {!isVerified && canSubmit && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-neutral-900">
              {latest?.status === 'rejected' ? 'Gửi lại yêu cầu' : 'Gửi yêu cầu xác thực'}
            </h2>
          </div>
          <StudentVerifyForm userId={user.id} />
        </div>
      )}

      {/* History */}
      {(verifications?.length ?? 0) > 1 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-800 mb-3">Lịch sử yêu cầu</h2>
          <div className="space-y-2">
            {verifications!.slice(1).map(v => (
              <div key={v.id} className="flex items-center justify-between text-sm py-1.5 border-b border-neutral-50 last:border-0">
                <span className="text-neutral-600 truncate mr-2">{v.student_email}</span>
                <span className={`text-xs font-medium shrink-0 ${
                  v.status === 'approved' ? 'text-emerald-600' :
                  v.status === 'rejected' ? 'text-red-500' : 'text-amber-600'
                }`}>
                  {v.status === 'approved' ? 'Đã duyệt' : v.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
