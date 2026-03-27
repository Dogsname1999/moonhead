'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ShowPage() {
  const router = useRouter()
  const params = useParams()
  const [show, setShow] = useState<any>(null)
  const [songs, setSongs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadShow = async () => {
      const { data: showData } = await supabase.from('checkins').select('*').eq('id', params.id).single()
      setShow(showData)
      const { data: songData } = await supabase.from('setlists').select('*').eq('checkin_id', params.id).order('position', { ascending: true })
      setSongs(songData || [])
      setLoading(false)
      if (showData) {
        try {
          const dateStr = showData.date || ''
          const artistStr = showData.artist || ''
          const archiveRes = await fetch('https://archive.org/advancedsearch.php?q=' + encodeURIComponent(artistStr + ' ' + dateStr) + '&fl=identifier&sort=downloads+desc&output=json&rows=1')
          const archiveData = await archiveRes.json()
          const id = archiveData?.response?.docs?.[0]?.identifier
          if (id) setArchiveUrl('https://archive.org/details/' + id)
        } catch (e) { console.error(e) }
      }
    }
    loadShow()
  }, [params.id])

  const formatDate = (d: string) => {
    if (!d) return ''
    const parts = d.split('-')
    if (parts.length !== 3) return d
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    return days[date.getDay()] + ', ' + months[parseInt(parts[1]) - 1] + ' ' + parseInt(parts[2]) + ', ' + parts[0]
  }

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-500">Loading show...</p>
    </main>
  )

  if (!show) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-500">Show not found</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.push('/profile')} className="text-zinc-500 text-sm mb-8 hover:text-white transition">My Shows</button>
        <div className="mb-8">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">You were there</p>
          <h2 className="text-4xl font-bold mb-2" style={{ color: '#F5A623' }}>{show.artist}</h2>
          <p className="text-zinc-400">{show.venue}{show.city ? ' - ' + show.city : ''}</p>
          <p className="text-zinc-500 text-sm mt-1">{formatDate(show.date)}</p>
        </div>
        {show.note && (
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-6">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Your note</p>
            <p className="text-white leading-relaxed">{show.note}</p>
          </div>
        )}
        {songs.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Set List</p>
              <span className="text-zinc-600 text-xs">{songs.length} songs</span>
            </div>
            <div className="space-y-2">
              {songs.map((song, index) => (
                <div key={song.id} className="flex items-start gap-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                  <span className="text-zinc-600 text-sm font-mono mt-0.5 w-6 text-right shrink-0">{index + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{song.song_title}</p>
                    {song.note && <p className="text-zinc-400 text-sm mt-1">{song.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {archiveUrl && (
          <a href={archiveUrl} target="_blank" rel="noopener noreferrer"
            className="block w-full py-4 rounded-full text-center font-semibold border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition mb-4">
            Listen on Archive.org
          </a>
        )}
        <div className="space-y-4">
          <button onClick={() => router.push('/setlist?checkinId=' + show.id + '&artist=' + encodeURIComponent(show.artist))}
            className="w-full py-4 rounded-full font-semibold border-2 transition"
            style={{ borderColor: '#F5A623', color: '#F5A623' }}>
            {songs.length > 0 ? 'Edit Set List' : 'Track Set List'}
          </button>
          <button onClick={() => router.push('/memories')}
            className="w-full py-4 rounded-full font-semibold border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition">
            Memories
          </button>
        </div>
      </div>
    </main>
  )
}
