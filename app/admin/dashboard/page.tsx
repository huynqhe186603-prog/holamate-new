import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  Store, Star, Users, ShoppingBag, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { MonthFilter } from './_components/MonthFilter'
import { UserDashboard } from './_components/user/UserDashboard'
import { StoreDashboard } from './_components/store/StoreDashboard'
import type {
  UserDashboardData, StoreDashboardData,
  DayCount, DayRevenue, NameValue, EventCount, FreqGroup, VendorRating,
} from './_components/types'

export const metadata: Metadata = { title: 'Admin Dashboard — HolaMate' }

const adminClient = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDay7(iso: string): number {
  return new Date(new Date(iso).getTime() + 7 * 3_600_000).getUTCDate()
}

function buildDayCounts(events: Array<{ created_at: string }>, days: number): number[] {
  const arr: number[] = Array.from({ length: days }, () => 0)
  for (const e of events) {
    const d = getDay7(e.created_at)
    if (d >= 1 && d <= days) arr[d - 1]++
  }
  return arr
}

function toDayCount(arr: number[]): DayCount[] {
  return arr.map((count, i) => ({ day: i + 1, count }))
}

function fmt(d: string) { return new Date(d).toLocaleDateString('vi-VN') }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll<T>(builder: any): Promise<T[]> {
  const PAGE = 1000
  let result: T[] = []
  let offset = 0
  while (true) {
    const { data } = await builder.range(offset, offset + PAGE - 1)
    const rows: T[] = data ?? []
    result = result.concat(rows)
    if (rows.length < PAGE) break
    offset += PAGE
  }
  return result
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
function StatLink({ href, icon, label, value, color }: {
  href: string; icon: React.ReactNode; label: string; value: number | null; color: string
}) {
  return (
    <Link href={href} className={cn(
      'flex items-center gap-3 rounded-2xl border p-4 hover:shadow-sm transition-shadow', color
    )}>
      <div className="p-2 rounded-xl bg-white/70">{icon}</div>
      <div>
        <p className="text-xl font-bold text-neutral-900">{value ?? '—'}</p>
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
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string; month?: string; vendor?: string }
}) {
  const supabase = createClient()

  const tab       = searchParams.tab === 'store' ? 'store' : 'user'
  const month     = Math.min(12, Math.max(1, Number(searchParams.month) || 7))
  const vendorId  = searchParams.vendor ?? ''
  const year      = 2026
  const monthStr  = String(month).padStart(2, '0')
  const lastDay   = new Date(year, month, 0).getDate()
  const startISO  = `${year}-${monthStr}-01T00:00:00+07:00`
  const endISO    = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}T23:59:59+07:00`

  // ── Always-on queries ──────────────────────────────────────────────────────
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
  ] = await Promise.all([
    supabase.from('vendors').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date('2026-07-12').toISOString().split('T')[0]),
    supabase.from('vendors').select('id,name,vendor_type,created_at', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('review_reports').select('id,reason,review_id,created_at,reviews(content)', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('user_reports').select('id,reason,reported_user_id,created_at,profiles!user_reports_reported_user_id_fkey(full_name,email)', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('review_media').select('id,image_url,review_id,created_at', { count: 'exact' })
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('student_verifications').select('id,student_email,submitted_at,profiles!student_verifications_user_id_fkey(full_name,email)', { count: 'exact' })
      .eq('status', 'pending').order('submitted_at', { ascending: false }).limit(5),
  ])

  const totalPending =
    (pendingVendorCount ?? 0) + (reviewReportCount ?? 0) + (userReportCount ?? 0) +
    (pendingMediaCount ?? 0) + (verificationCount ?? 0)

  // ── Tab-specific data ──────────────────────────────────────────────────────
  let userData: UserDashboardData | null = null
  let storeData: StoreDashboardData | null = null

  if (tab === 'user') {
    // MAU window: startISO = đầu tháng, mauEnd = cuối tháng (tháng 7 chỉ đến 12/7)
    const mauEnd = month === 7 ? '2026-07-12T23:59:59+07:00' : endISO

    // Fetch all needed data in parallel
    const [signInsRes, pvRows, actionsRes, allSignUpsRes] = await Promise.all([
      adminClient.from('user_login_history')
        .select('user_id, created_at')
        .eq('event_type', 'sign_in')
        .gte('created_at', startISO).lte('created_at', mauEnd)
        .limit(20000),
      // page_view có >4000 rows — paginate để không bị cut off tại 1000
      fetchAll<{ user_id: string; session_id: string; created_at: string }>(
        adminClient.from('user_activity_logs')
          .select('user_id, session_id, created_at')
          .eq('event_type', 'page_view')
          .gte('created_at', startISO).lte('created_at', mauEnd)
      ),
      adminClient.from('user_activity_logs')
        .select('user_id, event_type, created_at')
        .in('event_type', ['view_vendor', 'search', 'use_ai', 'filter', 'checkout', 'write_review'])
        .gte('created_at', startISO).lte('created_at', mauEnd)
        .limit(20000),
      adminClient.from('user_login_history')
        .select('user_id, created_at')
        .eq('event_type', 'sign_up')
        .lte('created_at', endISO)
        .limit(10000),
    ])

    const signInRows   = signInsRes.data    ?? []
    // pvRows đã là mảng từ fetchAll (pagination)
    const actionRows   = actionsRes.data    ?? []
    const allSignUps   = allSignUpsRes.data ?? []

    // ── Signups growth ──────────────────────────────────────────────────────
    const monthSignUps = allSignUps.filter(r => r.created_at >= startISO && r.created_at <= endISO)
    const baseCount    = allSignUps.filter(r => r.created_at < startISO).length
    const signupsPerDay = buildDayCounts(monthSignUps, lastDay)
    const signupsByDay  = toDayCount(signupsPerDay)

    let running = baseCount
    const cumulativeByDay: DayCount[] = signupsPerDay.map((count, i) => {
      running += count
      return { day: i + 1, count: running }
    })

    // ── Logins by day ───────────────────────────────────────────────────────
    const loginsByDay = toDayCount(buildDayCounts(signInRows, lastDay))

    // ── C1: login ≥ 2 in month ──────────────────────────────────────────────
    const loginCountMap: Record<string, number> = {}
    for (const r of signInRows) loginCountMap[r.user_id] = (loginCountMap[r.user_id] || 0) + 1
    const c1Set   = new Set<string>(Object.entries(loginCountMap).filter(([, v]) => v >= 2).map(([k]) => k))
    const c1Count = c1Set.size

    // ── C2: session ≥ 3 min via page_view events ────────────────────────────
    const sessMap: Record<string, { uid: string; min: string; max: string }> = {}
    for (const r of pvRows) {
      if (!sessMap[r.session_id]) sessMap[r.session_id] = { uid: r.user_id, min: r.created_at, max: r.created_at }
      else {
        if (r.created_at < sessMap[r.session_id].min) sessMap[r.session_id].min = r.created_at
        if (r.created_at > sessMap[r.session_id].max) sessMap[r.session_id].max = r.created_at
      }
    }
    const c2UserSet = new Set<string>()
    const c2DayMap: Record<number, Set<string>> = {}
    for (const { uid, min, max } of Object.values(sessMap)) {
      const durSec = (new Date(max).getTime() - new Date(min).getTime()) / 1000
      if (durSec >= 180) {
        c2UserSet.add(uid)
        const d = getDay7(min)
        if (d >= 1 && d <= lastDay) {
          if (!c2DayMap[d]) c2DayMap[d] = new Set()
          c2DayMap[d].add(uid)
        }
      }
    }
    const c2UsersByDay: DayCount[] = Array.from({ length: lastDay }, (_, i) => ({
      day: i + 1, count: c2DayMap[i + 1]?.size ?? 0,
    }))
    const c2Count = c2UserSet.size

    // ── C3: ≥ 1 action in month ─────────────────────────────────────────────
    const c3Set   = new Set<string>(actionRows.map(r => r.user_id))
    const c3Count = c3Set.size

    // ── MAU = C1 ∩ C2 ∩ C3 ─────────────────────────────────────────────────
    const mauUsers = new Set<string>(Array.from(c1Set).filter(u => c2UserSet.has(u) && c3Set.has(u)))
    const mauCount = mauUsers.size

    // MAU by day: unique MAU users with any event on each day
    const mauDayMap: Record<number, Set<string>> = {}
    const allEventsForMau = [...signInRows, ...pvRows, ...actionRows]
    for (const r of allEventsForMau) {
      if (!mauUsers.has(r.user_id)) continue
      const d = getDay7(r.created_at)
      if (d >= 1 && d <= lastDay) {
        if (!mauDayMap[d]) mauDayMap[d] = new Set()
        mauDayMap[d].add(r.user_id)
      }
    }
    const mauByDay: DayCount[] = Array.from({ length: lastDay }, (_, i) => ({
      day: i + 1, count: mauDayMap[i + 1]?.size ?? 0,
    }))

    // ── Event breakdown (C3) ────────────────────────────────────────────────
    const evMap: Record<string, { count: number; users: Set<string> }> = {}
    for (const r of actionRows) {
      if (!evMap[r.event_type]) evMap[r.event_type] = { count: 0, users: new Set() }
      evMap[r.event_type].count++
      evMap[r.event_type].users.add(r.user_id)
    }
    const eventBreakdown: EventCount[] = Object.entries(evMap)
      .map(([event_type, v]) => ({ event_type, count: v.count, uniqueUsers: v.users.size }))
      .sort((a, b) => b.count - a.count)

    // ── Return logins: all sign_in events in this month ─────────────────────
    const returnLoginsByDay = toDayCount(buildDayCounts(signInRows, lastDay))

    // ── Login frequency groups ───────────────────────────────────────────────
    const loginFreqGroups: FreqGroup[] = [
      { group: '1 lần',   count: 0 },
      { group: '2–3 lần', count: 0 },
      { group: '4–5 lần', count: 0 },
      { group: '>5 lần',  count: 0 },
    ]
    for (const [, c] of Object.entries(loginCountMap)) {
      if      (c === 1) loginFreqGroups[0].count++
      else if (c <= 3)  loginFreqGroups[1].count++
      else if (c <= 5)  loginFreqGroups[2].count++
      else              loginFreqGroups[3].count++
    }

    userData = {
      month, year, signupsByDay, cumulativeByDay, loginsByDay,
      c2UsersByDay, eventBreakdown, mauByDay,
      c1Count, c2Count, c3Count, mauCount,
      returnLoginsByDay, loginFreqGroups,
    }

  } else {
    // ── Store tab ────────────────────────────────────────────────────────────
    const [
      { count: totalVendors },
      { count: partnered },
      ordersRes,
      vendorViewsRes,
      allVendorsRes,
      reviewsRes,
    ] = await Promise.all([
      adminClient.from('vendors').select('*', { count: 'exact', head: true }),
      adminClient.from('vendors').select('*', { count: 'exact', head: true }).eq('is_partnered', true),
      (() => {
        let q = adminClient.from('orders').select('vendor_id, total_price, created_at, status')
          .gte('created_at', startISO).lte('created_at', endISO).limit(10000)
        if (vendorId) q = q.eq('vendor_id', vendorId)
        return q
      })(),
      adminClient.from('user_activity_logs')
        .select('event_data, user_id')
        .eq('event_type', 'view_vendor')
        .gte('created_at', startISO).lte('created_at', endISO)
        .limit(10000),
      adminClient.from('vendors').select('id, name').eq('status', 'active').order('name').limit(200),
      (() => {
        let q = adminClient.from('reviews')
          .select('vendor_id, rating, created_at, vendors!inner(name, is_partnered)')
          .gte('created_at', startISO).lte('created_at', endISO)
          .eq('review_type', 'vendor')
          .eq('status', 'visible')
          .eq('vendors.is_partnered', true)
          .limit(5000)
        if (vendorId) q = q.eq('vendor_id', vendorId)
        return q
      })(),
    ])

    const orderRows      = ordersRes.data       ?? []
    const vendorViewRows = vendorViewsRes.data   ?? []
    const allVendors     = (allVendorsRes.data ?? []).map(v => ({ id: v.id, name: v.name }))

    // Orders by day
    const orderDayData: { count: number; revenue: number }[] =
      Array.from({ length: lastDay }, () => ({ count: 0, revenue: 0 }))
    for (const o of orderRows) {
      const d = getDay7(o.created_at)
      if (d >= 1 && d <= lastDay) {
        orderDayData[d - 1].count++
        orderDayData[d - 1].revenue += o.total_price ?? 0
      }
    }
    const ordersByDay: DayRevenue[] = orderDayData.map((d, i) => ({ day: i + 1, ...d }))

    // Top vendors by views
    const viewsByVendorId: Record<string, number> = {}
    for (const e of vendorViewRows) {
      const vid = (e.event_data as Record<string, string> | null)?.vendor_id
      if (vid) viewsByVendorId[vid] = (viewsByVendorId[vid] || 0) + 1
    }
    const topViewIds = Object.entries(viewsByVendorId)
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)

    let topVendorsByViews: NameValue[] = []
    if (topViewIds.length > 0) {
      const { data: vd } = await adminClient.from('vendors').select('id, name').in('id', topViewIds)
      const vMap = new Map((vd ?? []).map(v => [v.id, v.name]))
      topVendorsByViews = topViewIds.map(id => ({
        name: vMap.get(id) ?? id.slice(0, 8) + '…',
        value: viewsByVendorId[id],
      }))
    }

    // Top vendors by orders
    const ordersByVendorId: Record<string, number> = {}
    for (const o of orderRows) ordersByVendorId[o.vendor_id] = (ordersByVendorId[o.vendor_id] || 0) + 1
    const topOrderIds = Object.entries(ordersByVendorId)
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)

    let topVendorsByOrders: NameValue[] = []
    if (topOrderIds.length > 0) {
      const { data: od } = await adminClient.from('vendors').select('id, name').in('id', topOrderIds)
      const oMap = new Map((od ?? []).map(v => [v.id, v.name]))
      topVendorsByOrders = topOrderIds.map(id => ({
        name: oMap.get(id) ?? id.slice(0, 8) + '…',
        value: ordersByVendorId[id],
      }))
    }

    // Reviews by day
    const reviewRows = reviewsRes.data ?? []
    const reviewDayArr: number[] = Array.from({ length: lastDay }, () => 0)
    for (const r of reviewRows) {
      const d = getDay7(r.created_at)
      if (d >= 1 && d <= lastDay) reviewDayArr[d - 1]++
    }
    const reviewsByDay: DayCount[] = reviewDayArr.map((count, i) => ({ day: i + 1, count }))

    // Vendor avg ratings
    const ratingAcc: Record<string, { total: number; count: number; name: string }> = {}
    for (const r of reviewRows) {
      const vnd = r.vendors as unknown as { name: string } | null
      const name = vnd?.name ?? r.vendor_id.slice(0, 8) + '…'
      if (!ratingAcc[r.vendor_id]) ratingAcc[r.vendor_id] = { total: 0, count: 0, name }
      ratingAcc[r.vendor_id].total += r.rating
      ratingAcc[r.vendor_id].count++
    }
    const vendorRatings: VendorRating[] = Object.values(ratingAcc)
      .map(v => ({ name: v.name, avgRating: Math.round((v.total / v.count) * 10) / 10 }))
      .sort((a, b) => b.avgRating - a.avgRating)

    storeData = {
      month, year,
      totalActiveVendors: totalVendors ?? 0,
      partneredVendors: partnered ?? 0,
      ordersInMonth: orderRows.length,
      ordersByDay, topVendorsByViews, topVendorsByOrders,
      reviewsByDay, vendorRatings, allVendors,
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {new Date('2026-07-12').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
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

      {/* ── Analytics tabs ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Tab switcher */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 border-b border-neutral-100 w-full sm:w-auto">
            <Link
              href={`/admin/dashboard?tab=user&month=${month}`}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors',
                tab === 'user'
                  ? 'text-orange-500 border-orange-500'
                  : 'text-neutral-500 border-transparent hover:text-neutral-700'
              )}
            >
              👥 Người dùng
            </Link>
            <Link
              href={`/admin/dashboard?tab=store&month=${month}`}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors',
                tab === 'store'
                  ? 'text-orange-500 border-orange-500'
                  : 'text-neutral-500 border-transparent hover:text-neutral-700'
              )}
            >
              🏪 Quán ăn
            </Link>
          </div>

          {/* Month filter (only for User tab — Store tab has its own StoreFilter) */}
          {tab === 'user' && <MonthFilter currentMonth={month} />}
        </div>

        {/* Dashboard content */}
        {tab === 'user' && userData && <UserDashboard data={userData} />}
        {tab === 'store' && storeData && <StoreDashboard data={storeData} vendorId={vendorId} />}
      </section>

      {/* ── Cần xử lý ─────────────────────────────────────────────────────── */}
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
              label={(r.profiles as any)?.full_name ?? (r.profiles as any)?.email ?? 'Unknown'}
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
            <p className="text-sm text-neutral-400">Không có việc gì cần xử lý 🎉</p>
          </div>
        )}
      </section>
    </div>
  )
}
