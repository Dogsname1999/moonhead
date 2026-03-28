'use client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#F5F0E8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '320px' }}>

        <img
          src="/ticket.png"
          alt="Moonhead"
          width={200}
          height={200}
          style={{ width: '200px', height: '200px', objectFit: 'contain', marginBottom: '32px' }}
        />

        <p style={{ color: '#5C7A9E', fontSize: '16px', letterSpacing: '0.03em', marginBottom: '40px', textAlign: 'center' }}>
          The ticket stub. Evolved.
        </p>

        <button
          onClick={() => router.push('/search')}
          style={{ width: '100%', padding: '16px 32px', borderRadius: '999px', fontSize: '18px', fontWeight: 700, backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer', marginBottom: '14px', letterSpacing: '0.01em' }}
        >
          Show Check-In
        </button>

        <button
          onClick={() => router.push('/pastshow')}
          style={{ width: '100%', padding: '16px 32px', borderRadius: '999px', fontSize: '18px', fontWeight: 700, backgroundColor: 'transparent', color: '#2C4A6E', border: '2px solid #2C4A6E', cursor: 'pointer', marginBottom: '14px', letterSpacing: '0.01em' }}
        >
          I Was There
        </button>

        <button
          onClick={() => router.push('/dreamshow')}
          style={{ width: '100%', padding: '16px 32px', borderRadius: '999px', fontSize: '18px', fontWeight: 700, backgroundColor: 'transparent', color: '#2C4A6E', border: '2px solid #2C4A6E', cursor: 'pointer', marginBottom: '14px', letterSpacing: '0.01em' }}
        >
          Wish I Was There
        </button>

        <button
          onClick={() => router.push('/profile')}
          style={{ width: '100%', padding: '16px 32px', borderRadius: '999px', fontSize: '18px', fontWeight: 700, backgroundColor: 'transparent', color: '#5C7A9E', border: '2px solid #5C7A9E', cursor: 'pointer', marginBottom: '28px', letterSpacing: '0.01em' }}
        >
          My Shows
        </button>

        <button
          onClick={() => router.push('/auth')}
          style={{ background: 'none', border: 'none', padding: '8px 0', fontSize: '15px', color: '#8BA5C0', cursor: 'pointer' }}
        >
          Sign in / Create account
        </button>

        <div style={{ display: 'flex', gap: '16px', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #EDE8DF' }}>
          <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#8BA5C0', cursor: 'pointer', padding: 0 }}>Terms of Service</button>
          <span style={{ color: '#EDE8DF' }}>|</span>
          <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#8BA5C0', cursor: 'pointer', padding: 0 }}>Privacy Policy</button>
        </div>

      </div>
    </main>
  )
}
