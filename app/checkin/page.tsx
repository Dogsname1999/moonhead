'use client'
import { useState, useEffect, Suspense } from 'react'
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
          user_id: user.id,
          artist,
          venue,
          city,
          date,
          note,
          concert_id: concertId,
        }).select().single()
        if (data) setCheckinId(data.id)
      }
    } catch (e) {
      console.error(e)
    }
    setChecked(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-8 hover:text-white transition">
          ← Back
        </button>

        {!checked ? (
          <div className="text-center">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">You're about to check in to</p>
            <h2 className="text-4xl font-bold mb-2" style={{ color: '#F5A623' }}>{artist}</h2>
            <p className="text-zinc-400 mb-1">{venue}{city ? ` · ${city}` : ''}</p>
            <p className="text-zinc-500 text-sm mb-10">{formatDate(date)}</p>

            <div className="mb-8">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="First thoughts? Opening act? How are you feeling..."
                className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-2xl px-5 py-4 text-base focus:outline-none resize-none h-32"
              />
            </div>

            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full py-5 rounded-full font-bold text-xl transition"
              style={{ backgroundColor: '#F5A623', color: '#000' }}
            >
              {loading ? 'Checking in...' : "I'M HERE 🎶"}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-7xl mb-6">🌕</div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#F5A623' }}>YOU'RE CHECKED IN</h2>
            <p className="text-zinc-400 mb-2">{artist}</p>
            <p className="text-zinc-500 text-sm mb-12">{venue}{city ? ` · ${city}` : ''}</p>

            <div className="space-y-4">
              <button
                onClick={() => router.push(`/setlist?checkinId=${checkinId}&artist=${encodeURIComponent(artist)}`)}
                className="w-full py-4 rounded-full font-semibold border-2 transition"
                style={{ borderColor: '#F5A623', color: '#F5A623' }}
              >
                Track the Set List 🎵
              </button>
              <button
                onClick={() => router.push('/whohere')}
                className="w-full py-4 rounded-full font-semibold border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition"
              >
                See Who's Here 👥
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="w-full py-4 rounded-full font-semibold border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition"
              >
                View My Shows 👤
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function CheckInPage() {
  return (
    <Suspense>
      <CheckInContent />
    </Suspense>
  )
}