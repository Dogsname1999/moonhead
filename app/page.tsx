'use client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-8" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="flex flex-col items-center" style={{ width: '100%', maxWidth: '320px' }}>

        {/* Logo */}
        <img
          src="/ticket.png"
          alt="Moonhead"
          width={180}
          height={180}
          style={{ width: '180px', height: '180px', objectFit: 'contain', marginBottom: '32px' }}
        />

        {/* Tagline */}
        <p className="text-base text-center" style={{ color: '#5C7A9E', marginBottom: '40px', letterSpacing: '0.03em' }}>
          The ticket stub. Evolved.
        </p>

        {/* Primary */}
        <button onClick={() => router.push('/search')} className="w-full font-semibold rounded-full text-lg transition"
          style={{ color: '#F5F0E8', backgroundColor: '#2C4A6E', padding: '16px 32px', marginBottom: '12px' }}>
          Find Your Show
        </button>

        {/* Secondary */}
        <button onClick={() => router.push('/pastshow')} className="w-full font-semibold rounded-full text-lg transition"
          style={{ color: '#2C4A6E', backgroundColor: 'transparent', border: '2px solid #2C4A6E', padding: '16px 32px', marginBottom: '12px' }}>
          I Was There
        </button>

        {/* Tertiary */}
        <button onClick={() => router.push('/profile')} className="w-full font-semibold rounded-full text-lg transition"
          style={{ color: '#5C7A9E', backgroundColor: 'transparent', border: '1.5px solid #5C7A9E', padding: '16px 32px', marginBottom: '32px' }}>
          My Shows
        </button>

        {/* Sign in */}
        <button onClick={() => router.push('/auth')} className="text-sm transition border-none bg-transparent"
          style={{ color: '#8BA5C0', padding: '8px 0' }}>
          Sign in / Create account
        </button>

      </div>
    </main>
  )
}
