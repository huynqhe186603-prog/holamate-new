import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// ── System Prompts ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT_1 = `Bạn là HolaMate AI — trợ lý ẩm thực tại khu vực Hòa Lạc, Hà Nội.

NHIỆM VỤ:
Phân tích câu hỏi và trả về JSON.

INTENT có thể chọn:
- find_food: tìm quán/món theo nhu cầu
- find_by_distance: tìm theo khoảng cách
- ask_ship: hỏi có ship không
- ask_hours: hỏi giờ mở cửa
- ask_item_price: hỏi giá món cụ thể
- ask_menu: hỏi menu đầy đủ
- ask_contact: hỏi SĐT/Zalo
- ask_address: hỏi địa chỉ
- ask_open_status: hỏi đang mở không
- ask_rating: hỏi rating
- order_help: muốn đặt món
- out_of_scope: ngoài phạm vi ẩm thực

JSON FORMAT (chỉ trả về JSON thuần):
{
  "intent": "...",
  "confidence": 0.0-1.0,
  "filters": {
    "categories": [],
    "max_price": null,
    "has_ship": null,
    "is_open_now": null,
    "min_rating": null,
    "max_rating": null,
    "max_distance": null,
    "vendor_type": null,
    "keywords": []
  },
  "vendor_name": null,
  "item_name": null,
  "missing_fields": [],
  "needs_gps": false
}

QUY TẮC PARSE:
- "dưới Xk" → max_price: X*1000
- "khoảng Xk" → max_price: X*1000*1.2
- "rẻ/tiết kiệm" → max_price: 30000
- "cơm/cơm tấm" → categories: ["com"]
- "bún/phở/mì" → categories: ["bun_pho_mi"]
- "trà sữa" → categories: ["tra_sua"]
- "cafe/cà phê" → categories: ["cafe"]
- "ăn vặt/bánh" → categories: ["an_vat"]
- "đồ uống/nước" → categories: ["do_uong"]
- "lẩu/nướng" → categories: ["lau_nuong"]
- "có ship/giao hàng" → has_ship: true
- "đang mở/còn mở" → is_open_now: true
- "ngon/chất lượng" → min_rating: 4
- "X sao" → min_rating: X-0.5, max_rating: X+0.5
- "trên X sao" → min_rating: X
- "cách Xkm/Xm" → max_distance: X (hoặc X/1000 nếu mét)
- "gần tôi/gần nhất" → max_distance: 1, needs_gps: true
- "quán ăn/quán cố định" → vendor_type: "fixed_shop"
- "gian hàng online/ship online" → vendor_type: "online_seller"
- "gian hàng SV/sinh viên bán" → vendor_type: "student_booth"

MERGE FILTERS TỪ CONTEXT:
Nếu có messages trước:
→ Giữ nguyên filters chưa thay đổi
→ Chỉ cập nhật filters mới được nhắc đến
→ Ví dụ: "cần ship thêm" → giữ max_price cũ, thêm has_ship: true

MISSING FIELDS:
- order_help + vendor_name = null → ["vendor_name"]
- find_by_distance + needs_gps = true nhưng không có GPS → ["gps"]

CONFIDENCE:
- Câu rõ ràng → 0.8-1.0
- Câu mơ hồ → 0.4-0.6
- Không hiểu → 0.1-0.3

CHỈ trả về JSON thuần, không markdown.`

const SYSTEM_PROMPT_2 = `Bạn là HolaMate AI — trợ lý ẩm thực HolaMate.

NGUYÊN TẮC TUYỆT ĐỐI:
- CHỈ dùng thông tin từ DATA DB bên dưới
- KHÔNG thêm bất kỳ thông tin nào ngoài DB
- KHÔNG đề cập quán/món không có trong list
- KHÔNG bịa giá, giờ, địa chỉ, SĐT
- Nếu không có data → nói rõ không có

PHONG CÁCH:
- Dùng "bạn/tôi", lịch sự, chuyên nghiệp
- Tối đa 1-2 emoji toàn bộ câu trả lời
- Ngắn gọn, đúng trọng tâm

GIỚI HẠN ĐỘ DÀI:
- find_food / find_by_distance: 150-200 từ
- ask_* (hỏi chi tiết): 50-80 từ
- order_help: 80-100 từ

VỚI find_food / find_by_distance:
→ 1 câu giới thiệu ngắn
→ Mỗi quán: tên + giá + trạng thái + nổi bật
→ Nếu có distance_km: thêm "~Xkm (ước tính)"
→ Gợi ý xem chi tiết

VỚI ask_*:
→ Trả lời thẳng vào câu hỏi
→ Không lan man

VỚI order_help:
→ Xác nhận quán + món
→ Hỏi xác nhận user trước
→ Sau khi ok → cung cấp link /checkout/[vendorId]
→ Nhắc trạng thái mở cửa

CHỈ trả về câu trả lời thuần, không JSON, không markdown.`

const SUMMARY_PROMPT = `Tóm tắt cuộc hội thoại sau để HolaMate AI dùng làm context.

Chỉ giữ thông tin hữu ích:
- Nhu cầu ăn uống
- Ngân sách
- Khu vực/khoảng cách
- Loại món thích/không thích
- Ràng buộc (không cay, có ship...)
- Quán/món đã gợi ý
- Lựa chọn đã từ chối

Không ghi chi tiết thừa.
Không bịa thêm thông tin.
Trả về dạng văn bản ngắn (dưới 200 từ).`

// ── Helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isVendorOpen(openingHours: Record<string, string> | null): boolean {
  if (!openingHours) return false
  const now = new Date()
  const dayKey = DAY_KEYS[now.getDay()]
  const hours = openingHours[dayKey]
  if (!hours || hours === 'closed') return false
  const parts = hours.split('-')
  if (parts.length !== 2) return false
  const toMin = (t: string) => {
    const [h, m] = t.trim().split(':').map(Number)
    return h * 60 + (m || 0)
  }
  const current = now.getHours() * 60 + now.getMinutes()
  return current >= toMin(parts[0]) && current <= toMin(parts[1])
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type GroqMessage = { role: string; content: string }

// ── Groq caller ──────────────────────────────────────────────────────────────

async function callGroq(
  apiKey: string,
  messages: GroqMessage[],
  maxTokens = 512,
  temperature = 0.2,
): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq ${res.status}: ${body}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ── Groq Call 1: Parse intent ─────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function parseIntent(
  apiKey: string,
  query: string,
  history: ChatMessage[],
  sessionSummary: string,
): Promise<any> {
  const baseMessages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT_1 },
    ...(sessionSummary ? [{ role: 'system', content: `Tóm tắt context: ${sessionSummary}` }] : []),
    ...history.slice(-6),
    { role: 'user', content: query },
  ]

  const rawText = await callGroq(apiKey, baseMessages)

  try {
    return JSON.parse(stripMarkdownFences(rawText))
  } catch {
    // Retry: show the model what it returned and ask for JSON only
    const retryText = await callGroq(apiKey, [
      ...baseMessages,
      { role: 'assistant', content: rawText },
      { role: 'user', content: 'Phản hồi không phải JSON thuần. CHỈ trả về JSON theo đúng format, không có text nào khác.' },
    ])
    return JSON.parse(stripMarkdownFences(retryText))
  }
}

// ── DB query by intent ────────────────────────────────────────────────────────

async function queryByIntent(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  intent: string,
  // deno-lint-ignore no-explicit-any
  filters: any,
  vendorName: string | null,
  itemName: string | null,
  userLat: number | null,
  userLng: number | null,
  hasLocation: boolean,
): Promise<{ type: string; data: any }> { // deno-lint-ignore no-explicit-any
  const detailIntents = [
    'ask_ship', 'ask_hours', 'ask_item_price', 'ask_menu',
    'ask_contact', 'ask_address', 'ask_open_status', 'ask_rating', 'order_help',
  ]

  // ── Detail intents: look up specific vendor ───────────────────────────────
  if (detailIntents.includes(intent)) {
    if (!vendorName) return { type: 'missing_vendor', data: null }

    const { data: vendorData } = await supabase
      .from('vendors')
      .select(`
        id, name, description, vendor_type, phone, zalo, address, area,
        opening_hours, has_delivery, price_range_min, price_range_max,
        food_categories, latitude, longitude, reviews(rating)
      `)
      .eq('status', 'active')
      .ilike('name', `%${vendorName}%`)
      .limit(5)

    if (!vendorData || vendorData.length === 0) {
      return { type: 'not_found', data: { vendor_name: vendorName } }
    }

    if (vendorData.length > 2) {
      return {
        type: 'ambiguous',
        // deno-lint-ignore no-explicit-any
        data: vendorData.slice(0, 5).map((v: any) => ({ id: v.id, name: v.name, address: v.address })),
      }
    }

    const vendor = vendorData[0]
    const revs = Array.isArray(vendor.reviews) ? vendor.reviews : []
    const rating_count = revs.length
    // deno-lint-ignore no-explicit-any
    const rating_avg = rating_count > 0
      ? Math.round(revs.reduce((s: number, r: any) => s + r.rating, 0) / rating_count * 10) / 10
      : null
    const enriched = {
      ...vendor, reviews: undefined,
      rating_avg, rating_count, is_open: isVendorOpen(vendor.opening_hours),
    }

    if (['order_help', 'ask_menu', 'ask_item_price'].includes(intent)) {
      // deno-lint-ignore no-explicit-any
      let menuQ: any = supabase
        .from('menu_items')
        .select('id, name, description, price, item_type')
        .eq('vendor_id', vendor.id)
        .limit(20)
      if (itemName) menuQ = menuQ.ilike('name', `%${itemName}%`)
      const { data: menuItems } = await menuQ
      return { type: 'vendor_detail', data: { vendor: enriched, menu_items: menuItems ?? [] } }
    }

    return { type: 'vendor_detail', data: { vendor: enriched, menu_items: [] } }
  }

  // ── List intents: find_food / find_by_distance ────────────────────────────
  // deno-lint-ignore no-explicit-any
  let q: any = supabase
    .from('vendors')
    .select(`
      id, name, description, vendor_type, cover_image_url, logo_url,
      phone, zalo, address, area, opening_hours, has_delivery,
      price_range_min, price_range_max, food_categories,
      latitude, longitude,
      reviews(rating)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)

  if (filters.vendor_type) q = q.eq('vendor_type', filters.vendor_type)
  if (intent === 'find_by_distance') q = q.eq('vendor_type', 'fixed_shop')
  if (filters.has_ship === true) q = q.eq('has_delivery', true)

  if (filters.categories?.length > 0) {
    const orClauses = filters.categories
      .slice(0, 3)
      .map((cat: string) => `food_categories.cs.{"${cat}"}`)
      .join(',')
    q = q.or(orClauses)
  }

  if (filters.keywords?.length) {
    q = q.or(`name.ilike.%${filters.keywords[0]}%,description.ilike.%${filters.keywords[0]}%`)
  }

  // deno-lint-ignore no-explicit-any
  const { data: raw, error: dbError } = await q as { data: any[] | null; error: any }
  if (dbError) throw dbError

  // deno-lint-ignore no-explicit-any
  let vendors = (raw ?? []).map((v: any) => {
    const revs = Array.isArray(v.reviews) ? v.reviews : []
    const rating_count = revs.length
    const rating_avg = rating_count > 0
      // deno-lint-ignore no-explicit-any
      ? Math.round(revs.reduce((s: number, r: any) => s + r.rating, 0) / rating_count * 10) / 10
      : null
    return { ...v, reviews: undefined, rating_avg, rating_count, is_open: isVendorOpen(v.opening_hours) }
  })

  // Price filter — JS so null price_range_min rows are kept
  if (filters.max_price) {
    // deno-lint-ignore no-explicit-any
    vendors = vendors.filter((v: any) =>
      v.price_range_min === null || v.price_range_min <= filters.max_price
    )
  }

  if (filters.is_open_now === true) {
    // deno-lint-ignore no-explicit-any
    vendors = vendors.filter((v: any) => v.is_open)
  }
  if (filters.min_rating !== null) {
    // deno-lint-ignore no-explicit-any
    vendors = vendors.filter((v: any) => v.rating_avg !== null && v.rating_avg >= filters.min_rating)
  }
  if (filters.max_rating !== null) {
    // deno-lint-ignore no-explicit-any
    vendors = vendors.filter((v: any) => v.rating_avg !== null && v.rating_avg <= filters.max_rating)
  }

  // ── Haversine distance ────────────────────────────────────────────────────
  if (hasLocation && userLat !== null && userLng !== null) {
    if (intent === 'find_by_distance' || filters.max_distance != null) {
      // deno-lint-ignore no-explicit-any
      vendors = vendors.filter((v: any) => v.vendor_type === 'fixed_shop')
    }

    // deno-lint-ignore no-explicit-any
    vendors = vendors.map((v: any) => ({
      ...v,
      distance_km: (v.latitude != null && v.longitude != null)
        ? Math.round(haversineKm(userLat, userLng, v.latitude, v.longitude) * 10) / 10
        : null,
    }))

    if (filters.max_distance != null) {
      const BUFFER = 1.5
      let bufferDist = filters.max_distance * BUFFER
      // deno-lint-ignore no-explicit-any
      let filtered = vendors.filter((v: any) =>
        v.distance_km !== null && v.distance_km <= bufferDist
      )
      while (filtered.length < 3 && bufferDist <= 10) {
        bufferDist += 0.5
        // deno-lint-ignore no-explicit-any
        filtered = vendors.filter((v: any) =>
          v.distance_km !== null && v.distance_km <= bufferDist
        )
      }
      vendors = filtered
    }

    // Sort: nearest first, nulls last
    // deno-lint-ignore no-explicit-any
    vendors.sort((a: any, b: any) => {
      if (a.distance_km === null) return 1
      if (b.distance_km === null) return -1
      return a.distance_km - b.distance_km
    })
  } else {
    // Sort: highest rating first
    // deno-lint-ignore no-explicit-any
    vendors.sort((a: any, b: any) => {
      if (a.rating_avg === null) return 1
      if (b.rating_avg === null) return -1
      return b.rating_avg - a.rating_avg
    })
  }

  vendors = vendors.slice(0, 5)
  return { type: 'vendor_list', data: vendors }
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { query, userId, sessionId, messages, userLat, userLng, sessionSummary, mode } = body

    const apiKey = Deno.env.get('GROQ_API_KEY')!
    if (!apiKey) throw new Error('GROQ_API_KEY is not set')

    // ── Summarize mode ──────────────────────────────────────────────────────
    if (mode === 'summarize') {
      const historyText = (messages as ChatMessage[])
        .map((m: ChatMessage) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n')
      const summary = await callGroq(
        apiKey,
        [
          { role: 'system', content: SUMMARY_PROMPT },
          { role: 'user', content: `Cuộc hội thoại:\n${historyText}` },
        ],
        300,
        0.3,
      )
      return new Response(
        JSON.stringify({ summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Normal query mode ───────────────────────────────────────────────────
    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const history: ChatMessage[] = Array.isArray(messages) ? messages : []
    const hasLocation = typeof userLat === 'number' && typeof userLng === 'number'
    const summary = typeof sessionSummary === 'string' ? sessionSummary : ''

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── GROQ CALL 1: Parse intent ───────────────────────────────────────────
    // deno-lint-ignore no-explicit-any
    let parsed: any = null
    try {
      parsed = await parseIntent(apiKey, query, history, summary)
    } catch (e) {
      console.error('Groq call 1 failed:', e)
      return new Response(
        JSON.stringify({
          explanation: 'Xin lỗi, mình đang gặp sự cố kỹ thuật. Bạn thử lại sau nhé!',
          vendors: [],
          filters: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const {
      intent = 'find_food',
      confidence = 1,
      filters = {},
      vendor_name = null,
      item_name = null,
      missing_fields = [],
    } = parsed

    // ── Early exits ─────────────────────────────────────────────────────────
    if (intent === 'out_of_scope') {
      return new Response(
        JSON.stringify({
          explanation: 'Tôi chỉ hỗ trợ tư vấn ẩm thực tại Hòa Lạc. Bạn muốn tìm quán ăn không?',
          vendors: [],
          filters: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (confidence < 0.6) {
      return new Response(
        JSON.stringify({
          explanation: 'Bạn có thể nói rõ hơn không? Ví dụ: tên quán, loại món, ngân sách?',
          vendors: [],
          filters: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (Array.isArray(missing_fields) && missing_fields.length > 0) {
      if (missing_fields.includes('vendor_name')) {
        return new Response(
          JSON.stringify({
            explanation: 'Bạn muốn đặt tại quán nào? Cho tôi biết tên quán nhé!',
            vendors: [],
            filters: {},
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      if (missing_fields.includes('gps') && !hasLocation) {
        return new Response(
          JSON.stringify({
            explanation: 'Để tìm quán gần bạn, tôi cần biết vị trí của bạn. Vui lòng cho phép trình duyệt truy cập vị trí nhé!',
            vendors: [],
            filters: {},
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    // ── QUERY DB ────────────────────────────────────────────────────────────
    let dbResult: { type: string; data: any } // deno-lint-ignore no-explicit-any
    try {
      dbResult = await queryByIntent(
        supabase, intent, filters, vendor_name, item_name,
        hasLocation ? userLat : null,
        hasLocation ? userLng : null,
        hasLocation,
      )
    } catch (e) {
      console.error('DB query failed:', e)
      return new Response(
        JSON.stringify({
          explanation: 'Tôi chưa lấy được dữ liệu. Bạn thử lại sau nhé.',
          vendors: [],
          filters: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Handle special DB result types before Groq call 2
    if (dbResult.type === 'not_found') {
      const vName = dbResult.data?.vendor_name ?? 'quán này'
      return new Response(
        JSON.stringify({
          explanation: `Tôi không tìm thấy "${vName}" trong hệ thống. Bạn thử tên khác không?`,
          vendors: [],
          filters: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (dbResult.type === 'ambiguous') {
      const names = (dbResult.data as any[]) // deno-lint-ignore no-explicit-any
        .map((v: any) => `- ${v.name}${v.address ? ` (${v.address})` : ''}`) // deno-lint-ignore no-explicit-any
        .join('\n')
      return new Response(
        JSON.stringify({
          explanation: `Bạn hỏi về quán nào?\n${names}`,
          vendors: [],
          filters: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (dbResult.type === 'missing_vendor') {
      return new Response(
        JSON.stringify({
          explanation: 'Bạn muốn hỏi về quán nào? Cho tôi biết tên quán nhé!',
          vendors: [],
          filters: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── GROQ CALL 2: Generate response ──────────────────────────────────────
    const vendors = dbResult.type === 'vendor_list' ? (dbResult.data as any[]) : [] // deno-lint-ignore no-explicit-any

    let explanation: string
    try {
      explanation = await callGroq(
        apiKey,
        [
          { role: 'system', content: SYSTEM_PROMPT_2 },
          {
            role: 'system',
            content: `Intent: ${intent}\nFilters: ${JSON.stringify(filters)}\n\nDATA TỪ DB:\n${JSON.stringify(dbResult.data, null, 2)}`,
          },
          ...history.slice(-3),
          { role: 'user', content: query },
        ],
        512,
        0.4,
      )
    } catch (e) {
      console.error('Groq call 2 failed:', e)
      if (dbResult.type === 'vendor_list' && vendors.length > 0) {
        explanation = `Tôi tìm được ${vendors.length} quán phù hợp với yêu cầu của bạn.`
      } else if (dbResult.type === 'vendor_detail') {
        explanation = `Đây là thông tin về quán ${(dbResult.data as any)?.vendor?.name ?? ''}.` // deno-lint-ignore no-explicit-any
      } else {
        explanation = 'Đây là kết quả tìm được.'
      }
    }

    // ── Log + return ────────────────────────────────────────────────────────
    void supabase.from('ai_search_logs').insert({
      user_id: userId ?? null,
      query,
      parsed_filters: filters,
      // deno-lint-ignore no-explicit-any
      result_vendor_ids: vendors.map((v: any) => v.id),
      session_id: sessionId ?? null,
    })

    return new Response(
      JSON.stringify({ explanation, vendors, filters }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('ai-assistant error:', err)
    return new Response(
      JSON.stringify({ error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
