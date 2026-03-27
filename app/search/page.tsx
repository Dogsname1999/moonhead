'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

interface Concert {
  id: string; source: string; name: string; artist: string
  venue: string; city: string; date: string; time: string; image: string; url: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Concert[]>([])
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const router = useRouter()

  const search = async (q: string, lat?: number, lng?: number) => {
    setLoading(true)
    try {
      let url = `/api/concerts?query=${encodeURIComponent(q)}`
      if (lat && lng) url += `&lat=${lat}&lng=${lng}`
      const res = await fetch(url)
      const data = await res.json()
      setResults(data.results || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const useMyLocation = () => {
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocationLoading(false); search(query, pos.coords.latitude, pos.coords.longitude) },
      () => { setLocationLoading(false); alert('Could not get your location.') }
    )
  }

  const formatDate = (date: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '8px', marginTop: 0 }}>FIND YOUR SHOW</h2>
        <p style={{ color: '#5C7A9E', fontSize: '15px', marginBottom: '28px', marginTop: 0 }}>Search by artist, venue, or city</p>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search(query)} placeholder="e.g. Radiohead, Madison Square Garden..."
          style={{ display: 'block', width: '100%', boxSizing: 'border-box', backgroundColor: '#EDE8DF', color: '#2C4A6E', border: '1.5px solid #8BA5C0', borderRadius: '12px', padding: '16px 20px', fontSize: '16px', outline: 'none', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <button onClick={() => search(query)} style={{ flex: 1, padding: '16px', borderRadius: '999px', fontWeight: 600, fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Searching...' : 'Search Shows'}
          </button>
          <button onClick={useMyLocation} style={{ padding: '16px 20px', borderRadius: '999px', fontSize: '14px', border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer' }}>
            {locationLoading ? '...' : '📍 Near Me'}
          </button>
        </div>
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.map((concert) => (
              <div key={concert.id} style={{ backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px', border: '1px solid #8BA5C0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '18px', color: '#2C4A6E', margin: 0 }}>{concert.artist}</h3>
                  <span style={{ fontSize: '11px', color: '#8BA5C0', textTransform: 'uppercase' }}>{concert.source}</span>
                </div>
                <p style={{ fontSize: '14px', color: '#5C7A9E', margin: '4px 0' }}>{concert.venue} · {concert.city}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#2C4A6E', margin: '8px 0 16px' }}>{formatDate(concert.date)}</p>
                <button onClick={() => router.push(`/checkin?id=${concert.id}&artist=${encodeURIComponent(concert.artist)}&venue=${encodeURIComponent(concert.venue)}&city=${encodeURIComponent(concert.city)}&date=${concert.date}`)}
                  style={{ width: '100%', padding: '12px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, border: '1.5px solid #2C4A6E', color: '#2C4A6E', background: 'transparent', cursor: 'pointer' }}>
                  Check In Here 🎶
                </button>
              </div>
            ))}
          </div>
        )}
        {!loading && results.length === 0 && query && (
          <p style={{ color: '#8BA5C0', textAlign: 'center', marginTop: '32px' }}>No shows found. Try another search.</p>
        )}
      </div>
    </div>
  )
}
