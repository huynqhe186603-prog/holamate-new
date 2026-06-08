import { NextRequest, NextResponse } from 'next/server'

// Edge runtime: low-latency tile/glyph/sprite proxying
export const runtime = 'edge'

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const apiKey = process.env.VIETMAP_API_KEY
  if (!apiKey) return new NextResponse(null, { status: 500 })

  // Reconstruct original VietMap URL and add API key
  const pathStr = params.path.join('/')
  const upstreamUrl = `https://maps.vietmap.vn/${pathStr}?apikey=${apiKey}`

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl)
  } catch {
    return new NextResponse(null, { status: 502 })
  }

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status })
  }

  const body = await upstream.arrayBuffer()
  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'

  // Determine cache duration: tiles cache longer than fonts/sprites
  const isTile = pathStr.includes('/maps/tiles/')
  const maxAge = isTile ? 86400 : 3600

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${maxAge}`,
    },
  })
}
