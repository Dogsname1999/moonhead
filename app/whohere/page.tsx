'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

interface Attendee {
  id: string
  email: string
  displayName: string
  showCount: number
  mutualArtists: string[]
  checkedInAt: string
}

function WhoHereContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const artist = searchParams.get('artist') || ''
  const date = searchParams.get('date') || ''
  const venue = searchParams.get('venue') || ''
  const city = searchParams.get('city') || ''

  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadAttendees = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setCurrentUserId(user.id)

      // Find all check-ins for the same artist + date (same show)
      let query = supabase.from('checkins').select('*').eq('artist', artist)
      if (date) query = query.eq('date', date)

      const { data: showCheckins } = await query
      if (!showCheckins || showCheckins.length === 0) { setLoading(false); return }

      // Get other users (not the current user)
      const otherUserIds = [...new Set(showCheckins.filter(c => c.user_id !== user.id).map(c => c.user_id))]

      if (otherUserIds.length === 0) { setLoading(false); return }

      // Get current user's artists for mutual comparison
      const { data: myCheckins } = await supabase.from('checkins').select('artist').eq('user_id', user.id)
      const myArtists = new Set((myCheckins || []).map(c => c.artist))

      // For each other user, get their show count and find mutual artists
      const attendeeList: Attendee[] = []
      for (const userId of otherUserIds) {
        const { data: theirCheckins } = await supabase.from('checkins').select('artist, created_at').eq('user_id', userId)
        if (!theirCheckins) continue

        const theirArtists = [...new Set(theirCheckins.map(c => c.artist))]
        const mutual = theirArtists.filter(a => myArtists.has(a) && a !== artist)

        // Get their check-in time for this show
        const thisShowCheckin = showCheckins.find(c => c.user_id === userId)

        // Create a display name from user_id (anonymized)
        const shortId = userId.slice(0, 6)
        const displayName = `Fan ${shortId.toUpperCase()}`

        attendeeList.push({
          id: userId,
          email: '',
          displayName,
          showCount: theirCheckins.length,
          mutualArtists: mutual.slice(0, 5),
          checkedInAt: thisShowCheckin?.created_at || '',
        })
      }

      // Sort by most mutual artists, then by show count
      attendeeList.sort((a, b) => b.mutualArtists.length - a.mutualArtists.length || b.showCount - a.showCount)
      setAttendees(attendeeList)
      setLoading(false)
    }

    loadAttendees()
  }, [artist, date])

  const timeSince = (dateStr: string) => {
    if (!dateStr) return ''
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Check In" backPath="/checkin" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', margin: 0 }}>WHO'S HERE</h2>
          <span style={{ color: '#8BA5C0', fontSize: '14px', marginTop: '8px' }}>
            {loading ? '...' : `${attendees.length} fan${attendees.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        <p style={{ color: '#5C7A9E', fontSize: '15px', marginTop: '4px', marginBottom: '4px' }}>{artist}</p>
        <p style={{ color: '#8BA5C0', fontSize: '13px', marginTop: 0, marginBottom: '32px' }}>{venue}{city ? ` · ${city}` : ''}</p>

        {loading ? (
          <p style={{ color: '#8BA5C0', textAlign: 'center', padding: '64px 0' }}>Finding fans at this show...</p>
        ) : attendees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌕</div>
            <p style={{ color: '#5C7A9E', fontSize: '18px', marginBottom: '8px' }}>You're the first one here!</p>
            <p style={{ color: '#8BA5C0', fontSize: '14px' }}>Other fans will appear as they check in</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {attendees.map((person) => (
              <div key={person.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: 0 }}>{person.displayName}</h3>
                      <span style={{ fontSize: '11px', color: '#8BA5C0' }}>{timeSince(person.checkedInAt)}</span>
                    </div>
                    <p style={{ color: '#8BA5C0', fontSize: '13px', margin: '0 0 12px' }}>{person.showCount} show{person.showCount !== 1 ? 's' : ''} on Moonhead</p>
                    {person.mutualArtists.length > 0 && (
                      <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {person.mutualArtists.map((a) => (
                            <span key={a} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', border: '1.5px solid #5C7A9E', color: '#5C7A9E' }}>{a}</span>
                          ))}
                        </div>
                        <p style={{ color: '#8BA5C0', fontSize: '12px', marginTop: '8px', marginBottom: 0 }}>
                          {person.mutualArtists.length} other artist{person.mutualArtists.length !== 1 ? 's' : ''} in common
                        </p>
                      </>
                    )}
                    {person.mutualArtists.length === 0 && (
                      <p style={{ color: '#8BA5C0', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>No other artists in common yet</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '40px', backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0', textAlign: 'center' }}>
          <p style={{ color: '#5C7A9E', fontSize: '14px', margin: '0 0 4px' }}>More fans appear as they check in</p>
          <p style={{ color: '#8BA5C0', fontSize: '12px', margin: 0 }}>Shared artists are based on your Moonhead history</p>
        </div>
      </div>
    </div>
  )
}

export default function WhoHerePage() {
  return <Suspense><WhoHereContent /></Suspense>
}
