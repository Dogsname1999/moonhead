'use client'
import { useState, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const YEARS = Array.from({ length: 60 }, (_, i) => (2025 - i).toString())

function PastShowContent() {
  const router = useRouter()
  const [artist, setArtist] = useState('')
  const [year, setYear] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState('')
  const [saved, setSaved] = useState<string[]>([])
  const [mbid, setMbid] = useState('')
  const [myDates, setMyDates] = useState<string[]>([])

  useEffect(() => {
    const loadMyShows = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('checkins').select('date,artist').eq('user_id', user.id)
      if (data) setMyDates(data.map((c: any) => c.artist + '|' + c.date))
    }
    loadMyShows()
  }, [])

  const alreadySaved = (show: any) => {
    if (!show.date || myDates.length === 0) return false
    const parts = show.date.split('-')
    if (parts.length !== 3) return false
    const iso = parts[2] + '-' + parts[1] + '-' + parts[0]
    const key1 = show.artist + '|' + iso
    const key2 = show.artist + '|' + show.date
    return myDates.some(d => d === key1 || d === key2 || d.includes(iso) || d.includes(show.date))
  }


  const search = async () => {
    if (!artist.trim()) return
    setLoading(true)
    try {
      let url = `/api/pastshows?artist=${encodeURIComponent(artist)}`
      if (year) url += `&year=${year}`
      if (mbid) url += `&mbid=${mbid}`
      const res = await fetch(url)
      const data = await res.json()
      setResults(data.results || [])
      if (data.mbid) setMbid(data.mbid)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const formatDate = (d: string) => {
    if (!d) return ''
    const parts = d.split('-')
    if (parts.length !== 3) return d
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1
    const year = parts[2]
    return months[month] + ' ' + day + ', ' + year
  }

  const iWasThere = async (show: any) => {
    setSaving(show.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      console.log('RAW DATE FROM SETLIST:', show.date)
      const dp = show.date ? show.date.split('-') : []
      const dateFormatted = dp.length === 3 ? dp[2] + '-' + dp[1] + '-' + dp[0] : show.date || ''
      console.log('DATE FORMATTED:', dateFormatted)
      const { data: checkin } = await supabase.from('checkins').insert({
        user_id: user.id, artist: show.artist, venue: show.venue,
        city: show.city + (show.state ? ', ' + show.state : ''),
        date: dateFormatted, note: '', concert_id: show.id, source: 'setlist.fm'
      }).select().single()
      if (checkin && show.songs && show.songs.length > 0) {
        const songRows = show.songs.map((song: any, index: number) => ({
          checkin_id: checkin.id, user_id: user.id,
          song_title: song.name, note: song.info || '', position: index + 1
        }))
        await supabase.from('setlists').insert(songRows)
      }
      setSaved((prev) => [...prev, show.id])
      if (checkin) setTimeout(() => router.push('/show/' + checkin.id), 800)
    } catch (e) { console.error(e) }
    setSaving('')
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-8 hover:text-white transition">Back</button>
        <h2 className="text-3xl font-bold tracking-widest mb-2" style={{ color: '#F5A623' }}>I WAS THERE</h2>
        <p className="text-zinc-400 text-sm mb-8">Log shows from your past</p>
        <div className="space-y-4 mb-6">
          <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Artist name..."
            className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-xl px-5 py-4 text-lg focus:outline-none" />
          <select value={year} onChange={(e) => setYear(e.target.value)}
            className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-xl px-5 py-4 text-lg focus:outline-none">
            <option value="">All years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={search} className="w-full py-4 rounded-full font-semibold text-lg transition"
            style={{ backgroundColor: '#F5A623', color: '#000' }}>
            {loading ? 'Searching...' : 'Find Shows'}
          </button>
        </div>
        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">{results.length} shows found</p>
            {results.map((show) => (
              <div key={show.id} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{show.artist}</h3>
                    <p className="text-zinc-400 text-sm">{show.venue}</p>
                    <p className="text-zinc-500 text-sm">{show.city}{show.state ? ', ' + show.state : ''}</p>
                    <p className="text-sm mt-1" style={{ color: '#F5A623' }}>{formatDate(show.date)}</p>
                    {show.tour && <p className="text-zinc-600 text-xs mt-1">{show.tour}</p>}
                  </div>
                  <span className="text-zinc-600 text-xs mt-1">{show.totalSongs} songs</span>
                </div>
                {show.info && <p className="text-zinc-500 text-xs italic mb-3 leading-relaxed">{show.info}</p>}
                {show.songs && show.songs.length > 0 && (
                  <div className="mb-4">
                    <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Set List Preview</p>
                    <div className="flex flex-wrap gap-1">
                      {show.songs.slice(0, 6).map((song: any, i: number) => (
                        <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">{song.name}</span>
                      ))}
                      {show.songs.length > 6 && <span className="text-xs text-zinc-600 px-2 py-1">+{show.songs.length - 6} more</span>}
                    </div>
                  </div>
                )}
                {show.archiveUrl && (
                  <a href={show.archiveUrl} target="_blank" rel="noopener noreferrer"
                    className="block w-full py-3 rounded-full text-center text-sm font-semibold border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition mb-3">
                    Listen on Archive.org
                  </a>
                )}
                {saved.includes(show.id) ? (
                  <div className="w-full py-3 rounded-full text-center text-sm font-semibold bg-zinc-800 text-zinc-500">Saved to My Shows</div>
                ) : (
                  <button onClick={() => iWasThere(show)} disabled={saving === show.id}
                    className="w-full py-3 rounded-full font-semibold transition"
                    style={{ backgroundColor: saving === show.id ? '#c47d0e' : '#F5A623', color: '#000' }}>
                    {saving === show.id ? 'Saving...' : 'I Was There'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && results.length === 0 && artist && (
          <p className="text-zinc-500 text-center mt-8">No shows found. Try a different artist or year.</p>
        )}
      </div>
    </main>
  )
}

export default function PastShowPage() {
  return <Suspense><PastShowContent /></Suspense>
}
