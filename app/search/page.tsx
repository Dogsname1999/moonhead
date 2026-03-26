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
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const useMyLocation = () => {
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLoading(false)
        search(query, pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setLocationLoading(false)
        alert('Could not get your location. Try searching by name.')
      }
    )
  }

  const formatDate = (date: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-8 hover:text-white transition">
          ← Back
        </button>
        <h2 className="text-3xl font-bold tracking-widest mb-2" style={{ color: '#F5A623' }}>
          FIND YOUR SHOW
        </h2>
        <p className="text-zinc-400 mb-6">Search by artist, venue, or city</p>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search(query)}
          placeholder="e.g. Radiohead, Madison Square Garden..."
          className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-xl px-5 py-4 text-lg focus:outline-none mb-4"
        />

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => search(query)}
            className="flex-1 py-4 rounded-full font-semibold text-lg border-2 transition"
            style={{ borderColor: '#F5A623', color: '#F5A623' }}
          >
            {loading ? 'Searching...' : 'Search Shows'}
          </button>
          <button
            onClick={useMyLocation}
            className="px-5 py-4 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition text-sm"
          >
            {locationLoading ? '...' : '📍 Near Me'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((concert) => (
              <div key={concert.id} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 hover:border-amber-400 transition cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg leading-tight">{concert.artist}</h3>
                  <span className="text-xs text-zinc-500 ml-2 mt-1 uppercase">{concert.source}</span>
                </div>
                <p className="text-zinc-400 text-sm">{concert.venue} · {concert.city}</p>
                <p className="text-sm mt-2" style={{ color: '#F5A623' }}>{formatDate(concert.date)}</p>
                <button
                  onClick={() => router.push(`/checkin?id=${concert.id}&artist=${encodeURIComponent(concert.artist)}&venue=${encodeURIComponent(concert.venue)}&city=${encodeURIComponent(concert.city)}&date=${concert.date}`)}
                  className="mt-4 w-full py-2 rounded-full text-sm font-semibold border transition"
                  style={{ borderColor: '#F5A623', color: '#F5A623' }}>
                  Check In Here 🎶
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <p className="text-zinc-500 text-center mt-8">No shows found. Try another search or add your show manually.</p>
        )}
      </div>
    </main>
  )
}