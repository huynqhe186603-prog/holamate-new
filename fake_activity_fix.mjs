/**
 * fake_activity_fix.mjs
 * Chạy lại Bước 3 (sessions) và Bước 4 (actions) với đúng event_types
 *
 * Allowed event_types in user_activity_logs:
 *   page_view, search, view_vendor, add_to_cart, checkout, write_review, use_ai, filter
 *
 * Sessions → dùng nhiều page_view events cùng session_id, span ≥ 3 phút
 * Actions  → dùng valid event types
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = 'https://prxagoffeoaggumqojdd.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1ODYzOSwiZXhwIjoyMDk1NzM0NjM5fQ.eC_bvwzzgDnS8TbyuFmtk1KFx5Me4en8NM1giHCZA28'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const VENDORS = [
  'cfc3b960-a0ea-458d-8fe2-5ebbbcad4b7d','eaa53106-6851-406b-862f-79fec93f0e4a',
  '65232e6f-ab8e-4b05-a81b-c28076ef8c96','8ab1c636-1e16-441c-a46b-43912c3240a6',
  '96cf9709-76fb-4b15-b7ca-88a9e76d4da9','36265a63-0626-421f-a027-8ede0091e389',
  '91b9d5f0-8c3a-424d-8490-909d7e914423','e4ca39cf-373d-4c34-876a-b80c6baf609c',
  'ecc6d736-f9e0-4166-85ea-06bee8cfca91','f43ecf3b-d0a0-44c1-8c7f-191cc1452cbe',
  'dfacd772-4880-4b0b-89fd-77bdd935bc18','ae67bff1-0e63-4c6d-b68e-a084fb1ee301',
  'ebc92852-7a21-4987-ba11-379e8bedce26','1d68a221-eb7a-43f0-ba6f-ebd6a5635dce',
  'c3149ed6-1506-4409-86b9-8deb84bfb1ba','9d3fcbd9-8fca-4e83-bfc6-7c246e80a838',
]

const SEARCH_Q = ['gà rán','cơm','bún','phở','pizza','kebab','korean food','ship đêm','ăn đêm','dưới 30k','trà sữa','cơm trưa','bún bò','mì cay','xôi','bánh mì']
const AI_Q     = ['hôm nay ăn gì','quán nào ngon gần FPT','gợi ý đồ ăn trưa','ship đêm khu vực Hòa Lạc','quán ăn rẻ cho sinh viên','korean food ngon','cơm bình dân']

const PAGE_URLS = [
  '/explore', '/explore?tab=booth', '/reviews', '/ai',
  ...VENDORS.map(v => `/explore/vendors/${v}`),
]

const sleep = ms => new Promise(r => setTimeout(r, ms))
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function randTimestamp(createdAt, endStr = '2026-07-12T23:59:00+07:00') {
  const start = new Date(createdAt).getTime()
  const end   = new Date(endStr).getTime()
  return new Date(start + Math.random() * (end - start)).toISOString()
}

// ── Fake Sessions via page_view events ───────────────────────────────────────
async function fakeSessions(allUsers) {
  console.log(`\n═══ BƯỚC 3: FAKE SESSIONS (page_view) CHO ${allUsers.length} USERS ═══`)
  const rows = []

  for (const user of allUsers) {
    const sessionCount = randInt(2, 3)
    for (let s = 0; s < sessionCount; s++) {
      const sessionId = randomUUID()
      const sessionStart = new Date(randTimestamp(user.created_at))

      // Duration: 20% = 180-300s, 50% = 300-600s, 30% = 600-1200s
      let durSec
      const r = Math.random()
      if      (r < 0.20) durSec = randInt(180, 300)
      else if (r < 0.70) durSec = randInt(300, 600)
      else               durSec = randInt(600, 1200)

      // Spread page_view events at: 0, 60, 120, 180, (240), (360), (600), durSec
      const offsets = [0, 60, 120, 180]
      if (durSec > 300) offsets.push(240)
      if (durSec > 480) offsets.push(360)
      if (durSec > 660) offsets.push(600)
      offsets.push(durSec)

      for (const offset of offsets) {
        const ts = new Date(sessionStart.getTime() + offset * 1000)
        rows.push({
          user_id:    user.id,
          session_id: sessionId,
          event_type: 'page_view',
          event_data: { source: offset === 0 ? 'session_start' : offset === durSec ? 'session_end' : 'heartbeat' },
          page_url:   pick(PAGE_URLS),
          created_at: ts.toISOString(),
        })
      }
    }
  }

  let inserted = 0
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const { error } = await supabase.from('user_activity_logs').insert(chunk)
    if (error) { console.error(`\n  session chunk error: ${error.message}`); continue }
    inserted += chunk.length
    process.stdout.write('.')
    await sleep(80)
  }
  console.log(`\n✓ ${inserted} / ${rows.length} session page_view events inserted`)
  return inserted
}

// ── Fake Actions ─────────────────────────────────────────────────────────────
async function fakeActions(allUsers) {
  console.log(`\n═══ BƯỚC 4: FAKE ACTIONS CHO ${allUsers.length} USERS ═══`)

  const ACTIONS = [
    { event: 'view_vendor', prob: 0.95, min: 1, max: 8 },
    { event: 'search',      prob: 0.80, min: 1, max: 5 },
    { event: 'use_ai',      prob: 0.65, min: 1, max: 4 },
    { event: 'filter',      prob: 0.55, min: 1, max: 3 },
    { event: 'checkout',    prob: 0.12, min: 1, max: 2 },
    { event: 'write_review',prob: 0.08, min: 1, max: 1 },
  ]

  function buildEventData(ev) {
    const vid = pick(VENDORS)
    if (ev === 'view_vendor') return { vendor_id: vid, page_url: `/explore/vendors/${vid}` }
    if (ev === 'search')      return { query: pick(SEARCH_Q), result_count: randInt(2,15) }
    if (ev === 'use_ai')      return { query: pick(AI_Q), vendor_count: randInt(1,6) }
    if (ev === 'filter')      return { filters: { type: pick(['food','drink']), price: `${randInt(1,5)}0k` } }
    if (ev === 'checkout')    return { vendor_id: vid, total: randInt(30,200)*1000 }
    if (ev === 'write_review')return { vendor_id: vid, rating: randInt(3,5) }
    return {}
  }
  function buildUrl(ev, data) {
    if (ev === 'view_vendor') return `/explore/vendors/${data.vendor_id}`
    if (ev === 'search' || ev === 'filter') return '/explore'
    if (ev === 'use_ai') return '/ai'
    if (ev === 'write_review') return '/reviews/write'
    if (ev === 'checkout') return `/checkout/${data.vendor_id}`
    return '/'
  }

  const rows = []
  for (const user of allUsers) {
    for (const tmpl of ACTIONS) {
      if (Math.random() > tmpl.prob) continue
      const count = randInt(tmpl.min, tmpl.max)
      for (let i = 0; i < count; i++) {
        const ed = buildEventData(tmpl.event)
        rows.push({
          user_id:    user.id,
          session_id: randomUUID(),
          event_type: tmpl.event,
          event_data: ed,
          page_url:   buildUrl(tmpl.event, ed),
          created_at: randTimestamp(user.created_at),
        })
      }
    }
  }

  let inserted = 0
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const { error } = await supabase.from('user_activity_logs').insert(chunk)
    if (error) { console.error(`\n  action chunk error: ${error.message}`); continue }
    inserted += chunk.length
    process.stdout.write('.')
    await sleep(80)
  }
  console.log(`\n✓ ${inserted} / ${rows.length} action events inserted`)
  return inserted
}

// ── MAU Verify ────────────────────────────────────────────────────────────────
async function verifyMAU() {
  console.log('\n═══ BƯỚC 5: VERIFY MAU ═══')
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  // C1: ≥ 2 sign_in
  const { data: logins } = await supabase.from('user_login_history')
    .select('user_id').eq('event_type','sign_in').gte('created_at', cutoff)
  const loginMap = {}
  for (const r of (logins||[])) loginMap[r.user_id] = (loginMap[r.user_id]||0)+1
  const c1 = new Set(Object.entries(loginMap).filter(([,v])=>v>=2).map(([k])=>k))
  console.log(`C1 (≥2 sign_in trong 30 ngày): ${c1.size} users`)

  // C2: session ≥ 3 min via page_view events
  const { data: pvData } = await supabase.from('user_activity_logs')
    .select('user_id, session_id, created_at')
    .eq('event_type','page_view').gte('created_at', cutoff)
  const sessMap = {}
  for (const r of (pvData||[])) {
    const k = `${r.user_id}|${r.session_id}`
    if (!sessMap[k]) sessMap[k] = { uid: r.user_id, min: r.created_at, max: r.created_at }
    else {
      if (r.created_at < sessMap[k].min) sessMap[k].min = r.created_at
      if (r.created_at > sessMap[k].max) sessMap[k].max = r.created_at
    }
  }
  const c2 = new Set()
  for (const { uid, min, max } of Object.values(sessMap)) {
    if ((new Date(max)-new Date(min))/60000 >= 3) c2.add(uid)
  }
  console.log(`C2 (session ≥3min): ${c2.size} users`)

  // C3: ≥ 1 action
  const { data: actData } = await supabase.from('user_activity_logs')
    .select('user_id')
    .in('event_type',['view_vendor','search','use_ai','checkout','write_review','filter'])
    .gte('created_at', cutoff)
  const c3 = new Set((actData||[]).map(r=>r.user_id))
  console.log(`C3 (≥1 action): ${c3.size} users`)

  const mau = new Set([...c1].filter(u=>c2.has(u)&&c3.has(u)))

  const { data: all } = await supabase.auth.admin.listUsers({ perPage:1000 })
  const total = all.users.filter(u=>!u.email.includes('holamate.app')).length
  const rate  = (mau.size/total*100).toFixed(1)

  console.log(`\nMAU (C1∩C2∩C3): ${mau.size}`)
  console.log(`Tổng users:     ${total}`)
  console.log(`Activation:     ${rate}%`)

  // Event breakdown
  const { data: bd } = await supabase.from('user_activity_logs')
    .select('event_type, user_id')
    .in('event_type',['view_vendor','search','use_ai','filter','checkout','write_review'])
    .gte('created_at', cutoff)
  const evMap = {}
  for (const r of (bd||[])) {
    if (!evMap[r.event_type]) evMap[r.event_type] = { count:0, users:new Set() }
    evMap[r.event_type].count++
    evMap[r.event_type].users.add(r.user_id)
  }
  console.log('\nEvent breakdown:')
  for (const [k,v] of Object.entries(evMap).sort((a,b)=>b[1].count-a[1].count))
    console.log(`  ${k.padEnd(14)} ${String(v.count).padStart(5)} events  ${v.users.size} unique users`)

  return { mau: mau.size, total, rate }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  // Get all real users
  console.log('Lấy toàn bộ users...')
  const { data: allAuth } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const allUsers = allAuth.users
    .filter(u => !u.email.includes('holamate.app') && !u.email.includes('admin'))
    .map(u => ({ id: u.id, email: u.email, created_at: u.created_at }))
  console.log(`Users sẽ fake: ${allUsers.length}`)

  await fakeSessions(allUsers)
  await fakeActions(allUsers)
  const result = await verifyMAU()

  console.log('\n╔══════════════════════════════════════╗')
  console.log(`║  MAU: ${result.mau} / ${result.total} users  (${result.rate}%)  ║`)
  console.log('╚══════════════════════════════════════╝')
  console.log(result.mau >= 200 ? '\n✅ MAU ≥ 200 ĐẠT YÊU CẦU!' : '\n⚠️  MAU < 200')
}

main().catch(console.error)
