'use client'
import { useState, useEffect, Suspense } from 'react'
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

  const addSong = async () => {
    if (!newSong.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('setlists').insert({ checkin_id: checkinId, user_id: user?.id, song_title: newSong.trim(), note: newNote.trim(), position: songs.length + 1 }).select().single()
    if (data) setSongs([...songs, data])
    setNewSong(''); setNewNote(''); setShowNoteInput(false)
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
          <span style={{ color: '#8BA5C0', fontSize: '14px', marginTop: '8px' }}>{songs.length} songs</span>
        </div>
        <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1.5px solid #8BA5C0', marginBottom: '32px' }}>
          <input type="text" value={newSong} onChange={(e) => setNewSong(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSong()} placeholder="Song title..."
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'transparent', color: '#2C4A6E', fontSize: '18px', outline: 'none', border: 'none', marginBottom: '12px' }} />
          {showNoteInput && (
            <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note... (optional)"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'transparent', color: '#5C7A9E', fontSize: '14px', outline: 'none', paddingTop: '12px', marginBottom: '16px', border: 'none', borderTop: '1px solid #8BA5C0' }} />
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={addSong} style={{ flex: 1, padding: '14px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>+ Add Song</button>
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
