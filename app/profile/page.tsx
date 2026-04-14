"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import NavBar from "@/components/NavBar"

export default function ProfilePage() {
  const router = useRouter()
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [copied, setCopied] = useState(false)
  const [groupBy, setGroupBy] = useState<'none' | 'artist' | 'year'>('none')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [archiveLinks, setArchiveLinks] = useState<Record<string, string>>({})
  const [relistenLinks, setRelistenLinks] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        // Fetch username and avatar for share link / display
        const { data: profileData } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
        if (profileData?.username) setUsername(profileData.username)
        if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url)
        const { data } = await supabase.from("checkins").select("*").eq("user_id", user.id).or("is_dream.eq.false,is_dream.is.null").order("created_at", { ascending: false })
        setCheckins(data || [])
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Check Archive.org + Relisten for recordings
  useEffect(() => {
    if (checkins.length === 0) return
    const checkRecordings = async () => {
      // Fetch Relisten artist slugs
      let relistenArtists: Record<string, string> = {}
      try {
        const rlRes = await fetch('https://api.relisten.net/api/v2/artists', { signal: AbortSignal.timeout(5000) })
        const rlData = await rlRes.json()
        rlData.forEach((a: any) => { if (a.slug && a.name) relistenArtists[a.name.toLowerCase()] = a.slug })
      } catch {}

      const artistMap = new Map<string, { id: string; date: string }[]>()
      checkins.forEach(s => {
        if (!s.artist || !s.date) return
        const key = s.artist.trim()
        if (!artistMap.has(key)) artistMap.set(key, [])
        artistMap.get(key)!.push({ id: s.id, date: s.date.substring(0, 10) })
      })
      const archLinks: Record<string, string> = {}
      const rlLinks: Record<string, string> = {}
      const entries = [...artistMap.entries()]
      const BATCH = 6
      for (let i = 0; i < entries.length; i += BATCH) {
        await Promise.all(entries.slice(i, i + BATCH).map(async ([artist, items]) => {
          try {
            const dates = [...new Set(items.map(it => it.date))]
            const dateClause = dates.map(d => `date:${d}`).join(' OR ')
            const q = `creator:"${artist}" AND mediatype:etree AND (${dateClause})`
            const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=date&sort[]=downloads+desc&output=json&rows=${dates.length * 3}`
            const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
            if (!res.ok) return
            const data = await res.json()
            const docs = data?.response?.docs || []
            const dateHits: Record<string, string> = {}
            docs.forEach((doc: any) => {
              if (!doc.date || !doc.identifier) return
              const ad = doc.date.substring(0, 10)
              if (!dateHits[ad]) dateHits[ad] = doc.identifier
            })
            const slug = relistenArtists[artist.toLowerCase()]
            items.forEach(it => {
              if (dateHits[it.date]) {
                archLinks[it.id] = `https://archive.org/details/${dateHits[it.date]}`
                if (slug) {
                  const [y, m, d] = it.date.split('-')
                  rlLinks[it.id] = `https://relisten.net/${slug}/${y}/${m}/${d}`
                }
              }
            })
          } catch {}
        }))
        setArchiveLinks(prev => ({ ...prev, ...archLinks }))
        setRelistenLinks(prev => ({ ...prev, ...rlLinks }))
      }
    }
    checkRecordings()
  }, [checkins])

  const formatDate = (d: string) => {
    if (!d) return ''
    const parts = d.split('-')
    if (parts.length !== 3) return d
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return months[parseInt(parts[1]) - 1] + ' ' + parseInt(parts[2]) + ', ' + parts[0]
  }
  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/") }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      // Resize image client-side
      const resized = await new Promise<Blob>((resolve) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const size = 256
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')!
          // Crop to square from center
          const min = Math.min(img.width, img.height)
          const sx = (img.width - min) / 2
          const sy = (img.height - min) / 2
          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
        }
        img.src = URL.createObjectURL(file)
      })

      const fileName = `${user.id}.jpg`
      // Upload (upsert)
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, resized, {
        contentType: 'image/jpeg', upsert: true
      })
      if (uploadError) { console.error('Upload error:', uploadError); setUploadingAvatar(false); return }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = urlData.publicUrl + '?t=' + Date.now() // cache bust

      // Save to profile
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      setAvatarUrl(publicUrl)
    } catch (err) { console.error('Avatar upload failed:', err) }
    setUploadingAvatar(false)
  }

  const removeShow = async (id: string) => {
    setDeleting(id)
    try {
      await supabase.from('setlists').delete().eq('checkin_id', id)
      await supabase.from('checkins').delete().eq('id', id)
      setCheckins(prev => prev.filter(c => c.id !== id))
      setConfirmDelete(null)
    } catch (e) { console.error(e) }
    setDeleting(null)
  }

  // Stats
  const uniqueArtists = new Set(checkins.map(s => s.artist?.toLowerCase())).size
  const uniqueVenues = new Set(checkins.map(s => s.venue?.toLowerCase())).size

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Avatar with upload */}
            <label style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #8BA5C0' }} />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#2C4A6E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#F5F0E8', fontWeight: 700, border: '2px solid #8BA5C0' }}>
                  {(username || user?.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2C4A6E', border: '2px solid #F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#F5F0E8', fontSize: '11px', lineHeight: 1 }}>{uploadingAvatar ? '...' : '+'}</span>
              </div>
            </label>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '4px', marginTop: 0 }}>MY SHOWS</h2>
              <p style={{ color: '#8BA5C0', fontSize: '14px', margin: 0 }}>{username || user?.email || 'Your concert history'}</p>
            </div>
          </div>
          {user && <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '13px', cursor: 'pointer', padding: 0 }}>Sign out</button>}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {[{ value: checkins.length, label: 'Shows' }, { value: uniqueArtists, label: 'Artists' }, { value: uniqueVenues, label: 'Venues' }].map(({ value, label }) => (
            <div key={label} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '18px', textAlign: 'center', border: '1px solid #8BA5C0' }}>
              <p style={{ fontSize: '26px', fontWeight: 700, color: '#2C4A6E', margin: 0 }}>{value}</p>
              <p style={{ fontSize: '12px', color: '#8BA5C0', marginTop: '4px', marginBottom: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Share profile link */}
        {username && (
          <button
            onClick={() => {
              const url = `${window.location.origin}/u/${username}`
              navigator.clipboard?.writeText(url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2500)
            }}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer', marginBottom: '16px', textAlign: 'center' }}
          >
            {copied ? 'Link Copied!' : '🔗 Share My Profile'}
          </button>
        )}

        {/* === MY SHOWS === */}
        <>

        {/* Group by controls */}
        {checkins.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#8BA5C0', letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: '4px' }}>Group by</span>
            {(['none', 'artist', 'year'] as const).map(opt => (
              <button key={opt} onClick={() => setGroupBy(opt)}
                style={{
                  padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: groupBy === opt ? 600 : 400,
                  border: `1.5px solid ${groupBy === opt ? '#2C4A6E' : '#8BA5C0'}`,
                  backgroundColor: groupBy === opt ? '#2C4A6E' : 'transparent',
                  color: groupBy === opt ? '#F5F0E8' : '#5C7A9E', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {opt === 'none' ? 'Date' : opt === 'artist' ? 'Artist' : 'Year'}
              </button>
            ))}
          </div>
        )}

        {/* Show list */}
        {loading ? (
          <p style={{ color: '#8BA5C0', textAlign: 'center', padding: '64px 0' }}>Loading your shows...</p>
        ) : checkins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#5C7A9E', fontSize: '18px', marginBottom: '8px' }}>No shows yet</p>
            <p style={{ color: '#8BA5C0', fontSize: '14px' }}>Check in to your first show to get started</p>
          </div>
        ) : (() => {
          // Build groups
          const groups: { label: string; items: any[] }[] = []
          const sortByDate = (arr: any[]) => arr.sort((a, b) => {
            const da = a.date ? new Date(a.date).getTime() : 0
            const db = b.date ? new Date(b.date).getTime() : 0
            return db - da // newest first
          })
          if (groupBy === 'none') {
            groups.push({ label: '', items: sortByDate([...checkins]) })
          } else if (groupBy === 'year') {
            const yearMap: Record<string, any[]> = {}
            checkins.forEach(s => {
              const y = s.date ? new Date(s.date).getFullYear().toString() : 'Unknown'
              if (!yearMap[y]) yearMap[y] = []
              yearMap[y].push(s)
            })
            Object.keys(yearMap).sort((a, b) => b.localeCompare(a)).forEach(y => {
              groups.push({ label: y, items: sortByDate(yearMap[y]) })
            })
          } else {
            const artistMap: Record<string, any[]> = {}
            checkins.forEach(s => {
              const a = s.artist || 'Unknown'
              if (!artistMap[a]) artistMap[a] = []
              artistMap[a].push(s)
            })
            Object.keys(artistMap).sort((a, b) => a.localeCompare(b)).forEach(a => {
              groups.push({ label: `${a} (${artistMap[a].length})`, items: sortByDate(artistMap[a]) })
            })
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: groupBy === 'none' ? '12px' : '24px' }}>
              {groups.map((group, gi) => (
                <div key={gi}>
                  {group.label && (
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#2C4A6E', margin: '0 0 12px', paddingBottom: '8px', borderBottom: '2px solid #8BA5C0' }}>
                      {group.label}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {group.items.map((show) => (
          <div key={show.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', border: confirmDelete === show.id ? '1.5px solid #c0392b' : '1px solid #8BA5C0', overflow: 'hidden' }}>
                <div onClick={() => { if (confirmDelete !== show.id) router.push(`/show/${show.id}`) }}
                  style={{ padding: '20px', cursor: 'pointer' }}
                  onMouseEnter={e => { if (confirmDelete !== show.id) e.currentTarget.style.backgroundColor = '#e8e3da' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700, fontSize: groupBy === 'artist' ? '16px' : '18px', color: '#2C4A6E', margin: '0 0 4px' }}>
                        {groupBy === 'artist' ? show.venue || show.artist : show.artist}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#5C7A9E', margin: '0 0 8px' }}>
                        {groupBy === 'artist' ? (show.city || '') : `${show.venue || ''}${show.city ? ` · ${show.city}` : ''}`}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C4A6E', margin: 0 }}>{formatDate(show.date)}</p>
                        {relistenLinks[show.id] && (
                          <a
                            href={relistenLinks[show.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '3px',
                              fontSize: '12px', color: '#5C7A9E', textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                            title="Listen on Relisten"
                          >
                            🎧 Relisten
                          </a>
                        )}
                        {archiveLinks[show.id] && (
                          <a
                            href={archiveLinks[show.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '3px',
                              fontSize: '12px', color: '#5C7A9E', textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                            title="Listen on Archive.org"
                          >
                            🎙 Archive
                          </a>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(confirmDelete === show.id ? null : show.id) }}
                        style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '16px', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
                        title="Remove show">
                        ✕
                      </button>
                      <span style={{ color: '#8BA5C0', fontSize: '18px' }}>→</span>
                    </div>
                  </div>
                </div>
                {confirmDelete === show.id && (
                  <div style={{ padding: '0 20px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <p style={{ flex: 1, fontSize: '13px', color: '#c0392b', margin: 0, fontWeight: 500 }}>Remove this show?</p>
                    <button onClick={() => setConfirmDelete(null)}
                      style={{ padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={() => removeShow(show.id)} disabled={deleting === show.id}
                      style={{ padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, border: 'none', backgroundColor: '#c0392b', color: '#F5F0E8', cursor: 'pointer' }}>
                      {deleting === show.id ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                )}
              </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '36px' }}>
          <button onClick={() => router.push("/pastshow")} style={{ width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
            + Add a Show
          </button>
          <button onClick={() => router.push("/search")} style={{ width: '100%', padding: '14px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>
            🔍 Find Upcoming Shows
          </button>
        </div>

        </>
      </div>

      {/* Floating add button */}
      <button onClick={() => router.push("/pastshow")}
        style={{ position: 'fixed', bottom: '28px', right: '28px', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer', fontSize: '28px', fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(44,74,110,0.35)', zIndex: 20, lineHeight: 1 }}>
        +
      </button>
    </div>
  )
}
