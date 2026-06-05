import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AvatarUpload } from './_components/AvatarUpload'
import { ProfileForm } from './_components/ProfileForm'
import { GraduationCap, Mail, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Hồ sơ cá nhân' }

export default async function AccountPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, avatar_url, email, role, user_type, status')
    .eq('id', user.id)
    .single()

  // Latest student verification
  const { data: verification } = await supabase
    .from('student_verifications')
    .select('status, student_email, submitted_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const isStudentVerified = profile?.user_type === 'student_user'

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Hồ sơ cá nhân</h1>
        <p className="text-sm text-neutral-500 mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Avatar + info card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <AvatarUpload
            userId={user.id}
            avatarUrl={profile?.avatar_url ?? null}
            name={profile?.full_name ?? null}
          />

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Email — readonly */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-100">
              <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="text-sm text-neutral-700 truncate">{profile?.email ?? user.email}</span>
              <span className="ml-auto text-[10px] text-neutral-400 font-medium shrink-0">Không đổi được</span>
            </div>

            {/* Role badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {profile?.role === 'admin' && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
              {isStudentVerified ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <GraduationCap className="w-3 h-3" />
                  Sinh viên đã xác thực
                </span>
              ) : (
                <a href="/account/verify-student" className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium border border-neutral-200 hover:border-primary/40 hover:text-primary transition-colors">
                  <GraduationCap className="w-3 h-3" />
                  Xác thực sinh viên →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-5">Thông tin cá nhân</h2>
        <ProfileForm
          userId={user.id}
          initialData={{ full_name: profile?.full_name ?? null, phone: profile?.phone ?? null }}
        />
      </div>

      {/* Verification status teaser */}
      {!isStudentVerified && verification && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              {verification.status === 'pending' ? 'Đang chờ xác thực sinh viên' : 'Xác thực bị từ chối'}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {verification.student_email}
            </p>
          </div>
          <a href="/account/verify-student" className="text-xs font-medium text-amber-700 hover:underline underline-offset-2 shrink-0">
            Xem chi tiết →
          </a>
        </div>
      )}
    </div>
  )
}
