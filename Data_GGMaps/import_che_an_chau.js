// Import Chè An Châu — vendor, menu items, ảnh
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const VENDOR_NAME = 'Chè An Châu'
const IMG_DIR = path.join(__dirname, '../data quán/CHÈ AN CHÂU/tiệm chè an châu')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// ─── Vendor info ────────────────────────────────────────────────────────────
const VENDOR = {
  name: 'Chè An Châu',
  vendor_type: 'fixed_shop',
  description: 'Quán chè hiện đại và ăn vặt tại Thạch Hòa. Chuyên chè, tàu hũ, sữa chua, trà trái cây, trà sữa, bánh tráng và ăn vặt.',
  status: 'active',
  source: 'manual',
  address: 'Số 155, Xóm 4, Thôn 3, Thạch Hòa',
  area: 'Thạch Hòa và khu vực lân cận',
  phone: '0345219158',
  zalo: '0345219158',
  opening_hours: '09:00 - 22:00',
  has_delivery: true,
  delivery_note: 'Phí ship phụ thuộc khoảng cách',
  price_range_min: 5000,
  price_range_max: 65000,
  food_categories: ['chè', 'tàu hũ', 'sữa chua', 'trà trái cây', 'trà sữa', 'bánh tráng', 'ăn vặt'],
  is_partnered: true,
}

// ─── Menu items (37 món) ─────────────────────────────────────────────────────
const MENU_ITEMS = [
  { name: 'Chè bơ sầu', item_type: 'food', price: 40000, description: 'Chè bơ sầu', is_available: true, sort_order: 1 },
  { name: 'Chè thái sầu', item_type: 'food', price: 35000, description: 'Chè thái sầu', is_available: true, sort_order: 2 },
  { name: 'Chè sầu', item_type: 'food', price: 30000, description: 'Chè sầu', is_available: true, sort_order: 3 },
  { name: 'Chè khúc bạch', item_type: 'food', price: 30000, description: 'Chè khúc bạch', is_available: true, sort_order: 4 },
  { name: 'Chè bơ', item_type: 'food', price: 25000, description: 'Chè bơ', is_available: true, sort_order: 5 },
  { name: 'Chè thập cẩm', item_type: 'food', price: 25000, description: 'Chè thập cẩm', is_available: true, sort_order: 6 },
  { name: 'Chè hạt đác', item_type: 'food', price: 25000, description: 'Chè hạt đác', is_available: true, sort_order: 7 },
  { name: 'Chè hạt đác đậu đỏ', item_type: 'food', price: 25000, description: 'Chè hạt đác đậu đỏ', is_available: true, sort_order: 8 },
  { name: 'Chè thốt nốt', item_type: 'food', price: 25000, description: 'Chè thốt nốt', is_available: true, sort_order: 9 },
  { name: 'Chè thốt nốt đậu đỏ', item_type: 'food', price: 25000, description: 'Chè thốt nốt đậu đỏ', is_available: true, sort_order: 10 },
  { name: 'Chè khoai môn', item_type: 'food', price: 25000, description: 'Chè khoai môn', is_available: true, sort_order: 11 },
  { name: 'Chè thái', item_type: 'food', price: 25000, description: 'Chè thái', is_available: true, sort_order: 12 },
  { name: 'Chè dừa dầm', item_type: 'food', price: 20000, description: 'Chè dừa dầm', is_available: true, sort_order: 13 },
  { name: 'Chè khoai dẻo', item_type: 'food', price: 20000, description: 'Chè khoai dẻo', is_available: true, sort_order: 14 },
  { name: 'Chè bưởi', item_type: 'food', price: 20000, description: 'Chè bưởi', is_available: true, sort_order: 15 },
  { name: 'Caramen thêm vào chè', item_type: 'display_product', price: 5000, description: 'Caramen thêm vào chè', is_available: true, sort_order: 16 },
  { name: 'Caramen mang về', item_type: 'display_product', price: 7000, description: 'Caramen mang về', is_available: true, sort_order: 17 },
  { name: 'Tàu hũ sầu riêng', item_type: 'food', price: 28000, description: 'Tàu hũ sầu riêng', is_available: true, sort_order: 18 },
  { name: 'Tàu hũ kem trứng', item_type: 'food', price: 25000, description: 'Tàu hũ kem trứng', is_available: true, sort_order: 19 },
  { name: 'Tàu hũ caramen', item_type: 'food', price: 25000, description: 'Tàu hũ caramen', is_available: true, sort_order: 20 },
  { name: 'Tàu hũ hạt đác', item_type: 'food', price: 25000, description: 'Tàu hũ hạt đác', is_available: true, sort_order: 21 },
  { name: 'Tàu hũ thốt nốt', item_type: 'food', price: 25000, description: 'Tàu hũ thốt nốt', is_available: true, sort_order: 22 },
  { name: 'Tàu hũ đường đen', item_type: 'food', price: 20000, description: 'Tàu hũ đường đen', is_available: true, sort_order: 23 },
  { name: 'Sữa chua caramen', item_type: 'food', price: 25000, description: 'Sữa chua caramen', is_available: true, sort_order: 24 },
  { name: 'Sữa chua thốt nốt', item_type: 'food', price: 25000, description: 'Sữa chua thốt nốt', is_available: true, sort_order: 25 },
  { name: 'Sữa chua hạt đác', item_type: 'food', price: 25000, description: 'Sữa chua hạt đác', is_available: true, sort_order: 26 },
  { name: 'Trà đào dầm', item_type: 'drink', price: 20000, description: 'Trà đào dầm', is_available: true, sort_order: 27 },
  { name: 'Trà đào lắc sữa', item_type: 'drink', price: 25000, description: 'Trà đào lắc sữa', is_available: true, sort_order: 28 },
  { name: 'Trà đào kem cheese', item_type: 'drink', price: 30000, description: 'Trà đào kem cheese', is_available: true, sort_order: 29 },
  { name: 'Trà chanh nha đam', item_type: 'drink', price: 15000, description: 'Trà chanh nha đam', is_available: true, sort_order: 30 },
  { name: 'Trà tắc nha đam', item_type: 'drink', price: 15000, description: 'Trà tắc nha đam', is_available: true, sort_order: 31 },
  { name: 'Trà sữa truyền thống size M', item_type: 'drink', price: 20000, description: 'Trà sữa truyền thống size M', is_available: true, sort_order: 32 },
  { name: 'Trà sữa truyền thống size L', item_type: 'drink', price: 25000, description: 'Trà sữa truyền thống size L', is_available: true, sort_order: 33 },
  { name: 'Bánh tráng trộn', item_type: 'food', price: 25000, description: 'Bánh tráng trộn', is_available: true, sort_order: 34 },
  { name: 'Bánh tráng nướng', item_type: 'food', price: 25000, description: 'Bánh tráng nướng', is_available: true, sort_order: 35 },
  { name: 'Kem xôi', item_type: 'food', price: 25000, description: 'Kem xôi', is_available: true, sort_order: 36 },
  { name: 'Khoai dẻo mix caramen', item_type: 'food', price: 25000, description: 'Khoai dẻo mix caramen', is_available: true, sort_order: 37 },
]

// ─── Ảnh: dùng metadata từ sheet, file không có trong sheet → type 'food' ──
const PHOTO_META = {
  '738473146_2817075205316998_1978361429130455815_n.jpg': { media_type: 'food', is_primary: false },
  '738582987_2817074971983688_6254334628507996672_n.jpg': { media_type: 'food', is_primary: false },
  '738593528_2817074148650437_5255297088218101545_n.jpg': { media_type: 'menu', is_primary: false },
  '738759118_2817074835317035_5590860318636549987_n.jpg': { media_type: 'food', is_primary: false },
  '738828942_2817074625317056_6113669406447295592_n.jpg': { media_type: 'food', is_primary: false },
  '739471298_2817074941983691_8690522977742096301_n.jpg': { media_type: 'food', is_primary: false },
  '739799835_2817073921983793_3036014472965892841_n.jpg': { media_type: 'food', is_primary: false },
  '739855148_2817075078650344_5524028927612570856_n.jpg': { media_type: 'food', is_primary: false },
  '739866662_2817074931983692_7234574725420994038_n.jpg': { media_type: 'food', is_primary: false },
  '740486733_2817073998650452_4160024090819190092_n.jpg': { media_type: 'food', is_primary: false },
  '740563008_2817074918650360_7690407868864821485_n.jpg': { media_type: 'food', is_primary: false },
  '740821779_2817074631983722_6327020589646050314_n.jpg': { media_type: 'food', is_primary: false },
  '741092480_2817073685317150_6881457255544037712_n.jpg': { media_type: 'menu', is_primary: true },
}
// Files not in sheet → default food
const ALL_FILES = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'))

async function uploadPhoto(vendorId, filename) {
  const filePath = path.join(IMG_DIR, filename)
  const fileBuffer = fs.readFileSync(filePath)
  const storagePath = `vendors/${vendorId}/${filename}`
  const { error } = await sb.storage
    .from('vendor-images')
    .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(`Upload ${filename}: ${error.message}`)
  return storagePath
}

async function main() {
  console.log('=== Import Chè An Châu ===\n')

  // ── Step 1: Upsert vendor ──────────────────────────────────────────────────
  console.log('1. Inserting vendor...')
  const { data: vendorRow, error: vErr } = await sb
    .from('vendors')
    .insert(VENDOR)
    .select('id')
    .single()
  if (vErr) { console.error('Vendor insert error:', vErr.message); return }
  const vendorId = vendorRow.id
  console.log(`   ✓ Vendor inserted: ${vendorId}`)

  // ── Step 2: Insert menu items ───────────────────────────────────────────────
  console.log(`\n2. Inserting ${MENU_ITEMS.length} menu items...`)
  const menuRows = MENU_ITEMS.map(m => ({ ...m, vendor_id: vendorId }))
  const { error: mErr } = await sb.from('menu_items').insert(menuRows)
  if (mErr) { console.error('Menu insert error:', mErr.message); return }
  console.log(`   ✓ ${MENU_ITEMS.length} items inserted`)

  // ── Step 3: Upload ảnh & insert vendor_media ────────────────────────────────
  console.log(`\n3. Uploading ${ALL_FILES.length} photos...`)
  const mediaRows = []
  let coverUrl = null

  for (const filename of ALL_FILES) {
    try {
      const storagePath = await uploadPhoto(vendorId, filename)
      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vendor-images/${storagePath}`
      const meta = PHOTO_META[filename] || { media_type: 'food', is_primary: false }

      mediaRows.push({
        vendor_id: vendorId,
        image_url: imageUrl,
        storage_path: storagePath,
        media_type: meta.media_type,
        status: 'visible',
        is_primary: meta.is_primary,
      })

      if (meta.is_primary) coverUrl = imageUrl
      process.stdout.write('.')
    } catch (e) {
      console.error(`\n   ✗ ${filename}: ${e.message}`)
    }
  }
  console.log(`\n   ✓ ${mediaRows.length} photos uploaded`)

  const { error: imgErr } = await sb.from('vendor_media').insert(mediaRows)
  if (imgErr) { console.error('vendor_media insert error:', imgErr.message); return }
  console.log(`   ✓ vendor_media inserted`)

  // ── Step 4: Update cover_image_url ─────────────────────────────────────────
  if (coverUrl) {
    const { error: cErr } = await sb
      .from('vendors')
      .update({ cover_image_url: coverUrl })
      .eq('id', vendorId)
    if (cErr) { console.error('Cover update error:', cErr.message); return }
    console.log(`\n4. ✓ cover_image_url updated`)
  } else {
    // Fallback: dùng ảnh đầu tiên trong list
    const fallback = mediaRows[0]?.image_url
    if (fallback) {
      await sb.from('vendors').update({ cover_image_url: fallback }).eq('id', vendorId)
      console.log(`\n4. ✓ cover_image_url set to first photo (no is_primary found)`)
    }
  }

  // ── Step 5: Verify ─────────────────────────────────────────────────────────
  console.log('\n=== Verify ===')
  const { data: v } = await sb
    .from('vendors')
    .select('id, name, is_partnered, cover_image_url, vendor_type, status')
    .eq('id', vendorId)
    .single()
  const { count: menuCount } = await sb
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
  const { count: mediaCount } = await sb
    .from('vendor_media')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)

  console.log(`Tên quán    : ${v.name}`)
  console.log(`ID          : ${v.id}`)
  console.log(`vendor_type : ${v.vendor_type}`)
  console.log(`status      : ${v.status}`)
  console.log(`is_partnered: ${v.is_partnered}`)
  console.log(`Số món      : ${menuCount}`)
  console.log(`Số ảnh      : ${mediaCount}`)
  console.log(`cover       : ${v.cover_image_url ? '✓ set' : '✗ missing'}`)
}

main().catch(console.error)
