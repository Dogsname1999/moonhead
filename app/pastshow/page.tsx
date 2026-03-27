'use client'
import { useState, Suspense, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

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
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const justSelectedRef = useRef(false)
  const searchedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const loadMyShows = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('checkins').select('date,artist').eq('user_id', user.id)
      if (data) setMyDates(data.map((c: any) => c.artist + '|' + c.date))
    }
    loadMyShows()
  }, [])

  useEffect(() => {
    if (justSelectedRef.current) { justSelectedRef.current = false; return }
    if (artist.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artists?q=${encodeURIComponent(artist)}`)
        const data = await res.json()
        if (data.artists?.length > 0) { setSuggestions(data.artists); setShowSuggestions(true); setHighlightIndex(-1) }
        else { setSuggestions([]); setShowSuggestions(false) }
      } catch { setSuggestions([]); setShowSuggestions(false) }
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [artist])

  const selectArtist = (name: string) => {
    justSelectedRef.current = true
    searchedRef.current = true
    setArtist(name)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const alreadySaved = (show: any) => {
    if (saved.includes(show.id)) return true
    if (!show.date || myDates.length === 0) return false
    const parts = show.date.split('-')
    if (parts.length !== 3) return false
    const iso = parts[2] + '-' + parts[1] + '-' + parts[0]
    return myDates.some(d =>
      d === show.artist + '|' + iso ||
      d === show.artist + '|' + show.date ||
      d.includes(iso) ||
      d.includes(show.date)
    )
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '36px 24px 64px' }}>

        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '8px', marginTop: 0 }}>I WAS THERE</h2>
        <p style={{ color: '#5C7A9E', fontSize: '14px', marginBottom: '32px', marginTop: 0 }}>Log shows from your past</p>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input ref={inputRef} type="text" value={artist}
            onChange={(e) => { setArtist(e.target.value); searchedRef.current = false }}
            onFocus={() => { if (suggestions.length > 0 && !searchedRef.current) setShowSuggestions(true) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { if (highlightIndex >= 0 && showSuggestions) { selectArtist(suggestions[highlightIndex].name) } else { setShowSuggestions(false); searchedRef.current = true; search() } }
              else if (e.key === 'Escape') { setShowSuggestions(false) }
              else if (e.key === 'ArrowDown' && showSuggestions) { e.preventDefault(); setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1)) }
              else if (e.key === 'ArrowUp' && showSuggestions) { e.preventDefault(); setHighlightIndex(i => Math.max(i - 1, 0)) }
            }}
            placeholder="Artist name..."
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', backgroundColor: '#EDE8DF', color: '#2C4A6E', border: '1.5px solid #8BA5C0', borderRadius: '12px', padding: '16px 20px', fontSize: '16px', outline: 'none' }} />
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#EDE8DF', border: '1.5px solid #8BA5C0', borderRadius: '12px', marginTop: '4px', zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 24px rgba(44,74,110,0.15)' }}>
              {suggestions.map((s: any, i: number) => (
                <div key={i} onClick={() => selectArtist(s.name)}
                  style={{ padding: '14px 20px', cursor: 'pointer', backgroundColor: i === highlightIndex ? '#ddd8cf' : 'transparent', borderBottom: i < suggestions.length - 1 ? '1px solid rgba(139,165,192,0.2)' : 'none' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#2C4A6E', fontSize: '15px' }}>{s.name}</p>
                  {s.disambiguation && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8BA5C0' }}>{s.disambiguation}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <select value={year} onChange={(e) => setYear(e.target.value)}
          style={{ display: 'block', width: '100%', boxSizing: 'border-box', backgroundColor: '#EDE8DF', color: '#2C4A6E', border: '1.5px solid #8BA5C0', borderRadius: '12px', padding: '16px 20px', fontSize: '16px', outline: 'none', marginBottom: '12px' }}>
          <option value="">All years</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <button onClick={search} style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer', marginBottom: '32px' }}>
          {loading ? 'Searching…' : 'Find Shows'}
        </button>

        {results.length > 0 && (
          <div>
            <p style={{ color: '#8BA5C0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>{results.length} shows found</p>
            {results.map((show) => (
              <div key={show.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: 0 }}>{show.artist}</p>
                    <p style={{ color: '#5C7A9E', fontSize: '14px', margin: '2px 0 0' }}>{show.venue}</p>
                    <p style={{ color: '#8BA5C0', fontSize: '14px', margin: '2px 0 0' }}>{show.city}{show.state ? ', ' + show.state : ''}</p>
                    <p style={{ color: '#2C4A6E', fontSize: '14px', fontWeight: 500, margin: '6px 0 0' }}>{formatDate(show.date)}</p>
                    {show.tour && <p style={{ color: '#8BA5C0', fontSize: '12px', margin: '2px 0 0' }}>{show.tour}</p>}
                  </div>
                  <span style={{ color: '#8BA5C0', fontSize: '12px' }}>{show.totalSongs} songs</span>
                </div>
                {show.songs?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: '#8BA5C0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Set List Preview</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {show.songs.slice(0, 6).map((song: any, i: number) => (
                        <span key={i} style={{ fontSize: '12px', backgroundColor: '#F5F0E8', color: '#5C7A9E', padding: '4px 10px', borderRadius: '999px' }}>{song.name}</span>
                      ))}
                      {show.songs.length > 6 && <span style={{ fontSize: '12px', color: '#8BA5C0', padding: '4px 8px' }}>+{show.songs.length - 6} more</span>}
                    </div>
                  </div>
                )}
                {show.archiveUrl && (
                  <a href={show.archiveUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '999px', textAlign: 'center', fontSize: '14px', fontWeight: 600, border: '1.5px solid #8BA5C0', color: '#5C7A9E', textDecoration: 'none', marginBottom: '10px' }}>
                    🎙 Listen on Archive.org
                  </a>
                )}
                {alreadySaved(show) ? (
                  <div style={{ padding: '12px', borderRadius: '999px', textAlign: 'center', fontSize: '14px', fontWeight: 600, backgroundColor: '#F5F0E8', color: '#8BA5C0', border: '1px solid #8BA5C0' }}>
                    ✓ Already in My Shows
                  </div>
                ) : (
                  <button onClick={() => iWasThere(show)} disabled={saving === show.id} style={{ width: '100%', padding: '12px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', backgroundColor: saving === show.id ? '#5C7A9E' : '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
                    {saving === show.id ? 'Saving…' : 'I Was There 🌕'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && artist && (
          <p style={{ color: '#8BA5C0', textAlign: 'center', marginTop: '32px' }}>No shows found. Try a different artist or year.</p>
        )}
      </div>
    </div>
  )
}

export default function PastShowPage() {
  return <Suspense><PastShowContent /></Suspense>
}
