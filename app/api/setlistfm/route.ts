import { NextResponse } from 'next/server'

const SETLISTFM_API_KEY = 'mtUKLfJWGjln3c0YtrNzuxLEOlv76vwsv2D5'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist')

  if (!artist) {
    return NextResponse.json({ songs: [] })
  }

  try {
    // Search setlists for this artist
    const res = await fetch(
      `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artist)}&p=1`,
      {
        headers: {
          'Accept': 'application/json',
          'x-api-key': SETLISTFM_API_KEY,
        },
      }
    )

    if (!res.ok) {
      console.error('Setlist.fm error:', res.status, res.statusText)
      return NextResponse.json({ songs: [] })
    }

    const data = await res.json()
    const setlists = data.setlist || []

    // Extract all unique song titles across all setlists, ranked by frequency
    const songCounts: Record<string, number> = {}
    for (const setlist of setlists) {
      const sets = setlist.sets?.set || []
      for (const set of sets) {
        const songs = set.song || []
        for (const song of songs) {
          if (song.name) {
            const name = song.name.trim()
            songCounts[name] = (songCounts[name] || 0) + 1
          }
        }
      }
    }

    // Sort by frequency (most common first) then alphabetically
    const songs = Object.entries(songCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name)

    return NextResponse.json({ songs })
  } catch (error) {
    console.error('Setlist.fm fetch error:', error)
    return NextResponse.json({ songs: [] })
  }
}
