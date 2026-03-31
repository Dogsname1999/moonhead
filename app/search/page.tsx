'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

interface Concert {
  id: string; source: string; name: string; artist: string
  venue: string; city: string; date: string; time: string; image: string; url: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Concert[]>([])
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const router = useRouter()

  // Artist autocomplete state
  const [suggestions, setSuggestions] = useState<{ name: string; disambiguation?: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const justSelectedRef = useRef(false)

  // Fetch artist suggestions as user types — but NOT after a selection or search
  const searchedRef = useRef(false)

  useEffect(() => {
    if (justSelectedRef.current || searchedRef.current) {
      justSelectedRef.current = false
      return
    }

    if (query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artists?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setSuggestions(data.artists || [])
        setShowSuggestions((data.artists || []).length > 0)
        setActiveSuggestion(-1)
      } catch (e) {
        console.error('Artist autocomplete error:', e)
      }
    }, 250)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = async (q: string, lat?: number, lng?: number) => {
    searchedRef.current = true
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.blur()
    setLoading(true)
    try {
      let url = `/api/concerts?query=${encodeURIComponent(q)}`
      if (lat && lng) url += `&lat=${lat}&lng=${lng}`
      const res = await fetch(url)
      const data = await res.json()
      setResults(data.results || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const selectArtist = (name: string) => {
    justSelectedRef.current = true
    searchedRef.current = true
    setQuery(name)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.blur()
    // Auto-search immediately
    setTimeout(() => search(name), 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeSuggestion >= 0) {
          selectArtist(suggestions[activeSuggestion].name)
        } else {
          search(query)
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Enter') {
      search(query)
    }
  }

  // Highlight matching text
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ fontWeight: 700, color: '#2C4A6E' }}>{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    )
  }

  const useMyLocation = () => {
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocationLoading(false); search(query, pos.coords.latitude, pos.coords.longitude) },
      () => { setLocationLoading(false); alert('Could not get your location.') }
    )
  }

  const formatDate = (date: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '8px', marginTop: 0 }}>FIND YOUR SHOW</h2>
        <p style={{ color: '#5C7A9E', fontSize: '15px', marginBottom: '28px', marginTop: 0 }}>Search by artist, venue, or city</p>

        {/* Search input with artist autocomplete */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { searchedRef.current = false; setQuery(e.target.value) }}
            onFocus={() => { if (suggestions.length > 0 && !searchedRef.current) setShowSuggestions(true) }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Radiohead, Madison Square Garden..."
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', backgroundColor: '#EDE8DF', color: '#2C4A6E', border: '1.5px solid #8BA5C0', borderRadius: '12px', padding: '16px 20px', fontSize: '16px', outline: 'none' }}
          />

          {showSuggestions && (
            <div
              ref={suggestionsRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#F5F0E8',
                border: '1.5px solid #8BA5C0',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(44,74,110,0.15)',
                zIndex: 20,
                overflow: 'hidden',
                marginTop: '4px',
              }}
            >
              {suggestions.map((artist, i) => (
                <button
                  key={artist.name}
                  onClick={() => selectArtist(artist.name)}
                  onMouseEnter={() => setActiveSuggestion(i)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 20px',
                    fontSize: '16px',
                    color: activeSuggestion === i ? '#2C4A6E' : '#5C7A9E',
                    backgroundColor: activeSuggestion === i ? '#EDE8DF' : 'transparent',
                    border: 'none',
                    borderBottom: i < suggestions.length - 1 ? '1px solid #EDE8DF' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s',
                  }}
                >
                  {highlightMatch(artist.name, query)}
                  {artist.disambiguation && (
                    <span style={{ fontSize: '12px', color: '#8BA5C0', marginLeft: '8px' }}>{artist.disambiguation}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <button onClick={() => search(query)} style={{ flex: 1, padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Searching...' : 'Search Shows'}
          </button>
          <button onClick={useMyLocation} style={{ padding: '16px 20px', borderRadius: '999px', fontSize: '14px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>
            {locationLoading ? '...' : '📍 Near Me'}
          </button>
        </div>
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.map((concert) => (
              <div key={concert.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: 0 }}>{concert.artist}</h3>
                  <span style={{ fontSize: '11px', color: '#8BA5C0', textTransform: 'uppercase' }}>{concert.source}</span>
                </div>
                <p style={{ fontSize: '14px', color: '#5C7A9E', margin: '4px 0' }}>{concert.venue} · {concert.city}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C4A6E', margin: '8px 0 16px' }}>{formatDate(concert.date)}</p>
                <button onClick={() => router.push(`/checkin?id=${concert.id}&artist=${encodeURIComponent(concert.artist)}&venue=${encodeURIComponent(concert.venue)}&city=${encodeURIComponent(concert.city)}&date=${concert.date}`)}
                  style={{ width: '100%', padding: '12px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, border: '1.5px solid #2C4A6E', color: '#2C4A6E', background: 'transparent', cursor: 'pointer', marginBottom: '8px' }}>
                  Check In Here 🎶
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {concert.url ? (
                    <a href={concert.url} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, display: 'block', padding: '10px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', backgroundColor: '#2C4A6E', color: '#F5F0E8' }}>
                      🎟 Buy Tickets
                    </a>
                  ) : (
                    <a href={`https://www.ticketmaster.com/search?q=${encodeURIComponent(concert.artist)}`} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, display: 'block', padding: '10px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', backgroundColor: '#2C4A6E', color: '#F5F0E8' }}>
                      🎟 Ticketmaster
                    </a>
                  )}
                  <a href={`https://www.stubhub.com/${encodeURIComponent(concert.artist.toLowerCase().replace(/\s+/g, '-'))}-tickets`} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, display: 'block', padding: '10px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', border: '1.5px solid #5C7A9E', color: '#5C7A9E', backgroundColor: 'transparent' }}>
                    🎫 StubHub
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && results.length === 0 && query && (
          <p style={{ color: '#8BA5C0', textAlign: 'center', marginTop: '32px' }}>No shows found. Try another search.</p>
        )}
      </div>
    </div>
  )
}
