import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fromLat = searchParams.get('fromLat')
  const fromLng = searchParams.get('fromLng')
  const toLat = searchParams.get('toLat')
  const toLng = searchParams.get('toLng')

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const apiKey = process.env.VIETMAP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const url =
    `https://maps.vietmap.vn/api/route/v3?apikey=${apiKey}` +
    `&point=${fromLat},${fromLng}&point=${toLat},${toLng}` +
    `&vehicle=motorcycle&points_encoded=false`

  let res: Response
  try {
    res = await fetch(url, { next: { revalidate: 0 } })
  } catch {
    return NextResponse.json({ error: 'Network error' }, { status: 502 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Routing API error' }, { status: 502 })
  }

  const data = await res.json()
  const path = data?.paths?.[0]
  if (!path) {
    return NextResponse.json({ error: 'No route found' }, { status: 404 })
  }

  return NextResponse.json({
    distance: path.distance,  // metres
    time: path.time,          // milliseconds
    points: path.points,      // [[lng, lat], ...]
    bbox: path.bbox,          // [minLng, minLat, maxLng, maxLat]
  })
}
