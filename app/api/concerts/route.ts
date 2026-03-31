import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  const TM_KEY = process.env.TICKETMASTER_API_KEY

  try {
    const results: any[] = []

    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TM_KEY}&classificationName=music&size=10`
    if (query) tmUrl += `&keyword=${encodeURIComponent(query)}`
    if (lat && lng) tmUrl += `&latlong=${lat},${lng}&radius=25&unit=miles`

    const tmRes = await fetch(tmUrl)
    const tmData = await tmRes.json()

    if (tmData._embedded?.events) {
      const queryLower = query.toLowerCase()
      tmData._embedded.events.forEach((event: any) => {
        // Check if any attraction matches the search query
        const attractions = event._embedded?.attractions || []
        const matchingAttraction = attractions.find((a: any) => a.name?.toLowerCase().includes(queryLower))
        // Only include if the searched artist is in the lineup
        if (query && !matchingAttraction) return
        const artistName = matchingAttraction?.name || attractions[0]?.name || event.name
        results.push({
          id: `tm_${event.id}`,
          source: 'ticketmaster',
          name: event.name || '',
          artist: artistName,
          venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
          city: event._embedded?.venues?.[0]?.city?.name || '',
          date: event.dates?.start?.localDate || '',
          time: event.dates?.start?.localTime || '',
          image: event.images?.[0]?.url || '',
          url: event.url || '',
        })
      })
    }

    // Only upcoming shows from Ticketmaster — past shows use "I Was There" flow

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch concerts' }, { status: 500 })
  }
}
