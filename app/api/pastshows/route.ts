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

    const getStartPage = (y: string, totalShows: number) => {
      const yr = parseInt(y)
      const currentYear = new Date().getFullYear()
      const yearsBack = currentYear - yr
      const showsPerYear = totalShows / 50
      const approxPage = Math.floor((yearsBack * showsPerYear) / 20)
      return Math.max(1, approxPage - 2)
    }

    const totalRes = await fetch(
      'https://api.setlist.fm/rest/1.0/artist/' + artistMbid + '/setlists?p=1',
      { headers: { 'x-api-key': SLF_KEY || '', 'Accept': 'application/json' } }
    )
    const totalData = await totalRes.json()
    const totalShows = totalData.total || 100
    const startPage = year ? getStartPage(year, totalShows) : 1
    let results: any[] = []

    for (let page = Math.max(1, startPage - 3); page <= startPage + 10; page++) {
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
