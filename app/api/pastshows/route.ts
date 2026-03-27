import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist') || ''
  const year = searchParams.get('year') || ''
  const mbid = searchParams.get('mbid') || ''
  const SLF_KEY = process.env.SETLISTFM_API_KEY

  try {
    let artistMbid = mbid

    if (!artistMbid && artist) {
      const artistRes = await fetch(
        `https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(artist)}&p=1&sort=relevance`,
        { headers: { 'x-api-key': SLF_KEY || '', 'Accept': 'application/json' } }
      )
      const artistData = await artistRes.json()
      artistMbid = artistData?.artist?.[0]?.mbid || ''
    }

    if (!artistMbid) {
      return NextResponse.json({ results: [], error: 'Artist not found' })
    }

    const getStartPage = (y: string) => {
      const yr = parseInt(y)
      if (yr >= 2020) return 1
      if (yr >= 2015) return 1
      if (yr >= 2010) return 2
      if (yr >= 2005) return 3
      if (yr >= 2000) return 4
      if (yr >= 1995) return 5
      if (yr >= 1993) return 8
      if (yr >= 1992) return 12
      if (yr >= 1991) return 14
      if (yr >= 1989) return 18
      if (yr >= 1987) return 22
      if (yr >= 1985) return 26
      return 30
    }

    const startPage = year ? getStartPage(year) : 1
    let results: any[] = []

    for (let page = startPage; page <= startPage + 6; page++) {
      const url = `https://api.setlist.fm/rest/1.0/artist/${artistMbid}/setlists?p=${page}`
      const res = await fetch(url, {
        headers: { 'x-api-key': SLF_KEY || '', 'Accept': 'application/json' }
      })
      const data = await res.json()
      const shows = data.setlist || []
      if (shows.length === 0) break

      const filtered = year
        ? shows.filter((s: any) => s.eventDate?.includes(year))
        : shows

      results = [...results, ...filtered.map((show: any) => {
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
      })]
    }

    return NextResponse.json({ results, mbid: artistMbid })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 })
  }
}
