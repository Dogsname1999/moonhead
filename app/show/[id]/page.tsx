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
          const archiveRes = await fetch('https://archive.org/advancedsearch.php?q=' + encodeURIComponent(showData.artist + ' ' + showData.date) + '&fl=identifier&sort=downloads+desc&output=json&rows=1')
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
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
      <p style={{ color: '#8BA5C0' }}>Loading show...</p>
    </main>
  )

  if (!show) return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
      <p style={{ color: '#8BA5C0' }}>Show not found</p>
    </main>
  )

  return (
    <main className="min-h-screen px-6 py-12" style={{ backgroundColor: '#F5F0E8' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <button onClick={() => router.push('/profile')} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '14px', cursor: 'pointer', marginBottom: '32px', padding: 0 }}>← My Shows</button>

        {/* Show header */}
        <div style={{ marginBottom: '32px' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#8BA5C0', marginBottom: '8px' }}>You were there</p>
          <h2 className="text-4xl font-bold" style={{ color: '#2C4A6E', marginBottom: '8px' }}>{show.artist}</h2>
          <p style={{ color: '#5C7A9E' }}>{show.venue}{show.city ? ' — ' + show.city : ''}</p>
          <p className="text-sm" style={{ color: '#8BA5C0', marginTop: '4px' }}>{formatDate(show.date)}</p>
        </div>

        {/* Note */}
        {show.note && (
          <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0', marginBottom: '24px' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#8BA5C0', marginBottom: '12px' }}>Your note</p>
            <p style={{ color: '#2C4A6E', lineHeight: 1.6 }}>{show.note}</p>
          </div>
        )}

        {/* Set list */}
        {songs.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#8BA5C0' }}>Set List</p>
              <span className="text-xs" style={{ color: '#8BA5C0' }}>{songs.length} songs</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {songs.map((song, index) => (
                <div key={song.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', backgroundColor: '#EDE8DF', borderRadius: '14px', padding: '16px', border: '1px solid #8BA5C0' }}>
                  <span style={{ color: '#8BA5C0', fontSize: '13px', fontFamily: 'monospace', marginTop: '2px', width: '24px', textAlign: 'right', flexShrink: 0 }}>{index + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p className="font-semibold" style={{ color: '#2C4A6E' }}>{song.song_title}</p>
                    {song.note && <p className="text-sm" style={{ color: '#5C7A9E', marginTop: '4px' }}>{song.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archive link */}
        {archiveUrl && (
          <a href={archiveUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'block', width: '100%', padding: '16px', borderRadius: '999px',
            textAlign: 'center', fontWeight: 600, border: '1.5px solid #8BA5C0',
            color: '#5C7A9E', textDecoration: 'none', marginBottom: '24px', boxSizing: 'border-box',
          }}>
            🎙 Listen on Archive.org
          </a>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => router.push('/setlist?checkinId=' + show.id + '&artist=' + encodeURIComponent(show.artist))}
            style={{ width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 600, backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
            {songs.length > 0 ? 'Edit Set List' : 'Track Set List'}
          </button>
          <button onClick={() => router.push('/memories')}
            style={{ width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 600, border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>
            Memories
          </button>
        </div>
      </div>
    </main>
  )
}
