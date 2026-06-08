import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const apiKey = process.env.VIETMAP_API_KEY
  if (!apiKey) return new NextResponse('API key missing', { status: 500 })

  // Parse the path from the absolute request URL — more reliable than params
  // e.g. req.url = "https://holamate-new.vercel.app/api/vietmap/maps/tiles/..."
  //      → vmPath = "maps/tiles/..."
  const reqUrl = new URL(req.url)
  const vmPath = reqUrl.pathname.replace(/^\/api\/vietmap\//, '')

  if (!vmPath) return new NextResponse('Empty path', { status: 400 })

  const upstreamUrl = `https://maps.vietmap.vn/${vmPath}?apikey=${apiKey}`

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl, {
      headers: { Accept: req.headers.get('Accept') ?? '*/*' },
    })
  } catch (err) {
    console.error('[VietMap proxy] fetch error:', upstreamUrl, err)
    return new NextResponse('Upstream fetch failed', { status: 502 })
  }

  if (!upstream.ok) {
    return new NextResponse(`Upstream ${upstream.status}`, { status: upstream.status })
  }

  const body = await upstream.arrayBuffer()
  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const isTile = vmPath.includes('/maps/tiles/')

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${isTile ? 86400 : 3600}`,
    },
  })
}
