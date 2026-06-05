import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Store, Star, Users, ShoppingBag, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard — HolaMate' }

function StatCard({ icon, label, value, href, color }: {
  icon: React.ReactNode; label: string; value: number | null; href: string; color: string
}) {
  return (
    <Link href={href} className={cn('flex items-center gap-4 rounded-2xl border p-5 hover:shadow-sm transition-shadow', color)}>
      <div className="p-2.5 rounded-xl bg-white/70">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-neutral-900">{value ?? '—'}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
      </div>
    </Link>
  )
}

function PendingSection({ title, href, count, children }: {
  title: string; href: string; count: number; children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <div className="rounded-2xl border border-neutral-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-800">{title}</span>
          <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
            {count}
          </span>
        </div>
        <Link href={href} className="flex items-center gap-1 text-xs text-primary hover:underline">
          Xem tất cả <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-neutral-50">{children}</div>
    </div>
  )
}

function PendingRow({ label, sub, time }: { label: string; sub: string; time: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50/50">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-800 truncate">{label}</p>
        <p className="text-xs text-neutral-400 truncate">{sub}</p>
      </div>
      <span className="text-[11px] text-neutral-400 shrink-0 ml-4">{time}</span>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalVendors },
    { count: totalReviews },
    { count: totalUsers },
    { count: todayOrders },
    { data: pendingVendors, count: pendingVendorCount },
    { data: pendingReviewReports, count: reviewReportCount },
    { data: pendingUserReports, count: userReportCount },
    { data: pendingMedia, count: pendingMediaCount },
    { data: pendingVerifications, count: verificationCount },
  ] = await Promise.all([
    supabase.from('vendors').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('vendors').select('id, name, vendor_type, created_at', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('review_reports').select('id, reason, review_id, created_at, reviews(content)', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('user_reports').select('id, reason, reported_user_id, created_at, profiles!user_reports_reported_user_id_fkey(full_name, email)', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('review_media').select('id, image_url, review_id, created_at', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('student_verifications').select('id, student_email, submitted_at, profiles!student_verifications_user_id_fkey(full_name, email)', { count: 'exact' })
      .eq('status', 'pending').order('submitted_at', { ascending: false }).limit(5),
  ])

  const fmt = (d: string) => new Date(d).toLocaleDateString('vi-VN')

  const totalPending = (pendingVendorCount ?? 0) + (reviewReportCount ?? 0) + (userReportCount ?? 0) +
    (pendingMediaCount ?? 0) + (verificationCount ?? 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          {totalPending > 0 && (
            <span className="ml-2 text-red-600 font-medium">· {totalPending} việc cần xử lý</span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Store className="w-5 h-5 text-blue-600" />}  label="Tổng vendors"    value={totalVendors}  href="/admin/vendors"  color="bg-blue-50 border-blue-100" />
        <StatCard icon={<Star className="w-5 h-5 text-amber-600" />}  label="Tổng reviews"   value={totalReviews}  href="/admin/reviews"  color="bg-amber-50 border-amber-100" />
        <StatCard icon={<Users className="w-5 h-5 text-violet-600" />} label="Tổng users"    value={totalUsers}    href="/admin/users"    color="bg-violet-50 border-violet-100" />
        <StatCard icon={<ShoppingBag className="w-5 h-5 text-emerald-600" />} label="Đơn hôm nay" value={todayOrders} href="/admin/orders" color="bg-emerald-50 border-emerald-100" />
      </div>

      {/* Pending items */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Cần xử lý
        </h2>

        <PendingSection title="Vendor chờ duyệt" href="/admin/vendors?status=pending" count={pendingVendorCount ?? 0}>
          {(pendingVendors ?? []).map((v: any) => (
            <PendingRow
              key={v.id}
              label={v.name}
              sub={v.vendor_type === 'student_booth' ? 'Gian hàng SV' : 'Quán ăn cố định'}
              time={fmt(v.created_at)}
            />
          ))}
        </PendingSection>

        <PendingSection title="Review bị report" href="/admin/reviews" count={reviewReportCount ?? 0}>
          {(pendingReviewReports ?? []).map((r: any) => (
            <PendingRow
              key={r.id}
              label={r.reason}
              sub={(r.reviews as any)?.content?.slice(0, 60) ?? '(no content)'}
              time={fmt(r.created_at)}
            />
          ))}
        </PendingSection>

        <PendingSection title="User bị report" href="/admin/users" count={userReportCount ?? 0}>
          {(pendingUserReports ?? []).map((r: any) => (
            <PendingRow
              key={r.id}
              label={(r.profiles as any)?.full_name ?? (r.profiles as any)?.email ?? 'Unknown user'}
              sub={r.reason}
              time={fmt(r.created_at)}
            />
          ))}
        </PendingSection>

        <PendingSection title="Ảnh review chờ duyệt" href="/admin/media" count={pendingMediaCount ?? 0}>
          {(pendingMedia ?? []).map((m: any) => (
            <PendingRow
              key={m.id}
              label={`Ảnh review`}
              sub={`review_id: ${m.review_id?.slice(0, 8)}…`}
              time={fmt(m.created_at)}
            />
          ))}
        </PendingSection>

        <PendingSection title="Xác thực sinh viên chờ duyệt" href="/admin/verifications" count={verificationCount ?? 0}>
          {(pendingVerifications ?? []).map((v: any) => (
            <PendingRow
              key={v.id}
              label={v.student_email}
              sub={(v.profiles as any)?.full_name ?? (v.profiles as any)?.email ?? ''}
              time={fmt(v.submitted_at)}
            />
          ))}
        </PendingSection>

        {totalPending === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-200 py-12 text-center">
            <p className="text-sm text-neutral-400">Không có việc gì cần xử lý. 🎉</p>
          </div>
        )}
      </div>
    </div>
  )
}
