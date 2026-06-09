import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fromLat = searchParams.get('fromLat')
  const fromLng = searchParams.get('fromLng')
  const toLat   = searchParams.get('toLat')
  const toLng   = searchParams.get('toLng')

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // OSRM public routing API — free, no key, coordinates [lng,lat]
  const url =
    `https://router.project-osrm.org/route/v1/motorcycle/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&steps=false`

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
  const route = data?.routes?.[0]
  if (!route) {
    return NextResponse.json({ error: 'No route found' }, { status: 404 })
  }

  // Compute bbox from coordinates
  const coords: [number, number][] = route.geometry?.coordinates ?? []
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  }
  const bbox = coords.length ? [minLng, minLat, maxLng, maxLat] : null

  return NextResponse.json({
    distance: route.distance,                 // meters
    time: Math.round(route.duration * 1000),  // ms (OSRM returns seconds)
    points: coords,                           // [[lng, lat], ...] — GeoJSON order
    bbox,
  })
}
