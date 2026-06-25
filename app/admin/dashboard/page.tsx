import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  Store, Star, Users, ShoppingBag, AlertTriangle, ChevronRight,
  UserPlus, LogIn, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard — HolaMate' }

const adminClient = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Utilities ───────────────────────────────────────────────────────────────
function utcPlus7(d: Date) { return new Date(d.getTime() + 7 * 3_600_000) }

function dayKey(iso: string) {
  const d = utcPlus7(new Date(iso))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function hourOf(iso: string) { return utcPlus7(new Date(iso)).getUTCHours() }

function fmt(d: string) { return new Date(d).toLocaleDateString('vi-VN') }

function fmtTime(iso: string) {
  const d = utcPlus7(new Date(iso))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function StatLink({ href, icon, label, value, color }: {
  href: string; icon: React.ReactNode; label: string; value: number | null; color: string
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

function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: number; sub: string; color: string; icon: React.ReactNode
}) {
  return (
    <div className={cn('rounded-2xl border p-5 flex items-start gap-4', color)}>
      <div className="p-2.5 rounded-xl bg-white/70 shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-neutral-900 tabular-nums">{value.toLocaleString('vi-VN')}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5">
      <p className="text-sm font-bold text-neutral-800 mb-4">{title}</p>
      {children}
    </div>
  )
}

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-28">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
          {d.value > 0 && <span className="text-[9px] text-neutral-500 tabular-nums">{d.value}</span>}
          <div
            className="w-full bg-primary/70 rounded-t hover:bg-primary transition-colors"
            style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%`, minHeight: d.value > 0 ? '4px' : '0' }}
          />
          <span className="text-[9px] text-neutral-400 truncate w-full text-center leading-none mt-0.5">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Xem trang', view_vendor: 'Xem quán', search: 'Tìm kiếm',
  add_to_cart: 'Thêm giỏ', checkout: 'Đặt món', write_review: 'Viết review',
  use_ai: 'Dùng AI', filter: 'Lọc', sign_in: 'Đăng nhập', sign_up: 'Đăng ký',
}
const CHART_COLORS = ['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500', 'bg-orange-400']

function EventBreakdown({ data }: { data: { event_type: string; count: number }[] }) {
  if (!data.length) return <p className="text-sm text-neutral-400 py-4 text-center">Chưa có dữ liệu.</p>
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.event_type} className="flex items-center gap-3">
          <span className="text-xs text-neutral-600 w-24 shrink-0 truncate">
            {EVENT_LABELS[d.event_type] ?? d.event_type}
          </span>
          <div className="flex-1 bg-neutral-100 rounded-full h-2">
            <div className={`h-2 rounded-full ${CHART_COLORS[i % CHART_COLORS.length]}`}
              style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <span className="text-xs font-semibold text-neutral-700 w-8 text-right tabular-nums">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

function Heatmap({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const m = new Map(data.map(d => [d.hour, d.count]))
  const cls = (c: number) => {
    if (c === 0) return 'bg-neutral-100'
    const r = c / max
    if (r < 0.2) return 'bg-primary/15'
    if (r < 0.4) return 'bg-primary/30'
    if (r < 0.6) return 'bg-primary/50'
    if (r < 0.8) return 'bg-primary/70'
    return 'bg-primary'
  }
  return (
    <div>
      <div className="grid grid-cols-12 gap-1 mb-2">
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} title={`${h}:00 — ${m.get(h) ?? 0} sự kiện`}
            className={`h-8 rounded flex items-end justify-center pb-0.5 ${cls(m.get(h) ?? 0)} cursor-default`}>
            <span className="text-[8px] font-medium text-neutral-500 select-none">{h}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-1">
        <span className="text-[10px] text-neutral-400">Ít</span>
        {['bg-neutral-100', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-neutral-400">Nhiều</span>
      </div>
    </div>
  )
}

const EVENT_BADGE: Record<string, { label: string; cls: string }> = {
  sign_up:  { label: 'Đăng ký',   cls: 'bg-emerald-100 text-emerald-700' },
  sign_in:  { label: 'Đăng nhập', cls: 'bg-blue-100 text-blue-700' },
  sign_out: { label: 'Đăng xuất', cls: 'bg-neutral-100 text-neutral-600' },
}

interface LoginRow { id: string; user_id: string | null; event_type: string; provider: string | null; created_at: string; displayName: string }

function LoginTable({ rows }: { rows: LoginRow[] }) {
  if (!rows.length) return <p className="text-sm text-neutral-400 py-4 text-center">Chưa có dữ liệu.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500">Người dùng</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500">Sự kiện</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500">Provider</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500">Thời gian (UTC+7)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const badge = EVENT_BADGE[row.event_type] ?? { label: row.event_type, cls: 'bg-neutral-100 text-neutral-600' }
            return (
              <tr key={row.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                <td className="py-2.5 px-3 text-neutral-700 text-[12px] max-w-[180px] truncate">{row.displayName}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                </td>
                <td className="py-2.5 px-3 text-neutral-500 capitalize text-[12px]">{row.provider ?? '—'}</td>
                <td className="py-2.5 px-3 text-neutral-500 text-[11px] tabular-nums">{fmtTime(row.created_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
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
          <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">{count}</span>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AdminDashboardPage() {
  const now = Date.now()
  const todayStr = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(now - 30 * 24 * 3_600_000).toISOString()
  const fourteenDaysAgo = new Date(now - 14 * 24 * 3_600_000).toISOString()
  const sevenDaysAgo = new Date(now - 7 * 24 * 3_600_000).toISOString()

  const supabase = createClient()

  const [
    { count: totalVendors },
    { count: totalReviews },
    { count: totalUsers },
    { count: todayOrders },
    { data: pendingVendors,       count: pendingVendorCount },
    { data: pendingReviewReports, count: reviewReportCount },
    { data: pendingUserReports,   count: userReportCount },
    { data: pendingMedia,         count: pendingMediaCount },
    { data: pendingVerifications, count: verificationCount },
    loginHistory30dRes,
    recentLoginsRes,
    activityLogs30dRes,
    signups14dRes,
    activityLogs7dRes,
    searchLogs30dRes,
    { count: orders30d },
  ] = await Promise.all([
    supabase.from('vendors').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabase.from('vendors')
      .select('id, name, vendor_type, created_at', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('review_reports')
      .select('id, reason, review_id, created_at, reviews(content)', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('user_reports')
      .select('id, reason, reported_user_id, created_at, profiles!user_reports_reported_user_id_fkey(full_name, email)', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('review_media')
      .select('id, image_url, review_id, created_at', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('student_verifications')
      .select('id, student_email, submitted_at, profiles!student_verifications_user_id_fkey(full_name, email)', { count: 'exact' })
      .eq('status', 'pending').order('submitted_at', { ascending: false }).limit(5),
    adminClient.from('user_login_history').select('event_type, created_at').gte('created_at', thirtyDaysAgo),
    adminClient.from('user_login_history')
      .select('id, user_id, event_type, provider, created_at')
      .order('created_at', { ascending: false }).limit(20),
    adminClient.from('user_activity_logs').select('event_type, created_at').gte('created_at', thirtyDaysAgo),
    adminClient.from('user_login_history').select('created_at').eq('event_type', 'sign_up').gte('created_at', fourteenDaysAgo),
    adminClient.from('user_activity_logs').select('created_at').gte('created_at', sevenDaysAgo),
    adminClient.from('user_activity_logs').select('event_data').eq('event_type', 'search').gte('created_at', thirtyDaysAgo),
    adminClient.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
  ])

  // Fetch profiles for login table (separate query after parallel batch)
  const rawLogins = recentLoginsRes.data ?? []
  const userIds = Array.from(new Set(rawLogins.map(r => r.user_id).filter(Boolean))) as string[]
  const { data: profilesData } = userIds.length > 0
    ? await adminClient.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] }
  const profileMap = new Map((profilesData ?? []).map(p => [p.id, p]))

  const recentLogins: LoginRow[] = rawLogins.map(r => ({
    id: r.id,
    user_id: r.user_id,
    event_type: r.event_type,
    provider: r.provider,
    created_at: r.created_at,
    displayName: (() => {
      if (!r.user_id) return '—'
      const p = profileMap.get(r.user_id)
      return p?.full_name ?? p?.email ?? `${r.user_id.slice(0, 8)}…`
    })(),
  }))

  // ── Pending total ──
  const totalPending = (pendingVendorCount ?? 0) + (reviewReportCount ?? 0) + (userReportCount ?? 0) +
    (pendingMediaCount ?? 0) + (verificationCount ?? 0)

  // ── Analytics data processing ──
  const loginHistory30d = loginHistory30dRes.data ?? []
  const newUsers30d = loginHistory30d.filter(r => r.event_type === 'sign_up').length
  const signIns30d  = loginHistory30d.filter(r => r.event_type === 'sign_in').length
  const activity30d = (activityLogs30dRes.data ?? []).length

  // Daily signups bar chart (14 days)
  const dailyMap: Record<string, number> = {}
  ;(signups14dRes.data ?? []).forEach(r => {
    const k = dayKey(r.created_at)
    dailyMap[k] = (dailyMap[k] ?? 0) + 1
  })
  const dailyChartData = Array.from({ length: 14 }, (_, i) => {
    const d = utcPlus7(new Date(now - (13 - i) * 24 * 3_600_000))
    const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    return { label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`, value: dailyMap[k] ?? 0 }
  })

  // Event breakdown
  const eventCounts: Record<string, number> = {}
  ;(activityLogs30dRes.data ?? []).forEach(r => {
    eventCounts[r.event_type] = (eventCounts[r.event_type] ?? 0) + 1
  })
  const eventBreakdown = Object.entries(eventCounts)
    .map(([event_type, count]) => ({ event_type, count }))
    .sort((a, b) => b.count - a.count)

  // Hourly heatmap
  const hourCounts: Record<number, number> = {}
  ;(activityLogs7dRes.data ?? []).forEach(r => {
    const h = hourOf(r.created_at)
    hourCounts[h] = (hourCounts[h] ?? 0) + 1
  })
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourCounts[h] ?? 0 }))

  // Top keywords
  const kwCounts: Record<string, number> = {}
  ;(searchLogs30dRes.data ?? []).forEach(r => {
    const q = (r.event_data as any)?.query
    if (typeof q === 'string' && q.trim()) {
      const k = q.trim().toLowerCase()
      kwCounts[k] = (kwCounts[k] ?? 0) + 1
    }
  })
  const topKeywords = Object.entries(kwCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          {totalPending > 0 && (
            <span className="ml-2 text-red-600 font-medium">· {totalPending} việc cần xử lý</span>
          )}
        </p>
      </div>

      {/* Overview stat links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatLink href="/admin/vendors" label="Tổng vendors" value={totalVendors}
          color="bg-blue-50 border-blue-100" icon={<Store className="w-5 h-5 text-blue-600" />} />
        <StatLink href="/admin/reviews" label="Tổng reviews" value={totalReviews}
          color="bg-amber-50 border-amber-100" icon={<Star className="w-5 h-5 text-amber-600" />} />
        <StatLink href="/admin/users" label="Tổng users" value={totalUsers}
          color="bg-violet-50 border-violet-100" icon={<Users className="w-5 h-5 text-violet-600" />} />
        <StatLink href="/admin/orders" label="Đơn hôm nay" value={todayOrders}
          color="bg-emerald-50 border-emerald-100" icon={<ShoppingBag className="w-5 h-5 text-emerald-600" />} />
      </div>

      {/* ── Analytics section ── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-neutral-900">Analytics & Tracking</h2>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Người dùng mới" value={newUsers30d} sub="sign_up · 30 ngày"
            color="bg-emerald-50 border-emerald-100" icon={<UserPlus className="w-5 h-5 text-emerald-600" />} />
          <KpiCard label="Người dùng quay lại" value={signIns30d} sub="sign_in · 30 ngày"
            color="bg-blue-50 border-blue-100" icon={<LogIn className="w-5 h-5 text-blue-600" />} />
          <KpiCard label="Phiên sử dụng" value={activity30d} sub="activities · 30 ngày"
            color="bg-orange-50 border-orange-100" icon={<Activity className="w-5 h-5 text-orange-500" />} />
          <KpiCard label="Tổng đơn hàng" value={orders30d ?? 0} sub="30 ngày"
            color="bg-violet-50 border-violet-100" icon={<ShoppingBag className="w-5 h-5 text-violet-500" />} />
        </div>

        {/* Bar chart + event breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Đăng ký mới theo ngày (14 ngày)">
            <MiniBarChart data={dailyChartData} />
          </SectionCard>
          <SectionCard title="Phân bổ hành vi (30 ngày)">
            <EventBreakdown data={eventBreakdown} />
          </SectionCard>
        </div>

        {/* Heatmap + keywords */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SectionCard title="Giờ cao điểm UTC+7 (7 ngày)">
              <Heatmap data={hourlyData} />
            </SectionCard>
          </div>
          <SectionCard title="Top từ khóa tìm kiếm (30 ngày)">
            {topKeywords.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">Chưa có tìm kiếm nào.</p>
            ) : (
              <ol className="space-y-2">
                {topKeywords.map((kw, i) => (
                  <li key={kw.query} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-300 w-5 text-right shrink-0">{i + 1}</span>
                    <span className="flex-1 text-sm text-neutral-700 truncate">{kw.query}</span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tabular-nums">
                      {kw.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>

        {/* Login history */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-5">
          <p className="text-sm font-bold text-neutral-800 mb-4">Lịch sử đăng nhập gần đây</p>
          <LoginTable rows={recentLogins} />
        </div>
      </section>

      {/* ── Cần xử lý ── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Cần xử lý
        </h2>

        <PendingSection title="Vendor chờ duyệt" href="/admin/vendors?status=pending" count={pendingVendorCount ?? 0}>
          {(pendingVendors ?? []).map((v: any) => (
            <PendingRow key={v.id} label={v.name}
              sub={v.vendor_type === 'student_booth' ? 'Gian hàng SV' : 'Quán ăn cố định'}
              time={fmt(v.created_at)} />
          ))}
        </PendingSection>

        <PendingSection title="Review bị report" href="/admin/reviews" count={reviewReportCount ?? 0}>
          {(pendingReviewReports ?? []).map((r: any) => (
            <PendingRow key={r.id} label={r.reason}
              sub={(r.reviews as any)?.content?.slice(0, 60) ?? '(no content)'}
              time={fmt(r.created_at)} />
          ))}
        </PendingSection>

        <PendingSection title="User bị report" href="/admin/users" count={userReportCount ?? 0}>
          {(pendingUserReports ?? []).map((r: any) => (
            <PendingRow key={r.id}
              label={(r.profiles as any)?.full_name ?? (r.profiles as any)?.email ?? 'Unknown user'}
              sub={r.reason} time={fmt(r.created_at)} />
          ))}
        </PendingSection>

        <PendingSection title="Ảnh review chờ duyệt" href="/admin/media" count={pendingMediaCount ?? 0}>
          {(pendingMedia ?? []).map((m: any) => (
            <PendingRow key={m.id} label="Ảnh review"
              sub={`review_id: ${m.review_id?.slice(0, 8)}…`}
              time={fmt(m.created_at)} />
          ))}
        </PendingSection>

        <PendingSection title="Xác thực sinh viên chờ duyệt" href="/admin/verifications" count={verificationCount ?? 0}>
          {(pendingVerifications ?? []).map((v: any) => (
            <PendingRow key={v.id} label={v.student_email}
              sub={(v.profiles as any)?.full_name ?? (v.profiles as any)?.email ?? ''}
              time={fmt(v.submitted_at)} />
          ))}
        </PendingSection>

        {totalPending === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-200 py-12 text-center">
            <p className="text-sm text-neutral-400">Không có việc gì cần xử lý. 🎉</p>
          </div>
        )}
      </section>
    </div>
  )
}
