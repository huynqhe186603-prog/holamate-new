import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, userId, sessionId } = await req.json()

    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    // Parse natural language query into structured filters + explanation
    const aiMsg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `Bạn là trợ lý ẩm thực thân thiện cho sinh viên khu Hòa Lạc, Hà Nội.
Phân tích yêu cầu người dùng và trả về JSON:
{
  "filters": {
    "vendor_type": "fixed_shop" | "student_booth" | null,
    "category": "com" | "bun_pho_mi" | "tra_sua" | "cafe" | "an_vat" | "do_uong" | null,
    "max_price": <số nguyên VND hoặc null>,
    "has_ship": true | false | null,
    "is_open_now": true | false | null,
    "keywords": [<từ khóa tên quán hoặc khu vực, mảng string, tối đa 2 phần tử>]
  },
  "explanation": "<1-2 câu ngắn, thân thiện, bằng tiếng Việt, giải thích mình sẽ tìm gì>"
}
Lưu ý: category chỉ chọn 1 trong các giá trị đã liệt kê hoặc null. Chỉ trả về JSON thuần túy, không markdown.`,
      messages: [{ role: 'user', content: query }],
    })

    // Parse AI response, gracefully fall back on errors
    let filters = {
      vendor_type: null as string | null,
      category: null as string | null,
      max_price: null as number | null,
      has_ship: null as boolean | null,
      is_open_now: null as boolean | null,
      keywords: [] as string[],
    }
    let explanation = 'Đây là các quán ăn mình tìm được cho bạn!'

    try {
      const raw = (aiMsg.content[0] as { type: string; text: string }).text.trim()
      const parsed = JSON.parse(raw)
      if (parsed.filters) filters = { ...filters, ...parsed.filters }
      if (parsed.explanation) explanation = parsed.explanation
    } catch {
      // use defaults
    }

    // Build Supabase vendor query with parsed filters
    // deno-lint-ignore no-explicit-any
    let q: any = supabase
      .from('vendors')
      .select(`
        id, name, description, vendor_type, cover_image_url, logo_url,
        phone, zalo, address, area, opening_hours, has_delivery,
        price_range_min, price_range_max, food_categories,
        reviews(rating)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12)

    if (filters.vendor_type) q = q.eq('vendor_type', filters.vendor_type)
    if (filters.has_ship === true) q = q.eq('has_delivery', true)
    if (filters.max_price) q = q.lte('price_range_min', filters.max_price)
    if (filters.category) q = q.contains('food_categories', [filters.category])
    if (filters.keywords?.length) {
      q = q.or(`name.ilike.%${filters.keywords[0]}%,description.ilike.%${filters.keywords[0]}%`)
    }

    // deno-lint-ignore no-explicit-any
    const { data: raw, error: dbError } = await q as { data: any[] | null; error: any }
    if (dbError) throw dbError

    // Compute rating + open status, strip raw reviews array
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

    if (filters.is_open_now === true) {
      // deno-lint-ignore no-explicit-any
      vendors = vendors.filter((v: any) => v.is_open)
    }

    // Log to ai_search_logs (fire and forget)
    void supabase.from('ai_search_logs').insert({
      user_id: userId ?? null,
      query,
      parsed_filters: filters,
      result_vendor_ids: vendors.map((v: any) => v.id),
      session_id: sessionId ?? null,
    })

    return new Response(
      JSON.stringify({ explanation, vendors, filters }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('ai-assistant error:', err)
    return new Response(
      JSON.stringify({ error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
