'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function BurgerMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const links = [
    { label: '🔍 Find a Show', path: '/search' },
    { label: '🌕 I Was There', path: '/pastshow' },
    { label: '🎵 My Shows', path: '/profile' },
    { label: '🏠 Home', path: '/' },
  ]

  return (
    <>
      {/* Burger button */}
      <button
        onClick={() => setOpen(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}
        aria-label="Menu"
      >
        <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: '#2C4A6E', borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: '#2C4A6E', borderRadius: '2px' }} />
        <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: '#2C4A6E', borderRadius: '2px' }} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(44,74,110,0.3)', zIndex: 40 }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '260px',
        backgroundColor: '#F5F0E8', zIndex: 50, padding: '48px 32px',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        boxShadow: open ? '-4px 0 24px rgba(44,74,110,0.12)' : 'none',
      }}>
        <button
          onClick={() => setOpen(false)}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '24px', color: '#8BA5C0', cursor: 'pointer' }}
        >
          ✕
        </button>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.12em', color: '#2C4A6E' }}>🌕 MOONHEAD</p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {links.map(link => (
            <button key={link.path} onClick={() => { router.push(link.path); setOpen(false) }}
              style={{ background: 'none', border: 'none', textAlign: 'left', padding: '14px 0', fontSize: '17px', fontWeight: 600, color: '#2C4A6E', cursor: 'pointer', borderBottom: '1px solid #EDE8DF' }}>
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

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
      <p style={{ color: '#8BA5C0', fontSize: '16px' }}>Loading show...</p>
    </div>
  )

  if (!show) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8BA5C0', fontSize: '16px' }}>Show not found</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>

      {/* Top nav bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: '1px solid #EDE8DF',
        backgroundColor: '#F5F0E8', position: 'sticky', top: 0, zIndex: 30,
      }}>
        <button onClick={() => router.push('/profile')} style={{
          background: 'none', border: 'none', color: '#8BA5C0',
          fontSize: '15px', cursor: 'pointer', padding: 0, fontWeight: 500,
        }}>
          ← My Shows
        </button>
        <p style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.12em', color: '#2C4A6E', margin: 0 }}>
          🌕 MOONHEAD
        </p>
        <BurgerMenu />
      </div>

      {/* Content */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>

        {/* Show header */}
        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', marginBottom: '10px' }}>
            You were there
          </p>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#2C4A6E', marginBottom: '10px', lineHeight: 1.1 }}>
            {show.artist}
          </h2>
          <p style={{ fontSize: '17px', color: '#5C7A9E', marginBottom: '6px' }}>
            {show.venue}{show.city ? ' — ' + show.city : ''}
          </p>
          <p style={{ fontSize: '16px', color: '#8BA5C0' }}>
            {formatDate(show.date)}
          </p>
        </div>

        {/* Note */}
        {show.note && (
          <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '24px', border: '1px solid #8BA5C0', marginBottom: '28px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', marginBottom: '12px' }}>
              Your note
            </p>
            <p style={{ color: '#2C4A6E', lineHeight: 1.7, fontSize: '16px' }}>{show.note}</p>
          </div>
        )}

        {/* Set list */}
        {songs.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0' }}>
                Set List
              </p>
              <span style={{ fontSize: '14px', color: '#8BA5C0' }}>{songs.length} songs</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {songs.map((song, index) => (
                <div key={song.id} style={{
                  display: 'flex', alignItems: 'center', gap: '20px',
                  backgroundColor: '#EDE8DF', borderRadius: '14px',
                  padding: '18px 20px', border: '1px solid #8BA5C0',
                }}>
                  <span style={{
                    color: '#8BA5C0', fontSize: '13px', fontWeight: 600,
                    width: '28px', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#2C4A6E', fontSize: '17px', margin: 0 }}>{song.song_title}</p>
                    {song.note && <p style={{ color: '#5C7A9E', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>{song.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archive link */}
        {archiveUrl && (
          <a href={archiveUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'block', width: '100%', padding: '18px', borderRadius: '999px',
            textAlign: 'center', fontWeight: 600, fontSize: '16px',
            border: '1.5px solid #8BA5C0', color: '#5C7A9E',
            textDecoration: 'none', marginBottom: '16px', boxSizing: 'border-box',
          }}>
            🎙 Listen on Archive.org
          </a>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => router.push('/setlist?checkinId=' + show.id + '&artist=' + encodeURIComponent(show.artist))}
            style={{ width: '100%', padding: '18px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
            {songs.length > 0 ? 'Edit Set List' : 'Track Set List'}
          </button>
          <button onClick={() => router.push('/memories')}
            style={{ width: '100%', padding: '18px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>
            Memories
          </button>
        </div>

      </div>
    </div>
  )
}
