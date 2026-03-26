'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const mockAttendees = [
  {
    id: 1,
    name: 'Sarah M.',
    location: 'Brooklyn, NY',
    shows: 47,
    mutualArtists: ['Radiohead', 'Phoebe Bridgers'],
    connected: false,
  },
  {
    id: 2,
    name: 'Jake T.',
    location: 'Manhattan, NY',
    shows: 23,
    mutualArtists: ['The Dead', 'Wilco'],
    connected: false,
  },
  {
    id: 3,
    name: 'Rosa L.',
    location: 'Hoboken, NJ',
    shows: 61,
    mutualArtists: ['Radiohead', 'Bon Iver', 'The National'],
    connected: false,
  },
  {
    id: 4,
    name: 'Marcus W.',
    location: 'Queens, NY',
    shows: 12,
    mutualArtists: ['The Dead'],
    connected: false,
  },
]

export default function WhoHerePage() {
  const router = useRouter()
  const [attendees, setAttendees] = useState(mockAttendees)

  const toggleConnect = (id: number) => {
    setAttendees(attendees.map(a =>
      a.id === id ? { ...a, connected: !a.connected } : a
    ))
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-8 hover:text-white transition">
          ← Back
        </button>

        <div className="flex justify-between items-start mb-2">
          <h2 className="text-3xl font-bold tracking-widest" style={{ color: '#F5A623' }}>WHO'S HERE</h2>
          <span className="text-zinc-500 text-sm mt-2">{attendees.length} fans</span>
        </div>
        <p className="text-zinc-400 text-sm mb-8">Other Moonhead users at this show</p>

        <div className="space-y-4">
          {attendees.map((person) => (
            <div key={person.id} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{person.name}</h3>
                  <p className="text-zinc-500 text-xs mt-1">{person.location} · {person.shows} shows</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {person.mutualArtists.map((artist) => (
                      <span
                        key={artist}
                        className="text-xs px-3 py-1 rounded-full border"
                        style={{ borderColor: '#F5A623', color: '#F5A623' }}
                      >
                        {artist}
                      </span>
                    ))}
                  </div>
                  <p className="text-zinc-600 text-xs mt-2">
                    {person.mutualArtists.length} artist{person.mutualArtists.length > 1 ? 's' : ''} in common
                  </p>
                </div>
                <button
                  onClick={() => toggleConnect(person.id)}
                  className="ml-4 px-4 py-2 rounded-full text-sm font-semibold transition shrink-0"
                  style={person.connected
                    ? { backgroundColor: '#F5A623', color: '#000' }
                    : { border: '1px solid #F5A623', color: '#F5A623' }
                  }
                >
                  {person.connected ? 'Connected ✓' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-zinc-900 rounded-2xl p-5 border border-zinc-800 text-center">
          <p className="text-zinc-400 text-sm">More fans check in as the show goes on</p>
          <p className="text-zinc-600 text-xs mt-1">Connections are based on shared artists</p>
        </div>

      </div>
    </main>
  )
}