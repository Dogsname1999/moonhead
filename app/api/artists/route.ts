import { NextResponse } from 'next/server'

const SETLISTFM_API_KEY = 'mtUKLfJWGjln3c0YtrNzuxLEOlv76vwsv2D5'
const TM_KEY = 'mHMiypXXPGBaGh5QujAzyzy0O8q7BNfO'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ artists: [] })
  }

  try {
    // Query both Setlist.fm and Ticketmaster in parallel for artist suggestions
    const [slfRes, tmRes] = await Promise.allSettled([
      fetch(
        `https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(query)}&p=1&sort=relevance`,
        {
          headers: {
            'Accept': 'application/json',
            'x-api-key': SETLISTFM_API_KEY,
          },
        }
      ),
      fetch(
        `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${TM_KEY}&keyword=${encodeURIComponent(query)}&resource=attractions`
      ),
    ])

    const seen = new Set<string>()
    const artists: { name: string; disambiguation?: string }[] = []

    // Setlist.fm artists
    if (slfRes.status === 'fulfilled' && slfRes.value.ok) {
      const data = await slfRes.value.json()
      const list = data?.artist || []
      for (const a of list.slice(0, 8)) {
        const lower = a.name.toLowerCase()
        if (!seen.has(lower)) {
          seen.add(lower)
          artists.push({ name: a.name, disambiguation: a.disambiguation || undefined })
        }
      }
    }

    // Ticketmaster attractions
    if (tmRes.status === 'fulfilled' && tmRes.value.ok) {
      const data = await tmRes.value.json()
      const attractions = data?._embedded?.attractions || []
      for (const a of attractions.slice(0, 5)) {
        const lower = a.name.toLowerCase()
        if (!seen.has(lower)) {
          seen.add(lower)
          artists.push({ name: a.name })
        }
      }
    }

    return NextResponse.json({ artists: artists.slice(0, 8) })
  } catch (error) {
    console.error('Artist search error:', error)
    return NextResponse.json({ artists: [] })
  }
}
