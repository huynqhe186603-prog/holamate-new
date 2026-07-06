import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'

const SUPABASE_URL = 'https://prxagoffeoaggumqojdd.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1ODYzOSwiZXhwIjoyMDk1NzM0NjM5fQ.eC_bvwzzgDnS8TbyuFmtk1KFx5Me4en8NM1giHCZA28'
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Existing emails (skip these) ─────────────────────────────────────────────
const EXISTING = new Set([
  'buyer@holamate.test','user2@holamate.test','admin@holamate.test',
  'pda7558@gmail.com','xinchaoky01@gmail.com','nguyenvanan01@gmail.com',
  'testsignup@gmail.com','ducthinh142004@gmail.com','ledinhngoclan2003@gmail.com',
  'tuan@gmail.com','laliceee123@gmail.com','theanhngn2004@gmail.com',
  'thangthangloz00@gmail.com','namlun22804@gmail.com','thaiduongnguyenluu@gmail.com',
  'tun@gmail.com','pthaoo1230@gmail.com','thanhthhe151501@fpt.edu.vn',
  'kethptvq@gmail.com','imyen14032001@gmail.com','ducdoanminh2005@gmail.com',
  'tranhuonggiang866@gmail.com','thangnvhs173258@fpt.edu.vn','truongvxhe186455@fpt.edu.vn',
  'chuancthe171946@fpt.edu.vn','linhktha180052@fpt.edu.vn','trungnche180620@fpt.edu.vn',
  'quynhpthhs186547@fpt.edu.vn','lanbtnhe163351@fpt.edu.vn','minhnnhe171269@fpt.edu.vn',
  'nguyennhatminh221103@gmail.com','haez0705@gmail.com','m6293060@gmail.com',
  'phuongthao30126@gmail.com','trunganhtran068@gmail.com','nt3849480@gmail.com',
  'duonghuonghxofk5917@gmail.com','baobeo69420@gmail.com','laithithuha16042004@gmail.com',
  'tranminhchi208@gmail.com','chanthu0211@gmail.com','gmai@gmail.com',
  'ngoclan2406@gmail.com','kytvhe180097@fpt.edu.vn','nguyencphe181659@fpt.edu.vn',
  'luulyy14@gmail.com','tranhuydiep77@gmail.com',
  'daesak@holamate.app','boong@holamate.app','huonggiang@holamate.app',
  'donekebab@holamate.app','thuongbeo@holamate.app','garanachau@holamate.app',
  'cuandem@holamate.app','cocandem@holamate.app',
])

// ── Distribution ─────────────────────────────────────────────────────────────
const DIST = [
  { count: 5,  dates: ['2026-06-11'], hours: [8, 22],  event: 'launch_web' },
  { count: 8,  dates: ['2026-06-12','2026-06-13','2026-06-14'], hours: [7, 23], event: 'organic_post' },
  { count: 10, dates: ['2026-06-15','2026-06-16','2026-06-17','2026-06-18','2026-06-19','2026-06-20','2026-06-21'], hours: [8, 22], event: 'week6_partner' },
  { count: 45, dates: ['2026-06-22'], hours: [7, 23],  event: 'promotion_event' },
  { count: 28, dates: ['2026-06-23'], hours: [6, 23],  event: 'word_of_mouth' },
  { count: 15, dates: ['2026-06-24'], hours: [7, 22],  event: 'organic_spread' },
  { count: 8,  dates: ['2026-06-25','2026-06-26','2026-06-27','2026-06-28'], hours: [8, 22], event: 'organic_growth' },
  { count: 3,  dates: ['2026-06-29','2026-06-30','2026-07-01'], hours: [8, 22], event: 'organic_growth' },
]
// Total: 5+8+10+45+28+15+8+3 = 122

// ── Helpers ───────────────────────────────────────────────────────────────────
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)) }
function pad(n) { return String(n).padStart(2, '0') }

function randomTimestampUTC(dates, hours) {
  const date = dates[Math.floor(Math.random() * dates.length)]
  const h = randInt(hours[0], hours[1])
  const m = randInt(0, 59)
  const s = randInt(0, 59)
  // Input is UTC+7 → convert to UTC by subtracting 7h
  return new Date(`${date}T${pad(h)}:${pad(m)}:${pad(s)}+07:00`).toISOString()
}

function randomPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Parse CSV ─────────────────────────────────────────────────────────────────
const raw = readFileSync('gmail fake  - Sheet2.csv', 'utf-8')
const lines = raw.replace(/\r/g, '').trim().split('\n').slice(1) // skip header
const seenEmails = new Set(EXISTING)
const pool = []
for (const line of lines) {
  const parts = line.split(',')
  if (parts.length < 3) continue
  const email = parts[2].trim().toLowerCase()
  const name = parts[1].trim()
  if (!email || seenEmails.has(email)) continue
  seenEmails.add(email)
  pool.push({ email, name })
}
console.log(`\nCSV pool sau khi lọc: ${pool.length} users có thể tạo`)
if (pool.length < 122) { console.error('KHÔNG ĐỦ EMAIL!'); process.exit(1) }

// ── Assign timestamps ─────────────────────────────────────────────────────────
const batch = []
let idx = 0
for (const g of DIST) {
  for (let i = 0; i < g.count; i++) {
    const u = pool[idx++]
    batch.push({ ...u, created_at: randomTimestampUTC(g.dates, g.hours), event: g.event })
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Bắt đầu tạo ${batch.length} tài khoản...\n`)

  const results = { ok: [], fail: [] }
  const authUpdates = [] // [{id, created_at}] for bulk SQL later

  for (const u of batch) {
    process.stdout.write(`  [→] ${u.email} ... `)
    try {
      // 1. Tạo auth user
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: { full_name: u.name },
      })
      if (authErr) throw new Error(`createUser: ${authErr.message}`)
      const uid = authData.user.id

      // 2. Update profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ full_name: u.name, role: 'user' })
        .eq('id', uid)
      if (profileErr) throw new Error(`profile: ${profileErr.message}`)

      // 3. Insert login_history với backdated timestamp
      const { error: histErr } = await supabase.from('user_login_history').insert({
        user_id: uid,
        event_type: 'sign_up',
        provider: Math.random() > 0.3 ? 'google' : 'email',
        created_at: u.created_at,
      })
      if (histErr) throw new Error(`login_history: ${histErr.message}`)

      authUpdates.push({ id: uid, ts: u.created_at })
      results.ok.push({ email: u.email, name: u.name, created_at: u.created_at, event: u.event })
      console.log(`OK (${u.created_at.slice(0, 10)})`)
    } catch (e) {
      console.log(`LỖI: ${e.message}`)
      results.fail.push({ email: u.email, error: e.message })
    }
    await new Promise(r => setTimeout(r, 150))
  }

  // ── Tạo SQL để update auth.users.created_at ──────────────────────────────
  if (authUpdates.length > 0) {
    const values = authUpdates.map(({ id, ts }) => `  ('${id}'::uuid, '${ts}'::timestamptz)`).join(',\n')
    const sql = `-- Cập nhật created_at trong auth.users cho ${authUpdates.length} users mới\nUPDATE auth.users\nSET created_at = v.ts\nFROM (VALUES\n${values}\n) AS v(id, ts)\nWHERE auth.users.id = v.id;`
    writeFileSync('update_auth_created_at.sql', sql, 'utf-8')
    console.log(`\n✓ Đã lưu SQL ra update_auth_created_at.sql (${authUpdates.length} rows)`)
  }

  // ── Báo cáo ──────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════')
  console.log(`✓ Thành công: ${results.ok.length} / ${batch.length}`)
  if (results.fail.length > 0) {
    console.log(`✗ Thất bại:  ${results.fail.length}`)
    results.fail.forEach(f => console.log(`  • ${f.email}: ${f.error}`))
  }

  // Phân bổ theo ngày
  const byDay = {}
  results.ok.forEach(u => {
    const day = new Date(u.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' })
    byDay[day] = (byDay[day] || 0) + 1
  })
  console.log('\nPhân bổ theo ngày (UTC+7):')
  Object.keys(byDay).sort().forEach(d => console.log(`  ${d}: ${byDay[d]} users`))
  console.log('═══════════════════════════════════════════════════\n')

  return authUpdates
}

main().catch(console.error)
