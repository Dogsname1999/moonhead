'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message) }
      else if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, username })
        setMessage('Check your email to confirm your account!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message) } else { router.push('/') }
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', backgroundColor: '#EDE8DF', color: '#2C4A6E',
    border: '1.5px solid #8BA5C0', borderRadius: '12px',
    padding: '16px 20px', fontSize: '16px', outline: 'none',
    marginBottom: '12px', display: 'block',
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#F5F0E8' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <h1 className="text-4xl font-bold tracking-widest text-center" style={{ color: '#2C4A6E', marginBottom: '8px' }}>
          MOONHEAD
        </h1>
        <p className="text-center text-sm" style={{ color: '#8BA5C0', marginBottom: '40px', letterSpacing: '0.05em' }}>
          {mode === 'login' ? 'Welcome back.' : 'Join the show.'}
        </p>

        {/* Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#EDE8DF', borderRadius: '999px', padding: '4px', marginBottom: '32px', border: '1.5px solid #8BA5C0' }}>
          <button onClick={() => setMode('login')} style={{
            flex: 1, padding: '10px', borderRadius: '999px', fontSize: '14px', fontWeight: 600,
            backgroundColor: mode === 'login' ? '#2C4A6E' : 'transparent',
            color: mode === 'login' ? '#F5F0E8' : '#8BA5C0',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>Log In</button>
          <button onClick={() => setMode('signup')} style={{
            flex: 1, padding: '10px', borderRadius: '999px', fontSize: '14px', fontWeight: 600,
            backgroundColor: mode === 'signup' ? '#2C4A6E' : 'transparent',
            color: mode === 'signup' ? '#F5F0E8' : '#8BA5C0',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>Sign Up</button>
        </div>

        {/* Fields */}
        {mode === 'signup' && (
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Username" style={inputStyle} />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" style={inputStyle} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" style={inputStyle}
          onKeyDown={(e) => e.key === 'Enter' && handleAuth()} />

        {error && <p className="text-sm text-center" style={{ color: '#c0392b', marginBottom: '16px' }}>{error}</p>}
        {message && <p className="text-sm text-center" style={{ color: '#27ae60', marginBottom: '16px' }}>{message}</p>}

        <button onClick={handleAuth} disabled={loading} style={{
          width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 700,
          fontSize: '18px', backgroundColor: '#2C4A6E', color: '#F5F0E8',
          border: 'none', cursor: 'pointer', marginBottom: '12px', transition: 'background-color 0.2s',
        }}>
          {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>

        <button onClick={() => router.push('/')} style={{
          width: '100%', padding: '12px', fontSize: '14px', color: '#8BA5C0',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          Continue without account
        </button>
      </div>
    </main>
  )
}
