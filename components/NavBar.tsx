'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NavBar({ backLabel, backPath }: { backLabel?: string; backPath?: string }) {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        // Fetch username from profiles
        supabase.from('profiles').select('username, avatar_url').eq('id', data.user.id).single()
          .then(({ data: profile }) => {
            if (profile?.username) setUsername(profile.username)
            if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
          })
      }
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUsername(null)
    setOpen(false)
    router.push('/')
  }

  const links = [
    { label: '🔍 Find Shows', path: '/search' },
    { label: '🎫 I Was There / Scan Stub', path: '/pastshow' },
    { label: '🎵 My Shows', path: '/profile' },
    { label: '🏠 Home', path: '/' },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #EDE8DF', backgroundColor: '#F5F0E8', position: 'sticky', top: 0, zIndex: 30 }}>

        {/* Back button or spacer */}
        {backLabel && backPath ? (
          <button onClick={() => router.push(backPath)} style={{ background: 'none', border: 'none', color: '#8BA5C0', fontSize: '15px', cursor: 'pointer', padding: 0, fontWeight: 500, minWidth: '80px' }}>
            ← {backLabel}
          </button>
        ) : (
          <div style={{ minWidth: '80px' }} />
        )}

        {/* Ticket logo */}
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/ticket.png" alt="Moonhead" style={{ width: '72px', height: '72px', objectFit: 'contain' }} />
        </button>

        {/* Burger */}
        <div style={{ minWidth: '80px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }} aria-label="Menu">
            <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: '#2C4A6E', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: '#2C4A6E', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: '#2C4A6E', borderRadius: '2px' }} />
          </button>
        </div>
      </div>

      {/* Overlay */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(44,74,110,0.3)', zIndex: 40 }} />}

      {/* Drawer */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '260px', backgroundColor: '#F5F0E8', zIndex: 50, padding: '48px 32px', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', boxShadow: open ? '-4px 0 24px rgba(44,74,110,0.12)' : 'none' }}>
        <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '24px', color: '#8BA5C0', cursor: 'pointer' }}>✕</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <img src="/ticket.png" alt="Moonhead" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <p style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', margin: 0 }}>TOURBUSTIX</p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {links.map(link => (
            <button key={link.path} onClick={() => { router.push(link.path); setOpen(false) }}
              style={{ background: 'none', border: 'none', textAlign: 'left', padding: '16px 0', fontSize: '17px', fontWeight: 600, color: '#2C4A6E', cursor: 'pointer', borderBottom: '1px solid #EDE8DF' }}>
              {link.label}
            </button>
          ))}

          {/* Auth section */}
          {user ? (
            <>
              <div style={{ padding: '20px 0 8px', borderBottom: '1px solid #EDE8DF', display: 'flex', gap: '12px', alignItems: 'center' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #8BA5C0', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2C4A6E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#F5F0E8', fontWeight: 700, flexShrink: 0 }}>
                    {(username || user.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#2C4A6E', margin: '0 0 4px' }}>
                    {username || user.email}
                  </p>
                  <button onClick={handleSignOut}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '14px', color: '#5C7A9E', cursor: 'pointer', textDecoration: 'underline' }}>
                    Log Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button onClick={() => { router.push('/auth'); setOpen(false) }}
              style={{ background: 'none', border: 'none', textAlign: 'left', padding: '16px 0', fontSize: '17px', fontWeight: 600, color: '#2C4A6E', cursor: 'pointer', borderBottom: '1px solid #EDE8DF' }}>
              🔐 Sign In / Create Account
            </button>
          )}
        </nav>
      </div>
    </>
  )
}
