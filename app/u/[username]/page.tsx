'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = (params.username as string) || ''
  const [profile, setProfile] = useState<any>(null)
  const [shows, setShows] = useState<any[]>([])
  const [dreams, setDreams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<'shows' | 'dreams'>('shows')
  const [groupBy, setGroupBy] = useState<'date' | 'artist' | 'year'>('date')

  useEffect(() => {
    const load = async () => {
      // Look up the profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .single()

      if (profileError || !profileData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Fetch their shows
      const { data: showData } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', profileData.id)
        .or('is_dream.eq.false,is_dream.is.null')
        .order('date', { ascending: false })

      setShows(showData || [])

      // Fetch dream shows
      const { data: dreamData } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('is_dream', true)
        .order('date', { ascending: false })

      setDreams(dreamData || [])
      setLoading(false)
    }
    load()
  }, [username])

  const formatDate = (d: string) => {
    if (!d) return ''
    const parts = d.split('-')
    if (parts.length !== 3) return d
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[parseInt(parts[1]) - 1] + ' ' + parseInt(parts[2]) + ', ' + parts[0]
  }

  // Stats
  const uniqueArtists = new Set(shows.map(s => s.artist?.toLowerCase())).size
  const uniqueVenues = new Set(shows.map(s => s.venue?.toLowerCase())).size
  const years = [...new Set(shows.map(s => s.date ? new Date(s.date).getFullYear() : null).filter(Boolean))]
  years.sort((a, b) => (b || 0) - (a || 0))

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8BA5C0' }}>Loading profile...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
        <NavBar backLabel="Home" backPath="/" />
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</p>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#2C4A6E', marginBottom: '8px' }}>User not found</h2>
          <p style={{ color: '#8BA5C0', fontSize: '14px', marginBottom: '32px' }}>No profile exists for &ldquo;{username}&rdquo;</p>
          <button onClick={() => router.push('/')} style={{ padding: '12px 24px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
            Go to Tourbustix
          </button>
        </div>
      </div>
    )
  }

  const activeShows = tab === 'shows' ? shows : dreams

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>

        {/* Profile header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#2C4A6E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px', color: '#F5F0E8', fontWeight: 700 }}>
            {(profile.username || '?')[0].toUpperCase()}
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#2C4A6E', margin: '0 0 4px' }}>{profile.username}</h2>
          <p style={{ color: '#8BA5C0', fontSize: '13px', margin: 0 }}>tourbustix.com/u/{profile.username}</p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {[
            { value: shows.length, label: 'Shows' },
            { value: uniqueArtists, label: 'Artists' },
            { value: uniqueVenues, label: 'Venues' },
          ].map(({ value, label }) => (
            <div key={label} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '18px', textAlign: 'center', border: '1px solid #8BA5C0' }}>
              <p style={{ fontSize: '26px', fontWeight: 700, color: '#2C4A6E', margin: 0 }}>{value}</p>
              <p style={{ fontSize: '12px', color: '#8BA5C0', marginTop: '4px', marginBottom: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderRadius: '999px', overflow: 'hidden', border: '1.5px solid #8BA5C0' }}>
          <button onClick={() => setTab('shows')}
            style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
              backgroundColor: tab === 'shows' ? '#2C4A6E' : 'transparent', color: tab === 'shows' ? '#F5F0E8' : '#5C7A9E' }}>
            Shows ({shows.length})
          </button>
          {dreams.length > 0 && (
            <button onClick={() => setTab('dreams')}
              style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
                backgroundColor: tab === 'dreams' ? '#2C4A6E' : 'transparent', color: tab === 'dreams' ? '#F5F0E8' : '#5C7A9E',
                borderLeft: '1.5px solid #8BA5C0' }}>
              Dream Shows ({dreams.length})
            </button>
          )}
        </div>

        {/* Group by controls */}
        {activeShows.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#8BA5C0', letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: '4px' }}>Group by</span>
            {(['date', 'artist', 'year'] as const).map(opt => (
              <button key={opt} onClick={() => setGroupBy(opt)}
                style={{
                  padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: groupBy === opt ? 600 : 400,
                  border: `1.5px solid ${groupBy === opt ? '#2C4A6E' : '#8BA5C0'}`,
                  backgroundColor: groupBy === opt ? '#2C4A6E' : 'transparent',
                  color: groupBy === opt ? '#F5F0E8' : '#5C7A9E', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {opt === 'date' ? 'Date' : opt === 'artist' ? 'Artist' : 'Year'}
              </button>
            ))}
          </div>
        )}

        {/* Show list */}
        {activeShows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#8BA5C0', fontSize: '16px' }}>
              {tab === 'shows' ? 'No shows yet' : 'No dream shows yet'}
            </p>
          </div>
        ) : (() => {
          // Build groups
          const groups: { label: string; shows: any[] }[] = []
          if (groupBy === 'date') {
            groups.push({ label: '', shows: activeShows })
          } else if (groupBy === 'year') {
            const yearMap: Record<string, any[]> = {}
            activeShows.forEach(s => {
              const y = s.date ? new Date(s.date).getFullYear().toString() : 'Unknown'
              if (!yearMap[y]) yearMap[y] = []
              yearMap[y].push(s)
            })
            Object.keys(yearMap).sort((a, b) => b.localeCompare(a)).forEach(y => {
              groups.push({ label: y, shows: yearMap[y] })
            })
          } else {
            const artistMap: Record<string, any[]> = {}
            activeShows.forEach(s => {
              const a = s.artist || 'Unknown'
              if (!artistMap[a]) artistMap[a] = []
              artistMap[a].push(s)
            })
            Object.keys(artistMap).sort((a, b) => a.localeCompare(b)).forEach(a => {
              groups.push({ label: `${a} (${artistMap[a].length})`, shows: artistMap[a] })
            })
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: groupBy === 'date' ? '12px' : '24px' }}>
              {groups.map((group, gi) => (
                <div key={gi}>
                  {group.label && (
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#2C4A6E', margin: '0 0 12px', paddingBottom: '8px', borderBottom: '2px solid #8BA5C0' }}>
                      {group.label}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {group.shows.map((show) => (
                      <div key={show.id}
                        onClick={() => {
                          if (show.concert_id) router.push(`/concert/${show.concert_id}`)
                          else router.push(`/show/${show.id}`)
                        }}
                        style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', border: '1px solid #8BA5C0', padding: '20px', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e8e3da' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#EDE8DF' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              {tab === 'dreams' && <span style={{ fontSize: '14px' }}>✨</span>}
                              <h3 style={{ fontWeight: 700, fontSize: groupBy === 'artist' ? '16px' : '18px', color: '#2C4A6E', margin: 0 }}>
                                {groupBy === 'artist' ? show.venue || show.artist : show.artist}
                              </h3>
                            </div>
                            <p style={{ fontSize: '14px', color: '#5C7A9E', margin: '0 0 8px' }}>
                              {groupBy === 'artist'
                                ? (show.city || '')
                                : `${show.venue || ''}${show.city ? ` · ${show.city}` : ''}`
                              }
                            </p>
                            <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C4A6E', margin: 0 }}>{formatDate(show.date)}</p>
                          </div>
                          <span style={{ color: '#8BA5C0', fontSize: '18px', marginTop: '4px' }}>→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Year breakdown */}
        {shows.length > 0 && tab === 'shows' && years.length > 1 && (
          <div style={{ marginTop: '36px', backgroundColor: '#EDE8DF', borderRadius: '16px', border: '1px solid #8BA5C0', padding: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: '#8BA5C0', margin: '0 0 16px', textTransform: 'uppercase' }}>Shows by Year</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {years.map(y => {
                const count = shows.filter(s => s.date && new Date(s.date).getFullYear() === y).length
                return (
                  <div key={y} style={{ textAlign: 'center', minWidth: '60px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#2C4A6E', margin: 0 }}>{count}</p>
                    <p style={{ fontSize: '12px', color: '#8BA5C0', margin: '2px 0 0' }}>{y}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <p style={{ color: '#8BA5C0', fontSize: '13px', marginBottom: '12px' }}>Track your own concert history</p>
          <button onClick={() => router.push('/auth')} style={{ padding: '14px 32px', borderRadius: '999px', fontWeight: 600, fontSize: '15px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
            Join Tourbustix
          </button>
        </div>
      </div>
    </div>
  )
}
