'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

function SetlistContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkinId = searchParams.get('checkinId')
  const artist = searchParams.get('artist') || 'Unknown Artist'
  const [songs, setSongs] = useState<any[]>([])
  const [newSong, setNewSong] = useState('')
  const [newNote, setNewNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [loading, setLoading] = useState(true)

  // Autocomplete state
  const [knownSongs, setKnownSongs] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [loadingSongs, setLoadingSongs] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load saved songs for this checkin
  useEffect(() => {
    const loadSongs = async () => {
      if (checkinId) {
        const { data } = await supabase.from('setlists').select('*').eq('checkin_id', checkinId).order('position', { ascending: true })
        setSongs(data || [])
      }
      setLoading(false)
    }
    loadSongs()
  }, [checkinId])

  // Fetch known songs from Setlist.fm for this artist
  useEffect(() => {
    const fetchKnownSongs = async () => {
      if (!artist || artist === 'Unknown Artist') return
      setLoadingSongs(true)
      try {
        const res = await fetch(`/api/setlistfm?artist=${encodeURIComponent(artist)}`)
        const data = await res.json()
        setKnownSongs(data.songs || [])
      } catch (e) {
        console.error('Failed to fetch known songs:', e)
      }
      setLoadingSongs(false)
    }
    fetchKnownSongs()
  }, [artist])

  // Filter suggestions as user types
  useEffect(() => {
    if (!newSong.trim() || knownSongs.length === 0) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const query = newSong.toLowerCase()
    // Already-added song titles (lowercase) to exclude from suggestions
    const addedTitles = new Set(songs.map(s => s.song_title.toLowerCase()))
    const filtered = knownSongs
      .filter(s => s.toLowerCase().includes(query) && !addedTitles.has(s.toLowerCase()))
      .slice(0, 6)
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
    setActiveSuggestion(-1)
  }, [newSong, knownSongs, songs])

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

  const addSong = async (title?: string) => {
    const songTitle = title || newSong.trim()
    if (!songTitle) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('setlists').insert({ checkin_id: checkinId, user_id: user?.id, song_title: songTitle, note: newNote.trim(), position: songs.length + 1 }).select().single()
    if (data) setSongs([...songs, data])
    setNewSong(''); setNewNote(''); setShowNoteInput(false); setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const selectSuggestion = (song: string) => {
    setNewSong(song)
    setShowSuggestions(false)
    // Auto-add immediately for speed during a live show
    setTimeout(() => addSong(song), 50)
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
          selectSuggestion(suggestions[activeSuggestion])
        } else {
          addSong()
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Enter') {
      addSong()
    }
  }

  // Highlight the matching part of suggestion text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ fontWeight: 700, color: '#2C4A6E' }}>{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Show" backPath="/profile" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '4px', marginTop: 0 }}>SET LIST</h2>
            <p style={{ color: '#5C7A9E', fontSize: '15px', marginTop: 0, marginBottom: 0 }}>{artist}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#8BA5C0', fontSize: '14px', display: 'block' }}>{songs.length} songs</span>
            {loadingSongs && <span style={{ color: '#8BA5C0', fontSize: '11px' }}>Loading suggestions...</span>}
            {!loadingSongs && knownSongs.length > 0 && <span style={{ color: '#8BA5C0', fontSize: '11px' }}>✨ Autocomplete on</span>}
          </div>
        </div>

        {/* Song input with autocomplete */}
        <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1.5px solid #8BA5C0', marginBottom: '32px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={newSong}
              onChange={(e) => setNewSong(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
              onKeyDown={handleKeyDown}
              placeholder={knownSongs.length > 0 ? "Start typing a song..." : "Song title..."}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'transparent', color: '#2C4A6E', fontSize: '18px', outline: 'none', border: 'none', marginBottom: '12px' }}
            />

            {/* Suggestions dropdown */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '-20px',
                  right: '-20px',
                  backgroundColor: '#F5F0E8',
                  border: '1.5px solid #8BA5C0',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(44,74,110,0.15)',
                  zIndex: 20,
                  overflow: 'hidden',
                  marginTop: '-4px',
                }}
              >
                {suggestions.map((song, i) => (
                  <button
                    key={song}
                    onClick={() => selectSuggestion(song)}
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
                    {highlightMatch(song, newSong)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showNoteInput && (
            <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note... (optional)"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'transparent', color: '#5C7A9E', fontSize: '14px', outline: 'none', paddingTop: '12px', marginBottom: '16px', border: 'none', borderTop: '1px solid #8BA5C0' }} />
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => addSong()} style={{ flex: 1, padding: '14px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>+ Add Song</button>
            <button onClick={() => setShowNoteInput(!showNoteInput)} style={{ padding: '14px 18px', borderRadius: '999px', fontSize: '14px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>{showNoteInput ? 'Hide note' : '+ Note'}</button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#8BA5C0', textAlign: 'center', padding: '32px 0' }}>Loading...</p>
        ) : songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#5C7A9E', fontSize: '18px', marginBottom: '8px' }}>The show hasn't started yet...</p>
            <p style={{ color: '#8BA5C0', fontSize: '14px' }}>Add the first song when it plays</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {songs.map((song, index) => (
              <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#EDE8DF', borderRadius: '14px', padding: '18px 20px', border: '1px solid #8BA5C0' }}>
                <span style={{ color: '#8BA5C0', fontSize: '13px', fontWeight: 600, width: '28px', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{index + 1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#2C4A6E', fontSize: '17px', margin: 0 }}>{song.song_title}</p>
                  {song.note && <p style={{ color: '#5C7A9E', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>{song.note}</p>}
                </div>
                <span style={{ color: '#8BA5C0', fontSize: '12px', flexShrink: 0 }}>{new Date(song.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
        {songs.length > 0 && (
          <button onClick={() => router.push('/memories')} style={{ width: '100%', marginTop: '32px', padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', border: '1.5px solid #2C4A6E', color: '#2C4A6E', background: 'transparent', cursor: 'pointer' }}>
            Show is Over — Add Memories
          </button>
        )}
      </div>
    </div>
  )
}

export default function SetlistPage() {
  return <Suspense><SetlistContent /></Suspense>
}
