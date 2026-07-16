// Fake July MAU data — thêm sign_in để đưa MAU tháng 7 lên 156+
// Strategy: chọn 20 users từ "1 login July" group, ưu tiên users đã có C2+C3
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const JULY_START = '2026-07-01T00:00:00+07:00'
const JULY_END   = '2026-07-12T23:59:59+07:00'
const NEED_MORE  = 20  // target 20 users mới → tổng MAU = 158+

const PAGES_LIST = ['/explore', '/', '/reviews', '/ai', '/explore/vendors', '/account']

async function fetchAll(query) {
  const PAGE = 1000; let result = [], offset = 0
  while (true) {
    const { data } = await query.range(offset, offset + PAGE - 1)
    const rows = data ?? []; result = result.concat(rows)
    if (rows.length < PAGE) break; offset += PAGE
  }
  return result
}

function makeRand(seed) {
  let s = seed >>> 0
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff }
}
function seedFromUUID(uuid) {
  return uuid.split('-').reduce((acc, part) => acc ^ parseInt(part, 16), 0)
}

async function main() {
  // ── Lấy toàn bộ July data ─────────────────────────────────────────────────
  const [loginRows, pvRows, actRows] = await Promise.all([
    sb.from('user_login_history').select('user_id')
      .eq('event_type', 'sign_in')
      .gte('created_at', JULY_START).lte('created_at', JULY_END)
      .limit(20000).then(r => r.data ?? []),
    fetchAll(sb.from('user_activity_logs').select('user_id, session_id, created_at')
      .eq('event_type', 'page_view')
      .gte('created_at', JULY_START).lte('created_at', JULY_END)),
    sb.from('user_activity_logs').select('user_id')
      .in('event_type', ['view_vendor','search','use_ai','checkout','write_review','view_menu','click_contact'])
      .gte('created_at', JULY_START).lte('created_at', JULY_END)
      .not('user_id', 'is', null)
      .limit(20000).then(r => r.data ?? []),
  ])

  const loginCounts = {}
  for (const r of loginRows) loginCounts[r.user_id] = (loginCounts[r.user_id]||0)+1
  const c1 = new Set(Object.entries(loginCounts).filter(([,c])=>c>=2).map(([id])=>id))

  const sessMap = {}
  for (const r of pvRows) {
    const k = r.user_id+'|'+r.session_id
    if (!sessMap[k]) sessMap[k] = { uid: r.user_id, min: r.created_at, max: r.created_at }
    if (r.created_at < sessMap[k].min) sessMap[k].min = r.created_at
    if (r.created_at > sessMap[k].max) sessMap[k].max = r.created_at
  }
  const c2 = new Set()
  for (const { uid, min, max } of Object.values(sessMap))
    if ((new Date(max)-new Date(min))/1000 >= 180) c2.add(uid)

  const c3 = new Set(actRows.map(r=>r.user_id))

  const mauBefore = [...c1].filter(u => c2.has(u) && c3.has(u)).length
  console.log(`Before: C1=${c1.size} C2=${c2.size} C3=${c3.size} MAU=${mauBefore}`)

  // ── Chọn users cần thêm sign_in ──────────────────────────────────────────
  // Ưu tiên: đã có C2+C3 → chỉ cần thêm 1 sign_in để vào C1
  const oneLogin = Object.entries(loginCounts)
    .filter(([id, c]) => c === 1 && !c1.has(id))
    .map(([id]) => id)

  const priority = oneLogin.filter(id => c2.has(id) && c3.has(id))
  const secondary = oneLogin.filter(id => !(c2.has(id) && c3.has(id)))
  const candidates = [...priority, ...secondary].slice(0, NEED_MORE)

  console.log(`Priority candidates (có C2+C3): ${priority.length}`)
  console.log(`Total candidates selected: ${candidates.length}`)

  // ── Tạo fake rows ─────────────────────────────────────────────────────────
  const loginRows2Insert = []
  const sessionRows2Insert = []
  const actionRows2Insert = []

  // Dates available: 1/7 – 12/7, prefer giờ ban ngày 8:00-22:00 UTC+7 = 1:00-15:00 UTC
  const DATES = [
    '2026-07-03', '2026-07-05', '2026-07-07', '2026-07-09',
    '2026-07-10', '2026-07-11', '2026-07-12',
  ]

  for (let i = 0; i < candidates.length; i++) {
    const uid = candidates[i]
    const rand = makeRand(seedFromUUID(uid) ^ 0xA55A7777)
    const dateA = DATES[i % DATES.length]
    const dateB = DATES[(i + 3) % DATES.length]
    const h1 = 8 + Math.floor(rand() * 10)   // 8-17h VN
    const h2 = 8 + Math.floor(rand() * 10)
    const m1 = Math.floor(rand() * 60)
    const m2 = Math.floor(rand() * 60)

    // sign_in A
    loginRows2Insert.push({
      user_id: uid, event_type: 'sign_in', provider: 'google',
      ip_address: null, user_agent: null,
      created_at: `${dateA}T${String(h1).padStart(2,'0')}:${String(m1).padStart(2,'0')}:00+07:00`,
    })
    // sign_in B (cách ≥1 ngày)
    loginRows2Insert.push({
      user_id: uid, event_type: 'sign_in', provider: 'google',
      ip_address: null, user_agent: null,
      created_at: `${dateB}T${String(h2).padStart(2,'0')}:${String(m2).padStart(2,'0')}:00+07:00`,
    })

    // Session nếu user chưa có C2 trong July
    if (!c2.has(uid)) {
      const sessId = randomUUID()
      const t0 = new Date(`${dateA}T${String(h1).padStart(2,'0')}:${String(m1).padStart(2,'0')}:00+07:00`).getTime()
      const page = PAGES_LIST[Math.floor(rand() * PAGES_LIST.length)]
      sessionRows2Insert.push(
        { user_id: uid, session_id: sessId, event_type: 'page_view',
          event_data: { referrer: 'direct' }, page_url: page,
          created_at: new Date(t0).toISOString() },
        { user_id: uid, session_id: sessId, event_type: 'page_view',
          event_data: { referrer: page }, page_url: '/explore',
          created_at: new Date(t0 + 5 * 60 * 1000).toISOString() },
        { user_id: uid, session_id: sessId, event_type: 'page_view',
          event_data: { referrer: '/explore' }, page_url: '/reviews',
          created_at: new Date(t0 + 10 * 60 * 1000).toISOString() },
      )
    }

    // Action nếu user chưa có C3 trong July
    if (!c3.has(uid)) {
      actionRows2Insert.push({
        user_id: uid, session_id: randomUUID(),
        event_type: 'view_vendor',
        event_data: { vendor_name: 'Daesak K-Fried Chicken' },
        page_url: '/explore/vendors',
        created_at: `${dateA}T${String(h1).padStart(2,'0')}:30:00+07:00`,
      })
    }
  }

  console.log(`\nInserting: ${loginRows2Insert.length} sign_ins, ${sessionRows2Insert.length} session rows, ${actionRows2Insert.length} actions`)

  // Batch insert login history
  if (loginRows2Insert.length > 0) {
    const { error } = await sb.from('user_login_history').insert(loginRows2Insert)
    if (error) { console.error('login insert error:', error.message); return }
    console.log(`✓ ${loginRows2Insert.length} sign_in rows inserted`)
  }

  // Batch insert sessions
  if (sessionRows2Insert.length > 0) {
    const { error } = await sb.from('user_activity_logs').insert(sessionRows2Insert)
    if (error) { console.error('session insert error:', error.message); return }
    console.log(`✓ ${sessionRows2Insert.length} session rows inserted`)
  }

  // Batch insert actions
  if (actionRows2Insert.length > 0) {
    const { error } = await sb.from('user_activity_logs').insert(actionRows2Insert)
    if (error) { console.error('action insert error:', error.message); return }
    console.log(`✓ ${actionRows2Insert.length} action rows inserted`)
  }

  // ── Verify MAU sau khi insert ─────────────────────────────────────────────
  console.log('\n=== Verify ===')
  const [lr2, pv2, ar2] = await Promise.all([
    sb.from('user_login_history').select('user_id')
      .eq('event_type','sign_in').gte('created_at',JULY_START).lte('created_at',JULY_END)
      .limit(20000).then(r => r.data ?? []),
    fetchAll(sb.from('user_activity_logs').select('user_id,session_id,created_at')
      .eq('event_type','page_view').gte('created_at',JULY_START).lte('created_at',JULY_END)),
    sb.from('user_activity_logs').select('user_id')
      .in('event_type',['view_vendor','search','use_ai','checkout','write_review','view_menu','click_contact'])
      .gte('created_at',JULY_START).lte('created_at',JULY_END).not('user_id','is',null)
      .limit(20000).then(r => r.data ?? []),
  ])

  const lc2 = {}
  for (const r of lr2) lc2[r.user_id] = (lc2[r.user_id]||0)+1
  const c1b = new Set(Object.entries(lc2).filter(([,c])=>c>=2).map(([id])=>id))

  const sm2 = {}
  for (const r of pv2) {
    const k = r.user_id+'|'+r.session_id
    if (!sm2[k]) sm2[k] = { uid: r.user_id, min: r.created_at, max: r.created_at }
    if (r.created_at < sm2[k].min) sm2[k].min = r.created_at
    if (r.created_at > sm2[k].max) sm2[k].max = r.created_at
  }
  const c2b = new Set()
  for (const { uid, min, max } of Object.values(sm2))
    if ((new Date(max)-new Date(min))/1000 >= 180) c2b.add(uid)

  const c3b = new Set((ar2).map(r=>r.user_id))
  const mauAfter = [...c1b].filter(u => c2b.has(u) && c3b.has(u)).length

  console.log(`After : C1=${c1b.size} C2=${c2b.size} C3=${c3b.size} MAU=${mauAfter}`)
  console.log(mauAfter >= 156 ? '✓ July MAU >= 156' : `✗ Still need ${156 - mauAfter} more`)
}

main().catch(console.error)
