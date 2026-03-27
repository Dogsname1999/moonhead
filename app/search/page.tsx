'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Concert {
  id: string
  source: string
  name: string
  artist: string
  venue: string
  city: string
  date: string
  time: string
  image: string
  url: string
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
      () => { setLocationLoading(false); alert('Could not get your location. Try searching by name.') }
    )
  }

  const formatDate = (date: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <main className="min-h-screen px-6 py-12" style={{ backgroundColor: '#F5F0E8' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '14px', cursor: 'pointer', marginBottom: '32px', padding: 0 }}>← Back</button>

        <h2 className="text-3xl font-bold tracking-widest" style={{ color: '#2C4A6E', marginBottom: '8px' }}>FIND YOUR SHOW</h2>
        <p style={{ color: '#5C7A9E', marginBottom: '24px' }}>Search by artist, venue, or city</p>

        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search(query)}
          placeholder="e.g. Radiohead, Madison Square Garden..."
          style={{
            width: '100%', backgroundColor: '#EDE8DF', color: '#2C4A6E',
            border: '1.5px solid #8BA5C0', borderRadius: '12px',
            padding: '16px 20px', fontSize: '16px', outline: 'none',
            marginBottom: '12px', boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <button onClick={() => search(query)} style={{
            flex: 1, padding: '16px', borderRadius: '999px', fontWeight: 600,
            fontSize: '16px', backgroundColor: '#2C4A6E', color: '#F5F0E8',
            border: 'none', cursor: 'pointer',
          }}>
            {loading ? 'Searching...' : 'Search Shows'}
          </button>
          <button onClick={useMyLocation} style={{
            padding: '16px 20px', borderRadius: '999px', fontSize: '14px',
            border: '1.5px solid #8BA5C0', color: '#5C7A9E', background: 'transparent', cursor: 'pointer',
          }}>
            {locationLoading ? '...' : '📍 Near Me'}
          </button>
        </div>

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {results.map((concert) => (
              <div key={concert.id} style={{
                backgroundColor: '#EDE8DF', borderRadius: '16px', padding: '20px',
                border: '1px solid #8BA5C0', cursor: 'pointer', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2C4A6E')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#8BA5C0')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h3 className="font-bold text-lg" style={{ color: '#2C4A6E' }}>{concert.artist}</h3>
                  <span className="text-xs uppercase" style={{ color: '#8BA5C0', marginTop: '4px' }}>{concert.source}</span>
                </div>
                <p className="text-sm" style={{ color: '#5C7A9E' }}>{concert.venue} · {concert.city}</p>
                <p className="text-sm font-medium" style={{ color: '#2C4A6E', marginTop: '8px' }}>{formatDate(concert.date)}</p>
                <button
                  onClick={() => router.push(`/checkin?id=${concert.id}&artist=${encodeURIComponent(concert.artist)}&venue=${encodeURIComponent(concert.venue)}&city=${encodeURIComponent(concert.city)}&date=${concert.date}`)}
                  style={{
                    marginTop: '16px', width: '100%', padding: '10px', borderRadius: '999px',
                    fontSize: '14px', fontWeight: 600, border: '1.5px solid #2C4A6E',
                    color: '#2C4A6E', background: 'transparent', cursor: 'pointer',
                  }}>
                  Check In Here 🎶
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <p className="text-center mt-8" style={{ color: '#8BA5C0' }}>No shows found. Try another search or add your show manually.</p>
        )}
      </div>
    </main>
  )
}
