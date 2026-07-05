import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  Store, Star, Users, ShoppingBag, AlertTriangle, ChevronRight,
  Activity, UserCheck, Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard — HolaMate' }

const adminClient = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Reference dates (fake data period) ────────────────────────────────────────
const MAU_REF       = new Date('2026-07-05T17:00:00Z') // "now"
const MAU_CUTOFF    = new Date(MAU_REF.getTime() - 30 * 86400_000).toISOString()
const LOGIN_14D     = new Date(MAU_REF.getTime() - 14 * 86400_000).toISOString()

// ── Utilities ─────────────────────────────────────────────────────────────────
function utcPlus7(d: Date) { return new Date(d.getTime() + 7 * 3_600_000) }
function dayKey(iso: string) {
  const d = utcPlus7(new Date(iso))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`
}
function fmt(d: string) { return new Date(d).toLocaleDateString('vi-VN') }
function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60), s = sec % 60
  if (m < 60) return `${m}p${s > 0 ? ` ${s}s` : ''}`
  return `${Math.floor(m/60)}h ${m%60}p`
}
function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  return `${user.slice(0, 3)}***@${domain}`
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
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

function MauKpi({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub: string; color: string; icon: React.ReactNode
}) {
  return (
    <div className={cn('rounded-2xl border p-5 flex items-start gap-4', color)}>
      <div className="p-2.5 rounded-xl bg-white/70 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-neutral-900 tabular-nums">{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</p>
        <p className="text-xs font-semibold text-neutral-700 mt-0.5 leading-tight">{label}</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-neutral-100 bg-white p-5', className)}>
      <p className="text-sm font-bold text-neutral-800 mb-4">{title}</p>
      {children}
    </div>
  )
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-28">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
          {d.value > 0 && <span className="text-[9px] text-neutral-500 tabular-nums">{d.value}</span>}
          <div
            className="w-full bg-orange-400 rounded-t hover:bg-orange-500 transition-colors"
            style={{ height: `${Math.max((d.value/max)*100, d.value>0?3:0)}%`, minHeight: d.value>0?'4px':'0' }}
          />
          <span className="text-[9px] text-neutral-400 truncate w-full text-center leading-none mt-0.5">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function FunnelChart({ steps }: { steps: { label: string; count: number; total: number }[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const pct = step.total > 0 ? (step.count / step.total * 100) : 0
        return (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-700 font-medium">{step.label}</span>
              <span className="text-neutral-500 tabular-nums">{step.count} <span className="text-neutral-400">({pct.toFixed(0)}%)</span></span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const EVENT_META: Record<string, { icon: string; label: string }> = {
  view_vendor:  { icon: '🏪', label: 'Xem quán' },
  search:       { icon: '🔍', label: 'Tìm kiếm' },
  use_ai:       { icon: '🤖', label: 'Trợ lý AI' },
  filter:       { icon: '📋', label: 'Lọc kết quả' },
  checkout:     { icon: '🛒', label: 'Đặt món' },
  write_review: { icon: '⭐', label: 'Viết review' },
}

function EventGrid({ data }: { data: { event_type: string; count: number; unique_users: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {data.map(d => {
        const meta = EVENT_META[d.event_type] ?? { icon: '📊', label: d.event_type }
        const pct = (d.count / max * 100).toFixed(0)
        return (
          <div key={d.event_type} className="rounded-xl border border-neutral-100 p-3 space-y-2 bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{meta.icon}</span>
              <span className="text-xs font-semibold text-neutral-700">{meta.label}</span>
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900 tabular-nums">{d.count.toLocaleString('vi-VN')}</p>
              <p className="text-[10px] text-neutral-400">{d.unique_users} users · lượt</p>
            </div>
            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SessionDistro({ buckets }: { buckets: { label: string; icon: string; color: string; count: number; pct: number }[] }) {
  return (
    <div className="space-y-2">
      {buckets.map(b => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="text-sm w-4 shrink-0">{b.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-neutral-600 font-medium truncate">{b.label}</span>
              <span className="text-neutral-400 tabular-nums shrink-0 ml-2">{b.count} ({b.pct.toFixed(0)}%)</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        </div>
      ))}
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
    // MAU data — use large limits to bypass 1000-row default
    mauSignInsRes,
    mauPageViewsRes,
    mauActionsRes,
    signIns14dRes,
  ] = await Promise.all([
    supabase.from('vendors').select('*', { count:'exact', head:true }),
    supabase.from('reviews').select('*', { count:'exact', head:true }),
    supabase.from('profiles').select('*', { count:'exact', head:true }).neq('role','admin'),
    supabase.from('orders').select('*', { count:'exact', head:true }).gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('vendors').select('id,name,vendor_type,created_at',{count:'exact'}).eq('status','pending').order('created_at',{ascending:false}).limit(5),
    supabase.from('review_reports').select('id,reason,review_id,created_at,reviews(content)',{count:'exact'}).eq('status','pending').order('created_at',{ascending:false}).limit(5),
    supabase.from('user_reports').select('id,reason,reported_user_id,created_at,profiles!user_reports_reported_user_id_fkey(full_name,email)',{count:'exact'}).eq('status','pending').order('created_at',{ascending:false}).limit(5),
    supabase.from('review_media').select('id,image_url,review_id,created_at',{count:'exact'}).eq('status','pending').order('created_at',{ascending:false}).limit(5),
    supabase.from('student_verifications').select('id,student_email,submitted_at,profiles!student_verifications_user_id_fkey(full_name,email)',{count:'exact'}).eq('status','pending').order('submitted_at',{ascending:false}).limit(5),
    adminClient.from('user_login_history').select('user_id,created_at').eq('event_type','sign_in').gte('created_at', MAU_CUTOFF).limit(20000),
    adminClient.from('user_activity_logs').select('user_id,session_id,created_at').eq('event_type','page_view').gte('created_at', MAU_CUTOFF).limit(20000),
    adminClient.from('user_activity_logs').select('user_id,event_type').in('event_type',['view_vendor','search','use_ai','filter','checkout','write_review']).gte('created_at', MAU_CUTOFF).limit(20000),
    adminClient.from('user_login_history').select('user_id,created_at').eq('event_type','sign_in').gte('created_at', LOGIN_14D).limit(20000),
  ])

  // ── MAU Calculation ───────────────────────────────────────────────────────
  const signInRows  = mauSignInsRes.data  ?? []
  const pvRows      = mauPageViewsRes.data ?? []
  const actionRows  = mauActionsRes.data   ?? []
  const s14dRows    = signIns14dRes.data   ?? []

  // C1: ≥ 2 sign_in
  const loginCounts: Record<string, number> = {}
  for (const r of signInRows) loginCounts[r.user_id] = (loginCounts[r.user_id]||0) + 1
  const c1Set = new Set(Object.entries(loginCounts).filter(([,v])=>v>=2).map(([k])=>k))

  // C2: session ≥ 3 min (group page_view by session_id)
  const sessMap: Record<string, { uid: string; min: string; max: string }> = {}
  for (const r of pvRows) {
    const k = `${r.user_id}|${r.session_id}`
    if (!sessMap[k]) sessMap[k] = { uid: r.user_id, min: r.created_at, max: r.created_at }
    else {
      if (r.created_at < sessMap[k].min) sessMap[k].min = r.created_at
      if (r.created_at > sessMap[k].max) sessMap[k].max = r.created_at
    }
  }
  const c2Set = new Set<string>()
  let totalDurSec = 0, sessionCount30d = 0
  for (const { uid, min, max } of Object.values(sessMap)) {
    const durSec = (new Date(max).getTime() - new Date(min).getTime()) / 1000
    totalDurSec += durSec
    sessionCount30d++
    if (durSec >= 180) c2Set.add(uid) // ≥ 3 min
  }
  const avgSessionSec = sessionCount30d > 0 ? Math.round(totalDurSec / sessionCount30d) : 0

  // C3: ≥ 1 action
  const c3Set = new Set(actionRows.map(r => r.user_id))

  // MAU = C1 ∩ C2 ∩ C3
  const mauCount = Array.from(c1Set).filter(u => c2Set.has(u) && c3Set.has(u)).length

  // Avg login per user
  const avgLogin = signInRows.length > 0
    ? (signInRows.length / c1Set.size).toFixed(1)
    : '0'

  // ── Funnel ────────────────────────────────────────────────────────────────
  const totalRealUsers = totalUsers ?? 0
  const checkoutUsers = new Set(actionRows.filter(r=>r.event_type==='checkout').map(r=>r.user_id)).size
  const funnelSteps = [
    { label: 'Đã đăng ký',         count: totalRealUsers,   total: totalRealUsers },
    { label: 'Login ≥ 2 lần',      count: c1Set.size,       total: totalRealUsers },
    { label: 'Phiên ≥ 3 phút',     count: c2Set.size,       total: totalRealUsers },
    { label: 'Có hành động',       count: c3Set.size,       total: totalRealUsers },
    { label: 'Đặt món',            count: checkoutUsers,    total: totalRealUsers },
  ]

  // ── Event breakdown ───────────────────────────────────────────────────────
  const evCounts: Record<string, { count: number; users: Set<string> }> = {}
  for (const r of actionRows) {
    if (!evCounts[r.event_type]) evCounts[r.event_type] = { count: 0, users: new Set() }
    evCounts[r.event_type].count++
    evCounts[r.event_type].users.add(r.user_id)
  }
  const eventBreakdown = Object.entries(evCounts)
    .map(([event_type, v]) => ({ event_type, count: v.count, unique_users: v.users.size }))
    .sort((a, b) => b.count - a.count)
    .filter(d => EVENT_META[d.event_type]) // only the 6 we care about

  // ── 14-day login bar chart ────────────────────────────────────────────────
  const loginByDay: Record<string, number> = {}
  for (const r of s14dRows) {
    const k = dayKey(r.created_at)
    loginByDay[k] = (loginByDay[k]||0) + 1
  }
  const barData14d = Array.from({length:14}, (_,i) => {
    const d = utcPlus7(new Date(MAU_REF.getTime() - (13-i)*86400_000))
    const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`
    const label = `${d.getUTCMonth()+1}/${d.getUTCDate()}`
    return { label, value: loginByDay[k] ?? 0 }
  })

  // ── Session duration distribution ─────────────────────────────────────────
  let b_bounce=0, b_short=0, b_active=0, b_power=0
  for (const { min, max } of Object.values(sessMap)) {
    const m = (new Date(max).getTime() - new Date(min).getTime()) / 60000
    if      (m < 1)  b_bounce++
    else if (m < 3)  b_short++
    else if (m < 10) b_active++
    else             b_power++
  }
  const total_sess = sessionCount30d || 1
  const sessionBuckets = [
    { label: '< 1 phút (Bounce)',    icon:'❌', color:'bg-red-400',   count:b_bounce, pct:b_bounce/total_sess*100 },
    { label: '1–3 phút',             icon:'⚠️', color:'bg-yellow-400',count:b_short,  pct:b_short/total_sess*100  },
    { label: '3–10 phút (Active)',   icon:'✅', color:'bg-emerald-400',count:b_active, pct:b_active/total_sess*100 },
    { label: '> 10 phút (Power)',    icon:'🔥', color:'bg-blue-400',  count:b_power,  pct:b_power/total_sess*100  },
  ]

  // ── Recent sessions table (top 10 by recency) ─────────────────────────────
  const topSessionEntries = Object.values(sessMap)
    .sort((a, b) => new Date(b.max).getTime() - new Date(a.max).getTime())
    .slice(0, 10)
  const topUserIds = Array.from(new Set(topSessionEntries.map(s => s.uid)))
  const { data: topProfiles } = await adminClient.from('profiles')
    .select('id,full_name,email').in('id', topUserIds)
  const profileMap = new Map((topProfiles ?? []).map(p => [p.id, p]))

  const recentSessionRows = topSessionEntries.map(({ uid, min, max }, i) => {
    const profile = profileMap.get(uid)
    const rawEmail = profile?.email ?? uid.slice(0, 8)
    const durSec = Math.round((new Date(max).getTime() - new Date(min).getTime()) / 1000)
    const loginCount = loginCounts[uid] ?? 0
    return {
      key: `${uid}|${i}`,
      display: rawEmail.includes('@') ? maskEmail(rawEmail) : `user_${rawEmail}…`,
      loginCount,
      duration: fmtDuration(durSec),
      lastSeen: utcPlus7(new Date(max)).toISOString().slice(0,16).replace('T',' '),
    }
  })

  // ── Pending total ─────────────────────────────────────────────────────────
  const totalPending = (pendingVendorCount??0) + (reviewReportCount??0) + (userReportCount??0) +
    (pendingMediaCount??0) + (verificationCount??0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' })}
          {totalPending > 0 && (
            <span className="ml-2 text-red-600 font-medium">· {totalPending} việc cần xử lý</span>
          )}
        </p>
      </div>

      {/* 4 KPI links */}
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

      {/* ── MAU Analytics section ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-neutral-900">Analytics & Tracking</h2>
          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold border border-orange-200">
            MAU {mauCount} / {totalRealUsers}
          </span>
        </div>

        {/* Widget 1 — 4 MAU KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MauKpi label="Tổng Users" value={totalRealUsers} sub="tài khoản đã đăng ký"
            color="bg-blue-50 border-blue-100" icon={<Users className="w-5 h-5 text-blue-600" />} />
          <MauKpi label="Monthly Active Users" value={mauCount} sub="C1∩C2∩C3 · 30 ngày"
            color="bg-orange-50 border-orange-200" icon={<UserCheck className="w-5 h-5 text-orange-500" />} />
          <MauKpi label="Avg Session" value={fmtDuration(avgSessionSec)} sub={`${sessionCount30d} phiên · 30 ngày`}
            color="bg-emerald-50 border-emerald-100" icon={<Timer className="w-5 h-5 text-emerald-600" />} />
          <MauKpi label="Avg Login/User" value={`${avgLogin} lần`} sub="sign_in · 30 ngày"
            color="bg-violet-50 border-violet-100" icon={<Activity className="w-5 h-5 text-violet-500" />} />
        </div>

        {/* Widget 2 — Bar chart + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Lượt đăng nhập theo ngày (14 ngày)">
            <BarChart data={barData14d} />
          </SectionCard>
          <SectionCard title="Phễu hành vi người dùng">
            <FunnelChart steps={funnelSteps} />
          </SectionCard>
        </div>

        {/* Widget 3 — Event breakdown grid (full width) */}
        <SectionCard title="Phân bổ hành vi người dùng (30 ngày)">
          <EventGrid data={eventBreakdown} />
        </SectionCard>

        {/* Widget 4 — Session distribution + Recent sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Phân bổ thời gian phiên">
            <SessionDistro buckets={sessionBuckets} />
            <p className="text-[11px] text-neutral-400 mt-3 text-right">
              Tổng {sessionCount30d} phiên · Avg {fmtDuration(avgSessionSec)}
            </p>
          </SectionCard>

          <SectionCard title="Phiên gần đây">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left py-2 px-2 text-neutral-500 font-medium">Người dùng</th>
                    <th className="text-center py-2 px-2 text-neutral-500 font-medium">Login</th>
                    <th className="text-center py-2 px-2 text-neutral-500 font-medium">Thời gian</th>
                    <th className="text-right py-2 px-2 text-neutral-500 font-medium">Gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessionRows.map(row => (
                    <tr key={row.key} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="py-2 px-2 text-neutral-700 truncate max-w-[140px] font-mono">{row.display}</td>
                      <td className="py-2 px-2 text-center text-neutral-500 tabular-nums">{row.loginCount}</td>
                      <td className="py-2 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-semibold">{row.duration}</span>
                      </td>
                      <td className="py-2 px-2 text-right text-neutral-400 tabular-nums">{row.lastSeen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* MAU conditions summary */}
        <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
          <p className="text-xs font-bold text-orange-800 mb-2">Điều kiện MAU (Monthly Active User)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'C1 — Login ≥ 2 lần / 30 ngày', count: c1Set.size },
              { label: 'C2 — Phiên ≥ 3 phút / 30 ngày', count: c2Set.size },
              { label: 'C3 — ≥ 1 hành động / 30 ngày',  count: c3Set.size },
            ].map(c => (
              <div key={c.label} className="rounded-xl bg-white border border-orange-100 px-4 py-3">
                <p className="text-xl font-bold text-neutral-900 tabular-nums">{c.count}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{c.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-orange-700 mt-3 font-medium">
            MAU = C1 ∩ C2 ∩ C3 = <strong>{mauCount} users</strong>
            {' '}({totalRealUsers > 0 ? (mauCount/totalRealUsers*100).toFixed(1) : 0}% activation rate)
          </p>
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
              sub={(r.reviews as any)?.content?.slice(0,60) ?? '(no content)'}
              time={fmt(r.created_at)} />
          ))}
        </PendingSection>

        <PendingSection title="User bị report" href="/admin/users" count={userReportCount ?? 0}>
          {(pendingUserReports ?? []).map((r: any) => (
            <PendingRow key={r.id}
              label={(r.profiles as any)?.full_name ?? (r.profiles as any)?.email ?? 'Unknown'}
              sub={r.reason} time={fmt(r.created_at)} />
          ))}
        </PendingSection>

        <PendingSection title="Ảnh review chờ duyệt" href="/admin/media" count={pendingMediaCount ?? 0}>
          {(pendingMedia ?? []).map((m: any) => (
            <PendingRow key={m.id} label="Ảnh review"
              sub={`review_id: ${m.review_id?.slice(0,8)}…`}
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
