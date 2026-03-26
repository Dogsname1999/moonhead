import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const TM_KEY = process.env.TICKETMASTER_API_KEY
  const BIT_ID = process.env.BANDSINTOWN_APP_ID
  try {
    const results: any[] = []
    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TM_KEY}&classificationName=music&size=10`
    if (query) tmUrl += `&keyword=${encodeURIComponent(query)}`
    if (lat && lng) tmUrl += `&latlong=${lat},${lng}&radius=25&unit=miles`
    const tmRes = await fetch(tmUrl)
    const tmData = await tmRes.json()
    if (tmData._embedded?.events) {
      tmData._embedded.events.forEach((event: any) => {
        results.push({ id: `tm_${event.id}`, source: 'ticketmaster', name: event.name, artist: event._embedded?.attractions?.[0]?.name || event.name, venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue', city: event._embedded?.venues?.[0]?.city?.name || '', date: event.dates?.start?.localDate || '', time: event.dates?.start?.localTime || '', image: event.images?.[0]?.url || '', url: event.url || '' })
      })
    }
    if (query) {
      const bitUrl = `https://rest.bandsintown.com/artists/${encodeURIComponent(query)}/events?app_id=${BIT_ID}`
      const bitRes = await fetch(bitUrl)
      const bitData = await bitRes.json()
      if (Array.isArray(bitData)) {
        bitData.slice(0, 10).forEach((event: any) => {
          results.push({ id: `bit_${event.id}`, source: 'bandsintown', name: event.venue?.name, artist: query, venue: event.venue?.name || 'Unknown Venue', city: event.venue?.city || '', date: event.datetime?.split('T')[0] || '', time: event.datetime?.split('T')[1] || '', image: event.artist?.image_url || '', url: event.url || '' })
        })
      }
    }
    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch concerts' }, { status: 500 })
  }
}
