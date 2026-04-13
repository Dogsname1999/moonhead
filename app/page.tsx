'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const taglines = [
  'The ticket stub. Evolved.',
  'Keep track of your shows.',
  'Look up your set lists.',
  'Listen to live recordings.',
  'Support local music.',
]

export default function Home() {
  const router = useRouter()
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        supabase.from('profiles').select('username').eq('id', data.user.id).single()
          .then(({ data: profile }) => {
            if (profile?.username) setUsername(profile.username)
          })
      }
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUsername(null)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % taglines.length)
        setFade(true)
      }, 400)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

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

        <p style={{
          color: '#5C7A9E', fontSize: '16px', letterSpacing: '0.03em', marginBottom: '40px', textAlign: 'center',
          minHeight: '24px',
          opacity: fade ? 1 : 0,
          transition: 'opacity 0.4s ease-in-out',
        }}>
          {taglines[taglineIndex]}
        </p>

        <button
          onClick={() => router.push('/search')}
          style={{ width: '100%', padding: '16px 32px', borderRadius: '999px', fontSize: '18px', fontWeight: 700, backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer', marginBottom: '14px', letterSpacing: '0.01em' }}
        >
          Find Shows
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

        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#2C4A6E' }}>
              {username || user.email}
            </p>
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: 'none', padding: '4px 0', fontSize: '14px', color: '#5C7A9E', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Log Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/auth')}
            style={{ background: 'none', border: 'none', padding: '8px 0', fontSize: '15px', color: '#8BA5C0', cursor: 'pointer' }}
          >
            Sign in / Create account
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #EDE8DF', gap: '12px' }}>
          <a href="https://shoptourbus.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#8BA5C0', textDecoration: 'none' }}>Brought to you by <span style={{ fontWeight: 600, color: '#5C7A9E' }}>Tourbus</span></a>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => router.push('/terms')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#8BA5C0', cursor: 'pointer', padding: 0 }}>Terms of Service</button>
            <span style={{ color: '#EDE8DF' }}>|</span>
            <button onClick={() => router.push('/privacy')} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#8BA5C0', cursor: 'pointer', padding: 0 }}>Privacy Policy</button>
          </div>
        </div>

      </div>
    </main>
  )
}
