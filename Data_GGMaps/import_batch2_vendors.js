/**
 * HolaMate — Import 2 quán mới: Tiệm Bơ + Cóc Ăn Đêm
 * Chạy: node Data_GGMaps/import_batch2_vendors.js
 */

const XLSX    = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const fs   = require('fs')
const path = require('path')

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL      = 'https://prxagoffeoaggumqojdd.supabase.co'
const SERVICE_ROLE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1ODYzOSwiZXhwIjoyMDk1NzM0NjM5fQ.eC_bvwzzgDnS8TbyuFmtk1KFx5Me4en8NM1giHCZA28'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const DATA_ROOT = path.resolve(__dirname, '../data quán')

const VENDORS = [
  {
    excelPath: path.join(DATA_ROOT, 'TIỆM BƠ/Tiem_Bo_Menu_Template.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'TIỆM BƠ/tiệm bơ'),
  },
  {
    excelPath: path.join(DATA_ROOT, 'CÓC ĂN ĐÊM/Coc_An_Dem.xlsx'),
    photoDir:  path.join(DATA_ROOT, 'CÓC ĂN ĐÊM/Cóc Ăn Đêm'),
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseBool(val) {
  if (val === true  || val === 'true'  || val === 'TRUE'  || val === 1) return true
  if (val === false || val === 'false' || val === 'FALSE' || val === 0) return false
  return null
}

function mapVendorType(val) {
  if (!val) return 'online_seller'
  const v = String(val).toLowerCase()
  if (v === 'fixed_shop')  return 'fixed_shop'
  if (v === 'online_seller' || v === 'online_shop') return 'online_seller'
  if (v === 'student_booth') return 'student_booth'
  if (v.includes('online') || v.includes('giao hàng') || v.includes('đêm') || v.includes('dem'))
    return 'online_seller'
  return 'online_seller'   // fallback hợp lý cho 2 quán này
}

const VALID_ITEM_TYPES  = new Set(['food', 'drink', 'combo', 'display_product'])
const VALID_MEDIA_TYPES = new Set(['cover', 'logo', 'menu', 'food', 'booth', 'signboard', 'space', 'other'])

function mapItemType(val) {
  if (!val) return 'food'
  const v = String(val).trim().toLowerCase()
  if (VALID_ITEM_TYPES.has(v)) return v
  return 'food'   // modifier_item, ... → food
}

function mapMediaType(val) {
  if (!val) return 'other'
  const v = String(val).trim().toLowerCase()
  if (VALID_MEDIA_TYPES.has(v)) return v
  if (v === 'drink') return 'food'
  return 'other'
}

// Tìm file ảnh, strip "(1)" hoặc " (1)" nếu cần
function resolveImagePath(dir, filename) {
  const direct = path.join(dir, filename)
  if (fs.existsSync(direct)) return direct
  const stripped = filename.replace(/\s*\(\d+\)(\.[^.]+)$/, '$1')
  if (stripped !== filename) {
    const p2 = path.join(dir, stripped)
    if (fs.existsSync(p2)) return p2
  }
  return null
}

function getImageMime(filename) {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.png')  return 'image/png'
  if (ext === '.gif')  return 'image/gif'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

// ── Read Excel ───────────────────────────────────────────────────────────────

function readVendorInfo(wb) {
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  const map = {}
  for (const row of rows) {
    const field = row[0]
    if (field) map[String(field).trim()] = row[1] ?? null
  }

  // Tiệm Bơ: phone  |  Cóc Ăn Đêm: contact_phone / contact_zalo
  const phone = map['phone'] || map['contact_phone'] || null
  const zalo  = map['zalo']  || map['contact_zalo']  || null

  // price range: có thể là chuỗi "xx-yy" hoặc hai field riêng
  let priceMin = null, priceMax = null
  if (map['price_range_min'] != null) priceMin = parseInt(String(map['price_range_min']).replace(/\D/g, ''), 10) || null
  if (map['price_range_max'] != null) priceMax = parseInt(String(map['price_range_max']).replace(/\D/g, ''), 10) || null

  // delivery note
  const deliveryNote = map['delivery_time'] || map['delivery_area'] || null

  return {
    name:            map['name']        ? String(map['name']).trim()        : null,
    vendor_type:     mapVendorType(map['vendor_type']),
    description:     map['description'] ? String(map['description']).trim() : null,
    status:          (map['status'] && String(map['status']).trim()) || 'active',
    source:          'manual',
    address:         map['address'] || map['address_address'] ? String(map['address'] || map['address_address']).trim() : null,
    area:            map['area']        ? String(map['area']).trim()        : null,
    phone:           phone              ? String(phone).trim()               : null,
    zalo:            zalo               ? String(zalo).trim()                : null,
    has_delivery:    true,
    delivery_note:   deliveryNote       ? String(deliveryNote).trim()        : null,
    price_range_min: priceMin,
    price_range_max: priceMax,
  }
}

function readMenuItems(wb) {
  const sheet = wb.Sheets[wb.SheetNames[1]]
  const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  const items = []

  for (const row of rows) {
    const itemName  = row[1]
    const itemType  = row[2]
    const price     = row[3]
    const desc      = row[4]
    const isAvail   = row[5]
    const sortOrder = row[6]

    if (!itemName || !String(itemName).trim()) continue
    if (price == null || isNaN(parseInt(price, 10))) continue
    if (String(itemName).toLowerCase().includes('tên món')) continue
    if (String(itemName).toLowerCase().includes('item_type')) continue

    items.push({
      name:         String(itemName).trim(),
      item_type:    mapItemType(itemType),
      price:        parseInt(price, 10),
      description:  desc      ? String(desc).trim()      : null,
      is_available: parseBool(isAvail) !== false,
      sort_order:   sortOrder != null ? parseInt(sortOrder, 10) || 0 : 0,
    })
  }
  return items
}

function readPhotoList(wb) {
  const sheet = wb.Sheets[wb.SheetNames[2]]
  const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  const photos = []

  for (const row of rows) {
    const filename  = row[1]
    const mediaType = row[2]
    const isPrimary = row[4]
    const note      = row[5]
    const caption   = row[3]

    if (!filename || !String(filename).trim()) continue
    const fn = String(filename).trim()
    if (fn.toLowerCase().includes('tên file') || fn.toLowerCase().includes('media_type')) continue
    if (!fn.match(/\.(jpg|jpeg|png|gif|webp)$/i)) continue

    photos.push({
      filename:   fn,
      media_type: mapMediaType(mediaType),
      caption:    note ? String(note).trim() : (caption ? String(caption).trim() : null),
      is_primary: parseBool(isPrimary) === true,
    })
  }
  return photos
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const stats = {
    vendorsInserted: 0, vendorsUpdated: 0,
    menuItemsInserted: 0,
    photosUploaded: 0, photosFailed: 0,
    errors: [],
  }

  for (const cfg of VENDORS) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`📂  ${path.basename(path.dirname(cfg.excelPath))}`)

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
      stats.errors.push(`Đọc Excel: ${e.message}`)
      continue
    }

    // ── Bước 1: Đọc thông tin quán ──────────────────────────────────────────
    const vendorData = readVendorInfo(wb)
    if (!vendorData.name) {
      console.error(`  ❌  Không đọc được tên quán`)
      stats.errors.push(`Không có tên quán: ${cfg.excelPath}`)
      continue
    }
    console.log(`  Quán: ${vendorData.name}  |  type: ${vendorData.vendor_type}  |  phone: ${vendorData.phone}`)

    // ── Bước 2: Upsert vendor ────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from('vendors')
      .select('id, name')
      .ilike('name', vendorData.name)
      .maybeSingle()

    let vendorId
    if (existing) {
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

    // ── Bước 3: Refresh menu items ───────────────────────────────────────────
    const menuItems = readMenuItems(wb)
    console.log(`  Menu: ${menuItems.length} món`)

    if (menuItems.length > 0) {
      await supabase.from('menu_items').delete().eq('vendor_id', vendorId)
      const { error: menuErr } = await supabase
        .from('menu_items')
        .insert(menuItems.map(item => ({ ...item, vendor_id: vendorId })))
      if (menuErr) {
        console.error(`  ❌  INSERT menu_items thất bại: ${menuErr.message}`)
        stats.errors.push(`Menu ${vendorData.name}: ${menuErr.message}`)
      } else {
        stats.menuItemsInserted += menuItems.length
        console.log(`  ✅  Đã insert ${menuItems.length} món`)
      }
    }

    // ── Bước 4: Refresh ảnh ──────────────────────────────────────────────────
    const photoList = readPhotoList(wb)
    console.log(`  Ảnh: ${photoList.length} file trong sheet`)

    if (photoList.length > 0) {
      await supabase.from('vendor_media').delete().eq('vendor_id', vendorId)

      let coverUrl = null

      for (let idx = 0; idx < photoList.length; idx++) {
        const photo       = photoList[idx]
        const resolvedPath = resolveImagePath(cfg.photoDir, photo.filename)

        if (!resolvedPath) {
          console.log(`    ⚠️  Không tìm thấy file: ${photo.filename}`)
          stats.photosFailed++
          continue
        }

        const fileBuffer  = fs.readFileSync(resolvedPath)
        const storagePath = `${vendorId}/${photo.filename}`
        const mime        = getImageMime(photo.filename)

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

        const { error: mediaErr } = await supabase.from('vendor_media').insert({
          vendor_id:    vendorId,
          image_url:    publicUrl,
          storage_path: storagePath,
          media_type:   photo.media_type,
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

        // cover: ưu tiên is_primary=true, fallback ảnh đầu tiên upload thành công
        if (photo.is_primary || (!coverUrl && idx === 0)) {
          coverUrl = publicUrl
        }

        console.log(`    ✅  ${photo.filename} (${photo.media_type}${photo.is_primary ? ', primary' : ''})`)
      }

      if (coverUrl) {
        const { error: coverErr } = await supabase
          .from('vendors')
          .update({ cover_image_url: coverUrl })
          .eq('id', vendorId)
        if (coverErr) {
          console.error(`  ❌  Update cover_image_url thất bại: ${coverErr.message}`)
        } else {
          console.log(`  ✅  cover_image_url đã set`)
        }
      }
    }

    // ── Bước 5: Set is_partnered = true ─────────────────────────────────────
    const { error: partnerErr } = await supabase
      .from('vendors')
      .update({ is_partnered: true })
      .eq('id', vendorId)
    if (partnerErr) {
      console.error(`  ❌  Set is_partnered thất bại: ${partnerErr.message}`)
      stats.errors.push(`is_partnered ${vendorData.name}: ${partnerErr.message}`)
    } else {
      console.log(`  ✅  is_partnered = true`)
    }
  }

  // ── Bước 6: Xác nhận kết quả ─────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('          BÁO CÁO KẾT QUẢ IMPORT')
  console.log('═'.repeat(60))

  const { data: confirmRows } = await supabase
    .from('vendors')
    .select(`
      id, name, is_partnered, cover_image_url,
      menu_items(count),
      vendor_media(count)
    `)
    .or("name.ilike.%tiệm bơ%,name.ilike.%cóc ăn đêm%")

  if (confirmRows) {
    for (const r of confirmRows) {
      const soMon  = r.menu_items?.[0]?.count ?? 0
      const soAnh  = r.vendor_media?.[0]?.count ?? 0
      const cover  = r.cover_image_url ? '✅' : '❌'
      console.log(`\n  📍 ${r.name}`)
      console.log(`     id:           ${r.id}`)
      console.log(`     is_partnered: ${r.is_partnered}`)
      console.log(`     cover:        ${cover}`)
      console.log(`     Số món:       ${soMon}`)
      console.log(`     Số ảnh:       ${soAnh}`)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`Vendors inserted:  ${stats.vendorsInserted}`)
  console.log(`Vendors updated:   ${stats.vendorsUpdated}`)
  console.log(`Menu items:        ${stats.menuItemsInserted}`)
  console.log(`Ảnh uploaded:      ${stats.photosUploaded}`)
  console.log(`Ảnh thất bại:      ${stats.photosFailed}`)

  if (stats.errors.length > 0) {
    console.log('\nLỗi:')
    stats.errors.forEach(e => console.log(`  ⚠️  ${e}`))
  } else {
    console.log('\n✅  Không có lỗi!')
  }
  console.log('═'.repeat(60))
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
