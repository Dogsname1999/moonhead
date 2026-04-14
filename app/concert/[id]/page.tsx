'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

export default function ConcertPage() {
  const router = useRouter()
  const params = useParams()
  const [show, setShow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null)
  const [relistenUrl, setRelistenUrl] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      // Check if user is logged in
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      // Fetch show from Setlist.fm
      try {
        const res = await fetch(`/api/concert?id=${params.id}`)
        if (!res.ok) { setError('Show not found'); setLoading(false); return }
        const data = await res.json()
        setShow(data)

        // Check if already saved
        if (u && data.date) {
          const dp = data.date.split('-')
          const iso = dp.length === 3 ? dp[2] + '-' + dp[1] + '-' + dp[0] : data.date
          const { data: existing } = await supabase
            .from('checkins')
            .select('id')
            .eq('user_id', u.id)
            .or(`concert_id.eq.${data.id},date.eq.${iso}`)
            .limit(1)
          if (existing && existing.length > 0) setSaved(true)
        }

        // Archive.org + Relisten lookup — convert DD-MM-YYYY to YYYY-MM-DD
        try {
          const dp2 = data.date ? data.date.split('-') : []
          const isoDate = dp2.length === 3 ? dp2[2] + '-' + dp2[1] + '-' + dp2[0] : data.date
          const archiveRes = await fetch('https://archive.org/advancedsearch.php?q=' + encodeURIComponent('creator:"' + data.artist + '" AND mediatype:etree AND date:' + isoDate) + '&fl=identifier&sort=downloads+desc&output=json&rows=1')
          const archiveData = await archiveRes.json()
          const id = archiveData?.response?.docs?.[0]?.identifier
          if (id) {
            setArchiveUrl('https://archive.org/details/' + id)
            // Check Relisten
            try {
              const rlRes = await fetch('https://api.relisten.net/api/v2/artists', { signal: AbortSignal.timeout(5000) })
              const rlData = await rlRes.json()
              const match = rlData.find((a: any) => a.name.toLowerCase() === data.artist.toLowerCase())
              if (match && isoDate) {
                const [y, m, d] = isoDate.split('-')
                setRelistenUrl(`https://relisten.net/${match.slug}/${y}/${m}/${d}`)
              }
            } catch {}
          }
        } catch {}
      } catch { setError('Failed to load show') }
      setLoading(false)
    }
    load()
  }, [params.id])

  const formatDate = (d: string) => {
    if (!d) return ''
    const parts = d.split('-')
    if (parts.length !== 3) return d
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
    return days[date.getDay()] + ', ' + months[parseInt(parts[1]) - 1] + ' ' + parseInt(parts[0]) + ', ' + parts[2]
  }

  const iWasThere = async () => {
    if (!user) { router.push(`/auth?redirect=/concert/${params.id}`); return }
    setSaving(true)
    try {
      const dp = show.date ? show.date.split('-') : []
      const dateFormatted = dp.length === 3 ? dp[2] + '-' + dp[1] + '-' + dp[0] : show.date || ''
      const { data: checkin, error: insertError } = await supabase.from('checkins').insert({
        user_id: user.id, artist: show.artist, venue: show.venue,
        city: show.city + (show.state ? ', ' + show.state : ''),
        date: dateFormatted, note: '', concert_id: show.id, source: 'setlist.fm', is_dream: false
      }).select().single()
      if (insertError) { console.error('Insert error:', insertError); setSaving(false); return }
      if (checkin && show.songs?.length > 0) {
        await supabase.from('setlists').insert(show.songs.map((song: any, i: number) => ({
          checkin_id: checkin.id, user_id: user.id,
          song_title: song.name, note: song.info || '', position: i + 1,
          set_name: song.encore ? (song.encore > 1 ? `Encore ${song.encore}` : 'Encore') : (song.setName || 'Set')
        })))
      }
      if (checkin) {
        setSaved(true)
        setTimeout(() => router.push('/show/' + checkin.id), 1200)
      }
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const shareLink = typeof window !== 'undefined' ? window.location.href : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8BA5C0' }}>Loading show...</p>
    </div>
  )

  if (error || !show) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <p style={{ color: '#8BA5C0', fontSize: '18px', marginBottom: '16px' }}>{error || 'Show not found'}</p>
      <button onClick={() => router.push('/')} style={{ padding: '12px 24px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
        Go to Tourbustix
      </button>
    </div>
  )

  // Group songs by set
  const sets: { name: string; songs: any[] }[] = []
  if (show.songs?.length > 0) {
    show.songs.forEach((song: any) => {
      const sn = song.encore ? (song.encore > 1 ? `Encore ${song.encore}` : 'Encore') : (song.setName || 'Set')
      const existing = sets.find(s => s.name === sn)
      if (existing) existing.songs.push(song)
      else sets.push({ name: sn, songs: [song] })
    })
  }

  let runningIndex = 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>

        {/* Show header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <img src="/ticket.png" alt="Moonhead" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0' }}>Were you at this show?</span>
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#2C4A6E', marginBottom: '10px', lineHeight: 1.1, marginTop: 0 }}>{show.artist}</h2>
          <p style={{ fontSize: '17px', color: '#5C7A9E', marginBottom: '6px', marginTop: 0 }}>{show.venue}{show.city ? ' — ' + show.city + (show.state ? ', ' + show.state : '') : ''}</p>
          <p style={{ fontSize: '16px', color: '#8BA5C0', margin: 0 }}>{formatDate(show.date)}</p>
          {show.tour && <p style={{ fontSize: '14px', color: '#8BA5C0', margin: '4px 0 0' }}>{show.tour}</p>}
        </div>

        {/* Setlist */}
        {sets.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', margin: 0 }}>Set List</p>
              <span style={{ fontSize: '14px', color: '#8BA5C0' }}>{show.totalSongs} songs</span>
            </div>
            {sets.map((set, si) => (
              <div key={si} style={{ marginBottom: si < sets.length - 1 ? '24px' : 0 }}>
                {(sets.length > 1 || set.name !== 'Set') && (
                  <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C4A6E', margin: '0 0 10px', paddingBottom: '8px', borderBottom: '2px solid #8BA5C0' }}>{set.name}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {set.songs.map((song: any) => {
                    runningIndex++
                    return (
                      <div key={runningIndex} style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#EDE8DF', borderRadius: '14px', padding: '16px 18px', border: '1px solid #8BA5C0' }}>
                        <span style={{ color: '#8BA5C0', fontSize: '13px', fontWeight: 600, width: '28px', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{runningIndex}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, color: '#2C4A6E', fontSize: '16px', margin: 0 }}>{song.name}{song.info && <span style={{ color: '#5C7A9E', fontSize: '13px', fontWeight: 400, marginLeft: '6px' }}>{song.info}</span>}</p>
                          {song.cover && <p style={{ color: '#8BA5C0', fontSize: '12px', marginTop: '3px', marginBottom: 0 }}>Cover: {song.cover}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Relisten */}
        {relistenUrl && (
          <a href={relistenUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '18px', borderRadius: '999px', textAlign: 'center', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', textDecoration: 'none', marginBottom: '12px', border: 'none' }}>
            🎧 Listen on Relisten
          </a>
        )}

        {/* Archive.org */}
        {archiveUrl && (
          <a href={`/go?url=${encodeURIComponent(archiveUrl)}&label=${encodeURIComponent('Archive.org')}`} style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '18px', borderRadius: '999px', textAlign: 'center', fontWeight: 600, fontSize: '16px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', textDecoration: 'none', marginBottom: '16px' }}>
            🎙 Listen on Archive.org
          </a>
        )}

        {/* I Was There / Already saved */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {saved ? (
            <div style={{ padding: '18px', borderRadius: '999px', textAlign: 'center', fontSize: '16px', fontWeight: 600, backgroundColor: '#EDE8DF', color: '#2C4A6E', border: '1.5px solid #8BA5C0' }}>
              ✓ Added to My Shows
            </div>
          ) : (
            <button onClick={iWasThere} disabled={saving}
              style={{ width: '100%', padding: '18px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: saving ? '#5C7A9E' : '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
              {saving ? 'Saving…' : user ? 'I Was There 🌕' : 'Sign In & Add to My Shows 🌕'}
            </button>
          )}

          {/* Copy share link */}
          <button onClick={() => {
            navigator.clipboard?.writeText(shareLink)
            const btn = document.getElementById('copy-btn')
            if (btn) { btn.textContent = 'Link Copied!'; setTimeout(() => { btn.textContent = '🔗 Copy Share Link' }, 2000) }
          }}
            id="copy-btn"
            style={{ width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>
            🔗 Copy Share Link
          </button>
        </div>

        {/* Setlist.fm credit */}
        {show.url && (
          <p style={{ textAlign: 'center', marginTop: '24px' }}>
            <a href={show.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#8BA5C0', textDecoration: 'none' }}>
              Setlist data via setlist.fm
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
