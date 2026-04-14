import { NextRequest, NextResponse } from 'next/server'

// Check Archive.org Live Music Archive for recordings matching artist + date
// Groups by unique artist to minimize API calls

export async function POST(req: NextRequest) {
  try {
    const { shows } = await req.json() as {
      shows: { id: string; artist: string; date: string }[]
    }

    if (!shows || !Array.isArray(shows) || shows.length === 0) {
      return NextResponse.json({ results: {} })
    }

    // Group shows by artist (lowercased for dedup)
    const artistShows: Record<string, { id: string; date: string }[]> = {}
    shows.forEach(s => {
      if (!s.artist || !s.date) return
      const key = s.artist.trim()
      if (!artistShows[key]) artistShows[key] = []
      artistShows[key].push({ id: s.id, date: s.date })
    })

    // For each unique artist, query Archive.org for etree recordings
    const results: Record<string, string> = {} // show_id -> archive URL

    const artistQueries = Object.entries(artistShows).map(async ([artist, items]) => {
      try {
        // Collect all dates for this artist
        const dates = items.map(i => i.date)

        // Query archive.org advanced search - search by creator and mediatype:etree
        const query = `creator:"${artist}" AND mediatype:etree`
        const fields = 'identifier,date'
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=${fields.split(',').join('&fl[]=')}&rows=2000&output=json`

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Tourbustix/1.0 (tourbustix.com)' },
          signal: AbortSignal.timeout(8000),
        })

        if (!res.ok) return

        const data = await res.json()
        const docs = data?.response?.docs || []

        // Build a map of date -> first matching identifier
        const dateMap: Record<string, string> = {}
        docs.forEach((doc: any) => {
          if (!doc.date || !doc.identifier) return
          // Archive.org dates can be "YYYY-MM-DD" or "YYYY-MM-DDT..."
          const archiveDate = doc.date.substring(0, 10)
          if (!dateMap[archiveDate]) {
            dateMap[archiveDate] = doc.identifier
          }
        })

        // Match against the user's show dates
        items.forEach(item => {
          const showDate = item.date.substring(0, 10)
          if (dateMap[showDate]) {
            // Link to search results for that date so user can pick their preferred recording
            results[item.id] = `https://archive.org/details/${dateMap[showDate]}`
          }
        })
      } catch (err) {
        // Silently skip failed artist lookups
        console.error(`Archive check failed for ${artist}:`, err)
      }
    })

    // Run all artist queries in parallel (but limit concurrency)
    const BATCH_SIZE = 5
    for (let i = 0; i < artistQueries.length; i += BATCH_SIZE) {
      await Promise.all(artistQueries.slice(i, i + BATCH_SIZE))
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Archive check error:', err)
    return NextResponse.json({ results: {} })
  }
}
