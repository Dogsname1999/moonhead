'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'
import ShareCard from '@/components/ShareCard'

function CheckInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checked, setChecked] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkinId, setCheckinId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const artist = searchParams.get('artist') || 'Unknown Artist'
  const venue = searchParams.get('venue') || 'Unknown Venue'
  const city = searchParams.get('city') || ''
  const date = searchParams.get('date') || ''
  const concertId = searchParams.get('id') || ''

  // Check auth on mount — redirect to login if not signed in,
  // preserving the full checkin URL so they come back here after auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
      } else {
        const currentUrl = `/checkin?id=${encodeURIComponent(concertId)}&artist=${encodeURIComponent(artist)}&venue=${encodeURIComponent(venue)}&city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`
        router.replace(`/auth?redirect=${encodeURIComponent(currentUrl)}`)
      }
      setAuthChecked(true)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (d: string) => {
    if (!d) return 'Tonight'
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      if (user) {
        const { data } = await supabase.from('checkins').insert({ user_id: user.id, artist, venue, city, date, note, concert_id: concertId }).select().single()
        if (data) setCheckinId(data.id)
      }
    } catch (e) { console.error(e) }
    setChecked(true)
    setLoading(false)
  }

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#8BA5C0' }}>Loading...</p>
      </div>
    )
  }

  const secondaryBtn: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer', marginBottom: '12px' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Search" backPath="/search" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px', textAlign: 'center' }}>
        {!checked ? (
          <>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', marginBottom: '10px' }}>You're about to check in to</p>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#2C4A6E', marginBottom: '10px', lineHeight: 1.1 }}>{artist}</h2>
            <p style={{ color: '#5C7A9E', fontSize: '17px', marginBottom: '4px' }}>{venue}{city ? ` · ${city}` : ''}</p>
            <p style={{ color: '#8BA5C0', fontSize: '15px', marginBottom: '40px' }}>{formatDate(date)}</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="First thoughts? Opening act? How are you feeling..."
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', backgroundColor: '#EDE8DF', color: '#2C4A6E', border: '1.5px solid #8BA5C0', borderRadius: '16px', padding: '20px', fontSize: '16px', outline: 'none', resize: 'none', height: '128px', marginBottom: '24px' }} />
            <button onClick={handleCheckIn} disabled={loading} style={{ width: '100%', padding: '20px', borderRadius: '999px', fontWeight: 700, fontSize: '20px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
              {loading ? 'Checking in...' : "I'M HERE 🎶"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '72px', marginBottom: '24px' }}>🌕</div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#2C4A6E', marginBottom: '8px' }}>YOU'RE CHECKED IN</h2>
            <p style={{ color: '#5C7A9E', fontSize: '17px', marginBottom: '4px' }}>{artist}</p>
            <p style={{ color: '#8BA5C0', fontSize: '15px', marginBottom: '48px' }}>{venue}{city ? ` · ${city}` : ''}</p>
            <button onClick={() => router.push(`/setlist?checkinId=${checkinId}&artist=${encodeURIComponent(artist)}`)}
              style={{ width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer', marginBottom: '12px' }}>
              Track the Set List 🎵
            </button>
            <button onClick={() => router.push(`/whohere?artist=${encodeURIComponent(artist)}&date=${date}&venue=${encodeURIComponent(venue)}&city=${encodeURIComponent(city)}`)} style={secondaryBtn}>See Who's Here 👥</button>
            <button onClick={() => router.push('/profile')} style={secondaryBtn}>View My Shows 👤</button>
            <ShareCard artist={artist} venue={venue} city={city} date={date} />
          </>
        )}
      </div>
    </div>
  )
}

export default function CheckInPage() {
  return <Suspense><CheckInContent /></Suspense>
}
