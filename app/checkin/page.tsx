'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CheckInPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [note, setNote] = useState('')

  const handleCheckIn = () => {
    setChecked(true)
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-8 hover:text-white transition">
          ← Back
        </button>

        {!checked ? (
          <div className="text-center">
            <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">You're about to check in to</p>
            <h2 className="text-3xl font-bold mb-1" style={{ color: '#F5A623' }}>SHOW NAME</h2>
            <p className="text-zinc-400 mb-2">Venue Name · City</p>
            <p className="text-zinc-500 text-sm mb-12">Tonight</p>

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
              className="w-full py-5 rounded-full font-bold text-xl transition"
              style={{ backgroundColor: '#F5A623', color: '#000' }}
            >
              I'M HERE 🎶
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-7xl mb-6">🌕</div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#F5A623' }}>YOU'RE CHECKED IN</h2>
            <p className="text-zinc-400 mb-12">Enjoy every second. This is your moment.</p>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/setlist')}
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
            </div>
          </div>
        )}
      </div>
    </main>
  )
}