import { NextResponse } from 'next/server'

// Cache the modified style JSON for 1 hour
export const revalidate = 3600

export async function GET() {
  const apiKey = process.env.VIETMAP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  let res: Response
  try {
    res = await fetch(
      `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
      { next: { revalidate: 3600 } }
    )
  } catch {
    return NextResponse.json({ error: 'Upstream unreachable' }, { status: 502 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status })
  }

  const style = await res.json()

  // Replace all absolute VietMap URLs with relative proxy URLs.
  // This routes tile/glyph/sprite fetches through our backend,
  // eliminating CORS issues in the browser.
  const toProxy = (url: string) =>
    url
      .replace(/^https:\/\/maps\.vietmap\.vn\//, '/api/vietmap/')
      .replace(/[?&]apikey=[^&]*/g, '') // strip apikey — added server-side by [...path] route

  for (const src of Object.values(style.sources ?? {}) as any[]) {
    if (Array.isArray(src.tiles)) src.tiles = src.tiles.map(toProxy)
  }
  if (style.glyphs) style.glyphs = toProxy(style.glyphs)
  if (style.sprite) style.sprite = toProxy(style.sprite)

  return NextResponse.json(style, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
