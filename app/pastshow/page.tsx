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
    return months[parseInt(parts[1]) - 1] + ' ' + parseInt(parts[0]) + ', ' + parts[2]
  }

  const iWasThere = async (show: any) => {
    setSaving(show.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const dp = show.date ? show.date.split('-') : []
      const dateFormatted = dp.length === 3 ? dp[2] + '-' + dp[1] + '-' + dp[0] : show.date || ''
      const { data: checkin } = await supabase.from('checkins').insert({
        user_id: user.id, artist: show.artist, venue: show.venue,
        city: show.city + (show.state ? ', ' + show.state : ''),
        date: dateFormatted, note: '', concert_id: show.id, source: 'setlist.fm'
      }).select().single()
      if (checkin && show.songs?.length > 0) {
        await supabase.from('setlists').insert(show.songs.map((song: any, i: number) => ({
          checkin_id: checkin.id, user_id: user.id,
          song_title: song.name, note: song.info || '', position: i + 1
        })))
      }
      setSaved(prev => [...prev, show.id])
      if (checkin) setTimeout(() => router.push('/show/' + checkin.id), 800)
    } catch (e) { console.error(e) }
    setSaving('')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', padding: '48px 24px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '14px', cursor: 'pointer', marginBottom: '32px', padding: 0 }}
        >
          ← Back
        </button>

        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '8px', marginTop: 0 }}>
          I WAS THERE
        </h2>
        <p style={{ color: '#5C7A9E', fontSize: '14px', marginBottom: '32px', marginTop: 0 }}>
          Log shows from your past
        </p>

        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Artist name..."
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            backgroundColor: '#EDE8DF', color: '#2C4A6E',
            border: '1.5px solid #8BA5C0', borderRadius: '12px',
            padding: '16px 20px', fontSize: '16px', outline: 'none', marginBottom: '12px',
          }}
        />

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            backgroundColor: '#EDE8DF', color: '#2C4A6E',
            border: '1.5px solid #8BA5C0', borderRadius: '12px',
            padding: '16px 20px', fontSize: '16px', outline: 'none', marginBottom: '12px',
          }}
        >
          <option value="">All years</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <button
          onClick={search}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            padding: '16px', borderRadius: '999px', fontWeight: 600,
            fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8',
            border: 'none', cursor: 'pointer', marginBottom: '32px',
          }}
        >
          {loading ? 'Searching…' : 'Find Shows'}
        </button>

        {results.length > 0 && (
          <div>
            <p style={{ color: '#8BA5C0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
              {results.length} shows found
            </p>
            {results.map((show) => (
              <div key={show.id} style={{
                backgroundColor: '#EDE8DF', borderRadius: '16px',
                padding: '20px', border: '1px solid #8BA5C0', marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: 0 }}>{show.artist}</p>
                    <p style={{ color: '#5C7A9E', fontSize: '14px', margin: '2px 0 0' }}>{show.venue}</p>
                    <p style={{ color: '#8BA5C0', fontSize: '14px', margin: '2px 0 0' }}>{show.city}{show.state ? ', ' + show.state : ''}</p>
                    <p style={{ color: '#2C4A6E', fontSize: '14px', fontWeight: 500, margin: '6px 0 0' }}>{formatDate(show.date)}</p>
                  </div>
                  <span style={{ color: '#8BA5C0', fontSize: '12px' }}>{show.totalSongs} songs</span>
                </div>

                {show.songs?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: '#8BA5C0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                      Set List Preview
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {show.songs.slice(0, 6).map((song: any, i: number) => (
                        <span key={i} style={{ fontSize: '12px', backgroundColor: '#F5F0E8', color: '#5C7A9E', padding: '4px 10px', borderRadius: '999px' }}>
                          {song.name}
                        </span>
                      ))}
                      {show.songs.length > 6 && (
                        <span style={{ fontSize: '12px', color: '#8BA5C0', padding: '4px 8px' }}>+{show.songs.length - 6} more</span>
                      )}
                    </div>
                  </div>
                )}

                {show.archiveUrl && (
                  <a href={show.archiveUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', width: '100%', boxSizing: 'border-box',
                    padding: '12px', borderRadius: '999px', textAlign: 'center',
                    fontSize: '14px', fontWeight: 600, border: '1.5px solid #8BA5C0',
                    color: '#5C7A9E', textDecoration: 'none', marginBottom: '10px',
                  }}>
                    🎙 Listen on Archive.org
                  </a>
                )}

                {saved.includes(show.id) ? (
                  <div style={{
                    padding: '12px', borderRadius: '999px', textAlign: 'center',
                    fontSize: '14px', fontWeight: 600, backgroundColor: '#F5F0E8',
                    color: '#8BA5C0', border: '1px solid #8BA5C0',
                  }}>
                    ✓ Saved to My Shows
                  </div>
                ) : (
                  <button onClick={() => iWasThere(show)} disabled={saving === show.id} style={{
                    width: '100%', padding: '12px', borderRadius: '999px', fontWeight: 600,
                    fontSize: '14px', backgroundColor: saving === show.id ? '#5C7A9E' : '#2C4A6E',
                    color: '#F5F0E8', border: 'none', cursor: 'pointer',
                  }}>
                    {saving === show.id ? 'Saving…' : 'I Was There 🌕'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && artist && (
          <p style={{ color: '#8BA5C0', textAlign: 'center', marginTop: '32px' }}>
            No shows found. Try a different artist or year.
          </p>
        )}
      </div>
    </div>
  )
}

export default function PastShowPage() {
  return <Suspense><PastShowContent /></Suspense>
}
