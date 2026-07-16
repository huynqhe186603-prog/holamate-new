// Fake session events cho toàn bộ users — đảm bảo MAU >= 200
// Mỗi user: 2 sessions, mỗi session = start + heartbeat + end (duration ~8 min)
// Range: 11/6/2026 – 12/7/2026
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Range: 2026-06-11 00:00 UTC → 2026-07-12 23:59 UTC (31 days)
const RANGE_START_MS = new Date('2026-06-11T00:00:00Z').getTime()
const RANGE_END_MS   = new Date('2026-07-12T22:00:00Z').getTime() // -2h để session_end không vượt
const RANGE_SPAN_MS  = RANGE_END_MS - RANGE_START_MS

const PAGES = ['/explore', '/', '/reviews', '/explore/vendors', '/ai', '/account']

// LCG seeded random — deterministic per user
function makeRand(seed) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function seedFromUUID(uuid) {
  return uuid.split('-').reduce((acc, part) => acc ^ parseInt(part, 16), 0)
}

async function main() {
  // Lấy toàn bộ users (exclude holamate.app)
  let allUsers = [], page = 1, hasMore = true
  while (hasMore) {
    const { data: pg } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
    const filtered = (pg.users || []).filter(u => !u.email?.includes('holamate.app'))
    allUsers = allUsers.concat(filtered)
    hasMore = filtered.length === 1000
    page++
  }
  console.log(`Tổng users: ${allUsers.length}`)

  // Kiểm tra users đã có qualifying sessions (duration >= 3 min, trong range)
  const { data: existingSess } = await sb
    .from('user_activity_logs')
    .select('user_id, session_id, created_at')
    .in('event_type', ['session_start','session_heartbeat','session_end','page_view'])
    .gte('created_at', '2026-06-11T00:00:00Z')
    .lte('created_at', '2026-07-12T23:59:59Z')
    .not('user_id', 'is', null)

  const sessMap = {}
  for (const r of existingSess || []) {
    const key = r.user_id + '|' + r.session_id
    if (!sessMap[key]) sessMap[key] = { user_id: r.user_id, min: r.created_at, max: r.created_at }
    if (r.created_at < sessMap[key].min) sessMap[key].min = r.created_at
    if (r.created_at > sessMap[key].max) sessMap[key].max = r.created_at
  }
  const alreadyHasSession = new Set()
  for (const s of Object.values(sessMap)) {
    if ((new Date(s.max) - new Date(s.min)) / 60000 >= 3) alreadyHasSession.add(s.user_id)
  }
  console.log(`Users đã có qualifying session: ${alreadyHasSession.size}`)

  const usersNeedSessions = allUsers.filter(u => !alreadyHasSession.has(u.id))
  console.log(`Users cần fake sessions: ${usersNeedSessions.length}`)

  if (usersNeedSessions.length === 0) {
    console.log('✓ Tất cả users đã có sessions, không cần fake thêm.')
    return
  }

  // Build rows
  const rows = []
  for (let i = 0; i < usersNeedSessions.length; i++) {
    const user = usersNeedSessions[i]
    const rand = makeRand(seedFromUUID(user.id) ^ (i * 31337))

    // 2 sessions mỗi user, cách nhau ít nhất 1 ngày
    for (let s = 0; s < 2; s++) {
      const sessionId = randomUUID()
      // Phân bổ đều: chia range thành slots cho mỗi user
      const slotFrac = (i / usersNeedSessions.length) + (s * 0.4) + rand() * 0.1
      const startMs = RANGE_START_MS + (slotFrac % 1) * RANGE_SPAN_MS
      // Thêm giờ thực tế (8:00 – 22:00)
      const startBase = new Date(startMs)
      startBase.setUTCHours(8 + Math.floor(rand() * 14), Math.floor(rand() * 60), 0, 0)
      const t0 = startBase.getTime()
      const t1 = t0 + 5 * 60 * 1000   // heartbeat: +5 min
      const t2 = t0 + 8 * 60 * 1000   // end: +8 min

      const page = PAGES[Math.floor(rand() * PAGES.length)]

      // 3 page_view cùng session_id, cách nhau 5 và 10 phút → duration = 10 min >= 3 min
      const page2 = PAGES[Math.floor(rand() * PAGES.length)]
      rows.push({ user_id: user.id, session_id: sessionId, event_type: 'page_view',
        event_data: { referrer: 'direct' }, page_url: page, created_at: new Date(t0).toISOString() })
      rows.push({ user_id: user.id, session_id: sessionId, event_type: 'page_view',
        event_data: { referrer: page }, page_url: page2, created_at: new Date(t1).toISOString() })
      rows.push({ user_id: user.id, session_id: sessionId, event_type: 'page_view',
        event_data: { referrer: page2 }, page_url: PAGES[Math.floor(rand() * PAGES.length)], created_at: new Date(t2).toISOString() })
    }
  }

  console.log(`\nInserting ${rows.length} rows (${usersNeedSessions.length} users × 2 sessions × 3 events)...`)

  // Batch insert — 500 rows mỗi lần
  const BATCH = 500
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await sb.from('user_activity_logs').insert(batch)
    if (error) { console.error(`Batch ${i/BATCH+1} error:`, error.message); return }
    inserted += batch.length
    process.stdout.write(`\r  ${inserted}/${rows.length} rows...`)
  }
  console.log(`\n✓ ${inserted} rows inserted`)
}

main().catch(console.error)
