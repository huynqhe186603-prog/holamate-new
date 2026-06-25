import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { Users, UserPlus, LogIn, Activity, BarChart2 } from 'lucide-react'
import type { Metadata } from 'next'
import { KpiCard } from './KpiCard'
import { BarChart } from './BarChart'
import { DonutChart } from './DonutChart'
import { HeatmapChart } from './HeatmapChart'
import { LoginHistoryTable } from './LoginHistoryTable'
import { KeywordList } from './KeywordList'

export const metadata: Metadata = { title: 'Analytics — HolaMate Admin' }

// Use service role to read analytics tables (bypass RLS for server-side admin page)
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function utcPlus7(date: Date): Date {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000)
}

function dayKey(iso: string): string {
  const d = utcPlus7(new Date(iso))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function hourOf(iso: string): number {
  return utcPlus7(new Date(iso)).getUTCHours()
}

function sectionCard(title: string, children: React.ReactNode) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5">
      <h2 className="text-sm font-bold text-neutral-800 mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default async function AnalyticsPage() {
  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Parallel fetches
  const [
    allTimeSignUpRes,
    loginHistory30dRes,
    recentLoginsRes,
    activityLogs30dRes,
    signups14dRes,
    activityLogs7dRes,
    searchLogs30dRes,
  ] = await Promise.all([
    supabaseAdmin.from('user_login_history').select('id', { count: 'exact', head: true }).eq('event_type', 'sign_up'),
    supabaseAdmin.from('user_login_history').select('event_type, created_at').gte('created_at', thirtyDaysAgo),
    supabaseAdmin.from('user_login_history').select('id, user_id, event_type, provider, ip_address, created_at').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('user_activity_logs').select('event_type, created_at').gte('created_at', thirtyDaysAgo),
    supabaseAdmin.from('user_login_history').select('created_at').eq('event_type', 'sign_up').gte('created_at', fourteenDaysAgo),
    supabaseAdmin.from('user_activity_logs').select('created_at').gte('created_at', sevenDaysAgo),
    supabaseAdmin.from('user_activity_logs').select('event_data').eq('event_type', 'search').gte('created_at', thirtyDaysAgo),
  ])

  // KPIs
  const totalSignUps = allTimeSignUpRes.count ?? 0
  const loginHistory30d = loginHistory30dRes.data ?? []
  const newUsers30d = loginHistory30d.filter(r => r.event_type === 'sign_up').length
  const signIns30d = loginHistory30d.filter(r => r.event_type === 'sign_in').length
  const activity30d = (activityLogs30dRes.data ?? []).length

  // Daily signups chart (last 14 days)
  const signups14d = signups14dRes.data ?? []
  const dailyMap: Record<string, number> = {}
  signups14d.forEach(r => {
    const k = dayKey(r.created_at)
    dailyMap[k] = (dailyMap[k] ?? 0) + 1
  })
  const dailyChartData = Array.from({ length: 14 }, (_, i) => {
    const d = utcPlus7(new Date(now - (13 - i) * 24 * 60 * 60 * 1000))
    const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    return {
      label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      value: dailyMap[k] ?? 0,
    }
  })

  // Event type breakdown
  const activityLogs30d = activityLogs30dRes.data ?? []
  const eventCounts: Record<string, number> = {}
  activityLogs30d.forEach(r => {
    eventCounts[r.event_type] = (eventCounts[r.event_type] ?? 0) + 1
  })
  const eventBreakdown = Object.entries(eventCounts)
    .map(([event_type, count]) => ({ event_type, count }))
    .sort((a, b) => b.count - a.count)

  // Hourly heatmap (last 7 days)
  const hourCounts: Record<number, number> = {}
  ;(activityLogs7dRes.data ?? []).forEach(r => {
    const h = hourOf(r.created_at)
    hourCounts[h] = (hourCounts[h] ?? 0) + 1
  })
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourCounts[h] ?? 0 }))

  // Top keywords
  const keywordCounts: Record<string, number> = {}
  ;(searchLogs30dRes.data ?? []).forEach(r => {
    const q = (r.event_data as any)?.query
    if (typeof q === 'string' && q.trim()) {
      const k = q.trim().toLowerCase()
      keywordCounts[k] = (keywordCounts[k] ?? 0) + 1
    }
  })
  const topKeywords = Object.entries(keywordCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const recentLogins = recentLoginsRes.data ?? []

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-neutral-900">Analytics</h1>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Tổng đăng ký"
          value={totalSignUps}
          sub="Mọi thời điểm"
          icon={Users}
          color="border-emerald-100 bg-emerald-50"
        />
        <KpiCard
          label="Người dùng mới"
          value={newUsers30d}
          sub="30 ngày qua"
          icon={UserPlus}
          color="border-blue-100 bg-blue-50"
        />
        <KpiCard
          label="Lượt đăng nhập"
          value={signIns30d}
          sub="30 ngày qua"
          icon={LogIn}
          color="border-amber-100 bg-amber-50"
        />
        <KpiCard
          label="Sự kiện hoạt động"
          value={activity30d}
          sub="30 ngày qua"
          icon={Activity}
          color="border-violet-100 bg-violet-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sectionCard('Đăng ký mới theo ngày (14 ngày)', <BarChart data={dailyChartData} />)}
        {sectionCard('Phân bổ hành vi (30 ngày)', <DonutChart data={eventBreakdown} />)}
      </div>

      {/* Heatmap + keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {sectionCard('Giờ cao điểm theo giờ UTC+7 (7 ngày)', <HeatmapChart data={hourlyData} />)}
        </div>
        {sectionCard('Top từ khóa tìm kiếm (30 ngày)', <KeywordList keywords={topKeywords} />)}
      </div>

      {/* Recent logins */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-5">
        <h2 className="text-sm font-bold text-neutral-800 mb-4">Lịch sử đăng nhập gần đây</h2>
        <LoginHistoryTable rows={recentLogins as any} />
      </div>
    </div>
  )
}
