import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  const TM_KEY = process.env.TICKETMASTER_API_KEY
  const hasLocation = lat !== null && lng !== null && lat !== '' && lng !== ''

  try {
    const results: any[] = []

    const size = hasLocation ? 50 : 10
    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TM_KEY}&classificationName=music&size=${size}&sort=date,asc`
    if (query) tmUrl += `&keyword=${encodeURIComponent(query)}`
    if (hasLocation) tmUrl += `&latlong=${lat},${lng}&radius=25&unit=miles`

    const tmRes = await fetch(tmUrl)
    const tmData = await tmRes.json()

    if (tmData._embedded?.events) {
      const queryLower = query.toLowerCase().trim()
      tmData._embedded.events.forEach((event: any) => {
        const attractions = event._embedded?.attractions || []
        const venues = event._embedded?.venues || []

        // Match query loosely against attractions, venues, cities, or event name.
        // Skip the filter entirely when using location-based search (trust TM's geo filter).
        if (queryLower && !hasLocation) {
          const matchesAttraction = attractions.some((a: any) => a.name?.toLowerCase().includes(queryLower))
          const matchesVenue = venues.some((v: any) => v.name?.toLowerCase().includes(queryLower))
          const matchesCity = venues.some((v: any) => v.city?.name?.toLowerCase().includes(queryLower))
          const matchesState = venues.some((v: any) => v.state?.name?.toLowerCase().includes(queryLower) || v.state?.stateCode?.toLowerCase() === queryLower)
          const matchesEventName = event.name?.toLowerCase().includes(queryLower)
          if (!matchesAttraction && !matchesVenue && !matchesCity && !matchesState && !matchesEventName) return
        }

        // Prefer an attraction that matches the query; otherwise use the headliner or event name
        const matchingAttraction = queryLower
          ? attractions.find((a: any) => a.name?.toLowerCase().includes(queryLower))
          : null
        const artistName = matchingAttraction?.name || attractions[0]?.name || event.name

        results.push({
          id: `tm_${event.id}`,
          source: 'ticketmaster',
          name: event.name || '',
          artist: artistName,
          venue: venues[0]?.name || 'Unknown Venue',
          city: venues[0]?.city?.name || '',
          date: event.dates?.start?.localDate || '',
          time: event.dates?.start?.localTime || '',
          image: event.images?.[0]?.url || '',
          url: event.url || '',
        })
      })
    }

    // Sort chronologically
    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch concerts' }, { status: 500 })
  }
}
