'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
    const { data, error } = await supabase.from('setlists').insert({
      checkin_id: checkinId, user_id: user?.id,
      song_title: newSong.trim(), note: newNote.trim(), position: songs.length + 1,
    }).select().single()
    if (data) setSongs([...songs, data])
    setNewSong('')
    setNewNote('')
    setShowNoteInput(false)
  }

  return (
    <main className="min-h-screen px-6 py-12" style={{ backgroundColor: '#F5F0E8' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '14px', cursor: 'pointer', marginBottom: '32px', padding: 0 }}>← Back</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h2 className="text-3xl font-bold tracking-widest" style={{ color: '#2C4A6E' }}>SET LIST</h2>
            <p className="text-sm" style={{ color: '#5C7A9E', marginTop: '4px' }}>{artist}</p>
          </div>
          <span className="text-sm" style={{ color: '#8BA5C0', marginTop: '8px' }}>{songs.length} songs</span>
        </div>

        {/* Add song card */}
        <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1.5px solid #8BA5C0', marginBottom: '32px' }}>
          <input
            type="text" value={newSong} onChange={(e) => setNewSong(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSong()}
            placeholder="Song title..."
            style={{ width: '100%', background: 'transparent', color: '#2C4A6E', fontSize: '18px', outline: 'none', border: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
          />
          {showNoteInput && (
            <input
              type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note... (optional)"
              style={{ width: '100%', background: 'transparent', color: '#5C7A9E', fontSize: '14px', outline: 'none', borderTop: '1px solid #8BA5C0', paddingTop: '12px', marginBottom: '16px', border: 'none', borderTop: '1px solid #8BA5C0', boxSizing: 'border-box' }}
            />
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={addSong} style={{
              flex: 1, padding: '12px', borderRadius: '999px', fontWeight: 600,
              backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer',
            }}>+ Add Song</button>
            <button onClick={() => setShowNoteInput(!showNoteInput)} style={{
              padding: '12px 16px', borderRadius: '999px', fontSize: '14px',
              border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer',
            }}>{showNoteInput ? 'Hide note' : '+ Note'}</button>
          </div>
        </div>

        {/* Song list */}
        {loading ? (
          <p className="text-center py-8" style={{ color: '#8BA5C0' }}>Loading...</p>
        ) : songs.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: '#5C7A9E', fontSize: '18px' }}>The show hasn't started yet...</p>
            <p className="text-sm" style={{ color: '#8BA5C0', marginTop: '8px' }}>Add the first song when it plays</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {songs.map((song, index) => (
              <div key={song.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', backgroundColor: '#EDE8DF', borderRadius: '14px', padding: '16px', border: '1px solid #8BA5C0' }}>
                <span style={{ color: '#8BA5C0', fontSize: '13px', fontFamily: 'monospace', marginTop: '2px', width: '24px', textAlign: 'right', flexShrink: 0 }}>{index + 1}</span>
                <div style={{ flex: 1 }}>
                  <p className="font-semibold" style={{ color: '#2C4A6E' }}>{song.song_title}</p>
                  {song.note && <p className="text-sm" style={{ color: '#5C7A9E', marginTop: '4px' }}>{song.note}</p>}
                </div>
                <span className="text-xs" style={{ color: '#8BA5C0', marginTop: '2px', flexShrink: 0 }}>
                  {new Date(song.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {songs.length > 0 && (
          <button onClick={() => router.push('/memories')} style={{
            width: '100%', marginTop: '32px', padding: '16px', borderRadius: '999px',
            fontWeight: 600, border: '1.5px solid #2C4A6E', color: '#2C4A6E',
            background: 'transparent', cursor: 'pointer',
          }}>
            Show is Over — Add Memories
          </button>
        )}
      </div>
    </main>
  )
}

export default function SetlistPage() {
  return <Suspense><SetlistContent /></Suspense>
}
