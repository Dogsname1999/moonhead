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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
        })
        setMessage('Check your email to confirm your account!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.push('/')
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold tracking-widest text-center mb-2" style={{ color: '#F5A623' }}>
          MOONHEAD
        </h1>
        <p className="text-zinc-500 text-center text-sm mb-10 tracking-wide">
          {mode === 'login' ? 'Welcome back.' : 'Join the show.'}
        </p>

        {/* Toggle */}
        <div className="flex bg-zinc-900 rounded-full p-1 mb-8 border border-zinc-800">
          <button
            onClick={() => setMode('login')}
            className="flex-1 py-2 rounded-full text-sm font-semibold transition"
            style={mode === 'login' ? { backgroundColor: '#F5A623', color: '#000' } : { color: '#71717a' }}
          >
            Log In
          </button>
          <button
            onClick={() => setMode('signup')}
            className="flex-1 py-2 rounded-full text-sm font-semibold transition"
            style={mode === 'signup' ? { backgroundColor: '#F5A623', color: '#000' } : { color: '#71717a' }}
          >
            Sign Up
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          {mode === 'signup' && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-xl px-5 py-4 focus:outline-none"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-xl px-5 py-4 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-zinc-900 text-white border border-zinc-700 rounded-xl px-5 py-4 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          />
        </div>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        {message && <p className="text-green-400 text-sm mb-4 text-center">{message}</p>}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full py-4 rounded-full font-bold text-lg transition"
          style={{ backgroundColor: '#F5A623', color: '#000' }}
        >
          {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 py-3 text-zinc-500 text-sm hover:text-white transition"
        >
          Continue without account
        </button>
      </div>
    </main>
  )
}