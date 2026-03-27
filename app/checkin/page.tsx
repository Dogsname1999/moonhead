'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CheckInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checked, setChecked] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkinId, setCheckinId] = useState<string | null>(null)

  const artist = searchParams.get('artist') || 'Unknown Artist'
  const venue = searchParams.get('venue') || 'Unknown Venue'
  const city = searchParams.get('city') || ''
  const date = searchParams.get('date') || ''
  const concertId = searchParams.get('id') || ''

  const formatDate = (d: string) => {
    if (!d) return 'Tonight'
    return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase.from('checkins').insert({
          user_id: user.id, artist, venue, city, date, note, concert_id: concertId,
        }).select().single()
        if (data) setCheckinId(data.id)
      }
    } catch (e) { console.error(e) }
    setChecked(true)
    setLoading(false)
  }

  const secondaryBtn = {
    width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 600,
    fontSize: '16px', border: '1.5px solid #8BA5C0', color: '#5C7A9E',
    background: 'transparent', cursor: 'pointer', marginBottom: '12px', transition: 'all 0.2s',
  }

  return (
    <main className="min-h-screen px-6 py-12" style={{ backgroundColor: '#F5F0E8' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', color: '#8BA5C0', fontSize: '14px',
          cursor: 'pointer', marginBottom: '32px', padding: 0,
        }}>← Back</button>

        {!checked ? (
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest" style={{ color: '#8BA5C0', marginBottom: '8px' }}>
              You're about to check in to
            </p>
            <h2 className="text-4xl font-bold" style={{ color: '#2C4A6E', marginBottom: '8px' }}>{artist}</h2>
            <p style={{ color: '#5C7A9E', marginBottom: '4px' }}>{venue}{city ? ` · ${city}` : ''}</p>
            <p className="text-sm" style={{ color: '#8BA5C0', marginBottom: '40px' }}>{formatDate(date)}</p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="First thoughts? Opening act? How are you feeling..."
              style={{
                width: '100%', backgroundColor: '#EDE8DF', color: '#2C4A6E',
                border: '1.5px solid #8BA5C0', borderRadius: '16px',
                padding: '20px', fontSize: '16px', outline: 'none',
                resize: 'none', height: '128px', marginBottom: '24px',
                boxSizing: 'border-box',
              }}
            />

            <button onClick={handleCheckIn} disabled={loading} style={{
              width: '100%', padding: '20px', borderRadius: '999px', fontWeight: 700,
              fontSize: '20px', backgroundColor: '#2C4A6E', color: '#F5F0E8',
              border: 'none', cursor: 'pointer', transition: 'background-color 0.2s',
            }}>
              {loading ? 'Checking in...' : "I'M HERE 🎶"}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div style={{ fontSize: '72px', marginBottom: '24px' }}>🌕</div>
            <h2 className="text-3xl font-bold" style={{ color: '#2C4A6E', marginBottom: '8px' }}>YOU'RE CHECKED IN</h2>
            <p style={{ color: '#5C7A9E', marginBottom: '4px' }}>{artist}</p>
            <p className="text-sm" style={{ color: '#8BA5C0', marginBottom: '48px' }}>{venue}{city ? ` · ${city}` : ''}</p>

            <div>
              <button onClick={() => router.push(`/setlist?checkinId=${checkinId}&artist=${encodeURIComponent(artist)}`)}
                style={{
                  width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 600,
                  fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8',
                  border: 'none', cursor: 'pointer', marginBottom: '12px',
                }}>
                Track the Set List 🎵
              </button>
              <button onClick={() => router.push('/whohere')} style={secondaryBtn}>See Who's Here 👥</button>
              <button onClick={() => router.push('/profile')} style={secondaryBtn}>View My Shows 👤</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function CheckInPage() {
  return <Suspense><CheckInContent /></Suspense>
}
