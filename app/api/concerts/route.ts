import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  const TM_KEY = process.env.TICKETMASTER_API_KEY
  const SLF_KEY = process.env.SETLISTFM_API_KEY

  try {
    const results: any[] = []

    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TM_KEY}&classificationName=music&size=10`
    if (query) tmUrl += `&keyword=${encodeURIComponent(query)}`
    if (lat && lng) tmUrl += `&latlong=${lat},${lng}&radius=25&unit=miles`

    const tmRes = await fetch(tmUrl)
    const tmData = await tmRes.json()

    if (tmData._embedded?.events) {
      tmData._embedded.events.forEach((event: any) => {
        results.push({
          id: `tm_${event.id}`,
          source: 'ticketmaster',
          name: event.name,
          artist: event._embedded?.attractions?.[0]?.name || event.name,
          venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
          city: event._embedded?.venues?.[0]?.city?.name || '',
          date: event.dates?.start?.localDate || '',
          time: event.dates?.start?.localTime || '',
          image: event.images?.[0]?.url || '',
          url: event.url || '',
        })
      })
    }

    if (query) {
      const artistRes = await fetch(
        `https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(query)}&p=1&sort=relevance`,
        { headers: { 'x-api-key': SLF_KEY || '', 'Accept': 'application/json' } }
      )
      const artistData = await artistRes.json()
      const mbid = artistData?.artist?.[0]?.mbid

      if (mbid) {
        const setlistRes = await fetch(
          `https://api.setlist.fm/rest/1.0/artist/${mbid}/setlists?p=1`,
          { headers: { 'x-api-key': SLF_KEY || '', 'Accept': 'application/json' } }
        )
        const setlistData = await setlistRes.json()

        if (setlistData?.setlist) {
          setlistData.setlist.slice(0, 5).forEach((show: any) => {
            results.push({
              id: `slf_${show.id}`,
              source: 'setlist.fm',
              name: `${query} at ${show.venue?.name}`,
              artist: query,
              venue: show.venue?.name || 'Unknown Venue',
              city: show.venue?.city?.name || '',
              date: show.eventDate ? show.eventDate.split('-').reverse().join('-') : '',
              time: '',
              image: '',
              url: show.url || '',
              songs: show.sets?.set?.flatMap((s: any) => s.song?.map((sg: any) => sg.name) || []) || [],
            })
          })
        }
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch concerts' }, { status: 500 })
  }
}
