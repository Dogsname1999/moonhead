'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import ShareCard from '@/components/ShareCard'

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8BA5C0' }}>Loading show...</p>
    </div>
  )

  if (!show) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8BA5C0' }}>Show not found</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="My Shows" backPath="/profile" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', marginBottom: '10px' }}>You were there</p>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#2C4A6E', marginBottom: '10px', lineHeight: 1.1, marginTop: 0 }}>{show.artist}</h2>
          <p style={{ fontSize: '17px', color: '#5C7A9E', marginBottom: '6px', marginTop: 0 }}>{show.venue}{show.city ? ' — ' + show.city : ''}</p>
          <p style={{ fontSize: '16px', color: '#8BA5C0', margin: 0 }}>{formatDate(show.date)}</p>
        </div>
        {show.note && (
          <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '24px', border: '1px solid #8BA5C0', marginBottom: '28px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', marginBottom: '12px', marginTop: 0 }}>Your note</p>
            <p style={{ color: '#2C4A6E', lineHeight: 1.7, fontSize: '16px', margin: 0 }}>{show.note}</p>
          </div>
        )}
        {songs.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', margin: 0 }}>Set List</p>
              <span style={{ fontSize: '14px', color: '#8BA5C0' }}>{songs.length} songs</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {songs.map((song, index) => (
                <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#EDE8DF', borderRadius: '14px', padding: '18px 20px', border: '1px solid #8BA5C0' }}>
                  <span style={{ color: '#8BA5C0', fontSize: '13px', fontWeight: 600, width: '28px', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{index + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#2C4A6E', fontSize: '17px', margin: 0 }}>{song.song_title}</p>
                    {song.note && <p style={{ color: '#5C7A9E', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>{song.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {archiveUrl && (
          <a href={archiveUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '18px', borderRadius: '999px', textAlign: 'center', fontWeight: 600, fontSize: '16px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', textDecoration: 'none', marginBottom: '16px' }}>
            🎙 Listen on Archive.org
          </a>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => router.push('/setlist?checkinId=' + show.id + '&artist=' + encodeURIComponent(show.artist))}
            style={{ width: '100%', padding: '18px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
            {songs.length > 0 ? 'Edit Set List' : 'Track Set List'}
          </button>
          <button onClick={() => router.push('/memories')}
            style={{ width: '100%', padding: '18px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>
            Memories
          </button>
          <ShareCard artist={show.artist} venue={show.venue} city={show.city || ''} date={show.date} />
        </div>
      </div>
    </div>
  )
}
