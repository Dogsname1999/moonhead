'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<any>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  useEffect(() => {
    const loadAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      try {
        const res = await fetch('/api/admin', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (res.status === 403) { setError('Access denied. Admin only.'); setLoading(false); return }
        if (!res.ok) { setError('Failed to load admin data'); setLoading(false); return }
        const d = await res.json()
        setData(d)
      } catch (e) { setError('Failed to load') }
      setLoading(false)
    }
    loadAdmin()
  }, [router])

  const formatDate = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return formatDate(d)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#8BA5C0' }}>Loading admin...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#c0392b', fontSize: '18px' }}>{error}</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '8px', marginTop: 0 }}>ADMIN</h2>
        <p style={{ color: '#5C7A9E', fontSize: '14px', marginBottom: '32px', marginTop: 0 }}>Moonhead Dashboard</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          {[
            { value: data.totalUsers, label: 'Users' },
            { value: data.totalCheckins, label: 'Check-ins' },
            { value: data.totalSongs, label: 'Songs Logged' },
          ].map(({ value, label }) => (
            <div key={label} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '18px', textAlign: 'center', border: '1px solid #8BA5C0' }}>
              <p style={{ fontSize: '26px', fontWeight: 700, color: '#2C4A6E', margin: 0 }}>{value}</p>
              <p style={{ fontSize: '12px', color: '#8BA5C0', marginTop: '4px', marginBottom: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* User list */}
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8BA5C0', marginBottom: '12px' }}>Users ({data.totalUsers})</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.users.map((user: any) => {
            const isExpanded = expandedUser === user.userId
            return (
              <div key={user.userId} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', border: isExpanded ? '1.5px solid #2C4A6E' : '1px solid #8BA5C0', overflow: 'hidden' }}>
                <div onClick={() => setExpandedUser(isExpanded ? null : user.userId)}
                  style={{ padding: '20px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e8e3da'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '16px', color: '#2C4A6E', margin: 0 }}>
                        {user.username || user.email || user.userId.slice(0, 8) + '...'}
                        {user.email === 'warden@dogsname.com' && <span style={{ fontSize: '11px', color: '#8BA5C0', marginLeft: '8px' }}>ADMIN</span>}
                      </p>
                      <p style={{ color: '#8BA5C0', fontSize: '12px', margin: '4px 0 0' }}>
                        Last active: {timeAgo(user.lastCheckin)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: 0 }}>{user.totalShows}</p>
                        <p style={{ color: '#8BA5C0', fontSize: '11px', margin: 0 }}>shows</p>
                      </div>
                      <span style={{ color: '#8BA5C0', fontSize: '18px', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>→</span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 20px 20px' }}>
                    {/* User stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ backgroundColor: '#F5F0E8', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, fontSize: '16px', color: '#2C4A6E', margin: 0 }}>{user.totalShows}</p>
                        <p style={{ fontSize: '10px', color: '#8BA5C0', margin: 0 }}>Shows</p>
                      </div>
                      <div style={{ backgroundColor: '#F5F0E8', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, fontSize: '16px', color: '#2C4A6E', margin: 0 }}>{user.totalSongs}</p>
                        <p style={{ fontSize: '10px', color: '#8BA5C0', margin: 0 }}>Songs</p>
                      </div>
                      <div style={{ backgroundColor: '#F5F0E8', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, fontSize: '16px', color: '#2C4A6E', margin: 0 }}>{user.artists.length}</p>
                        <p style={{ fontSize: '10px', color: '#8BA5C0', margin: 0 }}>Artists</p>
                      </div>
                    </div>

                    {/* Top artists */}
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8BA5C0', margin: '0 0 8px' }}>Artists</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      {user.artists.slice(0, 12).map((a: string, i: number) => (
                        <span key={i} style={{ fontSize: '12px', backgroundColor: '#F5F0E8', color: '#5C7A9E', padding: '4px 10px', borderRadius: '999px' }}>{a}</span>
                      ))}
                      {user.artists.length > 12 && <span style={{ fontSize: '12px', color: '#8BA5C0', padding: '4px 8px' }}>+{user.artists.length - 12} more</span>}
                    </div>

                    {/* Recent shows */}
                    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8BA5C0', margin: '0 0 8px' }}>Recent Activity</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {user.recentShows.map((s: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F5F0E8', borderRadius: '10px' }}>
                          <div>
                            <p style={{ fontWeight: 600, color: '#2C4A6E', fontSize: '14px', margin: 0 }}>{s.artist}</p>
                            <p style={{ color: '#8BA5C0', fontSize: '12px', margin: '2px 0 0' }}>{s.venue}{s.city ? ' · ' + s.city : ''}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: '#5C7A9E', fontSize: '12px', margin: 0 }}>{formatDate(s.date)}</p>
                            <p style={{ color: '#8BA5C0', fontSize: '10px', margin: '2px 0 0' }}>Added {timeAgo(s.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Joined info */}
                    <p style={{ color: '#8BA5C0', fontSize: '11px', marginTop: '12px', marginBottom: 0 }}>
                      First check-in: {formatTime(user.firstCheckin)}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
