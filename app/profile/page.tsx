'use client'
import { useRouter } from 'next/navigation'

const mockShows = [
  {
    id: 1,
    artist: "Bushwick's Dead",
    venue: 'Brooklyn Bowl',
    city: 'Brooklyn',
    date: 'Apr 16, 2026',
    songs: 12,
    hasPhoto: true,
  },
  {
    id: 2,
    artist: 'Radiohead',
    venue: 'Madison Square Garden',
    city: 'New York',
    date: 'Mar 1, 2026',
    songs: 18,
    hasPhoto: false,
  },
  {
    id: 3,
    artist: 'Phoebe Bridgers',
    venue: 'Terminal 5',
    city: 'New York',
    date: 'Jan 14, 2026',
    songs: 15,
    hasPhoto: true,
  },
]

export default function ProfilePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-widest" style={{ color: '#F5A623' }}>MY SHOWS</h2>
            <p className="text-zinc-400 text-sm mt-1">Your concert history</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-zinc-500 text-sm hover:text-white transition mt-2"
          >
            🌕 Home
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <p className="text-2xl font-bold" style={{ color: '#F5A623' }}>3</p>
            <p className="text-zinc-500 text-xs mt-1">Shows</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <p className="text-2xl font-bold" style={{ color: '#F5A623' }}>45</p>
            <p className="text-zinc-500 text-xs mt-1">Songs Logged</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800">
            <p className="text-2xl font-bold" style={{ color: '#F5A623' }}>2</p>
            <p className="text-zinc-500 text-xs mt-1">Photos</p>
          </div>
        </div>

        {/* Show list */}
        <div className="space-y-4">
          {mockShows.map((show) => (
            <div
              key={show.id}
              className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 hover:border-amber-400 transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{show.artist}</h3>
                  <p className="text-zinc-400 text-sm">{show.venue} · {show.city}</p>
                  <p className="text-sm mt-2" style={{ color: '#F5A623' }}>{show.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 text-xs">{show.songs} songs</p>
                  {show.hasPhoto && <p className="text-zinc-500 text-xs mt-1">📸</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/search')}
          className="w-full mt-10 py-4 rounded-full font-semibold border-2 transition"
          style={{ borderColor: '#F5A623', color: '#F5A623' }}
        >
          + Check In to a Show
        </button>

      </div>
    </main>
  )
}