"use client"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import NavBar from "@/components/NavBar"

type SortOption = 'date-desc' | 'date-asc' | 'artist-asc' | 'artist-desc'

export default function ProfilePage() {
  const router = useRouter()
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Sort & filter state
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterCity, setFilterCity] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [dreams, setDreams] = useState<any[]>([])
  const [tab, setTab] = useState<'shows' | 'dreams'>('shows')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase.from("checkins").select("*").eq("user_id", user.id).eq("is_dream", false).order("created_at", { ascending: false })
        setCheckins(data || [])
        const { data: dreamData } = await supabase.from("checkins").select("*").eq("user_id", user.id).eq("is_dream", true).order("created_at", { ascending: false })
        setDreams(dreamData || [])
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Derive available years and cities from checkins
  const years = useMemo(() => {
    const yrs = new Set<string>()
    checkins.forEach(c => { if (c.date) yrs.add(new Date(c.date).getFullYear().toString()) })
    return Array.from(yrs).sort((a, b) => b.localeCompare(a))
  }, [checkins])

  const cities = useMemo(() => {
    const c = new Set<string>()
    checkins.forEach(ci => { if (ci.city) c.add(ci.city) })
    return Array.from(c).sort()
  }, [checkins])

  // Apply filters + sort
  const filteredCheckins = useMemo(() => {
    let result = [...checkins]

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.artist?.toLowerCase().includes(q) ||
        s.venue?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q)
      )
    }

    // Year filter
    if (filterYear !== 'all') {
      result = result.filter(s => s.date && new Date(s.date).getFullYear().toString() === filterYear)
    }

    // City filter
    if (filterCity !== 'all') {
      result = result.filter(s => s.city === filterCity)
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime()
        case 'date-asc': return new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime()
        case 'artist-asc': return (a.artist || '').localeCompare(b.artist || '')
        case 'artist-desc': return (b.artist || '').localeCompare(a.artist || '')
        default: return 0
      }
    })

    return result
  }, [checkins, search, filterYear, filterCity, sortBy])

  const activeFilterCount = (filterYear !== 'all' ? 1 : 0) + (filterCity !== 'all' ? 1 : 0) + (search.trim() ? 1 : 0)

  const clearFilters = () => { setFilterYear('all'); setFilterCity('all'); setSearch(''); setSortBy('date-desc') }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/") }

  const removeShow = async (id: string) => {
    setDeleting(id)
    try {
      await supabase.from('setlists').delete().eq('checkin_id', id)
      await supabase.from('checkins').delete().eq('id', id)
      setCheckins(prev => prev.filter(c => c.id !== id))
      setDreams(prev => prev.filter(c => c.id !== id))
      setConfirmDelete(null)
    } catch (e) { console.error(e) }
    setDeleting(null)
  }

  const chipStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    border: `1.5px solid ${active ? '#2C4A6E' : '#8BA5C0'}`,
    backgroundColor: active ? '#2C4A6E' : 'transparent',
    color: active ? '#F5F0E8' : '#5C7A9E',
    cursor: 'pointer',
    transition: 'all 0.15s',
  } as const)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '4px', marginTop: 0 }}>MY SHOWS</h2>
            <p style={{ color: '#8BA5C0', fontSize: '14px', margin: 0 }}>{user?.email || 'Your concert history'}</p>
          </div>
          {user && <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '13px', cursor: 'pointer', padding: 0 }}>Sign out</button>}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {[{ value: checkins.length, label: 'Shows' }, { value: dreams.length, label: 'Dream Shows' }, { value: 0, label: 'Photos' }].map(({ value, label }) => (
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
            🌕 My Shows ({checkins.length})
          </button>
          <button onClick={() => setTab('dreams')}
            style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
              backgroundColor: tab === 'dreams' ? '#2C4A6E' : 'transparent', color: tab === 'dreams' ? '#F5F0E8' : '#5C7A9E',
              borderLeft: '1.5px solid #8BA5C0' }}>
            ✨ Dream Shows ({dreams.length})
          </button>
        </div>

        {/* === MY SHOWS TAB === */}
        {tab === 'shows' && <>

        {/* Sort & filter bar — only show when there are checkins */}
        {checkins.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            {/* Search + filter toggle row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search artist, venue, city..."
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 38px', borderRadius: '999px',
                    border: '1.5px solid #8BA5C0', backgroundColor: '#EDE8DF', color: '#2C4A6E',
                    fontSize: '14px', outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8BA5C0', fontSize: '16px', pointerEvents: 'none' }}>⌕</span>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '12px 18px', borderRadius: '999px', border: `1.5px solid ${showFilters || activeFilterCount > 0 ? '#2C4A6E' : '#8BA5C0'}`,
                  backgroundColor: showFilters ? '#2C4A6E' : 'transparent', color: showFilters ? '#F5F0E8' : '#5C7A9E',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
              >
                ☰ Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
            </div>

            {/* Expandable filter panel */}
            {showFilters && (
              <div style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0', marginBottom: '12px' }}>
                {/* Sort options */}
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#8BA5C0', margin: '0 0 10px', letterSpacing: '0.08em' }}>SORT BY</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {([
                    ['date-desc', 'Newest'],
                    ['date-asc', 'Oldest'],
                    ['artist-asc', 'Artist A–Z'],
                    ['artist-desc', 'Artist Z–A'],
                  ] as [SortOption, string][]).map(([val, label]) => (
                    <button key={val} onClick={() => setSortBy(val)} style={chipStyle(sortBy === val)}>{label}</button>
                  ))}
                </div>

                {/* Year filter */}
                {years.length > 0 && (
                  <>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#8BA5C0', margin: '0 0 10px', letterSpacing: '0.08em' }}>YEAR</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                      <button onClick={() => setFilterYear('all')} style={chipStyle(filterYear === 'all')}>All</button>
                      {years.map(y => (
                        <button key={y} onClick={() => setFilterYear(y)} style={chipStyle(filterYear === y)}>{y}</button>
                      ))}
                    </div>
                  </>
                )}

                {/* City filter */}
                {cities.length > 0 && (
                  <>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#8BA5C0', margin: '0 0 10px', letterSpacing: '0.08em' }}>CITY</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                      <button onClick={() => setFilterCity('all')} style={chipStyle(filterCity === 'all')}>All</button>
                      {cities.map(c => (
                        <button key={c} onClick={() => setFilterCity(c)} style={chipStyle(filterCity === c)}>{c}</button>
                      ))}
                    </div>
                  </>
                )}

                {/* Clear all */}
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '13px', cursor: 'pointer', padding: '4px 0' }}>
                    Clear all filters
                  </button>
                )}
              </div>
            )}
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
        ) : filteredCheckins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#5C7A9E', fontSize: '16px', marginBottom: '8px' }}>No shows match your filters</p>
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#2C4A6E', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredCheckins.map((show) => (
              <div key={show.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', border: confirmDelete === show.id ? '1.5px solid #c0392b' : '1px solid #8BA5C0', overflow: 'hidden' }}>
                <div onClick={() => { if (confirmDelete !== show.id) router.push(`/show/${show.id}`) }}
                  style={{ padding: '20px', cursor: 'pointer' }}
                  onMouseEnter={e => { if (confirmDelete !== show.id) e.currentTarget.style.backgroundColor = '#e8e3da' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: '0 0 4px' }}>{show.artist}</h3>
                      <p style={{ fontSize: '14px', color: '#5C7A9E', margin: '0 0 8px' }}>{show.venue}{show.city ? ` · ${show.city}` : ""}</p>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C4A6E', margin: 0 }}>{formatDate(show.date)}</p>
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
        )}
        <button onClick={() => router.push("/search")} style={{ width: '100%', marginTop: '36px', padding: '18px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
          + Check In to a Show
        </button>

        </>}

        {/* === DREAM SHOWS TAB === */}
        {tab === 'dreams' && <>
          {loading ? (
            <p style={{ color: '#8BA5C0', textAlign: 'center', padding: '64px 0' }}>Loading dream shows...</p>
          ) : dreams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ color: '#5C7A9E', fontSize: '18px', marginBottom: '8px' }}>No dream shows yet</p>
              <p style={{ color: '#8BA5C0', fontSize: '14px' }}>Add shows you wish you&apos;d been at</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dreams.map((show) => (
                <div key={show.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', border: confirmDelete === show.id ? '1.5px solid #c0392b' : '1px solid #8BA5C0', overflow: 'hidden' }}>
                  <div onClick={() => { if (confirmDelete !== show.id) router.push(`/show/${show.id}`) }}
                    style={{ padding: '20px', cursor: 'pointer' }}
                    onMouseEnter={e => { if (confirmDelete !== show.id) e.currentTarget.style.backgroundColor = '#e8e3da' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px' }}>✨</span>
                          <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: 0 }}>{show.artist}</h3>
                        </div>
                        <p style={{ fontSize: '14px', color: '#5C7A9E', margin: '0 0 8px' }}>{show.venue}{show.city ? ` · ${show.city}` : ""}</p>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C4A6E', margin: 0 }}>{formatDate(show.date)}</p>
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
                      <p style={{ flex: 1, fontSize: '13px', color: '#c0392b', margin: 0, fontWeight: 500 }}>Remove this dream show?</p>
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
          )}
          <button onClick={() => router.push("/dreamshow")} style={{ width: '100%', marginTop: '36px', padding: '18px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
            + Add a Dream Show
          </button>
        </>}
      </div>
    </div>
  )
}
