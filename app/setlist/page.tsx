'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function SetlistContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkinId = searchParams.get('checkinId')
  const artist = searchParams.get('artist') || 'Unknown Artist'
  const [songs, setSongs] = useState([])
  const [newSong, setNewSong] = useState('')
  const [newNote, setNewNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSongs = async () => {
      if (checkinId) {
        const { data } = await supabase
          .from('setlists')
          .select('*')
          .eq('checkin_id', checkinId)
          .order('position', { ascending: true })
        setSongs(data || [])
      }
      setLoading(false)
    }
    loadSongs()
  }, [checkinId])

  const addSong = async () => {
    if (!newSong.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const position = songs.length + 1
    const { data, error } = await supabase.from('setlists').insert({
      checkin_id: checkinId,
      user_id: user?.id,
      song_title: newSong.trim(),
      note: newNote.trim(),
      position,
    }).select().single()
    if (data) setSongs([...songs, data])
    setNewSong('')
    setNewNote('')
    setShowNoteInput(false)
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-8 hover:text-white transition">
          Back
        </button>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-widest" style={{ color: '#F5A623' }}>SET LIST</h2>
            <p className="text-zinc-400 text-sm mt-1">{artist}</p>
          </div>
          <span className="text-zinc-500 text-sm mt-2">{songs.length} songs</span>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-8">
          <input
            type="text"
            value={newSong}
            onChange={(e) => setNewSong(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSong()}
            placeholder="Song title..."
            className="w-full bg-transparent text-white text-lg focus:outline-none mb-3"
          />
          {showNoteInput && (
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note... (optional)"
              className="w-full bg-transparent text-zinc-400 text-sm focus:outline-none mb-4 border-t border-zinc-800 pt-3"
            />
          )}
          <div className="flex gap-3">
            <button
              onClick={addSong}
              className="flex-1 py-3 rounded-full font-semibold transition"
              style={{ backgroundColor: '#F5A623', color: '#000' }}
            >
              + Add Song
            </button>
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="px-4 py-3 rounded-full border border-zinc-700 text-zinc-400 hover:text-white transition text-sm"
            >
              {showNoteInput ? 'Hide note' : '+ Note'}
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-zinc-500 text-center py-8">Loading...</p>
        ) : songs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-lg">The show has not started yet...</p>
            <p className="text-zinc-700 text-sm mt-2">Add the first song when it plays</p>
          </div>
        ) : (
          <div className="space-y-3">
            {songs.map((song, index) => (
              <div key={song.id} className="flex items-start gap-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <span className="text-zinc-600 text-sm font-mono mt-1 w-6 text-right shrink-0">{index + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white">{song.song_title}</p>
                  {song.note && <p className="text-zinc-400 text-sm mt-1">{song.note}</p>}
                </div>
                <span className="text-zinc-600 text-xs mt-1 shrink-0">
                  {new Date(song.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
        {songs.length > 0 && (
          <button
            onClick={() => router.push('/memories')}
            className="w-full mt-8 py-4 rounded-full font-semibold border-2 transition"
            style={{ borderColor: '#F5A623', color: '#F5A623' }}
          >
            Show is Over - Add Memories
          </button>
        )}
      </div>
    </main>
  )
}

export default function SetlistPage() {
  return (
    <Suspense>
      <SetlistContent />
    </Suspense>
  )
}
