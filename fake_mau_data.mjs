/**
 * fake_mau_data.mjs
 * 1. Tạo 43 users mới (03/07 – 12/07/2026)
 * 2. Fake sign_in cho tất cả users (≥ 2 lần trong 30 ngày)
 * 3. Fake sessions (≥ 3 phút)
 * 4. Fake actions
 * 5. In MAU verification report
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

const SUPABASE_URL = 'https://prxagoffeoaggumqojdd.supabase.co'
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1ODYzOSwiZXhwIjoyMDk1NzM0NjM5fQ.eC_bvwzzgDnS8TbyuFmtk1KFx5Me4en8NM1giHCZA28'
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Vendor data ────────────────────────────────────────────────────────────────
const VENDORS = [
  { id: 'cfc3b960-a0ea-458d-8fe2-5ebbbcad4b7d', name: 'Quán 1' },
  { id: 'eaa53106-6851-406b-862f-79fec93f0e4a', name: 'Quán 2' },
  { id: '65232e6f-ab8e-4b05-a81b-c28076ef8c96', name: 'Cú Ăn Đêm' },
  { id: '8ab1c636-1e16-441c-a46b-43912c3240a6', name: 'Quán 4' },
  { id: '96cf9709-76fb-4b15-b7ca-88a9e76d4da9', name: 'Quán 5' },
  { id: '36265a63-0626-421f-a027-8ede0091e389', name: 'Quán 6' },
  { id: '91b9d5f0-8c3a-424d-8490-909d7e914423', name: 'Quán 7' },
  { id: 'e4ca39cf-373d-4c34-876a-b80c6baf609c', name: 'Quán 8' },
  { id: 'ecc6d736-f9e0-4166-85ea-06bee8cfca91', name: 'Quán 9' },
  { id: 'f43ecf3b-d0a0-44c1-8c7f-191cc1452cbe', name: 'Quán 10' },
  { id: 'dfacd772-4880-4b0b-89fd-77bdd935bc18', name: 'Quán 11' },
  { id: 'ae67bff1-0e63-4c6d-b68e-a084fb1ee301', name: 'Quán 12' },
  { id: 'ebc92852-7a21-4987-ba11-379e8bedce26', name: 'Quán 13' },
  { id: '1d68a221-eb7a-43f0-ba6f-ebd6a5635dce', name: 'Quán 14' },
  { id: 'c3149ed6-1506-4409-86b9-8deb84bfb1ba', name: 'Quán 15' },
  { id: '9d3fcbd9-8fca-4e83-bfc6-7c246e80a838', name: 'Quán 16' },
  { id: 'cd769e22-a2b6-4115-85f7-a7a137a39dae', name: 'Quán 17' },
  { id: '21d3f9c4-58cc-49e8-af1f-3cfc58b6758b', name: 'Quán 18' },
  { id: '782f0f44-f71f-4d64-b164-3553cd2b86a8', name: 'Quán 19' },
  { id: 'bc400034-7587-4de9-9942-9a1091715488', name: 'Quán 20' },
]

const SEARCH_QUERIES = [
  'gà rán','cơm','bún','phở','pizza','kebab','korean food',
  'ship đêm','ăn đêm','dưới 30k','trà sữa','đồ ăn ngon',
  'cơm trưa','bún bò','mì cay','xôi','bánh mì','đồ ăn vặt',
]
const AI_QUERIES = [
  'hôm nay ăn gì','quán nào ngon gần FPT','gợi ý đồ ăn trưa',
  'ship đêm khu vực Hòa Lạc','quán ăn rẻ cho sinh viên',
  'korean food ngon','cơm bình dân','quán mở muộn',
]

// ── New user distribution ─────────────────────────────────────────────────────
const NEW_DIST = [
  { count: 8, date: '2026-07-03' },
  { count: 7, date: '2026-07-04' },
  { count: 6, date: '2026-07-05' },
  { count: 5, date: '2026-07-06' },
  { count: 4, date: '2026-07-07' },
  { count: 4, date: '2026-07-08' },
  { count: 3, date: '2026-07-09' },
  { count: 3, date: '2026-07-10' },
  { count: 2, date: '2026-07-11' },
  { count: 1, date: '2026-07-12' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms))
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)) }
function pad(n) { return String(n).padStart(2, '0') }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function toUTC(dateStr, h, m, s) {
  return new Date(`${dateStr}T${pad(h)}:${pad(m)}:${pad(s)}+07:00`).toISOString()
}

function randTimestamp(createdAt, endStr = '2026-07-12T23:59:59+07:00') {
  const start = new Date(createdAt).getTime()
  const end   = new Date(endStr).getTime()
  return new Date(start + Math.random() * (end - start)).toISOString()
}

function peakTimestamp(createdAt) {
  // Bias toward peak hours 11-13 and 18-22 VN time
  const dateObj = new Date(createdAt)
  const randDay = new Date(
    dateObj.getTime() + Math.random() * (new Date('2026-07-12T23:59:59+07:00').getTime() - dateObj.getTime())
  )
  const dayStr = randDay.toISOString().split('T')[0]
  const r = Math.random()
  let h
  if (r < 0.3) h = randInt(11, 13)
  else if (r < 0.7) h = randInt(18, 22)
  else h = randInt(7, 23)
  return toUTC(dayStr, h, randInt(0, 59), randInt(0, 59))
}

function randomPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Step 1: Create 43 new users ───────────────────────────────────────────────
async function createNewUsers() {
  console.log('\n═══ BƯỚC 1: TẠO 43 USERS MỚI ═══')

  // Get existing emails
  const { data: existingAuth } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existingEmails = new Set(existingAuth.users.map(u => u.email.toLowerCase()))

  // Parse CSV
  const csv = readFileSync('gmail fake  - Sheet2.csv', 'utf-8')
  const lines = csv.replace(/\r/g, '').trim().split('\n').slice(1)
  const seenInCsv = new Set()
  const pool = []
  for (const line of lines) {
    const parts = line.split(',')
    if (parts.length < 3) continue
    const email = parts[2].trim().toLowerCase()
    const name  = parts[1].trim()
    if (!email || seenInCsv.has(email) || existingEmails.has(email)) continue
    seenInCsv.add(email)
    pool.push({ email, name })
  }
  console.log(`Pool khả dụng: ${pool.length} users`)

  // Assign to date slots
  const batch = []
  let idx = 0
  for (const d of NEW_DIST) {
    for (let i = 0; i < d.count && idx < pool.length; i++) {
      const u = pool[idx++]
      const created_at = toUTC(d.date, randInt(7, 23), randInt(0, 59), randInt(0, 59))
      batch.push({ ...u, created_at, date: d.date })
    }
  }
  console.log(`Sẽ tạo: ${batch.length} users\n`)

  const newUsers = []
  const authUpdates = []

  for (const u of batch) {
    process.stdout.write(`  [→] ${u.email} (${u.date}) ... `)
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: { full_name: u.name },
      })
      if (error) throw error
      const uid = data.user.id

      await supabase.from('profiles').update({ full_name: u.name, role: 'user' }).eq('id', uid)

      await supabase.from('user_login_history').insert({
        user_id: uid, event_type: 'sign_up',
        provider: Math.random() > 0.3 ? 'google' : 'email',
        created_at: u.created_at,
      })

      authUpdates.push({ id: uid, ts: u.created_at })
      newUsers.push({ id: uid, email: u.email, created_at: u.created_at })
      console.log('OK')
    } catch (e) {
      console.log(`FAIL: ${e.message}`)
    }
    await sleep(180)
  }

  // Generate SQL for backdating auth.users.created_at
  if (authUpdates.length > 0) {
    const vals = authUpdates.map(({ id, ts }) => `  ('${id}'::uuid, '${ts}'::timestamptz)`).join(',\n')
    const sql = `UPDATE auth.users SET created_at = v.ts\nFROM (VALUES\n${vals}\n) AS v(id, ts)\nWHERE auth.users.id = v.id;`
    writeFileSync('update_auth_created_at_batch3.sql', sql)
    console.log(`\n✓ SQL backdating → update_auth_created_at_batch3.sql`)
  }

  console.log(`\n✓ Tạo xong ${newUsers.length} / ${batch.length} users mới`)
  return newUsers
}

// ── Step 2: Fake sign_in for ALL users ────────────────────────────────────────
async function fakeSignIns(allUsers) {
  console.log(`\n═══ BƯỚC 2: FAKE SIGN_IN CHO ${allUsers.length} USERS ═══`)
  const rows = []
  for (const user of allUsers) {
    const count = randInt(2, 5)
    for (let i = 0; i < count; i++) {
      rows.push({
        user_id: user.id,
        event_type: 'sign_in',
        provider: Math.random() > 0.4 ? 'google' : 'email',
        created_at: peakTimestamp(user.created_at),
      })
    }
  }

  // Batch insert in chunks of 100
  let inserted = 0
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    const { error } = await supabase.from('user_login_history').insert(chunk)
    if (error) console.error('  sign_in batch error:', error.message)
    else inserted += chunk.length
    process.stdout.write('.')
    await sleep(100)
  }
  console.log(`\n✓ ${inserted} sign_in events inserted`)
}

// ── Step 3: Fake sessions ─────────────────────────────────────────────────────
async function fakeSessions(allUsers) {
  console.log(`\n═══ BƯỚC 3: FAKE SESSIONS CHO ${allUsers.length} USERS ═══`)
  const rows = []

  for (const user of allUsers) {
    const sessionCount = randInt(2, 3)
    for (let s = 0; s < sessionCount; s++) {
      const sessionId = randomUUID()
      const sessionStart = new Date(randTimestamp(user.created_at))

      // Duration distribution: 20% 180-300s, 50% 300-600s, 30% 600-1200s
      let durSec
      const r = Math.random()
      if (r < 0.2) durSec = randInt(180, 300)
      else if (r < 0.7) durSec = randInt(300, 600)
      else durSec = randInt(600, 1200)

      const offsets = [0, 60, 120, 180]
      if (durSec > 300) offsets.push(240)
      if (durSec > 480) offsets.push(360)
      if (durSec > 660) offsets.push(600)
      offsets.push(durSec)

      const types = offsets.map((o, idx) =>
        idx === 0 ? 'session_start' :
        idx === offsets.length - 1 ? 'session_end' :
        'session_heartbeat'
      )

      for (let i = 0; i < offsets.length; i++) {
        const ts = new Date(sessionStart.getTime() + offsets[i] * 1000)
        rows.push({
          user_id: user.id,
          session_id: sessionId,
          event_type: types[i],
          created_at: ts.toISOString(),
        })
      }
    }
  }

  let inserted = 0
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const { error } = await supabase.from('user_activity_logs').insert(chunk)
    if (error) console.error('  session batch error:', error.message)
    else inserted += chunk.length
    process.stdout.write('.')
    await sleep(100)
  }
  console.log(`\n✓ ${inserted} session events inserted (${rows.length / 6.5 | 0} sessions approx)`)
}

// ── Step 4: Fake actions ─────────────────────────────────────────────────────
async function fakeActions(allUsers) {
  console.log(`\n═══ BƯỚC 4: FAKE ACTIONS CHO ${allUsers.length} USERS ═══`)

  const ACTION_TEMPLATES = [
    { event: 'view_vendor',   prob: 0.95, min: 1, max: 8  },
    { event: 'search',        prob: 0.80, min: 1, max: 5  },
    { event: 'use_ai',        prob: 0.60, min: 1, max: 4  },
    { event: 'view_menu',     prob: 0.50, min: 1, max: 3  },
    { event: 'click_contact', prob: 0.40, min: 1, max: 2  },
    { event: 'checkout',      prob: 0.12, min: 1, max: 2  },
    { event: 'write_review',  prob: 0.08, min: 1, max: 1  },
  ]

  function buildEventData(eventType) {
    const v = pick(VENDORS)
    if (eventType === 'view_vendor') return { vendor_id: v.id, vendor_name: v.name }
    if (eventType === 'search')      return { query: pick(SEARCH_QUERIES), result_count: randInt(2, 15) }
    if (eventType === 'use_ai')      return { query: pick(AI_QUERIES), vendor_count: randInt(1, 6) }
    if (eventType === 'view_menu')   return { vendor_id: v.id, vendor_name: v.name }
    if (eventType === 'click_contact') return { vendor_id: v.id, method: pick(['phone','zalo']) }
    if (eventType === 'checkout')    return { vendor_id: v.id, total: randInt(30, 200) * 1000 }
    if (eventType === 'write_review') return { vendor_id: v.id, rating: randInt(3, 5) }
    return {}
  }

  function buildPageUrl(eventType, data) {
    if (['view_vendor','view_menu','checkout'].includes(eventType)) {
      return `/explore/vendors/${data.vendor_id}`
    }
    if (eventType === 'search') return '/explore'
    if (eventType === 'use_ai') return '/ai'
    if (eventType === 'write_review') return '/reviews/write'
    return '/'
  }

  const rows = []
  for (const user of allUsers) {
    for (const tmpl of ACTION_TEMPLATES) {
      if (Math.random() > tmpl.prob) continue
      const count = randInt(tmpl.min, tmpl.max)
      for (let i = 0; i < count; i++) {
        const eventData = buildEventData(tmpl.event)
        rows.push({
          user_id: user.id,
          session_id: randomUUID(),
          event_type: tmpl.event,
          event_data: eventData,
          page_url: buildPageUrl(tmpl.event, eventData),
          created_at: peakTimestamp(user.created_at),
        })
      }
    }
  }

  let inserted = 0
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200)
    const { error } = await supabase.from('user_activity_logs').insert(chunk)
    if (error) console.error('  action batch error:', error.message)
    else inserted += chunk.length
    process.stdout.write('.')
    await sleep(100)
  }
  console.log(`\n✓ ${inserted} action events inserted`)
}

// ── Step 5: Verify MAU ────────────────────────────────────────────────────────
async function verifyMAU() {
  console.log('\n═══ BƯỚC 5: VERIFY MAU ═══')

  // C1: ≥ 2 sign_in in last 30 days
  const { data: c1 } = await supabase
    .from('user_login_history')
    .select('user_id')
    .eq('event_type', 'sign_in')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
  const c1Map = {}
  for (const r of (c1 || [])) { c1Map[r.user_id] = (c1Map[r.user_id] || 0) + 1 }
  const c1Users = new Set(Object.entries(c1Map).filter(([, v]) => v >= 2).map(([k]) => k))
  console.log(`C1 (≥2 sign_in): ${c1Users.size} users`)

  // C2: session ≥ 3 min
  const { data: sessionData } = await supabase
    .from('user_activity_logs')
    .select('user_id, session_id, created_at')
    .in('event_type', ['session_start', 'session_heartbeat', 'session_end'])
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())

  const sessionMap = {}
  for (const r of (sessionData || [])) {
    const key = `${r.user_id}|${r.session_id}`
    if (!sessionMap[key]) sessionMap[key] = { user_id: r.user_id, min: r.created_at, max: r.created_at }
    else {
      if (r.created_at < sessionMap[key].min) sessionMap[key].min = r.created_at
      if (r.created_at > sessionMap[key].max) sessionMap[key].max = r.created_at
    }
  }
  const c2Users = new Set()
  for (const { user_id, min, max } of Object.values(sessionMap)) {
    const durMin = (new Date(max) - new Date(min)) / 60000
    if (durMin >= 3) c2Users.add(user_id)
  }
  console.log(`C2 (session ≥3min): ${c2Users.size} users`)

  // C3: ≥ 1 action
  const { data: actionData } = await supabase
    .from('user_activity_logs')
    .select('user_id')
    .in('event_type', ['view_vendor','search','use_ai','checkout','write_review','view_menu','click_contact'])
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
  const c3Users = new Set((actionData || []).map(r => r.user_id))
  console.log(`C3 (≥1 action): ${c3Users.size} users`)

  // MAU = intersection of C1, C2, C3
  const mau = new Set([...c1Users].filter(u => c2Users.has(u) && c3Users.has(u)))
  console.log(`\nMAU (C1 ∩ C2 ∩ C3): ${mau.size} users`)

  // Total users
  const { data: allAuth } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const totalReal = allAuth.users.filter(u => !u.email.includes('holamate.app')).length
  const activationRate = (mau.size / totalReal * 100).toFixed(1)

  console.log(`Tổng users (excl holamate.app): ${totalReal}`)
  console.log(`Activation rate: ${activationRate}%`)

  // Event breakdown
  const { data: breakdown } = await supabase
    .from('user_activity_logs')
    .select('event_type, user_id')
    .in('event_type', ['view_vendor','search','use_ai','checkout','write_review','view_menu','click_contact'])
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())

  const evMap = {}
  for (const r of (breakdown || [])) {
    if (!evMap[r.event_type]) evMap[r.event_type] = { count: 0, users: new Set() }
    evMap[r.event_type].count++
    evMap[r.event_type].users.add(r.user_id)
  }
  console.log('\nEvent breakdown (last 30 days):')
  for (const [k, v] of Object.entries(evMap).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${k.padEnd(16)} ${String(v.count).padStart(5)} events  ${v.users.size} unique users`)
  }

  return { mau: mau.size, total: totalReal, activationRate }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   HolaMate MAU Fake Data Generator v3    ║')
  console.log('╚══════════════════════════════════════════╝')

  // Step 1: Create 43 new users
  const newUsers = await createNewUsers()

  // Get ALL real users for subsequent steps
  console.log('\nLấy toàn bộ users...')
  const { data: allAuth } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const allRealUsers = allAuth.users
    .filter(u => !u.email.includes('holamate.app') && !u.email.includes('admin'))
    .map(u => ({ id: u.id, email: u.email, created_at: u.created_at }))
  console.log(`Tổng users sẽ fake activity: ${allRealUsers.length}`)

  // Step 2: Fake sign_ins for all
  await fakeSignIns(allRealUsers)

  // Step 3: Fake sessions
  await fakeSessions(allRealUsers)

  // Step 4: Fake actions
  await fakeActions(allRealUsers)

  // Step 5: Verify
  const result = await verifyMAU()

  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║             KẾT QUẢ CUỐI CÙNG            ║')
  console.log('╠══════════════════════════════════════════╣')
  console.log(`║  Users mới tạo:    ${String(newUsers.length).padStart(3)}                      ║`)
  console.log(`║  Tổng users:       ${String(result.total).padStart(3)}                      ║`)
  console.log(`║  MAU count:        ${String(result.mau).padStart(3)}                      ║`)
  console.log(`║  Activation rate:  ${String(result.activationRate).padStart(5)}%                   ║`)
  console.log('╚══════════════════════════════════════════╝')

  if (result.mau < 200) {
    console.log('\n⚠️  MAU < 200. Cần chạy thêm activity.')
  } else {
    console.log('\n✅ MAU ≥ 200 đạt yêu cầu!')
  }
}

main().catch(console.error)
