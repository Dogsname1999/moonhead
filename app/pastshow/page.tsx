'use client'
import { useState, Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

const YEARS = Array.from({ length: 60 }, (_, i) => (2026 - i).toString())

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',
  DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
  KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',
  MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',
  WI:'Wisconsin',WY:'Wyoming',DC:'Washington DC'
}

function PastShowContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [artist, setArtist] = useState(searchParams.get('artist') || '')
  const [year, setYear] = useState(searchParams.get('year') || '')
  const [stateCode, setStateCode] = useState(searchParams.get('state') || '')
  const [venue, setVenue] = useState(searchParams.get('venue') || '')
  const [scanningStub, setScanningStub] = useState(false)
  const [stubImageUrl, setStubImageUrl] = useState<string | null>(null)
  const [scanError, setScanError] = useState('')
  const [scanResult, setScanResult] = useState<{ artist: string; venue: string; city: string; date: string; year: string } | null>(null)
  const stubFileRef = useRef<HTMLInputElement>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState('')
  const [saved, setSaved] = useState<string[]>([])
  const [mbid, setMbid] = useState('')
  const [myDates, setMyDates] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [expandedShow, setExpandedShow] = useState<string | null>(null)
  const [archiveUrls, setArchiveUrls] = useState<Record<string, string>>({})
  const justSelectedRef = useRef(false)
  const searchedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const autoSearchedRef = useRef(false)

  useEffect(() => {
    const loadMyShows = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('checkins').select('date,artist').eq('user_id', user.id)
      if (data) setMyDates(data.map((c: any) => c.artist + '|' + c.date))
    }
    loadMyShows()
    // Auto-search if pre-filled from stub scan
    if (searchParams.get('artist') && !autoSearchedRef.current) {
      autoSearchedRef.current = true
      searchedRef.current = true
      setTimeout(() => search(1), 300)
    }
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

  useEffect(() => {
    if (!expandedShow) return
    if (archiveUrls[expandedShow]) return
    const show = results.find(r => r.id === expandedShow)
    if (!show) return
    const lookup = async () => {
      try {
        const dp = show.date ? show.date.split('-') : []
        const isoDate = dp.length === 3 ? dp[2] + '-' + dp[1] + '-' + dp[0] : show.date
        const res = await fetch('https://archive.org/advancedsearch.php?q=' + encodeURIComponent('collection:etree AND creator:"' + show.artist + '" AND date:' + isoDate) + '&fl=identifier&sort=downloads+desc&output=json&rows=1')
        const data = await res.json()
        const id = data?.response?.docs?.[0]?.identifier
        if (id) setArchiveUrls(prev => ({ ...prev, [expandedShow]: 'https://archive.org/details/' + id }))
      } catch {}
    }
    lookup()
  }, [expandedShow])

  const handleStubScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanError('')
    setScanResult(null)
    setStubImageUrl(URL.createObjectURL(file))
    setScanningStub(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/scan-stub', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setScanError(data.error || 'Failed to analyze the ticket stub.')
        setScanningStub(false)
        return
      }
      setScanResult(data)
      if (data.artist) setArtist(data.artist)
      if (data.venue) setVenue(data.venue)
      if (data.year) setYear(data.year)
    } catch (err) {
      console.error('Scan error:', err)
      setScanError('Failed to scan the image. Please try again.')
    }
    setScanningStub(false)
    if (stubFileRef.current) stubFileRef.current.value = ''
  }

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

  const search = async (pageNum = 1) => {
    if (!artist.trim()) return
    if (pageNum === 1) { setLoading(true); setMbid('') }
    else setLoadingMore(true)
    try {
      let url = `/api/pastshows?artist=${encodeURIComponent(artist)}&page=${pageNum}`
      if (year) url += `&year=${year}`
      if (stateCode) url += `&state=${stateCode}`
      if (venue.trim()) url += `&venue=${encodeURIComponent(venue.trim())}`
      if (pageNum > 1 && mbid) url += `&mbid=${mbid}`
      const res = await fetch(url)
      const data = await res.json()
      if (pageNum === 1) {
        setResults(data.results || [])
      } else {
        setResults(prev => [...prev, ...(data.results || [])])
      }
      if (data.mbid) setMbid(data.mbid)
      setPage(data.page || pageNum)
      setTotalPages(data.totalPages || 0)
      setTotalResults(data.totalResults || 0)
    } catch (e) { console.error(e) }
    setLoading(false)
    setLoadingMore(false)
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
      if (!user) { router.push('/auth?redirect=/pastshow'); return }
      const dp = show.date ? show.date.split('-') : []
      const dateFormatted = dp.length === 3 ? dp[2] + '-' + dp[1] + '-' + dp[0] : show.date || ''
      const { data: checkin, error: insertError } = await supabase.from('checkins').insert({
        user_id: user.id, artist: show.artist, venue: show.venue,
        city: show.city + (show.state ? ', ' + show.state : ''),
        date: dateFormatted, note: '', concert_id: show.id, source: 'setlist.fm', is_dream: false
      }).select().single()
      if (insertError) { console.error('Insert error:', insertError); setSaving(''); return }
      if (checkin && show.songs?.length > 0) {
        await supabase.from('setlists').insert(show.songs.map((song: any, i: number) => ({
          checkin_id: checkin.id, user_id: user.id,
          song_title: song.name, note: song.info || '', position: i + 1,
          set_name: song.encore ? (song.encore > 1 ? `Encore ${song.encore}` : 'Encore') : (song.setName || 'Set')
        })))
      }
      if (checkin) {
        setSaved(prev => [...prev, show.id])
        setTimeout(() => router.push('/show/' + checkin.id), 800)
      }
    } catch (e) { console.error(e) }
    setSaving('')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '36px 24px 64px' }}>

        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '8px', marginTop: 0 }}>I WAS THERE</h2>
        <p style={{ color: '#5C7A9E', fontSize: '14px', marginBottom: '24px', marginTop: 0 }}>Log shows from your past</p>

        {/* Scan a Stub section */}
        <div style={{ marginBottom: '24px' }}>
          <input ref={stubFileRef} type="file" accept="image/*" capture="environment" onChange={handleStubScan} style={{ display: 'none' }} />

          {!stubImageUrl && !scanningStub && (
            <button onClick={() => stubFileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '16px', border: '2px dashed #8BA5C0', backgroundColor: '#EDE8DF', cursor: 'pointer', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🎫</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#2C4A6E' }}>Scan a Ticket Stub</span>
            </button>
          )}

          {stubImageUrl && (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #8BA5C0', marginBottom: '12px' }}>
              <img src={stubImageUrl} alt="Ticket stub" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
              {scanningStub && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(44,74,110,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid rgba(245,240,232,0.3)', borderTop: '3px solid #F5F0E8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#F5F0E8', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                    Reading your stub...
                  </p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              )}
            </div>
          )}

          {stubImageUrl && !scanningStub && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <button onClick={() => stubFileRef.current?.click()}
                style={{ background: 'none', border: 'none', color: '#5C7A9E', fontSize: '13px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                Try different photo
              </button>
              <button onClick={() => { setStubImageUrl(null); setScanResult(null); setArtist(''); setVenue(''); setYear('') }}
                style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '13px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                Clear
              </button>
            </div>
          )}

          {scanError && (
            <p style={{ color: '#c0392b', fontSize: '13px', margin: '0 0 12px' }}>{scanError}</p>
          )}

          {/* AI Vision results */}
          {scanResult && !scanningStub && (
            <div style={{ backgroundColor: '#EDE8DF', borderRadius: '12px', border: '1.5px solid #2C4A6E', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#2C4A6E', letterSpacing: '0.08em', margin: '0 0 12px', textTransform: 'uppercase' }}>We found this on your stub:</p>
              {scanResult.artist && (
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', margin: '0 0 4px' }}>{scanResult.artist}</p>
              )}
              {scanResult.venue && (
                <p style={{ fontSize: '14px', color: '#5C7A9E', margin: '0 0 2px' }}>{scanResult.venue}</p>
              )}
              {scanResult.city && (
                <p style={{ fontSize: '14px', color: '#5C7A9E', margin: '0 0 2px' }}>{scanResult.city}</p>
              )}
              {(scanResult.date || scanResult.year) && (
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C4A6E', margin: '4px 0 0' }}>{scanResult.date || scanResult.year}</p>
              )}
              <p style={{ fontSize: '12px', color: '#8BA5C0', margin: '10px 0 0', fontStyle: 'italic' }}>
                Fields below are pre-filled — edit if needed, then search
              </p>
            </div>
          )}

          {!stubImageUrl && !scanningStub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#8BA5C0' }} />
              <span style={{ fontSize: '12px', color: '#8BA5C0', fontWeight: 600 }}>OR SEARCH</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#8BA5C0' }} />
            </div>
          )}
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input ref={inputRef} type="text" value={artist}
            onChange={(e) => { setArtist(e.target.value); searchedRef.current = false }}
            onFocus={() => { if (suggestions.length > 0 && !searchedRef.current) setShowSuggestions(true) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { if (highlightIndex >= 0 && showSuggestions) { selectArtist(suggestions[highlightIndex].name) } else { setShowSuggestions(false); searchedRef.current = true; setPage(1); search(1) } }
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

        <select value={stateCode} onChange={(e) => setStateCode(e.target.value)}
          style={{ display: 'block', width: '100%', boxSizing: 'border-box', backgroundColor: '#EDE8DF', color: '#2C4A6E', border: '1.5px solid #8BA5C0', borderRadius: '12px', padding: '16px 20px', fontSize: '16px', outline: 'none', marginBottom: '12px' }}>
          <option value="">All states</option>
          {US_STATES.map(s => <option key={s} value={s}>{STATE_NAMES[s]} ({s})</option>)}
        </select>

        <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)}
          placeholder="Venue name (optional)"
          onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); search(1) } }}
          style={{ display: 'block', width: '100%', boxSizing: 'border-box', backgroundColor: '#EDE8DF', color: '#2C4A6E', border: '1.5px solid #8BA5C0', borderRadius: '12px', padding: '16px 20px', fontSize: '16px', outline: 'none', marginBottom: '12px' }} />

        <button onClick={() => { setPage(1); search(1) }} style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer', marginBottom: '32px' }}>
          {loading ? 'Searching…' : 'Find Shows'}
        </button>

        {results.length > 0 && (
          <div>
            <p style={{ color: '#8BA5C0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Showing {results.length}{totalResults > 0 ? ` of ${totalResults}` : ''} shows</p>
            {results.map((show) => {
              const isExpanded = expandedShow === show.id
              const sets: { name: string; songs: any[] }[] = []
              if (show.songs?.length > 0) {
                show.songs.forEach((song: any) => {
                  const sn = song.encore ? (song.encore > 1 ? `Encore ${song.encore}` : 'Encore') : (song.setName || 'Set')
                  const existing = sets.find(s => s.name === sn)
                  if (existing) existing.songs.push(song)
                  else sets.push({ name: sn, songs: [song] })
                })
              }
              return (
                <div key={show.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', border: isExpanded ? '1.5px solid #2C4A6E' : '1px solid #8BA5C0', marginBottom: '12px', overflow: 'hidden' }}>
                  {/* Clickable header */}
                  <div onClick={() => setExpandedShow(isExpanded ? null : show.id)}
                    style={{ padding: '20px', cursor: 'pointer' }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#e8e3da' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: 0 }}>{show.artist}</p>
                        <p style={{ color: '#5C7A9E', fontSize: '14px', margin: '2px 0 0' }}>{show.venue}</p>
                        <p style={{ color: '#8BA5C0', fontSize: '14px', margin: '2px 0 0' }}>{show.city}{show.state ? ', ' + show.state : ''}</p>
                        <p style={{ color: '#2C4A6E', fontSize: '14px', fontWeight: 500, margin: '6px 0 0' }}>{formatDate(show.date)}</p>
                        {show.tour && <p style={{ color: '#8BA5C0', fontSize: '12px', margin: '2px 0 0' }}>{show.tour}</p>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ color: '#8BA5C0', fontSize: '12px' }}>{show.totalSongs} songs</span>
                        <span style={{ color: '#8BA5C0', fontSize: '18px', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>→</span>
                      </div>
                    </div>
                    {/* Collapsed preview: just set names + song count */}
                    {!isExpanded && sets.length > 0 && (
                      <p style={{ color: '#8BA5C0', fontSize: '12px', margin: '8px 0 0' }}>
                        {sets.map(s => `${s.name} (${s.songs.length})`).join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* Expanded full setlist */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px' }}>
                      {sets.length > 0 && (() => {
                        let runningIndex = 0
                        return (
                          <div style={{ marginBottom: '16px' }}>
                            {sets.map((set, si) => {
                              return (
                                <div key={si} style={{ marginBottom: si < sets.length - 1 ? '20px' : 0 }}>
                                  <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C4A6E', margin: '0 0 8px', paddingBottom: '6px', borderBottom: '2px solid #8BA5C0' }}>{set.name}</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {set.songs.map((song: any) => {
                                      runningIndex++
                                      return (
                                        <div key={runningIndex} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#F5F0E8', borderRadius: '10px' }}>
                                          <span style={{ color: '#8BA5C0', fontSize: '12px', fontWeight: 600, width: '24px', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{runningIndex}</span>
                                          <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 600, color: '#2C4A6E', fontSize: '15px', margin: 0 }}>{song.name}{song.info && <span style={{ color: '#5C7A9E', fontSize: '12px', fontWeight: 400, marginLeft: '6px' }}>{song.info}</span>}</p>
                                            {song.cover && <p style={{ color: '#8BA5C0', fontSize: '11px', marginTop: '2px', marginBottom: 0 }}>Cover: {song.cover}</p>}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                      {archiveUrls[show.id] && (
                        <a href={archiveUrls[show.id]} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '999px', textAlign: 'center', fontSize: '14px', fontWeight: 600, border: '1.5px solid #8BA5C0', color: '#5C7A9E', textDecoration: 'none', marginBottom: '10px' }}>
                          🎙 Listen on Archive.org
                        </a>
                      )}
                      {alreadySaved(show) ? (
                        <div style={{ padding: '12px', borderRadius: '999px', textAlign: 'center', fontSize: '14px', fontWeight: 600, backgroundColor: '#F5F0E8', color: '#8BA5C0', border: '1px solid #8BA5C0' }}>
                          ✓ Already in My Shows
                        </div>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); iWasThere(show) }} disabled={saving === show.id} style={{ width: '100%', padding: '12px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', backgroundColor: saving === show.id ? '#5C7A9E' : '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
                          {saving === show.id ? 'Saving…' : 'I Was There 🌕'}
                        </button>
                      )}
                      <button onClick={(e) => {
                        e.stopPropagation()
                        const url = `${window.location.origin}/concert/${show.id}`
                        navigator.clipboard?.writeText(url)
                        const el = e.currentTarget
                        el.textContent = 'Link Copied!'
                        setTimeout(() => { el.textContent = '🔗 Share This Show' }, 2000)
                      }} style={{ width: '100%', padding: '10px', borderRadius: '999px', fontWeight: 600, fontSize: '13px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer', marginTop: '8px' }}>
                        🔗 Share This Show
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {page < totalPages && (
              <button onClick={() => search(page + 1)} disabled={loadingMore}
                style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer', marginTop: '16px' }}>
                {loadingMore ? 'Loading…' : `Load More Shows (page ${page + 1} of ${totalPages})`}
              </button>
            )}
          </div>
        )}

        {!loading && results.length === 0 && artist && (
          <p style={{ color: '#8BA5C0', textAlign: 'center', marginTop: '32px' }}>No shows found. Try adjusting your filters — different year, state, or venue.</p>
        )}
      </div>
    </div>
  )
}

export default function PastShowPage() {
  return <Suspense><PastShowContent /></Suspense>
}
