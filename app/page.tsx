'use client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold tracking-widest mb-3" style={{color: '#F5A623'}}>
          MOONHEAD
        </h1>
        <p className="text-zinc-400 text-lg tracking-wide">
          you are here. the music is now.
        </p>
      </div>

      <button
        onClick={() => router.push('/search')}
        className="font-semibold px-8 py-4 rounded-full text-lg transition border-2 mb-4 w-64"
        style={{borderColor: '#F5A623', color: '#F5A623', backgroundColor: 'transparent'}}
      >
        Find Your Show
      </button>

      <button
        onClick={() => router.push('/profile')}
        className="font-semibold px-8 py-4 rounded-full text-lg transition border border-zinc-700 text-zinc-400 hover:text-white hover:border-white w-64 mb-4"
      >
        My Shows
      </button>

      <button
        onClick={() => router.push('/auth')}
        className="text-zinc-600 text-sm hover:text-zinc-400 transition mt-2"
      >
        Sign in / Create account
      </button>
    </main>
  )
}