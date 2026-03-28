import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const setlistId = searchParams.get('id')
  const SLF_KEY = process.env.SETLISTFM_API_KEY

  if (!setlistId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const res = await fetch(
      `https://api.setlist.fm/rest/1.0/setlist/${setlistId}`,
      { headers: { 'x-api-key': SLF_KEY || '', 'Accept': 'application/json' } }
    )

    if (!res.ok) return NextResponse.json({ error: 'Show not found' }, { status: 404 })

    const show = await res.json()

    const songs = show.sets?.set?.flatMap((s: any) =>
      s.song?.map((sg: any) => ({
        name: sg.name,
        info: sg.info || '',
        cover: sg.cover?.name || null,
        encore: s.encore || 0,
        setName: s.name || 'Set'
      })) || []
    ) || []

    return NextResponse.json({
      id: show.id,
      artist: show.artist?.name,
      mbid: show.artist?.mbid,
      venue: show.venue?.name,
      city: show.venue?.city?.name,
      state: show.venue?.city?.stateCode || '',
      country: show.venue?.city?.country?.name || '',
      date: show.eventDate,
      tour: show.tour?.name || '',
      info: show.info || '',
      url: show.url,
      songs,
      totalSongs: songs.length
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch show' }, { status: 500 })
  }
}
