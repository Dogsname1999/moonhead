'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 text-sm mb-8 hover:text-white transition"
        >
          ← Back
        </button>
        <h2 className="text-3xl font-bold tracking-widest mb-2" style={{color: '#F5A623'}}>
          FIND YOUR SHOW
        </h2>
        <p className="text-zinc-400 mb-8">Search by artist, venue, or city</p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Radiohead, Madison Square Garden..."
          className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-amber-400 mb-6"
          style={{'--tw-border-opacity': '1'} as React.CSSProperties}
        />
        <button
          className="w-full py-4 rounded-full font-semibold text-lg border-2 transition"
          style={{borderColor: '#F5A623', color: '#F5A623'}}
        >
          Search Shows
        </button>
      </div>
    </main>
  )
}