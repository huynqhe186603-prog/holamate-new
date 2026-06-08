import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const SYSTEM_PROMPT = `Bạn là trợ lý ẩm thực thân thiện tên Mate, dành cho sinh viên khu Hòa Lạc, Hà Nội.

TÍNH CÁCH:
- Thân thiện, vui vẻ như người bạn cùng phòng
- Dùng ngôn ngữ sinh viên tự nhiên
- Có thể dùng emoji nhẹ (1-2 cái/câu)
- Nhớ và tham chiếu context từ tin nhắn trước
- Ví dụ: "Giữ nguyên 70k từ nãy nha bạn..." / "Oke, thêm bún vào list nhé 😄" / "Với ngân sách đó ăn được cả 2 luôn!"

JSON FORMAT (chỉ trả về JSON thuần):
{
  "filters": {
    "vendor_type": "fixed_shop"|"online_seller"|"student_booth"|null,
    "categories": ["com","bun_pho_mi","tra_sua","cafe","an_vat","do_uong"],
    "max_price": <số VND hoặc null>,
    "has_ship": true|false|null,
    "is_open_now": true|false|null,
    "min_rating": <số 1-5 hoặc null>,
    "max_rating": <số 1-5 hoặc null>,
    "keywords": [<tối đa 2 từ khóa>]
  },
  "explanation": "<1-2 câu thân thiện, tham chiếu context cũ nếu có, giải thích sẽ tìm gì>"
}

QUY TẮC PARSE:
- "cơm và bún" → categories: ["com","bun_pho_mi"]
- "cơm hoặc phở" → categories: ["com","bun_pho_mi"]
- "thêm bún nữa" → giữ categories cũ + thêm "bun_pho_mi"
- "cần ship" → has_ship: true, giữ filters khác từ context
- "dưới 50k" → max_price: 50000
- "ngon/chất lượng" → min_rating: 4
- "3 sao" → min_rating: 2.5, max_rating: 3.5
- "4 sao" → min_rating: 3.5, max_rating: 4.5
- "5 sao" → min_rating: 4.5, max_rating: null
- "trên 4 sao" → min_rating: 4, max_rating: null
- "quán ăn" → vendor_type: "fixed_shop"
- "gian hàng online" → vendor_type: "online_seller"
- "gian hàng SV" → vendor_type: "student_booth"
- Nếu có context từ tin trước → merge filters (giữ nguyên giá trị cũ, chỉ cập nhật field được nhắc tới)

CHỈ trả về JSON thuần, không markdown, không giải thích thêm.`

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

async function callGroq(apiKey: string, query: string, history: ChatMessage[]): Promise<string> {
  const recentHistory = history.slice(-10)
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...recentHistory,
        { role: 'user', content: query },
      ],
      max_tokens: 512,
      temperature: 0.2,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq ${res.status}: ${body}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, userId, sessionId, messages } = await req.json()

    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const history: ChatMessage[] = Array.isArray(messages) ? messages : []

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let filters = {
      vendor_type: null as string | null,
      categories: [] as string[],
      max_price: null as number | null,
      has_ship: null as boolean | null,
      is_open_now: null as boolean | null,
      min_rating: null as number | null,
      max_rating: null as number | null,
      keywords: [] as string[],
    }
    let explanation = 'Đây là các quán ăn mình tìm được cho bạn!'

    try {
      const apiKey = Deno.env.get('GROQ_API_KEY')!
      if (!apiKey) throw new Error('GROQ_API_KEY is not set')
      const rawText = await callGroq(apiKey, query, history)
      const parsed = JSON.parse(stripMarkdownFences(rawText))
      if (parsed.filters) {
        filters = {
          ...filters,
          ...parsed.filters,
          categories: Array.isArray(parsed.filters.categories) ? parsed.filters.categories : [],
        }
      }
      if (parsed.explanation) explanation = parsed.explanation
    } catch (e) {
      console.error('Groq call failed:', e)
    }

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

    if (filters.categories.length > 0) {
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

    if (filters.is_open_now === true) {
      // deno-lint-ignore no-explicit-any
      vendors = vendors.filter((v: any) => v.is_open)
    }
    if (filters.min_rating !== null) {
      // deno-lint-ignore no-explicit-any
      vendors = vendors.filter((v: any) => v.rating_avg !== null && v.rating_avg >= filters.min_rating!)
    }
    if (filters.max_rating !== null) {
      // deno-lint-ignore no-explicit-any
      vendors = vendors.filter((v: any) => v.rating_avg !== null && v.rating_avg <= filters.max_rating!)
    }

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
