import { NextRequest, NextResponse } from 'next/server'

// Check Archive.org Live Music Archive for recordings matching artist + date
// Groups by artist and uses OR'd date clauses for efficiency

export async function POST(req: NextRequest) {
  try {
    const { shows } = await req.json() as {
      shows: { id: string; artist: string; date: string }[]
    }

    if (!shows || !Array.isArray(shows) || shows.length === 0) {
      return NextResponse.json({ results: {} })
    }

    // Group shows by artist
    const artistGroups = new Map<string, { ids: string[]; dates: string[] }[]>()
    const showLookup = new Map<string, string[]>() // "artist|||date" -> show ids

    shows.forEach(s => {
      if (!s.artist || !s.date) return
      const artist = s.artist.trim()
      const date = s.date.substring(0, 10)
      const key = `${artist}|||${date}`

      const existing = showLookup.get(key)
      if (existing) {
        existing.push(s.id)
      } else {
        showLookup.set(key, [s.id])
      }

      if (!artistGroups.has(artist)) {
        artistGroups.set(artist, [])
      }
    })

    // Build per-artist date sets
    const artistDates = new Map<string, Set<string>>()
    showLookup.forEach((ids, key) => {
      const [artist, date] = key.split('|||')
      if (!artistDates.has(artist)) artistDates.set(artist, new Set())
      artistDates.get(artist)!.add(date)
    })

    const results: Record<string, string> = {}

    // One query per artist with OR'd dates
    const queries = [...artistDates.entries()].map(([artist, dates]) => async () => {
      try {
        const dateClause = [...dates].map(d => `date:${d}`).join(' OR ')
        const query = `creator:"${artist}" AND mediatype:etree AND (${dateClause})`
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier&fl[]=date&sort[]=downloads+desc&output=json&rows=${dates.size * 3}`

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Tourbustix/1.0 (tourbustix.com)' },
          signal: AbortSignal.timeout(5000),
        })

        if (!res.ok) return

        const data = await res.json()
        const docs = data?.response?.docs || []

        // Map date -> best identifier (first result per date, sorted by downloads)
        const dateMap: Record<string, string> = {}
        docs.forEach((doc: any) => {
          if (!doc.date || !doc.identifier) return
          const archiveDate = doc.date.substring(0, 10)
          if (!dateMap[archiveDate]) {
            dateMap[archiveDate] = doc.identifier
          }
        })

        // Map back to show IDs
        dates.forEach(date => {
          if (dateMap[date]) {
            const key = `${artist}|||${date}`
            const ids = showLookup.get(key) || []
            ids.forEach(id => {
              results[id] = `https://archive.org/details/${dateMap[date]}`
            })
          }
        })
      } catch (err) {
        // Silently skip failed artist lookups
      }
    })

    // Run all artist queries in parallel (batched)
    const BATCH_SIZE = 10
    for (let i = 0; i < queries.length; i += BATCH_SIZE) {
      await Promise.all(queries.slice(i, i + BATCH_SIZE).map(fn => fn()))
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Archive check error:', err)
    return NextResponse.json({ results: {} })
  }
}
