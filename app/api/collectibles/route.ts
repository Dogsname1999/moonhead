import { NextResponse } from 'next/server'

const DISCOGS_USER_AGENT = 'MoonheadApp/1.0'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist')
  const date = searchParams.get('date') || ''

  if (!artist) return NextResponse.json({ releases: [], ebaySearches: [] })

  // Extract year from date for filtering
  const year = date ? date.split('-')[0] : ''

  // Fetch from Discogs: artist releases (vinyl, CD, etc.)
  let releases: any[] = []
  try {
    const discogsRes = await fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(artist)}&type=release&per_page=12&sort=year&sort_order=desc`,
      {
        headers: {
          'User-Agent': DISCOGS_USER_AGENT,
        },
      }
    )
    if (discogsRes.ok) {
      const data = await discogsRes.json()
      const seen = new Set<string>()
      releases = (data.results || [])
        .filter((r: any) => {
          // Dedupe by title
          const key = r.title?.toLowerCase().replace(/\s+/g, ' ').trim()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, 8)
        .map((r: any) => ({
          title: r.title || '',
          year: r.year || '',
          format: (r.format || []).join(', '),
          thumbnail: r.cover_image || r.thumb || '',
          url: `https://www.discogs.com${r.uri || ''}`,
          genre: (r.genre || []).join(', '),
        }))
    }
  } catch (e) {
    console.error('Discogs error:', e)
  }

  // Build eBay search URLs for different collectible categories
  const baseQuery = artist
  const dateQuery = year ? ` ${year}` : ''
  const ebaySearches = [
    {
      label: 'Concert Posters',
      emoji: '🎨',
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(baseQuery + ' concert poster' + dateQuery)}&_sacat=0&LH_TitleDesc=0`,
    },
    {
      label: 'Ticket Stubs',
      emoji: '🎫',
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(baseQuery + ' concert ticket stub' + dateQuery)}&_sacat=0&LH_TitleDesc=0`,
    },
    {
      label: 'Tour Merch',
      emoji: '👕',
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(baseQuery + ' tour shirt' + dateQuery)}&_sacat=0&LH_TitleDesc=0`,
    },
    {
      label: 'Setlists & Ephemera',
      emoji: '📝',
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(baseQuery + ' setlist concert memorabilia' + dateQuery)}&_sacat=0&LH_TitleDesc=0`,
    },
  ]

  return NextResponse.json({ releases, ebaySearches })
}
