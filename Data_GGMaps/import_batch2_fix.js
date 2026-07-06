const https = require('https');
const fs = require('fs');

const svcKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeGFnb2ZmZW9hZ2d1bXFvamRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE1ODYzOSwiZXhwIjoyMDk1NzM0NjM5fQ.eC_bvwzzgDnS8TbyuFmtk1KFx5Me4en8NM1giHCZA28';
const base = 'prxagoffeoaggumqojdd.supabase.co';

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const buf = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    const headers = { 'apikey': svcKey, 'Authorization': 'Bearer ' + svcKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };
    if (buf) headers['Content-Length'] = buf.length;
    const r = https.request({ hostname: base, path: '/rest/v1/' + path, method, headers }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (buf) r.write(buf);
    r.end();
  });
}

// All 10 vendors with GPS coords
const coordMap = [
  { lat: 21.0064852, lng: 105.5221481, id: '2e87a872-0f14-4a39-8acb-ea467030c59b', name: 'Vườn Bia Đồi Xanh' },
  { lat: 21.008592,  lng: 105.524841,  id: '83077578-839f-4883-a153-476773e781ca', name: 'Nhà Hàng Hồ Sen' },
  { lat: 21.0178593, lng: 105.5484471, id: '87f33c9c-ce09-4595-98fa-b0704e28ba51', name: 'Bảo Trâm Quán' },
  { lat: 21.0177987, lng: 105.5483576, id: 'ae67bff1-0e63-4c6d-b68e-a084fb1ee301', name: 'Canh Ơi' },
  { lat: 21.0098358, lng: 105.5339518, id: 'cfc3b960-a0ea-458d-8fe2-5ebbbcad4b7d', name: 'Căng Tin Vườn Uơm' },
  { lat: 21.0178261, lng: 105.5483831, id: 'eaa53106-6851-406b-862f-79fec93f0e4a', name: 'Quán Thu Hà' },
  { lat: 21.0176617, lng: 105.5483525, id: 'ecc6d736-f9e0-4166-85ea-06bee8cfca91', name: 'Buk Bbq & Hotpot' },
  { lat: 21.0175753, lng: 105.5483179, id: '9d3fcbd9-8fca-4e83-bfc6-7c246e80a838', name: 'Bia Thành Quán' },
  { lat: 21.0194588, lng: 105.5211359, id: 'c3149ed6-1506-4409-86b9-8deb84bfb1ba', name: 'Cơm Huệ' },
  { lat: 21.0176375, lng: 105.5482656, id: 'ebc92852-7a21-4987-ba11-379e8bedce26', name: 'Nướng Ven Hồ Hà Quý' },
];

// Closest-match instead of first-within-threshold
function findClosest(lat, lng) {
  let best = null, bestDist = Infinity;
  for (const c of coordMap) {
    const dist = Math.sqrt((c.lat - lat) ** 2 + (c.lng - lng) ** 2);
    if (dist < bestDist) { bestDist = dist; best = c; }
  }
  return bestDist < 0.01 ? best : null; // max ~1km
}

const raw = fs.readFileSync('D:\\CN8\\Holamate_new\\database_ready (2).json', 'utf8');
const fileData = JSON.parse(raw);
const noName = fileData.filter(d => !d.name);

// Preview matching
console.log('=== Matching preview ===');
noName.forEach(d => {
  const m = findClosest(d.latitude, d.longitude);
  const dist = m ? Math.sqrt((m.lat - d.latitude) ** 2 + (m.lng - d.longitude) ** 2).toFixed(6) : 'N/A';
  console.log(`(${d.latitude}, ${d.longitude}) → ${m ? m.name : 'NO MATCH'} [dist=${dist}] ${d.menu.length} items`);
});

// Build menu payload
const menuRows = [];
noName.forEach(d => {
  const m = findClosest(d.latitude, d.longitude);
  if (!m) return;
  d.menu.forEach((item, i) => {
    menuRows.push({ vendor_id: m.id, name: item.name, price: item.price || 0,
      description: item.description || null, item_type: 'food', is_available: true, sort_order: i + 1 });
  });
});

async function run() {
  // Delete ALL menu items for these 10 vendors (clean slate)
  const allIds = coordMap.map(c => c.id).join(',');
  console.log('\n=== Step 1: Delete existing menu items for 10 vendors ===');
  const del = await req('DELETE', 'menu_items?vendor_id=in.(' + allIds + ')');
  console.log('Delete status:', del.status, del.status === 204 ? 'OK' : del.body);

  // Re-insert correctly
  console.log('\n=== Step 2: Insert', menuRows.length, 'menu items (correct match) ===');
  const ins = await req('POST', 'menu_items', menuRows);
  console.log('Insert status:', ins.status, ins.status === 201 ? 'SUCCESS' : ins.body);

  // Verify
  console.log('\n=== Step 3: Verify counts ===');
  const vr = await req('GET', 'menu_items?vendor_id=in.(' + allIds + ')&select=vendor_id');
  const items = JSON.parse(vr.body);
  const counts = {};
  items.forEach(i => counts[i.vendor_id] = (counts[i.vendor_id] || 0) + 1);
  coordMap.forEach(c => {
    const n = counts[c.id] || 0;
    console.log(`${c.name}: ${n} items ${n > 0 ? '✓' : '← MISSING'}`);
  });
  console.log('TOTAL:', items.length);
}

run().catch(console.error);
