/**
 * HolaMate — Import 8 vendors từ Excel vào Supabase
 * Chạy: SUPABASE_SERVICE_ROLE_KEY=xxx node import_vendors.js
 */

const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// ── Config ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://prxagoffeoaggumqojdd.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) {
  console.error('❌  Thiếu SUPABASE_SERVICE_ROLE_KEY. Chạy lại với:\n  SUPABASE_SERVICE_ROLE_KEY=xxx node import_vendors.js')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Gốc thư mục data
const DATA_ROOT = path.resolve(__dirname, '../data quán')

// Cấu hình 8 quán: { excelPath, photoDir }
const VENDORS = [
  {
    excelPath: path.join(DATA_ROOT, 'DAESAK K-FRIED CHICKEN/Daesak.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'DAESAK K-FRIED CHICKEN/Daesak'),
  },
  {
    excelPath: path.join(DATA_ROOT, 'BOONG KOREAN FOOD/Boong_Korean_Food.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'BOONG KOREAN FOOD/yến yến'),
  },
  {
    excelPath: path.join(DATA_ROOT, 'HƯƠNG GIANG/Pizza_Huong_Giang_Pizza.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'HƯƠNG GIANG/hương giang'),
  },
  {
    excelPath: path.join(DATA_ROOT, 'DONE KEBAB/Done_Kebab.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'DONE KEBAB/Bánh Mì done kebab'),
  },
  {
    excelPath: path.join(DATA_ROOT, 'THƯƠNG BÉO/Com_Thuong_Beo.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'THƯƠNG BÉO/Cơm Thương Béo'),
  },
  {
    excelPath: path.join(DATA_ROOT, 'GÀ RÁN A CHÂU/Ga_Ran_A_Chau.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'GÀ RÁN A CHÂU/gả rán a châu'),
  },
  {
    excelPath: path.join(DATA_ROOT, 'CÚ ĂN ĐÊM/Cu_An_Dem.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'CÚ ĂN ĐÊM/Cú Ăn Đêm (1)'),
  },
  {
    // NekoChan: Excel ở NekoChan/, ảnh ở thư mục cha TIRAMISU AND TEA/
    excelPath: path.join(DATA_ROOT, 'TIRAMISU AND TEA/NekoChan/NekoChan.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'TIRAMISU AND TEA'),
  },
]

// Các quán được set is_partnered = true (so sánh case-insensitive)
const PARTNERED_NAMES = [
  'daesak k-fried chicken',
  'boong korean food',
  'pizza hương giang',
  'done kebab',
  'cơm thương béo',
  'gà rán a châu',
  'cú ăn đêm',
]

// ── Helpers ────────────────────────────────────────────────────────────────

function parsePriceRange(str) {
  if (!str) return { min: null, max: null }
  const parts = String(str).split('-').map(s => parseInt(s.replace(/\D/g, ''), 10)).filter(n => !isNaN(n))
  if (parts.length === 1) return { min: parts[0], max: parts[0] }
  if (parts.length >= 2) return { min: Math.min(...parts), max: Math.max(...parts) }
  return { min: null, max: null }
}

function parseFoodCategories(str) {
  if (!str) return null
  return String(str).split(',').map(s => s.trim()).filter(Boolean)
}

function parseOpeningHours(rows) {
  // rows là Map<field_name, value> từ sheet 1
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const result = {}
  let hasAny = false
  for (const day of days) {
    const val = rows[`opening_hours_${day}`]
    if (val && String(val).trim() && String(val).trim().toLowerCase() !== 'null') {
      result[day] = String(val).trim()
      hasAny = true
    } else {
      result[day] = null
    }
  }
  return hasAny ? result : null
}

function parseBool(val) {
  if (val === true || val === 'true' || val === 'TRUE' || val === 1) return true
  if (val === false || val === 'false' || val === 'FALSE' || val === 0) return false
  return null
}

function mapVendorType(val) {
  if (!val) return 'fixed_shop'
  const v = String(val).toLowerCase()
  if (v === 'fixed_shop') return 'fixed_shop'
  if (v === 'online_seller' || v === 'online_shop') return 'online_seller'
  if (v === 'student_booth') return 'student_booth'
  // fallback: văn xuôi
  if (v.includes('online') || v.includes('giao hàng')) return 'online_seller'
  return 'fixed_shop'
}

function mapSource(val) {
  if (!val) return 'manual'
  const v = String(val).toLowerCase()
  if (v === 'google_maps') return 'google_maps'
  if (v === 'seller_submitted') return 'seller_submitted'
  return 'manual'
}

const VALID_ITEM_TYPES = new Set(['food', 'drink', 'combo', 'display_product'])

function mapItemType(val) {
  if (!val) return 'food'
  const v = String(val).trim().toLowerCase()
  if (VALID_ITEM_TYPES.has(v)) return v
  return 'food'
}

const VALID_MEDIA_TYPES = new Set(['cover', 'logo', 'menu', 'food', 'booth', 'signboard', 'space', 'other'])

function mapMediaType(val) {
  if (!val) return 'other'
  const v = String(val).trim().toLowerCase()
  if (VALID_MEDIA_TYPES.has(v)) return v
  // map không hợp lệ → gần nhất
  if (v === 'drink') return 'food'
  return 'other'
}

// Thử tìm file khi tên có "(1)" thừa hoặc thiếu
function resolveImagePath(dir, filename) {
  const direct = path.join(dir, filename)
  if (fs.existsSync(direct)) return direct
  // Thử bỏ "(1)" ở cuối trước extension
  const stripped = filename.replace(/\s*\(\d+\)(\.[^.]+)$/, '$1')
  if (stripped !== filename) {
    const p2 = path.join(dir, stripped)
    if (fs.existsSync(p2)) return p2
  }
  return null
}

function getImageMime(filename) {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

// ── Read Excel ─────────────────────────────────────────────────────────────

function readVendorInfo(wb) {
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  const VALID_FIELDS = new Set([
    'name', 'vendor_type', 'description', 'status', 'source',
    'address', 'area', 'phone', 'zalo',
    'latitude', 'longitude',
    'opening_hours_mon', 'opening_hours_tue', 'opening_hours_wed',
    'opening_hours_thu', 'opening_hours_fri', 'opening_hours_sat', 'opening_hours_sun',
    'has_delivery', 'delivery_area', 'delivery_fee', 'price_range', 'food_categories',
  ])

  const map = {}
  for (const row of rows) {
    const field = row[0]
    if (field && VALID_FIELDS.has(String(field).trim())) {
      map[String(field).trim()] = row[1] ?? null
    }
  }

  const priceRange = parsePriceRange(map.price_range)
  const openingHours = parseOpeningHours(map)

  return {
    name:            map.name ? String(map.name).trim() : null,
    vendor_type:     mapVendorType(map.vendor_type),
    description:     map.description ? String(map.description).trim() : null,
    status:          map.status ? String(map.status).trim() : 'active',
    source:          mapSource(map.source),
    address:         map.address ? String(map.address).trim() : null,
    area:            map.area ? String(map.area).trim() : null,
    phone:           map.phone ? String(map.phone).trim() : null,
    zalo:            map.zalo ? String(map.zalo).trim() : null,
    latitude:        map.latitude != null ? parseFloat(map.latitude) || null : null,
    longitude:       map.longitude != null ? parseFloat(map.longitude) || null : null,
    opening_hours:   openingHours,
    has_delivery:    parseBool(map.has_delivery) ?? false,
    delivery_note:   map.delivery_area ? String(map.delivery_area).trim() : null,
    price_range_min: priceRange.min,
    price_range_max: priceRange.max,
    food_categories: parseFoodCategories(map.food_categories),
  }
}

function readMenuItems(wb) {
  const sheet = wb.Sheets[wb.SheetNames[1]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  const items = []
  for (const row of rows) {
    // bỏ header và dòng giải thích (không có tên món + giá hợp lệ)
    const vendorName = row[0]
    const itemName   = row[1]
    const itemType   = row[2]
    const price      = row[3]
    const desc       = row[4]
    const isAvail    = row[5]
    const sortOrder  = row[6]

    if (!itemName || !String(itemName).trim()) continue
    if (!price || isNaN(parseInt(price, 10))) continue
    // bỏ dòng header (cột đầu là tên quán thật, không phải "Tên quán")
    if (String(itemName).toLowerCase().includes('tên món')) continue

    items.push({
      name:        String(itemName).trim(),
      item_type:   mapItemType(itemType),
      price:       parseInt(price, 10),
      description: desc ? String(desc).trim() : null,
      is_available: parseBool(isAvail) !== false, // default true
      sort_order:  sortOrder != null ? parseInt(sortOrder, 10) || 0 : 0,
    })
  }
  return items
}

function readPhotoList(wb) {
  const sheet = wb.Sheets[wb.SheetNames[2]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  const photos = []

  for (const row of rows) {
    const vendorName = row[0]
    const filename   = row[1]
    const mediaType  = row[2]
    const caption    = row[3]
    const isPrimary  = row[4]
    const note       = row[5]

    if (!filename || !String(filename).trim()) continue
    // bỏ dòng header và dòng giải thích
    const fn = String(filename).trim()
    if (fn.toLowerCase().includes('tên file') || fn.toLowerCase().includes('media_type')) continue
    if (!fn.match(/\.(jpg|jpeg|png|gif|webp)$/i)) continue

    photos.push({
      filename:   fn,
      media_type: mediaType ? String(mediaType).replace(/\s/g, '').trim().toLowerCase() : 'other',
      caption:    note ? String(note).trim() : (caption ? String(caption).trim() : null),
      is_primary: parseBool(isPrimary) === true,
    })
  }
  return photos
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const stats = {
    vendorsInserted: 0, vendorsUpdated: 0,
    menuItemsInserted: 0,
    photosUploaded: 0, photosFailed: 0,
    errors: [],
  }

  // ── Bước 1: Reset is_partnered toàn bộ ──────────────────────────────────
  console.log('\n=== BƯỚC 1: Reset is_partnered = false cho tất cả vendors ===')
  const { error: resetErr } = await supabase
    .from('vendors')
    .update({ is_partnered: false })
    .neq('id', '00000000-0000-0000-0000-000000000000') // update all rows
  if (resetErr) {
    console.error('❌  Reset is_partnered thất bại:', resetErr.message)
    stats.errors.push(`Reset is_partnered: ${resetErr.message}`)
  } else {
    console.log('✅  Đã reset is_partnered = false cho toàn bộ vendors')
  }

  // ── Bước 2: Xử lý 8 quán từ Excel ───────────────────────────────────────
  console.log('\n=== BƯỚC 2: Import 8 quán từ Excel ===')

  for (const cfg of VENDORS) {
    console.log(`\n── ${path.basename(cfg.excelPath)} ──`)

    if (!fs.existsSync(cfg.excelPath)) {
      console.error(`  ❌  Không tìm thấy file: ${cfg.excelPath}`)
      stats.errors.push(`File không tồn tại: ${cfg.excelPath}`)
      continue
    }

    let wb
    try {
      wb = XLSX.readFile(cfg.excelPath)
    } catch (e) {
      console.error(`  ❌  Lỗi đọc Excel: ${e.message}`)
      stats.errors.push(`Đọc Excel ${cfg.excelPath}: ${e.message}`)
      continue
    }

    // 2a. Đọc thông tin quán
    const vendorData = readVendorInfo(wb)
    if (!vendorData.name) {
      console.error(`  ❌  Không đọc được tên quán từ sheet 1`)
      stats.errors.push(`Không có tên quán: ${cfg.excelPath}`)
      continue
    }
    console.log(`  Quán: ${vendorData.name}`)

    // 2b. Check xem đã tồn tại chưa
    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .ilike('name', vendorData.name)
      .single()

    let vendorId
    if (existing) {
      // UPDATE
      const { error: upErr } = await supabase
        .from('vendors')
        .update(vendorData)
        .eq('id', existing.id)
      if (upErr) {
        console.error(`  ❌  UPDATE vendor thất bại: ${upErr.message}`)
        stats.errors.push(`UPDATE ${vendorData.name}: ${upErr.message}`)
        continue
      }
      vendorId = existing.id
      stats.vendorsUpdated++
      console.log(`  ✅  UPDATE vendor (id=${vendorId})`)
    } else {
      // INSERT
      const { data: inserted, error: insErr } = await supabase
        .from('vendors')
        .insert({ ...vendorData, is_partnered: false })
        .select('id')
        .single()
      if (insErr) {
        console.error(`  ❌  INSERT vendor thất bại: ${insErr.message}`)
        stats.errors.push(`INSERT ${vendorData.name}: ${insErr.message}`)
        continue
      }
      vendorId = inserted.id
      stats.vendorsInserted++
      console.log(`  ✅  INSERT vendor (id=${vendorId})`)
    }

    // 2c. Refresh menu items
    const menuItems = readMenuItems(wb)
    console.log(`  Menu: ${menuItems.length} món`)

    if (menuItems.length > 0) {
      // Xóa menu cũ
      await supabase.from('menu_items').delete().eq('vendor_id', vendorId)

      const menuRows = menuItems.map(item => ({ ...item, vendor_id: vendorId }))
      const { error: menuErr } = await supabase.from('menu_items').insert(menuRows)
      if (menuErr) {
        console.error(`  ❌  INSERT menu_items thất bại: ${menuErr.message}`)
        stats.errors.push(`Menu ${vendorData.name}: ${menuErr.message}`)
      } else {
        stats.menuItemsInserted += menuItems.length
        console.log(`  ✅  Đã insert ${menuItems.length} món`)
      }
    }

    // 2d. Refresh ảnh
    const photoList = readPhotoList(wb)
    console.log(`  Ảnh: ${photoList.length} file trong sheet`)

    if (photoList.length > 0) {
      // Xóa media cũ
      await supabase.from('vendor_media').delete().eq('vendor_id', vendorId)

      let coverUrl = null

      for (let idx = 0; idx < photoList.length; idx++) {
        const photo = photoList[idx]
        const imagePath = path.join(cfg.photoDir, photo.filename)

        const resolvedPath = resolveImagePath(cfg.photoDir, photo.filename)
        if (!resolvedPath) {
          console.log(`    ⚠️  Không tìm thấy file ảnh: ${photo.filename}`)
          stats.photosFailed++
          continue
        }

        const fileBuffer = fs.readFileSync(resolvedPath)
        const storagePath = `${vendorId}/${photo.filename}`
        const mime = getImageMime(photo.filename)

        const { error: uploadErr } = await supabase.storage
          .from('vendor-images')
          .upload(storagePath, fileBuffer, { contentType: mime, upsert: true })

        if (uploadErr) {
          console.log(`    ⚠️  Upload thất bại [${photo.filename}]: ${uploadErr.message}`)
          stats.photosFailed++
          continue
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/vendor-images/${storagePath}`
        stats.photosUploaded++

        // INSERT vendor_media
        const { error: mediaErr } = await supabase.from('vendor_media').insert({
          vendor_id:    vendorId,
          image_url:    publicUrl,
          storage_path: storagePath,
          media_type:   mapMediaType(photo.media_type),
          caption:      photo.caption,
          is_primary:   photo.is_primary,
          sort_order:   idx,
          status:       'visible',
        })

        if (mediaErr) {
          console.log(`    ⚠️  INSERT vendor_media thất bại [${photo.filename}]: ${mediaErr.message}`)
          stats.errors.push(`vendor_media ${photo.filename}: ${mediaErr.message}`)
          continue
        }

        // Nếu là cover chính → lưu để update vendor
        if (photo.is_primary && photo.media_type === 'cover') {
          coverUrl = publicUrl
        }

        console.log(`    ✅  ${photo.filename} (${photo.media_type}${photo.is_primary ? ', primary' : ''})`)
      }

      // Update cover_image_url nếu có
      if (coverUrl) {
        const { error: coverErr } = await supabase
          .from('vendors')
          .update({ cover_image_url: coverUrl })
          .eq('id', vendorId)
        if (coverErr) {
          console.error(`  ❌  Update cover_image_url thất bại: ${coverErr.message}`)
        } else {
          console.log(`  ✅  Đã set cover_image_url`)
        }
      }
    }
  }

  // ── Bước 3: Set is_partnered = true cho 7 quán đối tác ──────────────────
  console.log('\n=== BƯỚC 3: Set is_partnered = true cho 7 quán đối tác ===')

  const partnerResults = []
  for (const partnerName of PARTNERED_NAMES) {
    // tìm kiếm linh hoạt — lấy tên từ DB
    const { data: found } = await supabase
      .from('vendors')
      .select('id, name')
      .ilike('name', `%${partnerName.split(' ').filter(w => w.length > 2).slice(0, 3).join('%')}%`)
      .limit(1)
      .single()

    if (!found) {
      console.log(`  ⚠️  Không tìm thấy quán: "${partnerName}"`)
      partnerResults.push({ name: partnerName, status: 'NOT FOUND' })
      continue
    }

    const { error: pErr } = await supabase
      .from('vendors')
      .update({ is_partnered: true })
      .eq('id', found.id)

    if (pErr) {
      console.error(`  ❌  Set is_partnered thất bại [${found.name}]: ${pErr.message}`)
      partnerResults.push({ name: found.name, status: 'ERROR: ' + pErr.message })
    } else {
      console.log(`  ✅  ${found.name}`)
      partnerResults.push({ name: found.name, status: 'is_partnered = true' })
    }
  }

  // ── Bước 4: Báo cáo kết quả ──────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════')
  console.log('          BÁO CÁO KẾT QUẢ IMPORT')
  console.log('═══════════════════════════════════════')
  console.log(`Vendors inserted:   ${stats.vendorsInserted}`)
  console.log(`Vendors updated:    ${stats.vendorsUpdated}`)
  console.log(`Menu items:         ${stats.menuItemsInserted}`)
  console.log(`Ảnh uploaded:       ${stats.photosUploaded}`)
  console.log(`Ảnh thất bại:       ${stats.photosFailed}`)
  console.log('\nPartner status:')
  partnerResults.forEach(r => console.log(`  • ${r.name}: ${r.status}`))
  if (stats.errors.length > 0) {
    console.log('\nLỗi:')
    stats.errors.forEach(e => console.log(`  ⚠️  ${e}`))
  } else {
    console.log('\n✅  Không có lỗi!')
  }
  console.log('═══════════════════════════════════════')
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
