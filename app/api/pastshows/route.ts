import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist') || ''
  const year = searchParams.get('year') || ''
  const mbid = searchParams.get('mbid') || ''
  const stateCode = searchParams.get('state') || ''
  const venueName = searchParams.get('venue') || ''
  const SLF_KEY = process.env.SETLISTFM_API_KEY

  try {
    let artistMbid = mbid

    if (!artistMbid && artist) {
      const artistRes = await fetch(
        'https://api.setlist.fm/rest/1.0/search/artists?artistName=' + encodeURIComponent(artist) + '&p=1&sort=relevance',
        { headers: { 'x-api-key': SLF_KEY || '', 'Accept': 'application/json' } }
      )
      const artistData = await artistRes.json()
      artistMbid = artistData?.artist?.[0]?.mbid || ''
    }

    if (!artistMbid) return NextResponse.json({ results: [], error: 'Artist not found' })

    const page = parseInt(searchParams.get('page') || '1')
    let url = 'https://api.setlist.fm/rest/1.0/search/setlists?artistMbid=' + artistMbid + '&p=' + page
    if (year) url += '&year=' + year
    if (stateCode) url += '&stateCode=' + encodeURIComponent(stateCode)
    if (venueName) url += '&venueName=' + encodeURIComponent(venueName)

    const res = await fetch(url, {
      headers: { 'x-api-key': SLF_KEY || '', 'Accept': 'application/json' }
    })
    const data = await res.json()

    const totalResults = data.total || 0
    const itemsPerPage = data.itemsPerPage || 20
    const totalPages = Math.ceil(totalResults / itemsPerPage)

    const results = (data.setlist || []).map((show: any) => {
      const songs = show.sets?.set?.flatMap((s: any) =>
        s.song?.map((sg: any) => ({
          name: sg.name,
          info: sg.info || '',
          cover: sg.cover?.name || null,
          encore: s.encore || 0,
          setName: s.name || 'Set'
        })) || []
      ) || []
      return {
        id: show.id,
        mbid: artistMbid,
        artist: show.artist?.name,
        venue: show.venue?.name,
        city: show.venue?.city?.name,
        state: show.venue?.city?.stateCode || '',
        country: show.venue?.city?.country?.name || '',
        date: show.eventDate,
        tour: show.tour?.name || '',
        info: show.info || '',
        songs,
        url: show.url,
        totalSongs: songs.length
      }
    })

    return NextResponse.json({ results, mbid: artistMbid, page, totalPages, totalResults })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 })
  }
}
