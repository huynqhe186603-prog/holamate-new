/**
 * verify_mau.mjs - Full MAU verification with proper pagination
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://prxagoffeoaggumqojdd.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1ODYzOSwiZXhwIjoyMDk1NzM0NjM5fQ.eC_bvwzzgDnS8TbyuFmtk1KFx5Me4en8NM1giHCZA28'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Fetch all rows with pagination
async function fetchAll(table, query) {
  const PAGE = 1000
  let rows = [], offset = 0
  while (true) {
    const { data, error } = await query(table, offset, PAGE)
    if (error) { console.error('fetch error:', error.message); break }
    if (!data?.length) break
    rows = rows.concat(data)
    if (data.length < PAGE) break
    offset += PAGE
  }
  return rows
}

async function main() {
  // Use a fixed cutoff based on the actual inserted data range (2026-06-05)
  // Since real system time might differ from the "simulated" 2026-07-05,
  // use a generous cutoff of 2026-06-01 to capture all inserted data
  const cutoff = '2026-06-01T00:00:00+07:00'
  console.log(`Cutoff: ${cutoff}`)

  // C1: ≥ 2 sign_in events
  const logins = await fetchAll('user_login_history', (t, offset, limit) =>
    supabase.from(t).select('user_id').eq('event_type','sign_in')
      .gte('created_at', cutoff).range(offset, offset+limit-1)
  )
  const loginMap = {}
  for (const r of logins) loginMap[r.user_id] = (loginMap[r.user_id]||0)+1
  const c1 = new Set(Object.entries(loginMap).filter(([,v])=>v>=2).map(([k])=>k))
  console.log(`C1 (≥2 sign_in): ${c1.size} users  (from ${logins.length} total login events)`)

  // C2: session ≥ 3 min via page_view events grouped by session_id
  const pvRows = await fetchAll('user_activity_logs', (t, offset, limit) =>
    supabase.from(t).select('user_id, session_id, created_at')
      .eq('event_type','page_view').gte('created_at', cutoff)
      .range(offset, offset+limit-1)
  )
  console.log(`  page_view events fetched: ${pvRows.length}`)
  const sessMap = {}
  for (const r of pvRows) {
    const k = `${r.user_id}|${r.session_id}`
    if (!sessMap[k]) sessMap[k] = { uid: r.user_id, min: r.created_at, max: r.created_at }
    else {
      if (r.created_at < sessMap[k].min) sessMap[k].min = r.created_at
      if (r.created_at > sessMap[k].max) sessMap[k].max = r.created_at
    }
  }
  const c2 = new Set()
  let longestSess = 0
  for (const { uid, min, max } of Object.values(sessMap)) {
    const durMin = (new Date(max)-new Date(min))/60000
    if (durMin > longestSess) longestSess = durMin
    if (durMin >= 3) c2.add(uid)
  }
  console.log(`C2 (session ≥3min): ${c2.size} users  (${Object.keys(sessMap).length} total sessions, longest: ${longestSess.toFixed(1)} min)`)

  // C3: ≥ 1 action event
  const actRows = await fetchAll('user_activity_logs', (t, offset, limit) =>
    supabase.from(t).select('user_id')
      .in('event_type',['view_vendor','search','use_ai','filter','checkout','write_review'])
      .gte('created_at', cutoff).range(offset, offset+limit-1)
  )
  const c3 = new Set(actRows.map(r=>r.user_id))
  console.log(`C3 (≥1 action): ${c3.size} users  (from ${actRows.length} total action events)`)

  const mau = new Set([...c1].filter(u=>c2.has(u)&&c3.has(u)))
  const { data: all } = await supabase.auth.admin.listUsers({ perPage:1000 })
  const total = all.users.filter(u=>!u.email.includes('holamate.app')).length
  const rate  = (mau.size/total*100).toFixed(1)

  console.log(`\n┌─────────────────────────────────────┐`)
  console.log(`│  MAU count:     ${String(mau.size).padStart(3)} / ${total} users   │`)
  console.log(`│  Activation:    ${String(rate).padStart(5)}%                │`)
  console.log(`└─────────────────────────────────────┘`)
  console.log(mau.size >= 200 ? '\n✅ MAU ≥ 200 ĐẠT YÊU CẦU!' : '\n⚠️  MAU < 200, cần thêm data')

  // Event breakdown
  const bdRows = await fetchAll('user_activity_logs', (t, offset, limit) =>
    supabase.from(t).select('event_type, user_id')
      .not('event_type','eq','page_view').gte('created_at', cutoff)
      .range(offset, offset+limit-1)
  )
  const evMap = {}
  for (const r of bdRows) {
    if (!evMap[r.event_type]) evMap[r.event_type] = { count:0, users:new Set() }
    evMap[r.event_type].count++
    evMap[r.event_type].users.add(r.user_id)
  }
  console.log('\nEvent breakdown:')
  for (const [k,v] of Object.entries(evMap).sort((a,b)=>b[1].count-a[1].count))
    console.log(`  ${k.padEnd(14)} ${String(v.count).padStart(5)} events  ${v.users.size} unique users`)
}

main().catch(console.error)
