import { NextRequest, NextResponse } from 'next/server'

// Check Archive.org Live Music Archive for recordings matching artist + date
// Queries per show (artist+date) for reliability — avoids timeouts on huge collections like Grateful Dead

export async function POST(req: NextRequest) {
  try {
    const { shows } = await req.json() as {
      shows: { id: string; artist: string; date: string }[]
    }

    if (!shows || !Array.isArray(shows) || shows.length === 0) {
      return NextResponse.json({ results: {} })
    }

    const results: Record<string, string> = {} // show_id -> archive URL

    // Deduplicate by artist+date so we don't query the same show twice
    const uniqueKeys = new Map<string, { ids: string[]; artist: string; date: string }>()
    shows.forEach(s => {
      if (!s.artist || !s.date) return
      const key = `${s.artist.trim()}|||${s.date.substring(0, 10)}`
      const existing = uniqueKeys.get(key)
      if (existing) {
        existing.ids.push(s.id)
      } else {
        uniqueKeys.set(key, { ids: [s.id], artist: s.artist.trim(), date: s.date.substring(0, 10) })
      }
    })

    const queries = [...uniqueKeys.values()].map(({ ids, artist, date }) => async () => {
      try {
        const query = `creator:"${artist}" AND mediatype:etree AND date:${date}`
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier&sort=downloads+desc&output=json&rows=1`

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Tourbustix/1.0 (tourbustix.com)' },
          signal: AbortSignal.timeout(6000),
        })

        if (!res.ok) return

        const data = await res.json()
        const identifier = data?.response?.docs?.[0]?.identifier
        if (identifier) {
          ids.forEach(id => {
            results[id] = `https://archive.org/details/${identifier}`
          })
        }
      } catch (err) {
        // Silently skip failed lookups
      }
    })

    // Run queries in batches to avoid hammering archive.org
    const BATCH_SIZE = 8
    for (let i = 0; i < queries.length; i += BATCH_SIZE) {
      await Promise.all(queries.slice(i, i + BATCH_SIZE).map(fn => fn()))
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Archive check error:', err)
    return NextResponse.json({ results: {} })
  }
}
