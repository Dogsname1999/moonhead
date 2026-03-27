import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist')
  const date = searchParams.get('date') || ''

  if (!artist) return NextResponse.json({ ebaySearches: [] })

  const year = date ? date.split('-')[0] : ''
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
      label: 'Vinyl & Records',
      emoji: '💿',
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(baseQuery + ' vinyl record LP')}&_sacat=0&LH_TitleDesc=0`,
    },
  ]

  return NextResponse.json({ ebaySearches })
}
