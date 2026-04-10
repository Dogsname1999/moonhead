'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // When users land here from the reset email, Supabase's auth listener
    // will fire a PASSWORD_RECOVERY event with a temporary session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    // Also check current session in case the event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    setError(''); setMessage('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Password updated! Redirecting...')
      setTimeout(() => router.push('/'), 1500)
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    backgroundColor: '#EDE8DF', color: '#2C4A6E', border: '1.5px solid #8BA5C0',
    borderRadius: '12px', padding: '16px 20px', fontSize: '16px', outline: 'none', marginBottom: '12px',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '48px 24px 64px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', textAlign: 'center', marginBottom: '8px', marginTop: 0 }}>
          Set a new password.
        </h1>
        <p style={{ color: '#8BA5C0', textAlign: 'center', fontSize: '14px', marginBottom: '40px' }}>
          {ready ? 'Choose a new password for your account' : 'Verifying reset link...'}
        </p>
        {ready && (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              style={inputStyle}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleReset()}
            />
            {error && <p style={{ color: '#c0392b', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}
            {message && <p style={{ color: '#27ae60', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>{message}</p>}
            <button onClick={handleReset} disabled={loading} style={{ display: 'block', width: '100%', padding: '16px', borderRadius: '999px', fontWeight: 700, fontSize: '18px', backgroundColor: '#2C4A6E', color: '#F5F0E8', border: 'none', cursor: 'pointer', marginBottom: '12px' }}>
              {loading ? '...' : 'Update Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
