import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { user_id, event_type, provider } = await req.json()
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? null
    const userAgent = req.headers.get('user-agent') ?? null

    await supabaseAdmin.from('user_login_history').insert({
      user_id: user_id ?? null,
      event_type,
      provider: provider ?? null,
      ip_address: ip,
      user_agent: userAgent,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
